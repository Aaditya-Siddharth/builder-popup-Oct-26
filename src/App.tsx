import React, { useState } from 'react';
import { CafeProvider, useCafe } from './context/CafeContext';
import { Navbar } from './components/Navbar';
import { AuthAndCheckIn } from './components/Customer/AuthAndCheckIn';
import { SeatAndHospitality } from './components/Customer/SeatAndHospitality';
import { AIOrderAssistant } from './components/Customer/AIOrderAssistant';
import { LiveOrderTracker } from './components/Customer/LiveOrderTracker';
import { TeamHeader } from './components/Team/TeamHeader';
import { TeamQueue } from './components/Team/TeamQueue';
import { TeamGuests } from './components/Team/TeamGuests';
import { TeamPulseAndStock } from './components/Team/TeamPulseAndStock';
import { DemoDrawer } from './components/DemoDrawer';

const CafeCompanionContent: React.FC = () => {
  const { activeTab, currentGuest } = useCafe();
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2B1810] flex flex-col font-sans selection:bg-[#F5EBE1] selection:text-[#3D2616]">
      <Navbar onOpenDemo={() => setIsDemoDrawerOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {activeTab === 'customer' ? (
          <div className="space-y-6 max-w-2xl mx-auto">
            {!currentGuest ? (
              <AuthAndCheckIn />
            ) : (
              <div className="space-y-6">
                <SeatAndHospitality />
                <AIOrderAssistant />
                <LiveOrderTracker />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <TeamHeader onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)} />
            <TeamQueue />
            <TeamGuests />
            <TeamPulseAndStock />
          </div>
        )}
      </main>

      <footer className="border-t border-[#EFE8DE] bg-[#FAF7F2] py-4 text-center text-xs text-[#9E8B7C]">
        <p>
          Cafe Companion • AI-Powered Ordering & Intent-Guided Hospitality • In-Memory Browser State
        </p>
      </footer>

      <DemoDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CafeProvider>
      <CafeCompanionContent />
    </CafeProvider>
  );
}
