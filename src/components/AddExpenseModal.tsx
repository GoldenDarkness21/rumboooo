import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Equal, Percent, Hash } from "lucide-react";
import type { Participant, Expense, ExpenseCategory, SplitMethod } from "@/types";
import { buildEqualSplits, buildPercentageSplits } from "@/context/TripContext";

interface Props {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  currency: string;
  onSave: (expense: Expense) => void;
  editExpense?: Expense | null;
}

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "alojamiento", label: "Alojamiento", emoji: "🏨" },
  { value: "transporte", label: "Transporte", emoji: "🚗" },
  { value: "comida", label: "Comida", emoji: "🍽️" },
  { value: "actividades", label: "Actividades", emoji: "🎯" },
  { value: "compras", label: "Compras", emoji: "🛍️" },
  { value: "otros", label: "Otros", emoji: "💰" },
];

const sym = (c: string) => (c === "EUR" ? "€" : c === "USD" ? "US$" : "$");

export const AddExpenseModal: React.FC<Props> = ({
  open, onClose, participants, currency, onSave, editExpense,
}) => {
  const isEdit = !!editExpense;

  const [description, setDescription] = useState(editExpense?.description ?? "");
  const [amount, setAmount] = useState(editExpense ? String(editExpense.amount) : "");
  const [paidById, setPaidById] = useState(editExpense?.paidById ?? participants[0]?.id ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(editExpense?.category ?? "otros");
  const [date, setDate] = useState(editExpense?.date ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(editExpense?.notes ?? "");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(editExpense?.splitMethod ?? "equal");

  const defaultIncluded = editExpense
    ? editExpense.splits.map((s) => s.participantId)
    : participants.map((p) => p.id);
  const [includedIds, setIncludedIds] = useState<string[]>(defaultIncluded);

  const defaultPct = Object.fromEntries(
    participants.map((p) => {
      const existing = editExpense?.splits.find((s) => s.participantId === p.id);
      return [p.id, String(existing?.percentage ?? Math.round(100 / participants.length))];
    })
  );
  const [percentages, setPercentages] = useState<Record<string, string>>(defaultPct);

  const defaultCustom = Object.fromEntries(
    participants.map((p) => {
      const existing = editExpense?.splits.find((s) => s.participantId === p.id);
      return [p.id, existing ? String(existing.amount) : ""];
    })
  );
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(defaultCustom);

  const totalAmt = parseFloat(amount) || 0;
  const pctTotal = Object.values(percentages).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const customTotal = Object.values(customAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const equalShare = includedIds.length > 0 ? (totalAmt / includedIds.length).toFixed(2) : "0.00";

  const toggleIncluded = (id: string) =>
    setIncludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const pctValid = Math.abs(pctTotal - 100) < 0.5;
  const customValid = Math.abs(customTotal - totalAmt) < 0.1;

  const canSave =
    description.trim() &&
    totalAmt > 0 &&
    paidById &&
    (splitMethod !== "percentage" || pctValid) &&
    (splitMethod !== "custom" || customValid) &&
    (splitMethod !== "equal" || includedIds.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    let splits = [];

    if (splitMethod === "equal") {
      splits = buildEqualSplits(totalAmt, includedIds);
    } else if (splitMethod === "percentage") {
      splits = buildPercentageSplits(
        totalAmt,
        participants
          .filter((p) => (parseFloat(percentages[p.id]) || 0) > 0)
          .map((p) => ({ participantId: p.id, percentage: parseFloat(percentages[p.id]) || 0 }))
      );
    } else {
      splits = participants
        .filter((p) => (parseFloat(customAmounts[p.id]) || 0) > 0)
        .map((p) => ({
          participantId: p.id,
          amount: parseFloat(customAmounts[p.id]) || 0,
        }));
    }

    const expense: Expense = {
      id: editExpense?.id ?? `e-${Date.now()}`,
      description: description.trim(),
      amount: totalAmt,
      currency,
      paidById,
      splitMethod,
      splits,
      date,
      category,
      notes: notes.trim() || undefined,
    };

    onSave(expense);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar gasto" : "Añadir gasto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm">Descripción *</Label>
            <Input
              placeholder="Ej: Hotel, cena, taxi..."
              className="h-10 rounded-lg"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Monto *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {sym(currency)}
                </span>
                <Input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  className="h-10 rounded-lg pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Fecha</Label>
              <Input
                type="date" className="h-10 rounded-lg"
                value={date} onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="space-y-1.5">
            <Label className="text-sm">Categoría</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value} type="button"
                  onClick={() => setCategory(c.value)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                    category === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid by */}
          <div className="space-y-1.5">
            <Label className="text-sm">¿Quién pagó?</Label>
            <Select value={paidById} onValueChange={setPaidById}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split method */}
          <div className="space-y-2">
            <Label className="text-sm">¿Cómo se divide?</Label>
            <Tabs value={splitMethod} onValueChange={(v) => setSplitMethod(v as SplitMethod)}>
              <TabsList className="grid grid-cols-3 h-9 rounded-xl bg-muted w-full">
                <TabsTrigger value="equal" className="rounded-lg text-xs gap-1 data-[state=active]:bg-card">
                  <Equal className="h-3 w-3" /> Partes iguales
                </TabsTrigger>
                <TabsTrigger value="percentage" className="rounded-lg text-xs gap-1 data-[state=active]:bg-card">
                  <Percent className="h-3 w-3" /> Porcentaje
                </TabsTrigger>
                <TabsTrigger value="custom" className="rounded-lg text-xs gap-1 data-[state=active]:bg-card">
                  <Hash className="h-3 w-3" /> Montos
                </TabsTrigger>
              </TabsList>

              {/* ─── EQUAL ──────────────────────────────────────────────── */}
              <TabsContent value="equal" className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Selecciona quiénes participan:</p>
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id={`eq-${p.id}`}
                        checked={includedIds.includes(p.id)}
                        onCheckedChange={() => toggleIncluded(p.id)}
                      />
                      <label htmlFor={`eq-${p.id}`} className="text-sm font-medium cursor-pointer">
                        {p.name}
                      </label>
                    </div>
                    {includedIds.includes(p.id) && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {sym(currency)}{equalShare}
                      </Badge>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* ─── PERCENTAGE ─────────────────────────────────────────── */}
              <TabsContent value="percentage" className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Asigna el porcentaje de cada uno:</p>
                  <Badge variant={pctValid ? "secondary" : "destructive"} className="text-xs">
                    {pctTotal.toFixed(0)}% / 100%
                  </Badge>
                </div>
                {participants.map((p) => {
                  const pct = parseFloat(percentages[p.id]) || 0;
                  const share = totalAmt > 0 ? ((totalAmt * pct) / 100).toFixed(2) : "0.00";
                  return (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                      <span className="text-sm font-medium w-16 shrink-0">{p.name}</span>
                      <div className="relative flex-1">
                        <Input
                          type="number" min="0" max="100" step="1"
                          className="h-8 rounded-lg pr-7 text-sm"
                          value={percentages[p.id]}
                          onChange={(e) => setPercentages((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-14 text-right">
                        {sym(currency)}{share}
                      </span>
                    </div>
                  );
                })}
              </TabsContent>

              {/* ─── CUSTOM ─────────────────────────────────────────────── */}
              <TabsContent value="custom" className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Ingresa el monto de cada uno:</p>
                  <Badge variant={customValid ? "secondary" : "destructive"} className="text-xs font-mono">
                    {sym(currency)}{customTotal.toFixed(2)} / {sym(currency)}{totalAmt.toFixed(2)}
                  </Badge>
                </div>
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                    <span className="text-sm font-medium w-16 shrink-0">{p.name}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {sym(currency)}
                      </span>
                      <Input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        className="h-8 rounded-lg pl-7 text-sm"
                        value={customAmounts[p.id]}
                        onChange={(e) => setCustomAmounts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notas (opcional)</Label>
            <Input
              placeholder="Detalles adicionales..."
              className="h-10 rounded-lg"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!canSave}>
              {isEdit ? "Guardar cambios" : "Añadir gasto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};