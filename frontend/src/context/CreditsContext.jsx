import React, { createContext, useContext, useMemo, useState } from 'react';

const CreditsContext = createContext(null);
const STARTING_CREDITS = 50;

function storageKey() {
  const user = localStorage.getItem('gyansetu_user');
  try { return `gyansetu_credits_${JSON.parse(user || '{}').id || 'guest'}`; } catch { return 'gyansetu_credits_guest'; }
}

export function CreditsProvider({ children }) {
  const [credits, setCredits] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey()));
    return Number.isFinite(saved) && saved >= 0 ? saved : STARTING_CREDITS;
  });
  const [showTopUp, setShowTopUp] = useState(false);

  const spend = (amount) => {
    if (credits < amount) { setShowTopUp(true); return false; }
    const next = credits - amount;
    setCredits(next); localStorage.setItem(storageKey(), String(next)); return true;
  };
  const topUp = (amount = 100) => {
    const next = credits + amount;
    setCredits(next); localStorage.setItem(storageKey(), String(next)); setShowTopUp(false);
  };
  const value = useMemo(() => ({ credits, spend, topUp, showTopUp, setShowTopUp }), [credits, showTopUp]);
  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}
export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used within CreditsProvider');
  return context;
}
