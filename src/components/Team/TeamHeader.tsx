import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { computeStockBurnRates } from '../../utils/orderCalculator';
import {
  Clock,
  AlertTriangle,
  Flame,
  Coffee,
  ChefHat,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export const TeamHeader: React.FC<{ onOpenDemoDrawer: () => void }> = ({
  onOpenDemoDrawer,
}) => {
  const { currentTime, stock, orders, seats } = useCafe();

  const burnRates = computeStockBurnRates(stock, orders, 30);
  const criticalItems = Object.values(burnRates).filter(
    (b) => b.status === 'critical' || b.currentStock === 0
  );
  const warningItems = Object.values(burnRates).filter(
    (b) => b.status === 'warning' && b.currentStock > 0
  );

  const activeBarOrders = orders.filter(
    (o) =>
      o.items.some((i) => i.station === 'bar') &&
      o.status !== 'served'
  );
  const activeKitchenOrders = orders.filter(
    (o) =>
      o.items.some((i) => i.station === 'kitchen') &&
      o.status !== 'served'
  );
  const occupiedSeatsCount = seats.filter((s) => s.occupiedByCheckInId).length;

  const formattedTime = new Date(currentTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#3D2616] text-[#FAF7F2] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-[#2B1810]">
                Cafe Floor & Ops Board
              </h2>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs font-mono font-semibold text-[#7D6B5E]">
              Live Local Time: {formattedTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Stats Badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1] text-[#5A4638] flex items-center gap-1.5 font-semibold">
              <Coffee className="w-3.5 h-3.5 text-[#8E5932]" />
              Bar Queue: {activeBarOrders.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1] text-[#5A4638] flex items-center gap-1.5 font-semibold">
              <ChefHat className="w-3.5 h-3.5 text-[#8E5932]" />
              Kitchen Queue: {activeKitchenOrders.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1] text-[#5A4638] font-semibold">
              Occupancy: {occupiedSeatsCount}/{seats.length} tables
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenDemoDrawer}
            className="px-3.5 py-2 rounded-xl bg-[#F5EBE1] hover:bg-[#EAE0D3] text-[#3D2616] font-bold text-xs flex items-center gap-1.5 border border-[#D8C7B3] transition cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-[#8E5932]" />
            <span>Demo Controls</span>
          </button>
        </div>
      </div>

      {/* Alerts Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EFE8DE]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#7D6B5E] mr-1">
          Active Alerts:
        </span>

        {criticalItems.length > 0 &&
          criticalItems.map((item) => (
            <span
              key={item.ingredient}
              className="px-2.5 py-1 rounded-lg bg-red-100 text-red-900 border border-red-200 text-xs font-bold flex items-center gap-1 animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              {item.currentStock <= 0
                ? `${item.ingredient.replace('_', ' ')} OUT OF STOCK`
                : `${item.ingredient.replace('_', ' ')}: ~${item.minutesUntilStockout}m left`}
            </span>
          ))}

        {warningItems.length > 0 &&
          warningItems.map((item) => (
            <span
              key={item.ingredient}
              className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              {item.minutesUntilStockout !== null
                ? `${item.ingredient.replace('_', ' ')} low: ~${item.minutesUntilStockout}m left`
                : `${item.ingredient.replace('_', ' ')} low: ${item.currentStock} units`}
            </span>
          ))}

        {criticalItems.length === 0 && warningItems.length === 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            All ingredient stock levels healthy
          </span>
        )}
      </div>
    </div>
  );
};
