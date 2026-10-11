import {
  CartItem,
  GuestCheckIn,
  IngredientStock,
  ManagerBriefingResponse,
  MenuItem,
  Modifier,
} from '../types/cafe';
import {
  assessOrderAttention,
  buildCartItem,
  getAvailableMenuItems,
  getAvailableModifiers,
} from './orderCalculator';

export interface AssistantRawResult {
  reply: string;
  items: Array<{
    menu_item_id: string;
    qty: number;
    modifier_ids?: string[];
    notes?: string;
  }>;
  suggestions: Array<{
    menu_item_id: string;
    why: string;
  }>;
  needs_clarification?: boolean;
  clarifying_question?: string;
  constraints_detected?: {
    dietary?: string[];
    budget_inr?: number;
    avoid?: string[];
  };
}

export interface AssistantValidatedResult {
  reply: string;
  cartItems: CartItem[];
  suggestions: Array<{
    menuItemId: string;
    name: string;
    why: string;
  }>;
  needsClarification: boolean;
  clarifyingQuestion?: string;
  droppedItemsCount: number;
  isFallback: boolean;
}

// 8 second timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Client service for Order Assistant
export async function queryOrderAssistant(
  userMessage: string,
  stock: IngredientStock,
  allMenu: MenuItem[],
  allModifiers: Modifier[],
  checkIn: GuestCheckIn | null
): Promise<AssistantValidatedResult> {
  const availableMenu = getAvailableMenuItems(stock);
  const availableMods = getAvailableModifiers(stock);

  let rawData: AssistantRawResult | null = null;
  let isFallback = false;

  try {
    const res = await fetchWithTimeout('/api/ai/order-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage,
        availableMenu: availableMenu.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          station: m.station,
          allergens: m.allergens,
          dietary: m.dietary,
          tags: m.tags,
          isMilkBased: m.isMilkBased,
        })),
        availableModifiers: availableMods.map((mod) => ({
          id: mod.id,
          name: mod.name,
          priceDelta: mod.priceDelta,
          appliesToMilkDrinks: mod.appliesToMilkDrinks,
          makesVegan: mod.makesVegan,
        })),
        checkInContext: checkIn
          ? {
              intent: checkIn.intent,
              workDuration: checkIn.workDuration,
              partySize: checkIn.partySize,
            }
          : null,
      }),
    }, 8000);

    if (res.ok) {
      rawData = await res.json();
    } else {
      isFallback = true;
    }
  } catch (e) {
    console.warn('AI Order Assistant timed out or failed, using smart rule fallback', e);
    isFallback = true;
  }

  // If AI failed or timed out, run deterministic keyword fallback
  if (!rawData) {
    rawData = generateRuleBasedAssistantFallback(userMessage, availableMenu, availableMods, checkIn);
    isFallback = true;
  }

  // STRICT VALIDATION IN CODE
  return validateAssistantOutput(rawData, availableMenu, availableMods, isFallback, userMessage);
}

// Deterministic rule-based fallback when Gemini times out or is offline
function generateRuleBasedAssistantFallback(
  message: string,
  availableMenu: MenuItem[],
  availableMods: Modifier[],
  checkIn: GuestCheckIn | null
): AssistantRawResult {
  const lower = message.toLowerCase();
  const matchedItems: AssistantRawResult['items'] = [];
  const suggestions: AssistantRawResult['suggestions'] = [];

  // Parse budget if specified (e.g. "under 250", "below 200")
  const budgetMatch = lower.match(/(?:under|below|less than|max)\s*(\d+)/);
  const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : null;

  const wantsCold = lower.includes('cold') || lower.includes('iced');
  const wantsHot = lower.includes('hot') || lower.includes('warm');
  const wantsVegan = lower.includes('vegan') || lower.includes('no dairy') || lower.includes('dairy-free') || lower.includes('plant');
  const wantsNoDairy = wantsVegan || lower.includes('no milk') || lower.includes('oat') || lower.includes('soy');
  const wantsStrong = lower.includes('strong') || lower.includes('extra') || lower.includes('bold');

  // Search through available items
  for (const item of availableMenu) {
    let score = 0;
    if (wantsCold && item.tags.includes('cold')) score += 2;
    if (wantsHot && item.tags.includes('hot')) score += 2;
    if (wantsStrong && item.tags.includes('strong')) score += 2;
    if (lower.includes(item.name.toLowerCase())) score += 5;

    // Check budget
    if (budget && item.price > budget) continue;

    // Check dairy
    if (wantsNoDairy && item.isMilkBased) {
      // Check if oat milk modifier is available
      const hasOat = availableMods.some((m) => m.id === 'oat_milk');
      if (hasOat && (!budget || item.price + 40 <= budget)) {
        matchedItems.push({
          menu_item_id: item.id,
          qty: 1,
          modifier_ids: ['oat_milk'],
          notes: 'Prepared with oat milk as requested',
        });
        break;
      } else {
        // Can't do milk drink without dairy replacement
        continue;
      }
    } else if (score > 0 || (wantsNoDairy && item.dietary === 'vegan')) {
      matchedItems.push({
        menu_item_id: item.id,
        qty: 1,
        modifier_ids: wantsStrong && !item.tags.includes('strong') ? ['extra_shot'] : [],
      });
      break;
    }
  }

  // Work session 3h+ pairing suggestion
  if (checkIn?.intent === 'work' && (checkIn.workDuration === '3h' || checkIn.workDuration === '4h+')) {
    const snack = availableMenu.find((m) => m.station === 'kitchen');
    if (snack) {
      suggestions.push({
        menu_item_id: snack.id,
        why: 'Pair your beverage with a sustained-energy bite for your longer session.',
      });
    }
  }

  const reply =
    matchedItems.length > 0
      ? `I've prepared a recommended order based on your preferences. Review below and tap Confirm!`
      : `Here are our best matching options today. You can select an item or browse the quick filters below.`;

  return {
    reply,
    items: matchedItems,
    suggestions,
    needs_clarification: matchedItems.length === 0,
    clarifying_question:
      matchedItems.length === 0
        ? 'Could you tell me if you prefer hot coffee, chilled brew, or a tea snack?'
        : undefined,
    constraints_detected: {
      budget_inr: budget || undefined,
      dietary: wantsVegan ? ['vegan'] : wantsNoDairy ? ['dairy-free'] : [],
    },
  };
}

// Validation logic adhering strictly to the prompt constraints
function validateAssistantOutput(
  raw: AssistantRawResult,
  availableMenu: MenuItem[],
  availableMods: Modifier[],
  isFallback: boolean,
  _userMessage: string
): AssistantValidatedResult {
  const validCartItems: CartItem[] = [];
  let droppedCount = 0;

  const availableMenuMap = new Map(availableMenu.map((m) => [m.id, m]));
  const availableModMap = new Map(availableMods.map((m) => [m.id, m]));

  const budget = raw.constraints_detected?.budget_inr;
  const wantsVegan =
    raw.constraints_detected?.dietary?.some((d) => d.toLowerCase().includes('vegan')) || false;
  const wantsDairyFree =
    wantsVegan ||
    raw.constraints_detected?.dietary?.some((d) =>
      d.toLowerCase().includes('dairy') || d.toLowerCase().includes('milk')
    ) ||
    raw.constraints_detected?.avoid?.some((a) =>
      a.toLowerCase().includes('dairy') || a.toLowerCase().includes('milk')
    ) ||
    false;

  for (const rawItem of raw.items || []) {
    // 1. Drop unknown or unavailable items
    const menuItem = availableMenuMap.get(rawItem.menu_item_id);
    if (!menuItem) {
      droppedCount++;
      continue;
    }

    // 2. Enforce qty 1-10
    const qty = Math.max(1, Math.min(10, Math.floor(rawItem.qty || 1)));

    // Filter valid available modifiers
    const modIds = (rawItem.modifier_ids || []).filter((id) => availableModMap.has(id));

    // 3. Build cart item with computed allergens and prices FROM DATA
    const cartItem = buildCartItem(menuItem.id, qty, modIds, rawItem.notes);
    if (!cartItem) {
      droppedCount++;
      continue;
    }

    // 4. Re-check dietary / avoid constraints strictly against data
    if (wantsVegan && !cartItem.isVegan) {
      // Check if adding oat milk makes it vegan
      if (menuItem.isMilkBased && availableModMap.has('oat_milk')) {
        const upgraded = buildCartItem(menuItem.id, qty, [...modIds, 'oat_milk'], rawItem.notes);
        if (upgraded && upgraded.isVegan) {
          cartItem.modifierIds = upgraded.modifierIds;
          cartItem.computedPrice = upgraded.computedPrice;
          cartItem.allergens = upgraded.allergens;
          cartItem.isVegan = true;
          cartItem.ingredientsNeeded = upgraded.ingredientsNeeded;
        } else {
          droppedCount++;
          continue;
        }
      } else {
        droppedCount++;
        continue;
      }
    }

    if (wantsDairyFree && cartItem.allergens.includes('milk')) {
      if (menuItem.isMilkBased && availableModMap.has('oat_milk')) {
        const upgraded = buildCartItem(menuItem.id, qty, [...modIds, 'oat_milk'], rawItem.notes);
        if (upgraded && !upgraded.allergens.includes('milk')) {
          cartItem.modifierIds = upgraded.modifierIds;
          cartItem.computedPrice = upgraded.computedPrice;
          cartItem.allergens = upgraded.allergens;
          cartItem.isVegan = upgraded.isVegan;
          cartItem.ingredientsNeeded = upgraded.ingredientsNeeded;
        } else {
          droppedCount++;
          continue;
        }
      } else {
        droppedCount++;
        continue;
      }
    }

    // 5. Enforce budget constraint if detected
    if (budget && cartItem.computedPrice > budget) {
      droppedCount++;
      continue;
    }

    validCartItems.push(cartItem);
  }

  // Format valid suggestions
  const validSuggestions = (raw.suggestions || [])
    .filter((s) => availableMenuMap.has(s.menu_item_id))
    .slice(0, 2)
    .map((s) => ({
      menuItemId: s.menu_item_id,
      name: availableMenuMap.get(s.menu_item_id)!.name,
      why: s.why.slice(0, 120),
    }));

  // Fix reply if items were dropped so it never promises them
  let reply = raw.reply || 'Here is what we recommend for you:';
  if (droppedCount > 0 && validCartItems.length === 0) {
    reply =
      'Some requested items were currently out of stock or did not meet your constraints. We found great fresh alternatives below!';
  } else if (droppedCount > 0) {
    reply = `${reply} (Adjusted to our freshest in-stock ingredients).`;
  }

  return {
    reply,
    cartItems: validCartItems,
    suggestions: validSuggestions,
    needsClarification: Boolean(raw.needs_clarification && validCartItems.length === 0),
    clarifyingQuestion: raw.clarifying_question,
    droppedItemsCount: droppedCount,
    isFallback,
  };
}

// Client service for Hospitality "Why" lines
export async function fetchGestureWhy(
  gestureKey: string,
  intent: string,
  durationHours?: string,
  partySize = 1,
  surpriseOn = false
): Promise<string> {
  const fallbackMap: Record<string, string> = {
    wifi: 'Fast, secure connectivity so your deep work or study session stays completely uninterrupted.',
    quiet_seat: 'Tucked away in our low-decibel zone to protect your focus and concentration.',
    refill_reminder: 'Long sessions need steady hydration and caffeine pacing to maintain natural energy.',
    surprise_cookie: 'A celebratory sweet touch baked fresh to mark your special moment together.',
    couple_points: 'A shared loyalty perk to celebrate visiting our cafe as a pair.',
    low_interruption: 'No unsolicited interruptions so you can fully unwind, read, and recharge in peace.',
    matching_note: 'A warm heads-up for when our cafe community circles and meetups go live.',
    welcome_points: 'A warm thank-you for choosing Cafe Companion on your very first visit.',
  };

  const defaultWhy = fallbackMap[gestureKey] || 'Thoughtfully tailored to make your visit comfortable and memorable.';

  try {
    const res = await fetchWithTimeout('/api/ai/gesture-why', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gestureKey, intent, durationHours, partySize, surpriseOn }),
    }, 4000);

    if (res.ok) {
      const data = await res.json();
      if (data?.why && typeof data.why === 'string' && data.why.trim().length > 0) {
        return data.why.trim();
      }
    }
  } catch (_e) {
    // Return template fallback smoothly
  }

  return defaultWhy;
}

// Client service for Manager Briefing
export async function fetchManagerBriefing(stats: {
  stockAlerts: string[];
  barQueue: number;
  kitchenQueue: number;
  occupiedSeats: number;
  totalSeats: number;
  burnHighlights: string[];
}): Promise<ManagerBriefingResponse> {
  const fallbackNudges: string[] = [];

  if (stats.stockAlerts.length > 0) {
    fallbackNudges.push(`Prioritize restocking: ${stats.stockAlerts.slice(0, 2).join(', ')}.`);
  }
  if (stats.barQueue > 3) {
    fallbackNudges.push(`Bar queue has ${stats.barQueue} drinks; keep milk pitchers pre-chilled.`);
  }
  if (stats.kitchenQueue > 2) {
    fallbackNudges.push(`Kitchen prep active with ${stats.kitchenQueue} dishes; monitor toaster station.`);
  }
  if (stats.occupiedSeats >= 6) {
    fallbackNudges.push(`High floor occupancy (${stats.occupiedSeats}/${stats.totalSeats} seats); watch for clearing opportunities.`);
  }
  if (fallbackNudges.length === 0) {
    fallbackNudges.push('Floor operations steady. All stations running smoothly with comfortable capacity.');
  }

  const fallback: ManagerBriefingResponse = {
    headline: stats.stockAlerts.length > 0 ? 'Stock Attention Required' : 'Pacing Even & Smooth',
    nudges: fallbackNudges.slice(0, 3),
  };

  try {
    const res = await fetchWithTimeout('/api/ai/manager-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats }),
    }, 5000);

    if (res.ok) {
      const data = await res.json();
      if (data?.headline && Array.isArray(data?.nudges) && data.nudges.length > 0) {
        return {
          headline: data.headline,
          nudges: data.nudges.slice(0, 3),
        };
      }
    }
  } catch (_e) {
    // Return fallback smoothly
  }

  return fallback;
}
