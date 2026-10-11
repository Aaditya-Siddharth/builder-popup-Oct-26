import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Allergen,
  CartItem,
  GuestCheckIn,
  IngredientKey,
  IngredientStock,
  IntentMode,
  MenuItem,
  Modifier,
  Order,
  OrderStatus,
  PlaybookGesture,
  Seat,
  WorkDuration,
} from '../types/cafe';
import { INITIAL_SEATS, INITIAL_STOCK, MENU_ITEMS, MODIFIERS } from '../data/seedData';
import { assignSeat } from '../utils/seatAssigner';
import {
  assessOrderAttention,
  buildCartItem,
  calculateOrderETA,
  calculateTotalIngredientsNeeded,
  checkStockAvailability,
} from '../utils/orderCalculator';
import { fetchGestureWhy } from '../utils/aiService';

interface CafeContextType {
  activeTab: 'customer' | 'team';
  setActiveTab: (tab: 'customer' | 'team') => void;
  stock: IngredientStock;
  seats: Seat[];
  menu: MenuItem[];
  modifiers: Modifier[];
  orders: Order[];
  currentGuest: GuestCheckIn | null;
  allGuests: GuestCheckIn[];
  cart: CartItem[];
  currentTime: number;
  // Guest actions
  checkInGuest: (params: {
    phone: string;
    is18OrOlder: boolean;
    personalize: boolean;
    intent: IntentMode;
    workDuration?: WorkDuration;
    partySize: number;
    surpriseOn?: boolean;
    shareWithTeam: boolean;
  }) => { success: boolean; error?: string };
  signOutGuest: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQty: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  placeOrder: () => { success: boolean; orderId?: string; error?: string };
  // Team actions
  advanceOrderStatus: (orderId: string) => void;
  markGestureDelivered: (guestId: string, gestureId: string) => void;
  restockIngredient: (ingredient: IngredientKey, amount?: number) => void;
  simulateRush: () => void;
  restockOatMilk: () => void;
  resetDemo: () => void;
}

const CafeContext = createContext<CafeContextType | null>(null);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'team'>('customer');
  const [stock, setStock] = useState<IngredientStock>({ ...INITIAL_STOCK });
  const [seats, setSeats] = useState<Seat[]>([...INITIAL_SEATS]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [nextOrderNum, setNextOrderNum] = useState<number>(101);
  const [currentGuest, setCurrentGuest] = useState<GuestCheckIn | null>(null);
  const [allGuests, setAllGuests] = useState<GuestCheckIn[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1-second clock tick for live timers & burn rates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check-in guest with deterministic seat assignment and gestures
  const checkInGuest = (params: {
    phone: string;
    is18OrOlder: boolean;
    personalize: boolean;
    intent: IntentMode;
    workDuration?: WorkDuration;
    partySize: number;
    surpriseOn?: boolean;
    shareWithTeam: boolean;
  }) => {
    // Deterministic seat assignment
    const seatResult = assignSeat(params.intent, params.partySize, seats);
    if (!seatResult) {
      return { success: false, error: 'Sorry, no tables currently fit your party size.' };
    }

    const checkInId = `guest-${Date.now().toString(36)}`;
    const isFirstVisit = true; // demo: first visit gets 20 welcome points
    let initialLoyaltyPoints = isFirstVisit ? 20 : 0;

    // Build playbook gestures
    const gestures: PlaybookGesture[] = [];

    // 1. First visit welcome points
    gestures.push({
      id: `g-welcome-${Date.now()}`,
      title: 'First-Visit Welcome',
      description: '+20 loyalty points added to your account',
      why: 'A warm thank-you for choosing Cafe Companion on your very first visit.',
      category: 'loyalty',
    });

    // 2. Intent-specific gestures
    if (params.intent === 'work') {
      // Work: Wi-Fi FIRST
      gestures.unshift({
        id: `g-wifi-${Date.now()}`,
        title: 'High-Speed Work Wi-Fi',
        description: 'SSID: CafeCompanion-Guest • Pass: brew2026',
        why: 'Fast, secure connectivity so your deep work session stays completely uninterrupted.',
        category: 'wifi',
        actionableStaffTask: 'Confirm desk power outlet is live & active',
      });

      gestures.push({
        id: `g-seat-${Date.now()}`,
        title: 'Quiet Focus Zone',
        description: `Reserved Seat ${seatResult.seat.id} with power outlet`,
        why: 'Tucked away in our low-decibel zone to protect your focus and concentration.',
        category: 'service',
      });

      if (params.workDuration === '2h' || params.workDuration === '3h' || params.workDuration === '4h+') {
        gestures.push({
          id: `g-refill-${Date.now()}`,
          title: 'Hydration & Refill Reminder',
          description: 'Complimentary infused water refills on request',
          why: 'Long sessions need steady hydration and caffeine pacing to maintain natural energy.',
          category: 'refill',
          actionableStaffTask: 'Offer water refill after 60 minutes quietly',
        });
      }
    } else if (params.intent === 'date') {
      if (params.surpriseOn) {
        initialLoyaltyPoints += 50;
        gestures.push({
          id: `g-surprise-${Date.now()}`,
          title: 'Sweet Table Surprise',
          description: 'A complimentary heart-shaped cookie + 50 couple loyalty points',
          why: 'A celebratory sweet touch baked fresh to mark your special moment together.',
          category: 'surprise',
          actionableStaffTask: 'Deliver a heart-shaped cookie quietly, no announcement',
        });
      } else {
        initialLoyaltyPoints += 50;
        gestures.push({
          id: `g-couple-pts-${Date.now()}`,
          title: 'Couple Loyalty Perk',
          description: '+50 bonus points added for your shared visit',
          why: 'A shared loyalty perk to celebrate visiting our cafe as a pair.',
          category: 'loyalty',
        });
      }
    } else if (params.intent === 'unwind') {
      gestures.push({
        id: `g-unwind-${Date.now()}`,
        title: 'Low-Interruption Service',
        description: 'Quiet atmosphere • No unprompted staff check-ins',
        why: 'No unsolicited interruptions so you can fully unwind, read, and recharge in peace.',
        category: 'service',
        actionableStaffTask: 'Do not check in unprompted; let guest relax undisturbed',
      });
    } else if (params.intent === 'meet') {
      gestures.push({
        id: `g-meet-${Date.now()}`,
        title: 'Community Social Circle',
        description: 'Open seating table • Community matching feature coming soon',
        why: 'A friendly heads-up for when our cafe community circles and meetups go live.',
        category: 'social',
        actionableStaffTask: 'Seat near friendly regulars or main community counter',
      });
    }

    const newGuest: GuestCheckIn = {
      id: checkInId,
      phone: params.phone,
      is18OrOlder: params.is18OrOlder,
      personalize: params.personalize,
      intent: params.intent,
      workDuration: params.workDuration,
      partySize: params.partySize,
      surpriseOn: params.surpriseOn,
      shareWithTeam: params.shareWithTeam,
      seatId: seatResult.seat.id,
      seatReason: seatResult.reason,
      createdAt: Date.now(),
      firstVisit: isFirstVisit,
      loyaltyPoints: initialLoyaltyPoints,
      playbookGestures: gestures,
    };

    // Mark seat occupied
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatResult.seat.id ? { ...s, occupiedByCheckInId: checkInId } : s
      )
    );

    setCurrentGuest(newGuest);
    setAllGuests((prev) => [newGuest, ...prev]);

    // Enhance gesture "why" lines in the background with Gemini
    gestures.forEach(async (gesture) => {
      try {
        const enhancedWhy = await fetchGestureWhy(
          gesture.category,
          params.intent,
          params.workDuration,
          params.partySize,
          Boolean(params.surpriseOn)
        );
        if (enhancedWhy) {
          setCurrentGuest((cur) => {
            if (!cur || cur.id !== checkInId) return cur;
            return {
              ...cur,
              playbookGestures: cur.playbookGestures.map((g) =>
                g.id === gesture.id ? { ...g, why: enhancedWhy } : g
              ),
            };
          });
          setAllGuests((prev) =>
            prev.map((g) =>
              g.id === checkInId
                ? {
                    ...g,
                    playbookGestures: g.playbookGestures.map((item) =>
                      item.id === gesture.id ? { ...item, why: enhancedWhy } : item
                    ),
                  }
                : g
            )
          );
        }
      } catch (_e) {
        // Fallback remains in place
      }
    });

    return { success: true };
  };

  const signOutGuest = () => {
    if (currentGuest) {
      setSeats((prev) =>
        prev.map((s) =>
          s.occupiedByCheckInId === currentGuest.id
            ? { ...s, occupiedByCheckInId: null }
            : s
        )
      );
      setAllGuests((prev) => prev.filter((g) => g.id !== currentGuest.id));
      setCurrentGuest(null);
      setCart([]);
    }
  };

  // Cart operations
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.menuItemId === item.menuItemId &&
          JSON.stringify(i.modifierIds.sort()) === JSON.stringify(item.modifierIds.sort()) &&
          (i.notes || '') === (item.notes || '')
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        const updatedQty = Math.min(10, copy[existingIdx].qty + item.qty);
        copy[existingIdx] = {
          ...copy[existingIdx],
          qty: updatedQty,
          computedPrice: (copy[existingIdx].computedPrice / copy[existingIdx].qty) * updatedQty,
        };
        return copy;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateCartQty = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    const safeQty = Math.min(10, qty);
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== cartItemId) return i;
        const unitPrice = i.computedPrice / i.qty;
        return {
          ...i,
          qty: safeQty,
          computedPrice: unitPrice * safeQty,
        };
      })
    );
  };

  const clearCart = () => setCart([]);

  // Place order with atomic stock verification & decrement
  const placeOrder = (): { success: boolean; orderId?: string; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty.' };
    }

    const neededIngredients = calculateTotalIngredientsNeeded(cart);
    const stockCheck = checkStockAvailability(stock, neededIngredients);

    if (!stockCheck.available) {
      const ingName = stockCheck.missingIngredient?.replace('_', ' ') || 'ingredient';
      return {
        success: false,
        error: `Order rejected: Insufficient stock for ${ingName} (short by ${stockCheck.missingAmount}). Please adjust your items.`,
      };
    }

    // Atomic decrement of stock
    setStock((prev) => {
      const next = { ...prev };
      for (const [key, amount] of Object.entries(neededIngredients)) {
        const ing = key as IngredientKey;
        next[ing] = Math.max(0, (next[ing] || 0) - (amount || 0));
      }
      return next;
    });

    const orderId = nextOrderNum.toString();
    setNextOrderNum((prev) => prev + 1);

    const totalINR = cart.reduce((acc, item) => acc + item.computedPrice, 0);
    const estimatedPrepMinutes = calculateOrderETA(cart, orders);
    const targetReadyTime = Date.now() + estimatedPrepMinutes * 60 * 1000;
    const attention = assessOrderAttention(cart);

    const newOrder: Order = {
      id: orderId,
      checkInId: currentGuest?.id || 'walk-in',
      customerPhone: currentGuest?.phone,
      seatId: currentGuest?.seatId || 'Counter',
      items: [...cart],
      totalINR,
      status: 'placed',
      barStatus: cart.some((i) => i.station === 'bar') ? 'placed' : undefined,
      kitchenStatus: cart.some((i) => i.station === 'kitchen') ? 'placed' : undefined,
      placedAt: Date.now(),
      estimatedPrepMinutes,
      targetReadyTime,
      needsAttention: attention.needsAttention,
      attentionReasons: attention.attentionReasons,
      allergenSummary: attention.allergenSummary,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Award loyalty points: floor(order total / 10)
    const pointsEarned = Math.floor(totalINR / 10);
    if (currentGuest) {
      setCurrentGuest((prev) =>
        prev ? { ...prev, loyaltyPoints: prev.loyaltyPoints + pointsEarned } : prev
      );
      setAllGuests((prev) =>
        prev.map((g) =>
          g.id === currentGuest.id
            ? { ...g, loyaltyPoints: g.loyaltyPoints + pointsEarned }
            : g
        )
      );
    }

    clearCart();
    return { success: true, orderId };
  };

  // Forward transition for order status: placed -> preparing -> ready -> served
  const advanceOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        let nextStatus: OrderStatus = ord.status;
        const now = Date.now();
        const copy = { ...ord };

        if (ord.status === 'placed') {
          nextStatus = 'preparing';
          copy.startedAt = now;
        } else if (ord.status === 'preparing') {
          nextStatus = 'ready';
          copy.readyAt = now;
          // Vibrate if supported when order is ready
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch (_e) {
              // Ignore unsupported environments
            }
          }
        } else if (ord.status === 'ready') {
          nextStatus = 'served';
          copy.servedAt = now;
        }

        copy.status = nextStatus;
        if (copy.barStatus) copy.barStatus = nextStatus;
        if (copy.kitchenStatus) copy.kitchenStatus = nextStatus;
        return copy;
      })
    );
  };

  // Staff marks gesture delivered
  const markGestureDelivered = (guestId: string, gestureId: string) => {
    setAllGuests((prev) =>
      prev.map((g) => {
        if (g.id !== guestId) return g;
        return {
          ...g,
          playbookGestures: g.playbookGestures.map((item) =>
            item.id === gestureId ? { ...item, delivered: true } : item
          ),
        };
      })
    );
    if (currentGuest?.id === guestId) {
      setCurrentGuest((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          playbookGestures: prev.playbookGestures.map((item) =>
            item.id === gestureId ? { ...item, delivered: true } : item
          ),
        };
      });
    }
  };

  // Restock an ingredient
  const restockIngredient = (ingredient: IngredientKey, amount = 20) => {
    setStock((prev) => ({
      ...prev,
      [ingredient]: (prev[ingredient] || 0) + amount,
    }));
  };

  // Simulate rush: creates 6 synthetic oat-milk drink orders so oat milk alert triggers
  const simulateRush = () => {
    const rushOrders: Order[] = [];
    const latteItem = MENU_ITEMS.find((m) => m.id === 'iced_latte')!;
    let currentNum = nextOrderNum;

    // We consume oat milk for 6 orders
    const oatConsuming = 6;
    setStock((prev) => ({
      ...prev,
      oat_milk: Math.max(0, (prev.oat_milk || 0) - oatConsuming),
      espresso: Math.max(0, (prev.espresso || 0) - 6),
    }));

    for (let i = 0; i < 6; i++) {
      const cartItem = buildCartItem(latteItem.id, 1, ['oat_milk'], 'Extra rush order');
      if (cartItem) {
        rushOrders.push({
          id: currentNum.toString(),
          checkInId: `synthetic-rush-${i + 1}`,
          seatId: `T${(i % 5) + 1}`,
          items: [cartItem],
          totalINR: cartItem.computedPrice,
          status: i < 2 ? 'preparing' : 'placed',
          barStatus: i < 2 ? 'preparing' : 'placed',
          placedAt: Date.now() - (6 - i) * 60 * 1000,
          estimatedPrepMinutes: 3 + i,
          targetReadyTime: Date.now() + (3 + i) * 60 * 1000,
          needsAttention: false,
          attentionReasons: ['Vegan requirement on Iced Latte', 'Contains: soy'],
          allergenSummary: [],
        });
        currentNum++;
      }
    }

    setNextOrderNum(currentNum);
    setOrders((prev) => [...rushOrders, ...prev]);
  };

  // Restock oat milk (+20)
  const restockOatMilk = () => {
    restockIngredient('oat_milk', 20);
  };

  // Reset demo back to clean initial state
  const resetDemo = () => {
    setStock({ ...INITIAL_STOCK });
    setSeats([...INITIAL_SEATS]);
    setOrders([]);
    setNextOrderNum(101);
    setCurrentGuest(null);
    setAllGuests([]);
    setCart([]);
  };

  const contextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      stock,
      seats,
      menu: MENU_ITEMS,
      modifiers: MODIFIERS,
      orders,
      currentGuest,
      allGuests,
      cart,
      currentTime,
      checkInGuest,
      signOutGuest,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      placeOrder,
      advanceOrderStatus,
      markGestureDelivered,
      restockIngredient,
      simulateRush,
      restockOatMilk,
      resetDemo,
    }),
    [
      activeTab,
      stock,
      seats,
      orders,
      currentGuest,
      allGuests,
      cart,
      currentTime,
      nextOrderNum,
    ]
  );

  return <CafeContext.Provider value={contextValue}>{children}</CafeContext.Provider>;
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};
