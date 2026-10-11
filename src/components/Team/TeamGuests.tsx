import React from 'react';
import { useCafe } from '../../context/CafeContext';
import {
  Users,
  Briefcase,
  Heart,
  Coffee,
  CheckCircle2,
  Clock,
  ShieldCheck,
  EyeOff,
  Sparkles,
  Gift,
} from 'lucide-react';

export const TeamGuests: React.FC = () => {
  const { allGuests, currentTime, markGestureDelivered } = useCafe();

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'work':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'date':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'unwind':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'meet':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatElapsed = (createdAt: number) => {
    const min = Math.max(0, Math.floor((currentTime - createdAt) / 60000));
    if (min < 60) return `${min}m in cafe`;
    const hrs = Math.floor(min / 60);
    const rem = min % 60;
    return `${hrs}h ${rem}m in cafe`;
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EFE8DE] space-y-4">
      <div className="flex items-center justify-between border-b border-[#EFE8DE] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif text-[#2B1810]">
              Active Guests & Playbook Tasks
            </h3>
            <p className="text-[11px] text-[#7D6B5E]">
              {allGuests.length} table{allGuests.length === 1 ? '' : 's'} checked in • Phone numbers kept private
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#8E5932] border border-[#E8DFD1]">
          Privacy Shield Active
        </span>
      </div>

      {allGuests.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#7D6B5E] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#D8C7B3]">
          <p className="font-semibold">No active guest check-ins.</p>
          <p className="text-[11px] mt-0.5">
            Switch to the Customer tab to check in and see staff gestures appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {allGuests.map((guest) => {
            const isSharing = guest.shareWithTeam;
            const staffTasks = guest.playbookGestures.filter(
              (g) => g.actionableStaffTask
            );

            return (
              <div
                key={guest.id}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD1] space-y-3"
              >
                {/* Header: Table, Privacy or Intent Badge, Elapsed */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#2B1810]">
                        Table {guest.seatId}
                      </span>
                      <span className="text-xs text-[#7D6B5E]">
                        ({guest.partySize} {guest.partySize === 1 ? 'person' : 'people'})
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#7D6B5E] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatElapsed(guest.createdAt)}
                    </p>
                  </div>

                  {/* Intent Badge OR Neutral Guest Badge */}
                  {isSharing ? (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize flex items-center gap-1 ${getIntentColor(
                        guest.intent
                      )}`}
                    >
                      {guest.intent === 'work' && <Briefcase className="w-3 h-3" />}
                      {guest.intent === 'date' && <Heart className="w-3 h-3" />}
                      {guest.intent === 'unwind' && <Coffee className="w-3 h-3" />}
                      {guest.intent === 'meet' && <Users className="w-3 h-3" />}
                      <span>{guest.intent}</span>
                      {guest.intent === 'work' && guest.workDuration && (
                        <span>({guest.workDuration})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Neutral Guest
                    </span>
                  )}
                </div>

                {/* If sharing is OFF: Show NO playbook instructions */}
                {!isSharing ? (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>
                      Guest opted for private check-in. Standard courteous service with no playbook nudges.
                    </span>
                  </div>
                ) : (
                  /* If sharing is ON: Show Staff Playbook Cards */
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#7D6B5E]">
                      Hospitality Gestures to Deliver:
                    </p>

                    {staffTasks.length === 0 ? (
                      <p className="text-xs text-[#7D6B5E] italic">
                        Standard warm hospitality for Table {guest.seatId}.
                      </p>
                    ) : (
                      staffTasks.map((gesture) => (
                        <div
                          key={gesture.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                            gesture.delivered
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : 'bg-white border-[#E8DFD1] text-[#3D2616] shadow-2xs'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#8E5932] shrink-0" />
                              <p className="text-xs font-bold leading-tight">
                                {gesture.actionableStaffTask}
                              </p>
                            </div>
                            <p className="text-[11px] text-[#7D6B5E] italic pl-5">
                              &ldquo;{gesture.why}&rdquo;
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => markGestureDelivered(guest.id, gesture.id)}
                            disabled={gesture.delivered}
                            className={`shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                              gesture.delivered
                                ? 'bg-emerald-200 text-emerald-900 cursor-default'
                                : 'bg-[#3D2616] hover:bg-[#2B1810] text-[#FAF7F2]'
                            }`}
                          >
                            {gesture.delivered ? 'Delivered' : 'Mark Done'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
