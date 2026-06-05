import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type {
  Trip,
  Participant,
  Expense,
  ItineraryDay,
  Activity,
  Balance,
  Settlement,
  ExpenseSplit,
} from "@/types";
import {
  tripsService,
  expensesService,
  itineraryService,
} from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

// ── Helpers de cálculo ─────────────────────────────────────────────────────────

export function computeBalances(trip: Trip): Balance[] {
  return trip.participants.map((p) => {
    const totalPaid = trip.expenses
      .filter((e) => e.paidById === p.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalOwed = trip.expenses.reduce((sum, e) => {
      const split = e.splits.find((s) => s.participantId === p.id);
      return sum + (split ? split.amount : 0);
    }, 0);
    return {
      participantId: p.id,
      totalPaid,
      totalOwed,
      net: totalPaid - totalOwed,
    };
  });
}

export function computeSettlements(balances: Balance[]): Settlement[] {
  const sorted = balances.map((b) => ({ ...b })).sort((a, b) => a.net - b.net);
  const settlements: Settlement[] = [];
  let i = 0;
  let j = sorted.length - 1;
  while (i < j) {
    const debtor = sorted[i];
    const creditor = sorted[j];
    const amount = Math.min(Math.abs(debtor.net), creditor.net);
    if (amount > 0.01) {
      settlements.push({
        fromId: debtor.participantId,
        toId: creditor.participantId,
        amount,
      });
      debtor.net += amount;
      creditor.net -= amount;
    }
    if (Math.abs(debtor.net) < 0.01) i++;
    if (Math.abs(creditor.net) < 0.01) j--;
  }
  return settlements;
}

export function buildEqualSplits(
  amount: number,
  participantIds: string[],
): ExpenseSplit[] {
  if (participantIds.length === 0) return [];
  const share = parseFloat((amount / participantIds.length).toFixed(2));
  const splits = participantIds.map((id) => ({
    participantId: id,
    amount: share,
  }));
  const diff = parseFloat(
    (amount - splits.reduce((s, x) => s + x.amount, 0)).toFixed(2),
  );
  splits[0].amount = parseFloat((splits[0].amount + diff).toFixed(2));
  return splits;
}

export function buildPercentageSplits(
  amount: number,
  entries: { participantId: string; percentage: number }[],
): ExpenseSplit[] {
  return entries.map((e) => ({
    participantId: e.participantId,
    amount: parseFloat(((amount * e.percentage) / 100).toFixed(2)),
    percentage: e.percentage,
  }));
}

// ── Contexto ───────────────────────────────────────────────────────────────────

interface TripCtx {
  trips: Trip[];
  loading: boolean;
  refreshTrips: () => Promise<void>;
  addTrip: (t: Trip) => Promise<void>;
  updateTrip: (t: Trip) => void;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;

  addExpense: (tripId: string, e: Expense) => void;
  updateExpense: (tripId: string, e: Expense) => void;
  deleteExpense: (tripId: string, expenseId: string) => void;

  addDay: (tripId: string, day: ItineraryDay) => void;
  updateDay: (tripId: string, day: ItineraryDay) => void;
  deleteDay: (tripId: string, dayId: string) => void;

  addActivity: (tripId: string, dayId: string, a: Activity) => void;
  updateActivity: (tripId: string, dayId: string, a: Activity) => void;
  deleteActivity: (tripId: string, dayId: string, activityId: string) => void;

  addParticipant: (tripId: string, p: Participant) => void;
  removeParticipant: (tripId: string, participantId: string) => void;
}

const TripContext = createContext<TripCtx | null>(null);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar viajes desde Supabase cuando el usuario cambia
  const loadTrips = useCallback(async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userTrips = await tripsService.getMyTrips();
      setTrips(userTrips);
    } catch (error) {
      console.error("Error loading trips:", error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const refreshTrips = useCallback(async () => {
    await loadTrips();
  }, [loadTrips]);

  const updateTripById = useCallback(
    (id: string, updater: (t: Trip) => Trip) =>
      setTrips((prev) => prev.map((t) => (t.id === id ? updater(t) : t))),
    [],
  );

  const addTrip = useCallback(async (t: Trip) => {
    try {
      const created = await tripsService.createTrip({
        name: t.name,
        destination: t.destination,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        currency: t.currency,
        participantEmails: t.participants
          .map((p) => p.email)
          .filter(Boolean) as string[],
      });
      setTrips((p) => [...p, created]);
      toast.success("Viaje creado exitosamente");
    } catch (error) {
      console.error("Error creating trip:", error);
      toast.error("Error al crear el viaje");
    }
  }, []);
  const updateTrip = useCallback(
    (t: Trip) => setTrips((p) => p.map((x) => (x.id === t.id ? t : x))),
    [],
  );
  const deleteTrip = useCallback(
    (id: string) => setTrips((p) => p.filter((t) => t.id !== id)),
    [],
  );
  const getTripById = useCallback(
    (id: string) => trips.find((t) => t.id === id),
    [trips],
  );

  const addExpense = useCallback(
    async (tripId: string, e: Expense) => {
      try {
        await expensesService.createExpense({
          tripId,
          paidById: e.paidById,
          description: e.description,
          amount: e.amount,
          currency: e.currency,
          splitMethod: e.splitMethod,
          splits: e.splits.map((s) => ({
            participantId: s.participantId,
            amount: s.amount,
            percentage: s.percentage,
          })),
          date: e.date,
          category: e.category,
          notes: e.notes,
        });
        updateTripById(tripId, (t) => ({ ...t, expenses: [...t.expenses, e] }));
        toast.success("Gasto agregado exitosamente");
      } catch (error) {
        console.error("Error adding expense:", error);
        toast.error("Error al agregar gasto");
      }
    },
    [updateTripById],
  );
  const updateExpense = useCallback(
    async (tripId: string, e: Expense) => {
      try {
        await expensesService.updateExpense(e.id, {
          paidById: e.paidById,
          description: e.description,
          amount: e.amount,
          currency: e.currency,
          splitMethod: e.splitMethod,
          splits: e.splits.map((s) => ({
            participantId: s.participantId,
            amount: s.amount,
            percentage: s.percentage,
          })),
          date: e.date,
          category: e.category,
          notes: e.notes,
        });
        updateTripById(tripId, (t) => ({
          ...t,
          expenses: t.expenses.map((x) => (x.id === e.id ? e : x)),
        }));
        toast.success("Gasto actualizado exitosamente");
      } catch (error) {
        console.error("Error updating expense:", error);
        toast.error("Error al actualizar gasto");
      }
    },
    [updateTripById],
  );
  const deleteExpense = useCallback(
    async (tripId: string, expenseId: string) => {
      try {
        await expensesService.deleteExpense(expenseId);
        updateTripById(tripId, (t) => ({
          ...t,
          expenses: t.expenses.filter((x) => x.id !== expenseId),
        }));
        toast.success("Gasto eliminado exitosamente");
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Error al eliminar gasto");
      }
    },
    [updateTripById],
  );

  const addDay = useCallback(
    async (tripId: string, day: ItineraryDay) => {
      try {
        await itineraryService.createDay({
          tripId,
          date: day.date,
          title: day.title,
        });
        updateTripById(tripId, (t) => ({
          ...t,
          itinerary: [...t.itinerary, day].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        }));
        toast.success("Día agregado exitosamente");
      } catch (error) {
        console.error("Error adding day:", error);
        toast.error("Error al agregar día");
      }
    },
    [updateTripById],
  );
  const updateDay = useCallback(
    async (tripId: string, day: ItineraryDay) => {
      try {
        await itineraryService.updateDay(day.id, {
          date: day.date,
          title: day.title,
        });
        updateTripById(tripId, (t) => ({
          ...t,
          itinerary: t.itinerary.map((d) => (d.id === day.id ? day : d)),
        }));
        toast.success("Día actualizado exitosamente");
      } catch (error) {
        console.error("Error updating day:", error);
        toast.error("Error al actualizar día");
      }
    },
    [updateTripById],
  );
  const deleteDay = useCallback(
    async (tripId: string, dayId: string) => {
      try {
        await itineraryService.deleteDay(dayId);
        updateTripById(tripId, (t) => ({
          ...t,
          itinerary: t.itinerary.filter((d) => d.id !== dayId),
        }));
        toast.success("Día eliminado exitosamente");
      } catch (error) {
        console.error("Error deleting day:", error);
        toast.error("Error al eliminar día");
      }
    },
    [updateTripById],
  );

  const addActivity = useCallback(
    async (tripId: string, dayId: string, a: Activity) => {
      try {
        await itineraryService.createActivity({
          dayId,
          title: a.title,
          time: a.time,
          duration: a.duration,
          location: a.location,
          googleMapsUrl: a.googleMapsUrl,
          placeInfo: a.placeInfo,
          notes: a.notes,
          category: a.category,
        });
        updateTripById(tripId, (t) => ({
          ...t,
          itinerary: t.itinerary.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  activities: [...d.activities, a].sort((x, y) =>
                    x.time.localeCompare(y.time),
                  ),
                }
              : d,
          ),
        }));
        toast.success("Actividad agregada exitosamente");
      } catch (error) {
        console.error("Error adding activity:", error);
        toast.error("Error al agregar actividad");
      }
    },
    [updateTripById],
  );
  const updateActivity = useCallback(
    async (tripId: string, dayId: string, a: Activity) => {
      try {
        await itineraryService.updateActivity(a.id, {
          title: a.title,
          time: a.time,
          duration: a.duration,
          location: a.location,
          googleMapsUrl: a.googleMapsUrl,
          placeInfo: a.placeInfo,
          notes: a.notes,
          category: a.category,
        });
        updateTripById(tripId, (t) => ({
          ...t,
          itinerary: t.itinerary.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  activities: d.activities.map((x) => (x.id === a.id ? a : x)),
                }
              : d,
          ),
        }));
        toast.success("Actividad actualizada exitosamente");
      } catch (error) {
        console.error("Error updating activity:", error);
        toast.error("Error al actualizar actividad");
      }
    },
    [updateTripById],
  );
  const deleteActivity = useCallback(
    async (tripId: string, dayId: string, activityId: string) => {
      try {
        await itineraryService.deleteActivity(activityId);
        updateTripById(tripId, (t) => ({
          ...t,
          itinerary: t.itinerary.map((d) =>
            d.id === dayId
              ? {
                  ...d,
                  activities: d.activities.filter((x) => x.id !== activityId),
                }
              : d,
          ),
        }));
        toast.success("Actividad eliminada exitosamente");
      } catch (error) {
        console.error("Error deleting activity:", error);
        toast.error("Error al eliminar actividad");
      }
    },
    [updateTripById],
  );

  const addParticipant = useCallback(
    (tripId: string, p: Participant) =>
      updateTripById(tripId, (t) => ({
        ...t,
        participants: [...t.participants, p],
      })),
    [updateTripById],
  );
  const removeParticipant = useCallback(
    (tripId: string, participantId: string) =>
      updateTripById(tripId, (t) => ({
        ...t,
        participants: t.participants.filter((p) => p.id !== participantId),
      })),
    [updateTripById],
  );

  return (
    <TripContext.Provider
      value={{
        trips,
        loading,
        refreshTrips,
        addTrip,
        updateTrip,
        deleteTrip,
        getTripById,
        addExpense,
        updateExpense,
        deleteExpense,
        addDay,
        updateDay,
        deleteDay,
        addActivity,
        updateActivity,
        deleteActivity,
        addParticipant,
        removeParticipant,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrips must be inside TripProvider");
  return ctx;
};
