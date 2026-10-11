import {
  Allergen,
  CartItem,
  IngredientKey,
  IngredientStock,
  MenuItem,
  Modifier,
  Order,
} from '../types/cafe';
import { MENU_ITEMS, MODIFIERS } from '../data/seedData';

// Helper to calculate ingredient requirements for 1 unit of a menu item + modifiers
export function calculateItemIngredients(
  item: MenuItem,
  modifierIds: string[]
): Partial<Record<IngredientKey, number>> {
  const req: Partial<Record<IngredientKey, number>> = { ...item.ingredients };

  const hasOatMilk = modifierIds.includes('oat_milk');
  const hasSoyMilk = modifierIds.includes('soy_milk');
  const hasExtraShot = modifierIds.includes('extra_shot');

  if (item.isMilkBased) {
    if (hasOatMilk) {
      delete req.dairy_milk;
      req.oat_milk = (req.oat_milk || 0) + 1;
    } else if (hasSoyMilk) {
      delete req.dairy_milk;
      // soy milk doesn't decrement our tracked raw ingredients beyond dairy removal
    }
  }

  if (hasExtraShot) {
    req.espresso = (req.espresso || 0) + 1;
  }

  return req;
}

// Compute total ingredients needed for a list of CartItems
export function calculateTotalIngredientsNeeded(
  cartItems: CartItem[]
): Partial<Record<IngredientKey, number>> {
  const totals: Partial<Record<IngredientKey, number>> = {};

  for (const item of cartItems) {
    const singleReq = item.ingredientsNeeded;
    for (const [key, amount] of Object.entries(singleReq)) {
      const ing = key as IngredientKey;
      totals[ing] = (totals[ing] || 0) + (amount || 0) * item.qty;
    }
  }

  return totals;
}

// Check if stock has enough for the order
export function checkStockAvailability(
  stock: IngredientStock,
  needed: Partial<Record<IngredientKey, number>>
): { available: boolean; missingIngredient?: IngredientKey; missingAmount?: number } {
  for (const [key, amount] of Object.entries(needed)) {
    const ing = key as IngredientKey;
    const required = amount || 0;
    const current = stock[ing] ?? 0;
    if (current < required) {
      return {
        available: false,
        missingIngredient: ing,
        missingAmount: required - current,
      };
    }
  }
  return { available: true };
}

// Check which menu items are currently available given current stock
export function getAvailableMenuItems(stock: IngredientStock): MenuItem[] {
  return MENU_ITEMS.filter((item) => {
    // Check if base item has stock
    for (const [key, amount] of Object.entries(item.ingredients)) {
      const ing = key as IngredientKey;
      if ((stock[ing] ?? 0) < (amount || 0)) {
        return false;
      }
    }
    return true;
  });
}

// Check which modifiers are available
export function getAvailableModifiers(stock: IngredientStock): Modifier[] {
  return MODIFIERS.filter((mod) => {
    if (mod.id === 'oat_milk' && (stock.oat_milk ?? 0) < 1) return false;
    if (mod.id === 'extra_shot' && (stock.espresso ?? 0) < 1) return false;
    return true;
  });
}

// Construct a validated CartItem from menu item id, qty, modifiers, notes
export function buildCartItem(
  menuItemId: string,
  qty: number,
  modifierIds: string[] = [],
  notes?: string
): CartItem | null {
  const menuItem = MENU_ITEMS.find((m) => m.id === menuItemId);
  if (!menuItem) return null;

  const validQty = Math.max(1, Math.min(10, Math.floor(qty || 1)));
  const validModifiers = MODIFIERS.filter((m) => modifierIds.includes(m.id));
  const validModIds = validModifiers.map((m) => m.id);

  // Compute price
  const modTotal = validModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
  const computedPrice = (menuItem.price + modTotal) * validQty;

  // Compute allergens strictly from data
  let allergens = [...menuItem.allergens];
  let isVegan = menuItem.dietary === 'vegan';

  for (const mod of validModifiers) {
    if (mod.removesAllergens) {
      allergens = allergens.filter((a) => !mod.removesAllergens!.includes(a));
    }
    if (mod.addsAllergens) {
      for (const a of mod.addsAllergens) {
        if (!allergens.includes(a)) allergens.push(a);
      }
    }
    if (mod.makesVegan) {
      isVegan = true;
    }
  }

  const ingredientsNeeded = calculateItemIngredients(menuItem, validModIds);

  return {
    id: `${menuItem.id}-${validModIds.sort().join('-') || 'plain'}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    menuItemId: menuItem.id,
    name: menuItem.name,
    basePrice: menuItem.price,
    qty: validQty,
    modifierIds: validModIds,
    notes: notes?.trim() || undefined,
    computedPrice,
    allergens,
    isVegan,
    station: menuItem.station,
    prepMinutes: menuItem.prepMinutes,
    ingredientsNeeded,
  };
}

// Determine if an order needs staff attention
export function assessOrderAttention(
  items: CartItem[]
): { needsAttention: boolean; attentionReasons: string[]; allergenSummary: Allergen[] } {
  const attentionReasons: string[] = [];
  const allergenSet = new Set<Allergen>();

  for (const item of items) {
    item.allergens.forEach((a) => allergenSet.add(a));

    if (item.modifierIds.length >= 3) {
      attentionReasons.push(`3+ modifiers on ${item.name}`);
    }
    if (item.notes && item.notes.trim().length > 0) {
      attentionReasons.push(`Special request: "${item.notes}"`);
    }
    if (item.isVegan) {
      attentionReasons.push(`Vegan requirement on ${item.name}`);
    }
  }

  const allergenSummary = Array.from(allergenSet);
  if (allergenSummary.length > 0) {
    attentionReasons.push(`Contains: ${allergenSummary.join(', ')}`);
  }

  return {
    needsAttention: attentionReasons.length > 0,
    attentionReasons,
    allergenSummary,
  };
}

// Calculate ETA based on unfinished orders ahead
// Bar handles 2 at a time; Kitchen handles 1 at a time.
export function calculateOrderETA(
  cartItems: CartItem[],
  existingOrders: Order[]
): number {
  const unfinishedOrders = existingOrders.filter(
    (o) => o.status === 'placed' || o.status === 'preparing'
  );

  // Unfinished minutes queued at Bar
  let queuedBarMinutes = 0;
  // Unfinished minutes queued at Kitchen
  let queuedKitchenMinutes = 0;

  for (const order of unfinishedOrders) {
    for (const item of order.items) {
      if (item.station === 'bar') {
        queuedBarMinutes += item.prepMinutes * item.qty;
      } else {
        queuedKitchenMinutes += item.prepMinutes * item.qty;
      }
    }
  }

  // Current order station prep times
  let currentBarPrep = 0;
  let currentKitchenPrep = 0;
  for (const item of cartItems) {
    if (item.station === 'bar') {
      currentBarPrep += item.prepMinutes * item.qty;
    } else {
      currentKitchenPrep += item.prepMinutes * item.qty;
    }
  }

  // Bar handles 2 concurrent: wait = queued / 2 + currentBarPrep / 2
  const barETA = currentBarPrep > 0 ? Math.ceil(queuedBarMinutes / 2) + Math.ceil(currentBarPrep / 2) : 0;
  // Kitchen handles 1 concurrent: wait = queued / 1 + currentKitchenPrep
  const kitchenETA = currentKitchenPrep > 0 ? queuedKitchenMinutes + currentKitchenPrep : 0;

  const totalETA = Math.max(barETA, kitchenETA, 2); // minimum 2 minutes
  return totalETA;
}

// Burn rate calculator for the last 30 minutes
export interface BurnRateInfo {
  ingredient: IngredientKey;
  currentStock: number;
  consumedLast30m: number;
  burnRatePerMin: number; // units per min
  minutesUntilStockout: number | null; // null if burn rate 0
  status: 'critical' | 'warning' | 'healthy';
}

export function computeStockBurnRates(
  stock: IngredientStock,
  orders: Order[],
  windowMinutes: number = 30
): Record<IngredientKey, BurnRateInfo> {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const recentOrders = orders.filter((o) => now - o.placedAt <= windowMs);

  const consumed: Record<IngredientKey, number> = {
    espresso: 0,
    dairy_milk: 0,
    oat_milk: 0,
    cold_brew: 0,
    chai_mix: 0,
    bread: 0,
    avocado: 0,
    croissant: 0,
    brownie: 0,
  };

  for (const order of recentOrders) {
    for (const item of order.items) {
      for (const [key, amount] of Object.entries(item.ingredientsNeeded)) {
        const ing = key as IngredientKey;
        consumed[ing] += (amount || 0) * item.qty;
      }
    }
  }

  const result: Partial<Record<IngredientKey, BurnRateInfo>> = {};

  for (const key of Object.keys(stock) as IngredientKey[]) {
    const cur = stock[key];
    const totalConsumed = consumed[key];
    const burnRatePerMin = totalConsumed / windowMinutes;
    let minutesUntilStockout: number | null = null;
    let status: 'critical' | 'warning' | 'healthy' = 'healthy';

    if (cur <= 0) {
      minutesUntilStockout = 0;
      status = 'critical';
    } else if (burnRatePerMin > 0) {
      minutesUntilStockout = Math.round(cur / burnRatePerMin);
      if (minutesUntilStockout <= 15) {
        status = 'critical';
      } else if (minutesUntilStockout <= 45) {
        status = 'warning';
      } else {
        status = 'healthy';
      }
    } else {
      // Burn rate is 0, check if stock is very low in absolute terms
      if (cur <= 3) {
        status = 'warning';
      }
    }

    result[key] = {
      ingredient: key,
      currentStock: cur,
      consumedLast30m: totalConsumed,
      burnRatePerMin,
      minutesUntilStockout,
      status,
    };
  }

  return result as Record<IngredientKey, BurnRateInfo>;
}
