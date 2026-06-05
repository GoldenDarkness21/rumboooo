import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, MapPin, Clock, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { Activity, ActivityCategory } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  editActivity?: Activity | null;
}

const CATEGORIES: { value: ActivityCategory; label: string; emoji: string }[] = [
  { value: "transporte", label: "Transporte", emoji: "✈️" },
  { value: "alojamiento", label: "Alojamiento", emoji: "🏨" },
  { value: "comida", label: "Comida", emoji: "🍽️" },
  { value: "turismo", label: "Turismo", emoji: "🏛️" },
  { value: "ocio", label: "Ocio", emoji: "🎉" },
  { value: "otro", label: "Otro", emoji: "📌" },
];

export const AddActivityModal: React.FC<Props> = ({ open, onClose, onSave, editActivity }) => {
  const isEdit = !!editActivity;

  const [title, setTitle] = useState(editActivity?.title ?? "");
  const [time, setTime] = useState(editActivity?.time ?? "09:00");
  const [duration, setDuration] = useState(editActivity?.duration ? String(editActivity.duration) : "");
  const [category, setCategory] = useState<ActivityCategory>(editActivity?.category ?? "turismo");
  const [location, setLocation] = useState(editActivity?.location ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editActivity?.googleMapsUrl ?? "");
  const [notes, setNotes] = useState(editActivity?.notes ?? "");

  // Place info
  const [showPlaceInfo, setShowPlaceInfo] = useState(!!editActivity?.placeInfo);
  const [placeName, setPlaceName] = useState(editActivity?.placeInfo?.name ?? "");
  const [placeAddress, setPlaceAddress] = useState(editActivity?.placeInfo?.address ?? "");
  const [placeDescription, setPlaceDescription] = useState(editActivity?.placeInfo?.description ?? "");
  const [placeHours, setPlaceHours] = useState(editActivity?.placeInfo?.openingHours ?? "");
  const [placeRating, setPlaceRating] = useState(editActivity?.placeInfo?.rating ? String(editActivity.placeInfo.rating) : "");

  const canSave = title.trim() && time;

  const handleSave = () => {
    if (!canSave) return;

    const placeInfo =
      showPlaceInfo && (placeName || placeDescription)
        ? {
            name: placeName || title,
            address: placeAddress || undefined,
            description: placeDescription || undefined,
            googleMapsUrl: googleMapsUrl || undefined,
            openingHours: placeHours || undefined,
            rating: placeRating ? parseFloat(placeRating) : undefined,
          }
        : undefined;

    const activity: Activity = {
      id: editActivity?.id ?? `a-${Date.now()}`,
      title: title.trim(),
      time,
      duration: duration ? parseInt(duration) : undefined,
      category,
      location: location.trim() || undefined,
      googleMapsUrl: googleMapsUrl.trim() || undefined,
      placeInfo,
      notes: notes.trim() || undefined,
    };

    onSave(activity);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar actividad" : "Añadir actividad"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-sm">Actividad *</Label>
            <Input
              placeholder="Ej: Visitar la Sagrada Família"
              className="h-10 rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Hora *
              </Label>
              <Input
                type="time" className="h-10 rounded-lg"
                value={time} onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Duración (min)</Label>
              <Input
                type="number" min="5" step="5" placeholder="60"
                className="h-10 rounded-lg"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm">Tipo</Label>
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

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Lugar
            </Label>
            <Input
              placeholder="Ej: Sagrada Família, Barcelona"
              className="h-10 rounded-lg"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Google Maps URL */}
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Link de Google Maps
            </Label>
            <Input
              placeholder="https://maps.google.com/?q=..."
              className="h-10 rounded-lg"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ve a Google Maps, busca el lugar y copia el link del navegador o usa "Compartir"
            </p>
          </div>

          {/* Place info toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowPlaceInfo(!showPlaceInfo)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Info className="h-4 w-4" />
              {showPlaceInfo ? "Ocultar info del lugar" : "Añadir info del lugar (descripción, horarios...)"}
              {showPlaceInfo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showPlaceInfo && (
              <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Esta información aparecerá como guía turística del lugar
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre oficial del lugar</Label>
                  <Input
                    placeholder="Ej: Basílica de la Sagrada Família"
                    className="h-9 rounded-lg text-sm"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Dirección</Label>
                  <Input
                    placeholder="Ej: Carrer de Mallorca, 401, Barcelona"
                    className="h-9 rounded-lg text-sm"
                    value={placeAddress}
                    onChange={(e) => setPlaceAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Descripción / Info cultural e histórica</Label>
                  <textarea
                    placeholder="Describe el lugar, su historia, curiosidades..."
                    className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={placeDescription}
                    onChange={(e) => setPlaceDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Horarios</Label>
                    <Input
                      placeholder="Ej: 9:00 - 20:00"
                      className="h-9 rounded-lg text-sm"
                      value={placeHours}
                      onChange={(e) => setPlaceHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rating (1-5)</Label>
                    <Input
                      type="number" min="1" max="5" step="0.1" placeholder="4.5"
                      className="h-9 rounded-lg text-sm"
                      value={placeRating}
                      onChange={(e) => setPlaceRating(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notas del grupo (opcional)</Label>
            <Input
              placeholder="Recordatorios, recomendaciones..."
              className="h-10 rounded-lg"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!canSave}>
              {isEdit ? "Guardar cambios" : "Añadir actividad"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};