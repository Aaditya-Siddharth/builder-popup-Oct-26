import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import {
  Wifi,
  Sparkles,
  Zap,
  MapPin,
  Gift,
  Shield,
  Coffee,
  Check,
  Copy,
  Users,
  Compass,
  Star,
} from 'lucide-react';

export const SeatAndHospitality: React.FC = () => {
  const { currentGuest, seats } = useCafe();
  const [copiedWifi, setCopiedWifi] = useState(false);

  if (!currentGuest) return null;

  const assignedSeat = seats.find((s) => s.id === currentGuest.seatId);

  const copyWifiPassword = () => {
    navigator.clipboard?.writeText('brew2026');
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Seat Assignment Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center font-bold text-sm">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D6B5E]">
                Assigned Table
              </p>
              <h2 className="text-xl font-bold font-serif text-[#2B1810]">
                Table {currentGuest.seatId}{' '}
                <span className="text-xs font-normal text-[#8E5932] capitalize">
                  ({assignedSeat?.zone} zone)
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {assignedSeat?.hasOutlet && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-[11px] font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                Power Outlet
              </span>
            )}
            <span className="px-2.5 py-1 bg-[#FAF7F2] text-[#5A4638] border border-[#E8DFD1] rounded-full text-[11px] font-medium">
              Fits {assignedSeat?.capacity || 2}
            </span>
          </div>
        </div>

        {/* Why line for Seat */}
        <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] text-xs text-[#5A4638] flex items-start gap-2">
          <Compass className="w-4 h-4 text-[#8E5932] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#2B1810]">Why this table: </span>
            <span className="italic">{currentGuest.seatReason}</span>
          </div>
        </div>
      </div>

      {/* 2. Hospitality Playbook Gestures */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D6B5E] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#8E5932]" />
            Hospitality Gestures & Perks
          </h3>
          <span className="text-[11px] text-[#8E5932] font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-[#8E5932]" />
            {currentGuest.loyaltyPoints} Points
          </span>
        </div>

        <div className="grid gap-2.5">
          {currentGuest.playbookGestures.map((gesture) => {
            const isWifi = gesture.category === 'wifi';
            const isSurprise = gesture.category === 'surprise';
            const isRefill = gesture.category === 'refill';
            const isLoyalty = gesture.category === 'loyalty';
            const isService = gesture.category === 'service';
            const isSocial = gesture.category === 'social';

            return (
              <div
                key={gesture.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isWifi
                    ? 'bg-[#F9F5EF] border-[#E2D5C3] shadow-xs ring-1 ring-[#8E5932]/20'
                    : isSurprise
                    ? 'bg-rose-50/70 border-rose-200/70'
                    : 'bg-white border-[#EFE8DE]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isWifi
                          ? 'bg-[#3D2616] text-white'
                          : isSurprise
                          ? 'bg-rose-500 text-white'
                          : isRefill
                          ? 'bg-blue-100 text-blue-700'
                          : isLoyalty
                          ? 'bg-amber-100 text-amber-700'
                          : isSocial
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-[#F5EBE1] text-[#6E4226]'
                      }`}
                    >
                      {isWifi && <Wifi className="w-4 h-4" />}
                      {isSurprise && <Gift className="w-4 h-4" />}
                      {isRefill && <Coffee className="w-4 h-4" />}
                      {isLoyalty && <Star className="w-4 h-4" />}
                      {isSocial && <Users className="w-4 h-4" />}
                      {isService && <Shield className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#2B1810]">
                          {gesture.title}
                        </h4>
                        {gesture.delivered && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Delivered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5A4638] font-medium">
                        {gesture.description}
                      </p>

                      {/* Gemini-written warm "why" line */}
                      <p className="text-[11px] text-[#7D6B5E] italic pt-0.5">
                        <span className="font-semibold text-[#8E5932] not-italic">Why: </span>
                        &ldquo;{gesture.why}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Copy Wi-Fi action */}
                  {isWifi && (
                    <button
                      type="button"
                      onClick={copyWifiPassword}
                      className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white border border-[#D8C7B3] hover:bg-[#FAF7F2] text-xs font-semibold text-[#3D2616] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      {copiedWifi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#8E5932]" />
                          <span>Copy Pass</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
