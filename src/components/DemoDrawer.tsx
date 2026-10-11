import React from 'react';
import { useCafe } from '../context/CafeContext';
import {
  X,
  Zap,
  RotateCcw,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
} from 'lucide-react';

export const DemoDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { simulateRush, restockOatMilk, resetDemo, stock } = useCafe();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EFE8DE] space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-[#8E5932]" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-[#2B1810]">
                Demo & Simulation Drawer
              </h3>
              <p className="text-xs text-[#7D6B5E]">
                Test operational rush scenarios and state resets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#5A4638] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Oat Milk Status Preview */}
        <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5A4638]">Current Oat Milk Stock</p>
            <p className="text-base font-bold font-mono text-[#2B1810]">
              {stock.oat_milk} units
            </p>
          </div>
          {stock.oat_milk <= 2 ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Critical Shortage
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Available
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* 1. Simulate Rush */}
          <button
            type="button"
            onClick={() => {
              simulateRush();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#F5EBE1] border border-[#E8DFD1] text-left transition flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
              <Flame className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#2B1810]">
                Simulate Morning Rush (6 Oat-Milk Orders)
              </h4>
              <p className="text-xs text-[#7D6B5E] mt-0.5 leading-tight">
                Generates 6 synthetic Iced Latte + Oat Milk tickets to consume stock and trigger the critical burn rate alert.
              </p>
            </div>
          </button>

          {/* 2. Restock Oat Milk */}
          <button
            type="button"
            onClick={() => {
              restockOatMilk();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#F5EBE1] border border-[#E8DFD1] text-left transition flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
              <Coffee className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#2B1810]">
                Restock Oat Milk (+20 Units)
              </h4>
              <p className="text-xs text-[#7D6B5E] mt-0.5 leading-tight">
                Instantly replenishes carton reserves so oat-milk upgrades and vegan drinks become immediately orderable.
              </p>
            </div>
          </button>

          {/* 3. Reset Demo */}
          <button
            type="button"
            onClick={() => {
              resetDemo();
              onClose();
            }}
            className="w-full p-4 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200 text-left transition flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
              <RotateCcw className="w-4 h-4 text-rose-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Reset Demo to Seed State
              </h4>
              <p className="text-xs text-rose-800/80 mt-0.5 leading-tight">
                Restores original inventory, clears customer queue, resets seat assignments and orders back to initial start state.
              </p>
            </div>
          </button>
        </div>

        <div className="p-3 bg-[#FAF7F2] rounded-xl text-[11px] text-[#7D6B5E] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#8E5932] shrink-0" />
          <span>
            Everything runs live in-memory. Actions sync immediately between the Customer and Team views.
          </span>
        </div>
      </div>
    </div>
  );
};
