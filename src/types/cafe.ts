export type Station = 'bar' | 'kitchen';

export type Allergen = 'milk' | 'gluten' | 'nuts' | 'soy';

export type DietaryTag = 'vegetarian' | 'vegan';

export type IntentMode = 'work' | 'unwind' | 'meet' | 'date';

export type WorkDuration = '1h' | '2h' | '3h' | '4h+';

export type SeatZone = 'quiet' | 'window' | 'social' | 'date';

export interface IngredientStock {
  espresso: number;
  dairy_milk: number;
  oat_milk: number;
  cold_brew: number;
  chai_mix: number;
  bread: number;
  avocado: number;
  croissant: number;
  brownie: number;
}

export type IngredientKey = keyof IngredientStock;

export interface MenuItem {
  id: string;
  name: string;
  price: number; // INR
  station: Station;
  prepMinutes: number;
  allergens: Allergen[];
  dietary: DietaryTag;
  tags: string[];
  ingredients: Partial<Record<IngredientKey, number>>;
  isMilkBased?: boolean;
}

export interface Modifier {
  id: string;
  name: string;
  priceDelta: number; // INR
  appliesToMilkDrinks?: boolean;
  replacesMilkWith?: IngredientKey;
  removesAllergens?: Allergen[];
  addsAllergens?: Allergen[];
  makesVegan?: boolean;
  extraIngredients?: Partial<Record<IngredientKey, number>>;
}

export interface Seat {
  id: string; // T1 to T8
  zone: SeatZone;
  capacity: number;
  hasOutlet: boolean;
  occupiedByCheckInId?: string | null;
}

export interface GuestCheckIn {
  id: string;
  phone: string;
  is18OrOlder: boolean;
  personalize: boolean;
  intent: IntentMode;
  workDuration?: WorkDuration;
  partySize: number;
  surpriseOn?: boolean;
  shareWithTeam: boolean;
  seatId: string;
  seatReason: string;
  createdAt: number;
  firstVisit: boolean;
  loyaltyPoints: number;
  playbookGestures: PlaybookGesture[];
}

export interface PlaybookGesture {
  id: string;
  title: string;
  description: string;
  why: string;
  category: 'wifi' | 'surprise' | 'service' | 'social' | 'loyalty' | 'refill';
  actionableStaffTask?: string;
  delivered?: boolean;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  qty: number;
  modifierIds: string[];
  notes?: string;
  computedPrice: number;
  allergens: Allergen[];
  isVegan: boolean;
  station: Station;
  prepMinutes: number;
  ingredientsNeeded: Partial<Record<IngredientKey, number>>;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served';

export interface Order {
  id: string; // "101", "102"
  checkInId: string;
  customerPhone?: string;
  seatId: string;
  items: CartItem[];
  totalINR: number;
  status: OrderStatus;
  barStatus?: OrderStatus;
  kitchenStatus?: OrderStatus;
  placedAt: number;
  startedAt?: number;
  readyAt?: number;
  servedAt?: number;
  estimatedPrepMinutes: number;
  targetReadyTime: number;
  needsAttention: boolean;
  attentionReasons: string[];
  allergenSummary: Allergen[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  proposedCart?: CartItem[];
  suggestions?: { menuItemId: string; why: string }[];
  isAiFallback?: boolean;
}

export interface ManagerBriefingResponse {
  nudges: string[];
  headline: string;
}
