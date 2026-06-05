import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { TripCard } from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Plus, Search, Compass, Loader2 } from "lucide-react";
import { useTrips, computeBalances } from "@/context/TripContext";
import { useAuth } from "@/context/AuthContext";

const Dashboard = () => {
  const { trips, loading } = useTrips();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = trips.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Mis viajes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading
                ? "Cargando..."
                : `${trips.length} ${trips.length === 1 ? "viaje" : "viajes"}`}
            </p>
          </div>
          <Link to="/create-trip">
            <Button size="default">
              <Plus className="h-4 w-4" />
              Nuevo viaje
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar viajes..."
            className="pl-10 h-11 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-muted-foreground/40 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Cargando tus viajes...
            </p>
          </div>
        )}

        {/* Trip grid */}
        {!loading && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((trip) => {
                const balances = computeBalances(trip);
                const myBalance = balances.find(
                  (b) => b.participantId === user?.id,
                );
                const balanceAmt = myBalance ? myBalance.net : 0;
                return (
                  <TripCard
                    key={trip.id}
                    id={trip.id}
                    name={trip.name}
                    destination={trip.destination}
                    dates={`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`}
                    participants={trip.participants}
                    balance={parseFloat(balanceAmt.toFixed(2))}
                    currency={trip.currency}
                    expenseCount={trip.expenses.length}
                    activityCount={trip.itinerary.reduce(
                      (sum, d) => sum + d.activities.length,
                      0,
                    )}
                  />
                );
              })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <Compass className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {search ? "Sin resultados" : "Sin viajes aún"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {search
                    ? "Intenta con otro nombre o destino."
                    : "Crea tu primer viaje y empieza a organizar."}
                </p>
                {!search && (
                  <Link to="/create-trip">
                    <Button>Crear viaje</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default Dashboard;
