import React from 'react';
import { useCafe } from '../context/CafeContext';
import {
  Coffee,
  Users,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  Sliders,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenDemo: () => void }> = ({ onOpenDemo }) => {
  const {
    activeTab,
    setActiveTab,
    orders,
    currentGuest,
    signOutGuest,
    resetDemo,
  } = useCafe();

  const activeOrdersCount = orders.filter((o) => o.status !== 'served').length;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EFE8DE] px-4 py-3 sm:py-3.5 transition">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#3D2616] text-[#FAF7F2] flex items-center justify-center shadow-inner">
              <Coffee className="w-5 h-5 text-[#D4A373]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-serif text-[#2B1810] tracking-tight">
                  Cafe Companion
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F5EBE1] text-[#8E5932] border border-[#E4D9CC]">
                  AI Hospitality
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDemo}
              className="p-2 rounded-xl bg-white border border-[#E8DFD1] text-[#5A4638] text-xs font-semibold cursor-pointer"
              title="Demo Drawer"
            >
              <Sliders className="w-4 h-4 text-[#8E5932]" />
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="p-2 rounded-xl bg-white border border-[#E8DFD1] text-[#5A4638] text-xs font-semibold cursor-pointer"
              title="Reset Demo"
            >
              <RotateCcw className="w-4 h-4 text-rose-700" />
            </button>
          </div>
        </div>

        {/* Center Tabs: Customer & Team Board */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EFE8DE] border border-[#E2D5C3]">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-[#3D2616] text-[#FAF7F2] shadow-sm'
                : 'text-[#5A4638] hover:text-[#2B1810]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Customer View</span>
            {currentGuest && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'team'
                ? 'bg-[#3D2616] text-[#FAF7F2] shadow-sm'
                : 'text-[#5A4638] hover:text-[#2B1810]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Team Board</span>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#D4A373] text-[#3D2616]">
                {activeOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {currentGuest && activeTab === 'customer' && (
            <button
              type="button"
              onClick={signOutGuest}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-xs font-semibold text-[#7D6B5E] hover:text-rose-700 border border-[#E8DFD1] transition flex items-center gap-1.5 cursor-pointer"
              title="Sign out & release table"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Table {currentGuest.seatId}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDemo}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-xs font-bold text-[#3D2616] border border-[#E8DFD1] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-[#8E5932]" />
            <span>Demo Rush</span>
          </button>

          <button
            type="button"
            onClick={resetDemo}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-xs font-bold text-rose-800 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Reset in-memory demo state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
