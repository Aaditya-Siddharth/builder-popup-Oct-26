import React, { useEffect, useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { IngredientKey, ManagerBriefingResponse } from '../../types/cafe';
import { computeStockBurnRates } from '../../utils/orderCalculator';
import { fetchManagerBriefing } from '../../utils/aiService';
import {
  Activity,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Plus,
  Flame,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const TeamPulseAndStock: React.FC = () => {
  const { stock, orders, seats, restockIngredient } = useCafe();

  const [briefing, setBriefing] = useState<ManagerBriefingResponse>({
    headline: 'Floor Operations Steady',
    nudges: [
      'All ingredient burn rates are stable.',
      'Bar & kitchen prep queues running within target turnaround.',
    ],
  });
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);

  const burnRates = computeStockBurnRates(stock, orders, 30);

  const activeBarCount = orders.filter(
    (o) => o.status !== 'served' && o.items.some((i) => i.station === 'bar')
  ).length;

  const activeKitchenCount = orders.filter(
    (o) => o.status !== 'served' && o.items.some((i) => i.station === 'kitchen')
  ).length;

  const occupiedSeats = seats.filter((s) => s.occupiedByCheckInId).length;

  const loadBriefing = async () => {
    setIsBriefingLoading(true);
    try {
      const stockAlerts = Object.values(burnRates)
        .filter((b) => b.status !== 'healthy')
        .map((b) => `${b.ingredient.replace('_', ' ')} (${b.minutesUntilStockout ?? 0}m left)`);

      const burnHighlights = Object.values(burnRates)
        .filter((b) => b.consumedLast30m > 0)
        .map(
          (b) =>
            `${b.ingredient.replace('_', ' ')}: ${b.consumedLast30m} units consumed in 30m`
        );

      const res = await fetchManagerBriefing({
        stockAlerts,
        barQueue: activeBarCount,
        kitchenQueue: activeKitchenCount,
        occupiedSeats,
        totalSeats: seats.length,
        burnHighlights,
      });

      setBriefing(res);
    } catch (_e) {
      // Fallback handles it cleanly
    } finally {
      setIsBriefingLoading(false);
    }
  };

  // Re-fetch briefing when orders change or initially
  useEffect(() => {
    loadBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length, stock.oat_milk]);

  return (
    <div className="space-y-4">
      {/* 1. Manager Briefing Card */}
      <div className="bg-[#3D2616] text-[#FAF7F2] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D4A373] text-[#3D2616] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A373]">
                AI Operations Copilot
              </span>
              <h3 className="text-base font-bold font-serif text-[#FAF7F2]">
                Manager Briefing: {briefing.headline}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={loadBriefing}
            disabled={isBriefingLoading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] transition cursor-pointer text-xs flex items-center gap-1.5"
            title="Refresh AI briefing"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isBriefingLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-2">
          <p className="text-[11px] text-[#E8DFD1] font-semibold">
            Operational Nudges (based on live stock burn, queues & seats):
          </p>
          <ul className="space-y-1.5 text-xs text-[#FAF7F2]">
            {briefing.nudges.map((nudge, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#D4A373] font-bold">•</span>
                <span className="leading-snug">{nudge}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. Stock Inventory & Burn Rate Pulse */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-[#8E5932]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#2B1810]">
                Ingredient Stock & Burn Pulse
              </h3>
              <p className="text-[11px] text-[#7D6B5E]">
                Tracked against 30-minute consumption velocity
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#5A4638] border border-[#E8DFD1]">
            9 Ingredients Active
          </span>
        </div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(stock) as IngredientKey[]).map((key) => {
            const current = stock[key];
            const burn = burnRates[key];
            const isOutOfStock = current <= 0;
            const isCritical = burn.status === 'critical';
            const isWarning = burn.status === 'warning';

            return (
              <div
                key={key}
                className={`p-3.5 rounded-2xl border transition-all space-y-2 flex flex-col justify-between ${
                  isOutOfStock
                    ? 'bg-red-50/80 border-red-300'
                    : isCritical
                    ? 'bg-red-50/50 border-red-200'
                    : isWarning
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-[#FAF7F2] border-[#E8DFD1]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold capitalize text-[#2B1810]">
                        {key.replace('_', ' ')}
                      </h4>
                      <p className="text-base font-bold font-mono text-[#3D2616]">
                        {current}{' '}
                        <span className="text-xs font-sans text-[#7D6B5E]">units</span>
                      </p>
                    </div>

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold">
                        Out of Stock
                      </span>
                    ) : isCritical ? (
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-900 border border-red-300 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        Critical (&lt;15m)
                      </span>
                    ) : isWarning ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-600" />
                        Warning (&lt;45m)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        Healthy
                      </span>
                    )}
                  </div>

                  {/* Estimated minutes until stockout */}
                  <div className="mt-2 text-[11px] text-[#5A4638]">
                    {burn.minutesUntilStockout !== null ? (
                      <p className="font-semibold">
                        Burn velocity:{' '}
                        <span
                          className={
                            isCritical
                              ? 'text-red-700 font-bold'
                              : isWarning
                              ? 'text-amber-700 font-bold'
                              : 'text-emerald-700 font-bold'
                          }
                        >
                          ~{burn.minutesUntilStockout} mins left
                        </span>
                      </p>
                    ) : (
                      <p className="text-[#9E8B7C]">No burn in last 30m</p>
                    )}
                  </div>
                </div>

                {/* Restock Button */}
                <button
                  type="button"
                  onClick={() => restockIngredient(key, 20)}
                  className="w-full py-1.5 px-3 rounded-xl bg-white border border-[#D8C7B3] hover:bg-[#F5EBE1] text-[#3D2616] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#8E5932]" />
                  <span>Restock (+20)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
