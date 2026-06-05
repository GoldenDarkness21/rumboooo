import { Link } from "react-router-dom";
import { AvatarGroup } from "./AvatarGroup";
import { StatusBadge } from "./StatusBadge";
import { Calendar, MapPin, Receipt, Route } from "lucide-react";

interface TripCardProps {
  id: string;
  name: string;
  destination: string;
  dates: string;
  participants: { name: string }[];
  balance: number;
  currency?: string;
  expenseCount?: number;
  activityCount?: number;
}

const currencySymbol = (c?: string) => {
  if (c === "EUR") return "€";
  if (c === "COP") return "$";
  if (c === "USD") return "US$";
  return c ?? "€";
};

export const TripCard = ({
  id,
  name,
  destination,
  dates,
  participants,
  balance,
  currency,
  expenseCount = 0,
  activityCount = 0,
}: TripCardProps) => {
  const sym = currencySymbol(currency);

  return (
    <Link
      to={`/trip/${id}`}
      className="group block rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-primary/20"
    >
      <div className="h-1.5 w-12 rounded-full gradient-primary mb-4" />
      <h3 className="text-base font-semibold text-card-foreground mb-1">{name}</h3>

      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="text-sm truncate">{destination}</span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="text-sm">{dates}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Receipt className="h-3 w-3" />
          {expenseCount} gastos
        </span>
        <span className="flex items-center gap-1">
          <Route className="h-3 w-3" />
          {activityCount} actividades
        </span>
      </div>

      <div className="flex items-center justify-between">
        <AvatarGroup avatars={participants} size="sm" />
        {balance === 0 ? (
          <StatusBadge variant="positive">Al día ✓</StatusBadge>
        ) : balance > 0 ? (
          <StatusBadge variant="info">Te deben {sym}{balance}</StatusBadge>
        ) : (
          <StatusBadge variant="negative">Debes {sym}{Math.abs(balance)}</StatusBadge>
        )}
      </div>
    </Link>
  );
};