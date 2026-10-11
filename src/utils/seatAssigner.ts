import { IntentMode, Seat } from '../types/cafe';

export interface SeatAssignmentResult {
  seat: Seat;
  reason: string;
  isRelaxed: boolean;
}

export function assignSeat(
  intent: IntentMode,
  partySize: number,
  seats: Seat[]
): SeatAssignmentResult | null {
  // Available seats that fit the party
  const availableSeats = seats.filter(
    (s) => !s.occupiedByCheckInId && s.capacity >= partySize
  );

  if (availableSeats.length === 0) {
    // If no seats fit the party size at all
    return null;
  }

  // Helper to pick candidate with lowest wasted capacity (capacity - partySize)
  const pickBest = (candidates: Seat[]): Seat | null => {
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => {
      const wastedA = a.capacity - partySize;
      const wastedB = b.capacity - partySize;
      if (wastedA !== wastedB) return wastedA - wastedB;
      return a.id.localeCompare(b.id);
    })[0];
  };

  if (intent === 'work') {
    // 1. Ideal: quiet + outlet
    const ideal = availableSeats.filter((s) => s.zone === 'quiet' && s.hasOutlet);
    const bestIdeal = pickBest(ideal);
    if (bestIdeal) {
      return {
        seat: bestIdeal,
        reason: "You're here to focus, so we picked a quiet seat with power.",
        isRelaxed: false,
      };
    }

    // Relax 1: any zone with outlet
    const outletAny = availableSeats.filter((s) => s.hasOutlet);
    const bestOutlet = pickBest(outletAny);
    if (bestOutlet) {
      return {
        seat: bestOutlet,
        reason: "Quiet booths are full, so we selected a powered table nearby to keep your devices charged.",
        isRelaxed: true,
      };
    }

    // Relax 2: quiet zone without outlet
    const quietNoOutlet = availableSeats.filter((s) => s.zone === 'quiet');
    const bestQuiet = pickBest(quietNoOutlet);
    if (bestQuiet) {
      return {
        seat: bestQuiet,
        reason: "Powered seats are full, but we secured a peaceful quiet table for deep focus.",
        isRelaxed: true,
      };
    }

    // Relax 3: any available
    const anySeat = pickBest(availableSeats)!;
    return {
      seat: anySeat,
      reason: "Focus areas are busy, so we accommodated your party at the best open table.",
      isRelaxed: true,
    };
  }

  if (intent === 'unwind') {
    // Ideal: quiet or window
    const ideal = availableSeats.filter((s) => s.zone === 'quiet' || s.zone === 'window');
    const bestIdeal = pickBest(ideal);
    if (bestIdeal) {
      return {
        seat: bestIdeal,
        reason: "You're here to unwind, so we reserved a cozy spot with relaxed ambient views.",
        isRelaxed: false,
      };
    }

    // Relax: any available
    const anySeat = pickBest(availableSeats)!;
    return {
      seat: anySeat,
      reason: "Window nooks are full, but this comfortable open table is ready for your break.",
      isRelaxed: true,
    };
  }

  if (intent === 'date') {
    // Ideal: date zone
    const ideal = availableSeats.filter((s) => s.zone === 'date');
    const bestIdeal = pickBest(ideal);
    if (bestIdeal) {
      return {
        seat: bestIdeal,
        reason: "We reserved an intimate, private two-seater nook for your date.",
        isRelaxed: false,
      };
    }

    // Relax 1: window zone
    const windowSeats = availableSeats.filter((s) => s.zone === 'window');
    const bestWindow = pickBest(windowSeats);
    if (bestWindow) {
      return {
        seat: bestWindow,
        reason: "Date booths are booked, so we gave you a romantic window table with great light.",
        isRelaxed: true,
      };
    }

    // Relax 2: quiet
    const quietSeats = availableSeats.filter((s) => s.zone === 'quiet');
    const bestQuiet = pickBest(quietSeats);
    if (bestQuiet) {
      return {
        seat: bestQuiet,
        reason: "Date tables are full, so we set aside a quiet, low-noise corner for conversation.",
        isRelaxed: true,
      };
    }

    const anySeat = pickBest(availableSeats)!;
    return {
      seat: anySeat,
      reason: "Private booths are occupied, so we found the warmest table available for you two.",
      isRelaxed: true,
    };
  }

  // intent === 'meet'
  // Ideal: social zone
  const ideal = availableSeats.filter((s) => s.zone === 'social');
  const bestIdeal = pickBest(ideal);
  if (bestIdeal) {
    return {
      seat: bestIdeal,
      reason: "You're here to connect, so we seated you at our communal social table.",
      isRelaxed: false,
    };
  }

  // Relax: any available
  const anySeat = pickBest(availableSeats)!;
  return {
    seat: anySeat,
    reason: "Our community table is currently full, so we placed you right in the lively main area.",
    isRelaxed: true,
  };
}
