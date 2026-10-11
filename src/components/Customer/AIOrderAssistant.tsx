import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { CartItem, MenuItem } from '../../types/cafe';
import { queryOrderAssistant } from '../../utils/aiService';
import { buildCartItem, getAvailableMenuItems, getAvailableModifiers } from '../../utils/orderCalculator';
import {
  Sparkles,
  Send,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Clock,
  ShieldAlert,
  Flame,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const AIOrderAssistant: React.FC = () => {
  const {
    stock,
    menu,
    modifiers,
    currentGuest,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    placeOrder,
  } = useCafe();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [clarifyingQuestion, setClarifyingQuestion] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ menuItemId: string; name: string; why: string }>>([]);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Quick filter tab for menu browsing
  const [filterTag, setFilterTag] = useState<'all' | 'hot' | 'cold' | 'vegan' | 'snack'>('all');

  const availableMenu = getAvailableMenuItems(stock);
  const availableModifiers = getAvailableModifiers(stock);

  const samplePrompts = [
    'Something cold and strong, no dairy, under 250',
    'Hot coffee with an oat milk upgrade and a croissant',
    'Chai and a warm savory sandwich',
    'Vegan cold brew & brownie under 450',
  ];

  const handleAskAssistant = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    setIsLoading(true);
    setOrderError(null);
    setOrderSuccessId(null);
    setAssistantReply(null);
    setClarifyingQuestion(null);
    setSuggestions([]);

    try {
      const result = await queryOrderAssistant(
        promptText,
        stock,
        menu,
        modifiers,
        currentGuest
      );

      setAssistantReply(result.reply);
      setSuggestions(result.suggestions);
      setIsFallbackMode(result.isFallback);

      if (result.needsClarification && result.clarifyingQuestion) {
        setClarifyingQuestion(result.clarifyingQuestion);
      }

      // Add newly proposed valid items to the cart
      if (result.cartItems.length > 0) {
        result.cartItems.forEach((item) => addToCart(item));
      }
    } catch (_e) {
      setIsFallbackMode(true);
      setAssistantReply('Switched to quick menu filters. Browse or tap below to build your order.');
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const handleConfirmOrder = () => {
    setOrderError(null);
    setOrderSuccessId(null);

    const res = placeOrder();
    if (res.success && res.orderId) {
      setOrderSuccessId(res.orderId);
      setAssistantReply(null);
      setClarifyingQuestion(null);
      setSuggestions([]);
    } else {
      setOrderError(res.error || 'Failed to place order.');
    }
  };

  // Add item manually from menu filter chips
  const handleQuickAddItem = (item: MenuItem, withOatMilk = false) => {
    setOrderError(null);
    const modIds = withOatMilk && item.isMilkBased ? ['oat_milk'] : [];
    const cartItem = buildCartItem(item.id, 1, modIds);
    if (cartItem) {
      addToCart(cartItem);
    }
  };

  // Filtered menu for browser
  const filteredMenuItems = availableMenu.filter((item) => {
    if (filterTag === 'all') return true;
    if (filterTag === 'hot') return item.tags.includes('hot');
    if (filterTag === 'cold') return item.tags.includes('cold');
    if (filterTag === 'vegan') return item.dietary === 'vegan';
    if (filterTag === 'snack') return item.tags.includes('snack') || item.station === 'kitchen';
    return true;
  });

  const cartTotalINR = cart.reduce((acc, item) => acc + item.computedPrice, 0);

  // Compute allergen summary strictly from data
  const cartAllergens = Array.from(new Set(cart.flatMap((i) => i.allergens)));

  return (
    <div className="space-y-4">
      {/* 1. AI Order Assistant Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#8E5932]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#2B1810]">
                AI Barista Assistant
              </h3>
              <p className="text-[11px] text-[#7D6B5E]">
                Describe what you feel like in plain English
              </p>
            </div>
          </div>

          {currentGuest?.intent === 'work' && ['3h', '4h+'].includes(currentGuest.workDuration || '') && (
            <span className="text-[10px] bg-[#F5EBE1] text-[#8E5932] px-2.5 py-1 rounded-full font-bold">
              Focus Pairing Active
            </span>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAssistant(inputMessage);
          }}
          className="relative"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. something cold and strong, no dairy, under 250"
            className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E4D9CC] text-sm text-[#2B1810] placeholder-[#9E8B7C] focus:outline-none focus:ring-2 focus:ring-[#8E5932] transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-2 top-2 p-2 rounded-xl bg-[#3D2616] text-[#FAF7F2] hover:bg-[#2B1810] disabled:opacity-40 transition cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Sample prompt pills */}
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase font-bold tracking-wider text-[#9E8B7C]">
            Try a natural request:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputMessage(p);
                  handleAskAssistant(p);
                }}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE4] border border-[#E8DFD1] text-[#5A4638] text-left transition cursor-pointer"
              >
                &ldquo;{p}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Assistant Response bubble */}
        {assistantReply && (
          <div className="p-3.5 rounded-2xl bg-[#F5EBE1] border border-[#E4D9CC] space-y-2 text-xs text-[#3D2616]">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#8E5932] shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{assistantReply}</p>
            </div>

            {clarifyingQuestion && (
              <p className="font-semibold text-[#8E5932] pl-6 italic">
                Barista asks: &ldquo;{clarifyingQuestion}&rdquo;
              </p>
            )}

            {isFallbackMode && (
              <p className="text-[10px] text-[#8E5932] pl-6 flex items-center gap-1 font-semibold">
                <Info className="w-3 h-3" />
                Quick-filter mode activated.
              </p>
            )}
          </div>
        )}

        {/* AI Pairing Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#EFE8DE]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E5932] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Chef & Barista Pairings
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {suggestions.map((sug) => {
                const item = menu.find((m) => m.id === sug.menuItemId);
                if (!item) return null;
                return (
                  <div
                    key={sug.menuItemId}
                    className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] flex items-start justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#2B1810]">{item.name}</h4>
                      <p className="text-[11px] text-[#7D6B5E] italic mt-0.5 leading-tight">
                        &ldquo;{sug.why}&rdquo;
                      </p>
                      <p className="text-xs font-semibold text-[#8E5932] mt-1">₹{item.price}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickAddItem(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D8C7B3] hover:bg-[#F5EBE1] text-xs font-bold text-[#3D2616] shrink-0 cursor-pointer shadow-2xs"
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Menu Explorer with Quick-Filter Chips */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8E5932]" />
            <h3 className="text-sm font-bold text-[#2B1810]">Explore Cafe Menu</h3>
          </div>
          <span className="text-[11px] text-[#7D6B5E]">
            {availableMenu.length} of {menu.length} items ready
          </span>
        </div>

        {/* Chips: Hot, Cold, Vegan, Snacks */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'hot' as const, label: 'Hot Drinks' },
            { id: 'cold' as const, label: 'Cold Brews' },
            { id: 'vegan' as const, label: 'Vegan Friendly' },
            { id: 'snack' as const, label: 'Kitchen & Pastries' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilterTag(chip.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                filterTag === chip.id
                  ? 'bg-[#3D2616] text-[#FAF7F2]'
                  : 'bg-[#FAF7F2] text-[#5A4638] hover:bg-[#F2ECE4] border border-[#E8DFD1]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Menu item cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {filteredMenuItems.map((item) => {
            const hasOatMilkMod = item.isMilkBased && availableModifiers.some((m) => m.id === 'oat_milk');
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] hover:border-[#D4C3B2] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-[#2B1810]">{item.name}</h4>
                    <span className="text-xs font-bold text-[#8E5932]">₹{item.price}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#7D6B5E] border border-[#E8DFD1]">
                      {item.station} • {item.prepMinutes}m
                    </span>
                    {item.dietary === 'vegan' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Vegan
                      </span>
                    )}
                    {item.allergens.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Allergens: {item.allergens.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#E8DFD1]">
                  <button
                    type="button"
                    onClick={() => handleQuickAddItem(item, false)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-white border border-[#D8C7B3] hover:bg-[#F5EBE1] text-xs font-bold text-[#3D2616] transition cursor-pointer"
                  >
                    + Add
                  </button>
                  {hasOatMilkMod && (
                    <button
                      type="button"
                      onClick={() => handleQuickAddItem(item, true)}
                      className="py-1.5 px-2 rounded-xl bg-[#F5EBE1] border border-[#D8C7B3] hover:bg-[#EDE0D0] text-[11px] font-bold text-[#6E4226] transition cursor-pointer"
                      title="Add with Oat milk upgrade (+₹40, vegan)"
                    >
                      + Oat Milk (+₹40)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Proposed Cart & Confirmation */}
      {cart.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-[#8E5932]/30 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
            <div>
              <h3 className="text-base font-bold font-serif text-[#2B1810]">
                Your Proposed Order
              </h3>
              <p className="text-[11px] text-[#7D6B5E]">
                Table {currentGuest?.seatId || 'Counter'} • {cart.length} item{cart.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Cart items list */}
          <div className="space-y-2.5">
            {cart.map((cItem) => (
              <div
                key={cItem.id}
                className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#2B1810]">{cItem.name}</h4>
                    {cItem.isVegan && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Vegan
                      </span>
                    )}
                  </div>

                  {cItem.modifierIds.length > 0 && (
                    <p className="text-xs text-[#8E5932] font-semibold">
                      +{cItem.modifierIds.map((m) => modifiers.find((mod) => mod.id === m)?.name).join(', ')}
                    </p>
                  )}

                  {cItem.notes && (
                    <p className="text-[11px] text-[#7D6B5E] italic">
                      Note: &ldquo;{cItem.notes}&rdquo;
                    </p>
                  )}

                  <p className="text-xs font-bold text-[#3D2616]">
                    ₹{cItem.computedPrice}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-white rounded-xl border border-[#D8C7B3] p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(cItem.id, cItem.qty - 1)}
                    className="w-6 h-6 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE4] flex items-center justify-center text-[#3D2616] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-[#2B1810]">
                    {cItem.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(cItem.id, cItem.qty + 1)}
                    className="w-6 h-6 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE4] flex items-center justify-center text-[#3D2616] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Allergen summary computed strictly from data */}
          {cartAllergens.length > 0 ? (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Verified Allergen Summary: </span>
                <span>Contains {cartAllergens.join(', ')}.</span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Allergen-free order selection.</span>
            </div>
          )}

          {/* Atomic stock rejection notice */}
          {orderError && (
            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Stock Shortage Notice</p>
                <p>{orderError}</p>
              </div>
            </div>
          )}

          {/* Order Summary & Confirm Button */}
          <div className="pt-2 border-t border-[#EFE8DE] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#7D6B5E]">Estimated Loyalty Earn</p>
                <p className="text-xs font-bold text-[#8E5932]">
                  +{Math.floor(cartTotalINR / 10)} pts (₹10 = 1 pt)
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#7D6B5E]">Total Amount</p>
                <p className="text-xl font-bold font-serif text-[#2B1810]">
                  ₹{cartTotalINR}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmOrder}
              className="w-full py-4 rounded-2xl bg-[#3D2616] hover:bg-[#2B1810] text-[#FAF7F2] font-bold text-sm shadow-md active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirm & Place Order</span>
              <ArrowRight className="w-4 h-4 text-[#D4A373]" />
            </button>
          </div>
        </div>
      )}

      {/* Success banner after placing */}
      {orderSuccessId && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-bold text-sm">Order #{orderSuccessId} Placed!</p>
              <p className="text-xs text-emerald-700">Check preparation tracker below.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
