import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { AvatarGroup } from "@/components/AvatarGroup";
import { StatusBadge } from "@/components/StatusBadge";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { AddActivityModal } from "@/components/AddActivityModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Calendar,
  Wallet,
  Receipt,
  Clock,
  User,
  ExternalLink,
  Star,
  Trash2,
  Pencil,
  ArrowRight,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  useTrips,
  computeBalances,
  computeSettlements,
} from "@/context/TripContext";
import type { Expense, Activity, ItineraryDay } from "@/types";

// ── helpers ────────────────────────────────────────────────────────────────────

const sym = (c: string) => (c === "EUR" ? "€" : c === "USD" ? "US$" : "$");

const CATEGORY_EMOJI: Record<string, string> = {
  alojamiento: "🏨",
  transporte: "🚗",
  comida: "🍽️",
  actividades: "🎯",
  compras: "🛍️",
  otros: "💰",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  transporte: "✈️",
  alojamiento: "🏨",
  comida: "🍽️",
  turismo: "🏛️",
  ocio: "🎉",
  otro: "📌",
};

const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const formatDayHeader = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatDuration = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ── Component ──────────────────────────────────────────────────────────────────

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getTripById,
    addExpense,
    updateExpense,
    deleteExpense,
    addActivity,
    updateActivity,
    deleteActivity,
  } = useTrips();

  const trip = getTripById(id ?? "");

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{
    dayId: string;
    activity: Activity;
  } | null>(null);
  const [addActivityDayId, setAddActivityDayId] = useState<string | null>(null);

  // Place info detail
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl py-20 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Viaje no encontrado</h2>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Volver al dashboard
          </Button>
        </div>
      </div>
    );
  }

  const balances = computeBalances(trip);
  const settlements = computeSettlements(balances);
  const MY_ID = trip.participants[0]?.id ?? "";
  const myBalance = balances.find((b) => b.participantId === MY_ID);
  const totalExpenses = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const S = sym(trip.currency);

  const getParticipantName = (id: string) =>
    trip.participants.find((p) => p.id === id)?.name ?? "—";

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveExpense = (expense: Expense) => {
    if (editingExpense) {
      updateExpense(trip.id, expense);
    } else {
      addExpense(trip.id, expense);
    }
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm("¿Eliminar este gasto?")) deleteExpense(trip.id, expenseId);
  };

  const handleSaveActivity = (activity: Activity) => {
    const dayId = editingActivity?.dayId ?? addActivityDayId ?? "";
    if (!dayId) return;
    if (editingActivity) {
      updateActivity(trip.id, dayId, activity);
    } else {
      addActivity(trip.id, dayId, activity);
    }
    setEditingActivity(null);
    setAddActivityDayId(null);
  };

  const handleDeleteActivity = (dayId: string, activityId: string) => {
    if (confirm("¿Eliminar esta actividad?"))
      deleteActivity(trip.id, dayId, activityId);
  };

  const openAddActivity = (dayId: string) => {
    setAddActivityDayId(dayId);
    setEditingActivity(null);
    setActivityModalOpen(true);
  };

  const openEditActivity = (dayId: string, activity: Activity) => {
    setEditingActivity({ dayId, activity });
    setAddActivityDayId(null);
    setActivityModalOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Modals */}
      <AddExpenseModal
        open={expenseModalOpen || !!editingExpense}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        participants={trip.participants}
        currency={trip.currency}
        onSave={handleSaveExpense}
        editExpense={editingExpense}
      />
      <AddActivityModal
        open={activityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setEditingActivity(null);
          setAddActivityDayId(null);
        }}
        onSave={handleSaveActivity}
        editActivity={editingActivity?.activity ?? null}
      />

      <div className="container max-w-2xl py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Mis viajes
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="h-1.5 w-12 rounded-full gradient-primary mb-3" />
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            {trip.name}
          </h1>
          {trip.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {trip.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {trip.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <AvatarGroup avatars={trip.participants} />
            <span className="text-sm text-muted-foreground">
              {trip.participants.length} participantes
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <Wallet className="h-4 w-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Total gastos</p>
            <p className="text-lg font-semibold">
              {S}
              {totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <User className="h-4 w-4 text-secondary mb-2" />
            <p className="text-xs text-muted-foreground">Por persona</p>
            <p className="text-lg font-semibold">
              {S}
              {trip.participants.length > 0
                ? (totalExpenses / trip.participants.length).toFixed(2)
                : "0.00"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card col-span-2 sm:col-span-1">
            <Receipt className="h-4 w-4 text-destructive mb-2" />
            <p className="text-xs text-muted-foreground">Tu balance</p>
            {myBalance ? (
              <p
                className={`text-lg font-semibold ${myBalance.net >= 0 ? "text-success" : "text-destructive"}`}
              >
                {myBalance.net >= 0 ? "+" : ""}
                {S}
                {myBalance.net.toFixed(2)}
              </p>
            ) : (
              <p className="text-lg font-semibold">—</p>
            )}
          </div>
        </div>

        {/* ── RECORDATORIOS ─────────────────────────────────────────────── */}
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const startDate = trip.startDate;
          const endDate = trip.endDate;
          const todayDay = trip.itinerary.find((d) => d.date === today);
          const daysUntilTrip = Math.ceil(
            (new Date(startDate + "T00:00:00").getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const tripInProgress = today >= startDate && today <= endDate;
          const tripEnded = today > endDate;

          if (tripEnded) return null;

          return (
            <div className="mb-6">
              {/* Viaje aún no empieza */}
              {!tripInProgress && daysUntilTrip > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {daysUntilTrip === 1
                        ? "¡El viaje empieza mañana!"
                        : `Faltan ${daysUntilTrip} días para el viaje`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Empieza el {formatDate(startDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* Viaje en curso */}
              {tripInProgress && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-sm font-semibold text-foreground">Hoy</p>
                    <span className="text-xs text-muted-foreground capitalize">
                      {formatDayHeader(today)}
                    </span>
                  </div>

                  {!todayDay || todayDay.activities.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-4">
                      Sin actividades programadas para hoy.
                    </p>
                  ) : (
                    <div className="space-y-2 pl-4">
                      {todayDay.activities.map((a) => (
                        <div key={a.id} className="flex items-start gap-2.5">
                          <span className="text-sm">
                            {ACTIVITY_EMOJI[a.category] ?? "📌"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {a.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {a.time}
                              </span>
                              {a.duration && (
                                <span>· {formatDuration(a.duration)}</span>
                              )}
                              {a.location && (
                                <span className="flex items-center gap-1">
                                  · <MapPin className="h-3 w-3" /> {a.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tabs */}
        <Tabs defaultValue="gastos">
          <TabsList className="w-full grid grid-cols-3 mb-6 h-11 rounded-xl bg-muted">
            <TabsTrigger
              value="gastos"
              className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Gastos
            </TabsTrigger>
            <TabsTrigger
              value="balance"
              className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Balances
            </TabsTrigger>
            <TabsTrigger
              value="itinerario"
              className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Itinerario
            </TabsTrigger>
          </TabsList>

          {/* ── GASTOS ──────────────────────────────────────────────────────── */}
          <TabsContent value="gastos" className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">
                {trip.expenses.length} gastos registrados
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Añadir
              </Button>
            </div>

            {trip.expenses.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-3">
                  Sin gastos aún. ¡Añade el primero!
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingExpense(null);
                    setExpenseModalOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir gasto
                </Button>
              </div>
            )}

            {trip.expenses.map((e) => {
              const mySplit = e.splits.find((s) => s.participantId === MY_ID);
              return (
                <div
                  key={e.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">
                          {CATEGORY_EMOJI[e.category] ?? "💰"}
                        </span>
                        <p className="text-sm font-medium truncate">
                          {e.description}
                        </p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {e.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(e.date + "T00:00:00").toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short" },
                        )}
                        {" · "}Pagó{" "}
                        <strong>{getParticipantName(e.paidById)}</strong>
                        {" · "}
                        {e.splitMethod === "equal"
                          ? "partes iguales"
                          : e.splitMethod === "percentage"
                            ? "por porcentaje"
                            : "montos personalizados"}
                      </p>
                      {/* Split detail */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {e.splits.map((s) => (
                          <span
                            key={s.participantId}
                            className="text-xs bg-muted rounded-full px-2 py-0.5"
                          >
                            {getParticipantName(s.participantId)}: {S}
                            {s.amount.toFixed(2)}
                            {s.percentage !== undefined &&
                              ` (${s.percentage}%)`}
                          </span>
                        ))}
                      </div>
                      {e.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {e.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        {S}
                        {e.amount.toFixed(2)}
                      </p>
                      {mySplit && (
                        <p className="text-xs text-muted-foreground">
                          tú: {S}
                          {mySplit.amount.toFixed(2)}
                        </p>
                      )}
                      <div className="flex gap-1 mt-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingExpense(e);
                            setExpenseModalOpen(false);
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* ── BALANCE ─────────────────────────────────────────────────────── */}
          <TabsContent value="balance" className="space-y-4">
            <h3 className="text-sm font-medium">Resumen por persona</h3>
            <div className="space-y-2">
              {balances.map((b) => {
                const participant = trip.participants.find(
                  (p) => p.id === b.participantId,
                );
                if (!participant) return null;
                return (
                  <div
                    key={b.participantId}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-medium text-white">
                        {participant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {participant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pagó {S}
                          {b.totalPaid.toFixed(2)} · Le corresponde {S}
                          {b.totalOwed.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {b.net >= 0 ? (
                      <StatusBadge variant="positive">
                        +{S}
                        {b.net.toFixed(2)}
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="negative">
                        -{S}
                        {Math.abs(b.net).toFixed(2)}
                      </StatusBadge>
                    )}
                  </div>
                );
              })}
            </div>

            {settlements.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">
                  ¿Quién le paga a quién?
                </h3>
                <div className="space-y-2">
                  {settlements.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                        {getParticipantName(s.fromId).charAt(0)}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium">
                          {getParticipantName(s.fromId)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {getParticipantName(s.toId)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {S}
                        {s.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settlements.length === 0 && trip.expenses.length > 0 && (
              <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                <p className="text-sm text-success font-medium">
                  ✓ ¡Todo está al día! No hay deudas pendientes.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── ITINERARIO ──────────────────────────────────────────────────── */}
          <TabsContent value="itinerario" className="space-y-6">
            {trip.itinerary.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin días en el itinerario.</p>
              </div>
            )}

            {trip.itinerary.map((day: ItineraryDay) => (
              <div key={day.id}>
                {/* Day header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground capitalize">
                      {day.title || formatDayHeader(day.date)}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {formatDayHeader(day.date)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary h-8"
                    onClick={() => openAddActivity(day.id)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Actividad
                  </Button>
                </div>

                <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                  {day.activities.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2 pl-2">
                      Sin actividades. Añade una →
                    </p>
                  )}

                  {day.activities.map((activity) => {
                    const isExpanded = expandedActivity === activity.id;
                    return (
                      <div
                        key={activity.id}
                        className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
                      >
                        {/* Activity row */}
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span className="text-base mt-0.5">
                                {ACTIVITY_EMOJI[activity.category] ?? "📌"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium">
                                    {activity.title}
                                  </p>
                                  {activity.placeInfo && (
                                    <button
                                      onClick={() =>
                                        setExpandedActivity(
                                          isExpanded ? null : activity.id,
                                        )
                                      }
                                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
                                    >
                                      <Info className="h-3 w-3" />
                                      Info
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
                                    {activity.time}
                                  </span>
                                  {activity.duration && (
                                    <span>
                                      · {formatDuration(activity.duration)}
                                    </span>
                                  )}
                                  {activity.location && (
                                    <span className="flex items-center gap-1">
                                      · <MapPin className="h-3 w-3" />{" "}
                                      {activity.location}
                                    </span>
                                  )}
                                </div>
                                {activity.googleMapsUrl && (
                                  <a
                                    href={activity.googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" /> Ver en
                                    Google Maps
                                  </a>
                                )}
                                {activity.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    {activity.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  openEditActivity(day.id, activity)
                                }
                                className="text-muted-foreground hover:text-primary transition-colors p-1"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteActivity(day.id, activity.id)
                                }
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Place info expandable */}
                        {isExpanded && activity.placeInfo && (
                          <div className="border-t border-border bg-muted/40 px-4 py-3 space-y-2">
                            <p className="text-xs font-semibold text-foreground">
                              {activity.placeInfo.name}
                            </p>
                            {activity.placeInfo.address && (
                              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                {activity.placeInfo.address}
                              </p>
                            )}
                            {activity.placeInfo.description && (
                              <p className="text-xs text-foreground/80 leading-relaxed">
                                {activity.placeInfo.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              {activity.placeInfo.openingHours && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />{" "}
                                  {activity.placeInfo.openingHours}
                                </span>
                              )}
                              {activity.placeInfo.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {activity.placeInfo.rating.toFixed(1)}
                                </span>
                              )}
                              {activity.placeInfo.googleMapsUrl && (
                                <a
                                  href={activity.placeInfo.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" /> Abrir en
                                  Maps
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripDetail;
