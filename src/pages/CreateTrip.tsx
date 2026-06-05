import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Users,
  MapPin,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";
import { useTrips } from "@/context/TripContext";
import { tripsService, itineraryService, invitationsService, type SearchableProfile } from "@/lib/supabase";
import type { Trip, ItineraryDay } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { UserSearch } from "@/components/UserSearch";

const CURRENCIES = [
  { value: "COP", label: "COP – Peso colombiano" },
  { value: "EUR", label: "EUR – Euro" },
  { value: "USD", label: "USD – Dólar" },
  { value: "MXN", label: "MXN – Peso mexicano" },
];

const steps = [
  { num: 1, label: "Destino", icon: MapPin },
  { num: 2, label: "Fechas", icon: CalendarIcon },
  { num: 3, label: "Grupo", icon: Users },
  { num: 4, label: "Itinerario", icon: FileText },
  { num: 5, label: "Moneda", icon: DollarSign },
];

const CreateTrip = () => {
  const { refreshTrips } = useTrips();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selected users to invite (registered users from search)
  const [selectedUsers, setSelectedUsers] = useState<SearchableProfile[]>([]);

  const [days, setDays] = useState<{ date: string; title: string }[]>([]);

  const [currency, setCurrency] = useState("COP");

  const handleDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (!start || !end) return;
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    if (e < s) return;
    const generated: { date: string; title: string }[] = [];
    const cur = new Date(s);
    let idx = 1;
    while (cur <= e) {
      generated.push({
        date: cur.toISOString().slice(0, 10),
        title: `Día ${idx}`,
      });
      cur.setDate(cur.getDate() + 1);
      idx++;
    }
    setDays(generated.slice(0, 30)); // max 30 days
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para crear un viaje");
      return;
    }

    setLoading(true);
    try {
      // Create the trip
      const createdTrip = await tripsService.createTrip({
        name: tripName.trim(),
        destination: destination.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        currency,
        participantEmails: [], // We'll add participants separately
      });

      // Save itinerary days
      for (const day of days) {
        await itineraryService.createDay({
          tripId: createdTrip.id,
          date: day.date,
          title: day.title,
        });
      }

      // Invite selected users
      if (selectedUsers.length > 0) {
        const invitePromises = selectedUsers.map((userToInvite) =>
          invitationsService.inviteUser(
            createdTrip.id,
            userToInvite.id,
            user!.id
          )
        );
        const results = await Promise.all(invitePromises);
        const failures = results.filter((r) => !r.success);
        if (failures.length > 0) {
          toast.warning(
            `${failures.length} invitación(es) no se pudieron enviar`
          );
        } else {
          toast.success(
            `${selectedUsers.length} usuarios invitados exitosamente`
          );
        }
      }

      await refreshTrips();
      toast.success("¡Viaje creado exitosamente!");
      setTimeout(() => navigate(`/trip/${createdTrip.id}`), 800);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear el viaje";
      console.error("Error creating trip:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canAdvance1 = tripName.trim() && destination.trim();
  const canAdvance2 = startDate && endDate && endDate >= startDate;
  const canAdvance3 = selectedUsers.length >= 1; // At least 1 invited user (plus creator = 2)
  const canAdvance4 = true; // itinerary preview is optional
  const canCreate =
    tripName.trim() &&
    destination.trim() &&
    startDate &&
    endDate &&
    selectedUsers.length >= 0; // Creator is always included

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-lg py-8">
        {/* Back */}
        <button
          onClick={() =>
            step > 1 ? setStep(step - 1) : navigate("/dashboard")
          }
          className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 1 ? "Anterior" : "Volver"}
        </button>

        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Nuevo viaje
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Paso {step} de {steps.length}
        </p>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex-1">
                <div
                  className={`h-1 rounded-full transition-colors ${s.num <= step ? "gradient-primary" : "bg-muted"}`}
                />
                <div className="flex items-center gap-1 mt-1.5">
                  <Icon
                    className={`h-3 w-3 ${s.num <= step ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-[10px] hidden sm:block ${s.num <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {/* ── STEP 1: Destino ──────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-sm">Nombre del viaje *</Label>
                <Input
                  placeholder="Ej: Barcelona con amigos"
                  className="h-11 rounded-lg"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Destino *</Label>
                <Input
                  placeholder="Ej: Barcelona, España"
                  className="h-11 rounded-lg"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Descripción (opcional)</Label>
                <Input
                  placeholder="Describe el viaje brevemente..."
                  className="h-11 rounded-lg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(2)}
                disabled={!canAdvance1}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Fechas ───────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-sm">Fecha de inicio *</Label>
                <Input
                  type="date"
                  className="h-11 rounded-lg"
                  value={startDate}
                  onChange={(e) => handleDateRange(e.target.value, endDate)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Fecha de fin *</Label>
                <Input
                  type="date"
                  className="h-11 rounded-lg"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleDateRange(startDate, e.target.value)}
                />
              </div>
              {startDate && endDate && endDate >= startDate && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-primary">
                  ✓ Se generarán <strong>{days.length} días</strong> en el
                  itinerario automáticamente
                </div>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(3)}
                disabled={!canAdvance2}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 3: Grupo ────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-sm">Invitar participantes</Label>
                <p className="text-xs text-muted-foreground">
                  Busca usuarios registrados por nombre o email para invitarlos
                  a tu viaje. Ellos recibirán una invitación que podrán aceptar
                  o declinar.
                </p>
                <UserSearch
                  onUserSelect={(userProfile) =>
                    setSelectedUsers([...selectedUsers, userProfile])
                  }
                  selectedUsers={selectedUsers}
                  onRemoveUser={(userId) =>
                    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
                  }
                />
              </div>

              <div className="rounded-xl bg-muted/50 border border-border p-3 text-sm">
                <p className="font-medium text-foreground mb-1">
                  ¿Cómo funciona?
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Los usuarios invitados recibirán una notificación</li>
                  <li>• Podrán aceptar o declinar la invitación</li>
                  <li>• Una vez acepten, podrán ver el viaje en su lista</li>
                  <li>• Solo el creador podrá editar el viaje</li>
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(4)}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 4: Itinerario preview ───────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label className="text-sm">Días del itinerario</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Puedes personalizar los títulos ahora o añadir actividades
                  después.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {days.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono w-20 shrink-0">
                        {new Date(d.date + "T00:00:00").toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short" },
                        )}
                      </span>
                      <Input
                        className="h-9 rounded-lg text-sm flex-1"
                        value={d.title}
                        onChange={(e) => {
                          const updated = [...days];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setDays(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep(5)}
                disabled={days.length === 0}
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 5: Moneda ───────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-sm">Moneda del viaje</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCurrency(c.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        currency === c.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/30"
                      }`}
                    >
                      <p className="font-semibold text-sm">{c.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.label.split(" – ")[1]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-1.5 text-sm">
                <p className="font-medium text-foreground mb-2">
                  Resumen del viaje
                </p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Nombre</span>
                  <span className="text-foreground">{tripName}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Destino</span>
                  <span className="text-foreground">{destination}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fechas</span>
                  <span className="text-foreground">
                    {new Date(startDate + "T00:00:00").toLocaleDateString(
                      "es-ES",
                      { day: "numeric", month: "short" },
                    )}
                    {" – "}
                    {new Date(endDate + "T00:00:00").toLocaleDateString(
                      "es-ES",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Invitados</span>
                  <span className="text-foreground">{selectedUsers.length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Días</span>
                  <span className="text-foreground">{days.length}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creando
                    viaje...
                  </>
                ) : (
                  "🚀 Crear viaje"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;