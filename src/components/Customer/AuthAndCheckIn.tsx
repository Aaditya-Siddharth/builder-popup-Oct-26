import React, { useState } from 'react';
import { IntentMode, WorkDuration } from '../../types/cafe';
import { useCafe } from '../../context/CafeContext';
import {
  Briefcase,
  Heart,
  Users,
  Coffee,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  Flame,
} from 'lucide-react';

export const AuthAndCheckIn: React.FC = () => {
  const { checkInGuest } = useCafe();

  // Auth state
  const [step, setStep] = useState<'auth' | 'intent'>('auth');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [is18OrOlder, setIs18OrOlder] = useState(true);
  const [personalize, setPersonalize] = useState(true);
  const [authError, setAuthError] = useState('');

  // Intent state
  const [intent, setIntent] = useState<IntentMode>('work');
  const [workDuration, setWorkDuration] = useState<WorkDuration>('2h');
  const [partySize, setPartySize] = useState<number>(1);
  const [surpriseOn, setSurpriseOn] = useState<boolean>(true);
  const [shareWithTeam, setShareWithTeam] = useState<boolean>(true);
  const [checkInError, setCheckInError] = useState('');

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!phone || phone.trim().length < 6) {
      setAuthError('Please enter a valid phone number.');
      return;
    }

    if (otp !== '123456') {
      setAuthError('Invalid OTP code. For this demo, use code: 123456');
      return;
    }

    if (!is18OrOlder) {
      setAuthError('You must confirm you are 18 or older to proceed.');
      return;
    }

    setStep('intent');
  };

  const handleCompleteCheckIn = () => {
    setCheckInError('');
    const res = checkInGuest({
      phone,
      is18OrOlder,
      personalize,
      intent,
      workDuration: intent === 'work' ? workDuration : undefined,
      partySize,
      surpriseOn: intent === 'date' ? surpriseOn : undefined,
      shareWithTeam,
    });

    if (!res.success) {
      setCheckInError(res.error || 'Failed to complete check-in.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'auth' ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EFE8DE] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#F5EBE1] text-[#6E4226] flex items-center justify-center mx-auto shadow-inner">
              <Coffee className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-[#2B1810]">
              Welcome to Cafe Companion
            </h1>
            <p className="text-sm text-[#7D6B5E]">
              Natural-language ordering & hospitality tailored to your mood.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A4638] uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile"
                className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E4D9CC] text-[#2B1810] font-medium text-base focus:outline-none focus:ring-2 focus:ring-[#8E5932] transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#5A4638] uppercase tracking-wider">
                  Verification Code (OTP)
                </label>
                <span className="text-xs text-[#8E5932] font-medium bg-[#F5EBE1] px-2 py-0.5 rounded-full">
                  Demo code: 123456
                </span>
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E4D9CC] text-[#2B1810] tracking-widest text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#8E5932] transition"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={is18OrOlder}
                  onChange={(e) => setIs18OrOlder(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#8E5932] accent-[#8E5932] cursor-pointer"
                />
                <span className="text-xs text-[#5A4638] leading-tight">
                  I confirm that I am 18 years of age or older.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={personalize}
                  onChange={(e) => setPersonalize(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#8E5932] accent-[#8E5932] cursor-pointer"
                />
                <span className="text-xs text-[#5A4638] leading-tight">
                  Personalize my experience based on visit intent and seating preferences.
                </span>
              </label>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#3D2616] text-[#FAF7F2] font-semibold text-sm hover:bg-[#2B1810] active:scale-[0.99] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Check-In</span>
              <Sparkles className="w-4 h-4 text-[#D4A373]" />
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EFE8DE] space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8E5932]">Step 2 of 2</span>
            <h2 className="text-2xl font-bold font-serif text-[#2B1810]">
              Why are you visiting today?
            </h2>
            <p className="text-xs text-[#7D6B5E]">
              Your intent guides our seating, Wi-Fi priority, and hospitality touches.
            </p>
          </div>

          {/* 4 Intent Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'work' as IntentMode,
                title: 'Work & Focus',
                sub: 'Quiet, power & Wi-Fi',
                icon: Briefcase,
              },
              {
                id: 'unwind' as IntentMode,
                title: 'Unwind & Read',
                sub: 'Low-interruption space',
                icon: Coffee,
              },
              {
                id: 'meet' as IntentMode,
                title: 'Meet New People',
                sub: 'Community seating',
                icon: Users,
              },
              {
                id: 'date' as IntentMode,
                title: 'Date / Special',
                sub: 'Cozy two-seater nook',
                icon: Heart,
              },
            ].map((card) => {
              const Icon = card.icon;
              const isSelected = intent === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setIntent(card.id)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                    isSelected
                      ? 'bg-[#F5EBE1] border-[#8E5932] shadow-sm ring-1 ring-[#8E5932]'
                      : 'bg-[#FAF7F2] border-[#E8DFD1] hover:border-[#D4C3B2]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#3D2616] text-[#FAF7F2]'
                          : 'bg-white text-[#6E4226] border border-[#E8DFD1]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#8E5932]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2B1810]">{card.title}</h3>
                    <p className="text-[11px] text-[#7D6B5E] leading-tight">{card.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Follow-up Questions */}
          <div className="space-y-4 pt-2 border-t border-[#EFE8DE]">
            {/* Work Duration */}
            {intent === 'work' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#5A4638] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#8E5932]" />
                  <span>Expected Focus Duration</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1h', '2h', '3h', '4h+'] as WorkDuration[]).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setWorkDuration(dur)}
                      className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        workDuration === dur
                          ? 'bg-[#3D2616] text-[#FAF7F2] border-[#3D2616]'
                          : 'bg-[#FAF7F2] text-[#5A4638] border-[#E8DFD1] hover:bg-[#F2ECE4]'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
                {['3h', '4h+'].includes(workDuration) && (
                  <p className="text-[11px] text-[#8E5932] bg-[#F5EBE1] p-2 rounded-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Our order assistant will suggest sustained energy pairings for 3h+ sessions!</span>
                  </p>
                )}
              </div>
            )}

            {/* Party Size */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#5A4638] uppercase tracking-wider">
                Party Size
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPartySize(size)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      partySize === size
                        ? 'bg-[#3D2616] text-[#FAF7F2] border-[#3D2616]'
                        : 'bg-[#FAF7F2] text-[#5A4638] border-[#E8DFD1] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    {size === 4 ? '4+ Guests' : `${size} ${size === 1 ? 'Guest' : 'Guests'}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Surprise Toggle */}
            {intent === 'date' && (
              <div className="p-3 bg-[#FAF3EB] rounded-2xl border border-[#E9DACB] flex items-center justify-between">
                <div className="pr-3">
                  <p className="text-xs font-bold text-[#3D2616] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#C75D38]" />
                    OK if we add a small surprise?
                  </p>
                  <p className="text-[11px] text-[#7D6B5E] mt-0.5">
                    Free heart-shaped cookie & +50 couple loyalty points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSurpriseOn(!surpriseOn)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                    surpriseOn ? 'bg-[#8E5932]' : 'bg-[#D1C7BD]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                      surpriseOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Share intent with team toggle */}
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD1] flex items-center justify-between">
              <div className="pr-3">
                <p className="text-xs font-bold text-[#3D2616] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8E5932]" />
                  Share visit context with team
                </p>
                <p className="text-[11px] text-[#7D6B5E] mt-0.5">
                  Lets our bar & floor crew personalize service gestures without intruding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareWithTeam(!shareWithTeam)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                  shareWithTeam ? 'bg-[#8E5932]' : 'bg-[#D1C7BD]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    shareWithTeam ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {checkInError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{checkInError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('auth')}
              className="py-3 px-4 rounded-xl border border-[#E8DFD1] text-[#5A4638] text-xs font-semibold hover:bg-[#FAF7F2] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCompleteCheckIn}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-[#3D2616] text-[#FAF7F2] font-semibold text-sm hover:bg-[#2B1810] active:scale-[0.99] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Assign Table & Start</span>
              <Sparkles className="w-4 h-4 text-[#D4A373]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
