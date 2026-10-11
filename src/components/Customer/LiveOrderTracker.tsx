import React, { useEffect, useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Order, OrderStatus } from '../../types/cafe';
import {
  Clock,
  CheckCircle2,
  BellRing,
  Coffee,
  Sparkles,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const LiveOrderTracker: React.FC = () => {
  const { orders, currentGuest, currentTime } = useCafe();
  const [hasVibrated, setHasVibrated] = useState<Record<string, boolean>>({});

  // Filter orders for current guest
  const myOrders = orders.filter((o) =>
    currentGuest ? o.checkInId === currentGuest.id : true
  );

  // Trigger vibration when an order transitions to ready
  useEffect(() => {
    myOrders.forEach((order) => {
      if (order.status === 'ready' && !hasVibrated[order.id]) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([200, 100, 200, 100, 300]);
          } catch (_e) {
            // vibration API safe call
          }
        }
        setHasVibrated((prev) => ({ ...prev, [order.id]: true }));
      }
    });
  }, [myOrders, hasVibrated]);

  if (myOrders.length === 0 && !currentGuest) return null;

  const activeOrder = myOrders.find((o) => o.status !== 'served') || myOrders[0];

  return (
    <div className="space-y-4">
      {/* 1. Loyalty Balance Strip */}
      {currentGuest && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center">
              <Award className="w-5 h-5 text-[#8E5932]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D6B5E]">
                Loyalty Companion Balance
              </p>
              <h4 className="text-xl font-bold font-serif text-[#2B1810]">
                {currentGuest.loyaltyPoints}{' '}
                <span className="text-xs font-sans font-medium text-[#8E5932]">Points</span>
              </h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-[#8E5932] bg-[#FAF7F2] px-2.5 py-1 rounded-full border border-[#E8DFD1]">
              Earn 1 pt / ₹10
            </span>
            <p className="text-[10px] text-[#7D6B5E] mt-1">Free drink at 100 pts</p>
          </div>
        </div>
      )}

      {/* 2. Active Order Tracker */}
      {activeOrder && (
        <div className="space-y-3">
          {/* Big Banner when Ready */}
          {activeOrder.status === 'ready' && (
            <div className="p-5 rounded-3xl bg-[#3D2616] text-[#FAF7F2] shadow-lg border-2 border-[#D4A373] animate-pulse space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4A373] text-[#3D2616] flex items-center justify-center shrink-0">
                  <BellRing className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#FAF7F2]">
                    Order #{activeOrder.id} is Ready!
                  </h3>
                  <p className="text-xs text-[#E8DFD1]">
                    Your fresh items are ready at the counter or being brought to Table {activeOrder.seatId}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Progress Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#8E5932]">
                  Live Order Tracker
                </span>
                <h3 className="text-lg font-bold font-serif text-[#2B1810]">
                  Order #{activeOrder.id}
                </h3>
              </div>

              {/* Countdown ETA */}
              {activeOrder.status !== 'ready' && activeOrder.status !== 'served' && (
                <div className="text-right bg-[#FAF7F2] px-3 py-1.5 rounded-2xl border border-[#E8DFD1]">
                  <p className="text-[10px] uppercase font-bold text-[#7D6B5E]">Estimated ETA</p>
                  <p className="text-sm font-bold text-[#8E5932] flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {Math.max(
                        0,
                        Math.ceil((activeOrder.targetReadyTime - currentTime) / (60 * 1000))
                      )}{' '}
                      mins
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Stepper: Placed -> Preparing -> Ready */}
            <div className="relative pt-2 pb-1">
              <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                {[
                  { key: 'placed' as OrderStatus, label: 'Placed' },
                  { key: 'preparing' as OrderStatus, label: 'Preparing' },
                  { key: 'ready' as OrderStatus, label: 'Ready' },
                ].map((step, idx) => {
                  const statusOrder = ['placed', 'preparing', 'ready', 'served'];
                  const currentIndex = statusOrder.indexOf(activeOrder.status);
                  const isCurrent = activeOrder.status === step.key;
                  const isPassed = currentIndex >= idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#3D2616] text-[#FAF7F2] ring-4 ring-[#E8DFD1]'
                            : isPassed
                            ? 'bg-[#8E5932] text-white'
                            : 'bg-[#F5EBE1] text-[#9E8B7C]'
                        }`}
                      >
                        {isPassed && !isCurrent ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-[#2B1810] font-bold'
                            : isPassed
                            ? 'text-[#8E5932]'
                            : 'text-[#9E8B7C]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items summary */}
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] space-y-1.5 text-xs text-[#5A4638]">
              <div className="flex justify-between font-bold text-[#2B1810]">
                <span>Ordered Items</span>
                <span>₹{activeOrder.totalINR}</span>
              </div>
              <ul className="space-y-1 divide-y divide-[#EFE8DE] pt-1">
                {activeOrder.items.map((it) => (
                  <li key={it.id} className="pt-1 flex justify-between text-[11px]">
                    <span>
                      {it.qty}x {it.name}{' '}
                      {it.modifierIds.length > 0 && `(+${it.modifierIds.join(', ')})`}
                    </span>
                    <span className="font-semibold text-[#8E5932]">₹{it.computedPrice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
