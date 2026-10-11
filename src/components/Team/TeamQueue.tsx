import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { Order, OrderStatus } from '../../types/cafe';
import {
  Coffee,
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Play,
  Check,
} from 'lucide-react';

export const TeamQueue: React.FC = () => {
  const { orders, currentTime, advanceOrderStatus } = useCafe();

  // Active orders (placed, preparing, ready)
  const activeOrders = orders.filter((o) => o.status !== 'served');

  const barOrders = activeOrders.filter((o) =>
    o.items.some((item) => item.station === 'bar')
  );

  const kitchenOrders = activeOrders.filter((o) =>
    o.items.some((item) => item.station === 'kitchen')
  );

  const formatElapsed = (placedAt: number) => {
    const elapsedSec = Math.max(0, Math.floor((currentTime - placedAt) / 1000));
    if (elapsedSec < 60) return `${elapsedSec}s ago`;
    const elapsedMin = Math.floor(elapsedSec / 60);
    return `${elapsedMin}m ago`;
  };

  const renderOrderCard = (order: Order, stationFilter: 'bar' | 'kitchen') => {
    const stationItems = order.items.filter((i) => i.station === stationFilter);
    if (stationItems.length === 0) return null;

    const isReady = order.status === 'ready';
    const isPreparing = order.status === 'preparing';
    const isPlaced = order.status === 'placed';

    return (
      <div
        key={`${order.id}-${stationFilter}`}
        className={`p-4 rounded-2xl border transition-all space-y-3 ${
          isReady
            ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-400'
            : isPreparing
            ? 'bg-amber-50/60 border-amber-300'
            : 'bg-white border-[#EFE8DE] shadow-xs'
        }`}
      >
        {/* Card Header: Order #, Table, Elapsed Time */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-serif text-[#2B1810]">
                #{order.id}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#F5EBE1] text-[#6E4226] text-xs font-bold">
                Table {order.seatId}
              </span>
              {order.needsAttention && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                  Attention
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-[#7D6B5E] flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Placed {formatElapsed(order.placedAt)}
            </p>
          </div>

          {/* Status Badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isReady
                ? 'bg-emerald-600 text-white'
                : isPreparing
                ? 'bg-amber-600 text-white'
                : 'bg-[#FAF7F2] text-[#5A4638] border border-[#E8DFD1]'
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Visible Allergen & Attention Banner */}
        {order.needsAttention && (
          <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Attention / Dietary Alert:</span>
            </div>
            <ul className="list-disc pl-5 text-[11px] space-y-0.5">
              {order.attentionReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-1.5 text-xs text-[#2B1810]">
          {stationItems.map((item) => (
            <div
              key={item.id}
              className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1] space-y-0.5"
            >
              <div className="flex justify-between font-bold">
                <span>
                  {item.qty}x {item.name}
                </span>
                <span className="text-[#8E5932]">{item.prepMinutes}m prep</span>
              </div>

              {item.modifierIds.length > 0 && (
                <p className="text-[11px] text-[#8E5932] font-semibold">
                  Mod: {item.modifierIds.join(', ')}
                </p>
              )}

              {item.notes && (
                <p className="text-[11px] text-red-700 font-medium italic">
                  Note: &ldquo;{item.notes}&rdquo;
                </p>
              )}

              {item.isVegan && (
                <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Vegan
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Action Button: Forward only (Start -> Ready -> Served) */}
        <div className="pt-1">
          {isPlaced && (
            <button
              type="button"
              onClick={() => advanceOrderStatus(order.id)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#3D2616] hover:bg-[#2B1810] text-[#FAF7F2] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Preparing</span>
            </button>
          )}

          {isPreparing && (
            <button
              type="button"
              onClick={() => advanceOrderStatus(order.id)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark as Ready</span>
            </button>
          )}

          {isReady && (
            <button
              type="button"
              onClick={() => advanceOrderStatus(order.id)}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Mark Served (Complete)</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Bar Column */}
      <div className="bg-[#FAF7F2] rounded-3xl p-4 sm:p-5 border border-[#E8DFD1] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#3D2616] text-[#FAF7F2] flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#2B1810]">
                Bar Station Queue
              </h3>
              <p className="text-[11px] text-[#7D6B5E]">
                Concurrency: 2 drinks at a time
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-[#D8C7B3] text-[#3D2616]">
            {barOrders.length} active
          </span>
        </div>

        <div className="space-y-3">
          {barOrders.length === 0 ? (
            <div className="p-8 text-center bg-white/70 rounded-2xl border border-dashed border-[#D8C7B3] text-[#7D6B5E] text-xs">
              <Coffee className="w-6 h-6 mx-auto mb-1 text-[#C4B5A5]" />
              <p className="font-semibold">Bar queue is clear.</p>
              <p className="text-[11px]">Ready for fresh drink orders.</p>
            </div>
          ) : (
            barOrders.map((ord) => renderOrderCard(ord, 'bar'))
          )}
        </div>
      </div>

      {/* 2. Kitchen Column */}
      <div className="bg-[#FAF7F2] rounded-3xl p-4 sm:p-5 border border-[#E8DFD1] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#6E4226] text-[#FAF7F2] flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#2B1810]">
                Kitchen Station Queue
              </h3>
              <p className="text-[11px] text-[#7D6B5E]">
                Concurrency: 1 dish at a time
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-[#D8C7B3] text-[#3D2616]">
            {kitchenOrders.length} active
          </span>
        </div>

        <div className="space-y-3">
          {kitchenOrders.length === 0 ? (
            <div className="p-8 text-center bg-white/70 rounded-2xl border border-dashed border-[#D8C7B3] text-[#7D6B5E] text-xs">
              <ChefHat className="w-6 h-6 mx-auto mb-1 text-[#C4B5A5]" />
              <p className="font-semibold">Kitchen queue is clear.</p>
              <p className="text-[11px]">No pending food tickets.</p>
            </div>
          ) : (
            kitchenOrders.map((ord) => renderOrderCard(ord, 'kitchen'))
          )}
        </div>
      </div>
    </div>
  );
};
