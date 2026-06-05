import { supabase } from './client';
import type { ItineraryDay, Activity, ActivityCategory, PlaceInfo } from '@/types';

export interface CreateItineraryDayParams {
  tripId: string;
  date: string;
  title?: string;
}

export interface UpdateItineraryDayParams {
  date?: string;
  title?: string;
}

export interface CreateActivityParams {
  dayId: string;
  title: string;
  time: string;
  duration?: number;
  location?: string;
  googleMapsUrl?: string;
  placeInfo?: PlaceInfo;
  notes?: string;
  category: ActivityCategory;
}

export interface UpdateActivityParams {
  title?: string;
  time?: string;
  duration?: number;
  location?: string;
  googleMapsUrl?: string;
  placeInfo?: PlaceInfo;
  notes?: string;
  category?: ActivityCategory;
}

export const itineraryService = {
  // ── Itinerary Days ─────────────────────────────────────────────────────────────

  /**
   * Obtener todos los días del itinerario de un viaje
   */
  async getDaysByTrip(tripId: string): Promise<ItineraryDay[]> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (error) throw error;

    // Construir días con sus actividades
    const daysWithActivities = await Promise.all(
      (data || []).map(day => buildItineraryDay(day.id, day))
    );

    return daysWithActivities;
  },

  /**
   * Obtener un día específico del itinerario
   */
  async getDay(dayId: string): Promise<ItineraryDay | null> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('id', dayId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return buildItineraryDay(data.id, data);
  },

  /**
   * Crear un nuevo día en el itinerario
   */
  async createDay({ tripId, date, title }: CreateItineraryDayParams): Promise<ItineraryDay> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .insert({
        trip_id: tripId,
        date,
        title,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      title: data.title || undefined,
      activities: [],
    };
  },

  /**
   * Actualizar un día del itinerario
   */
  async updateDay(dayId: string, params: UpdateItineraryDayParams): Promise<ItineraryDay> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .update({
        date: params.date,
        title: params.title,
      })
      .eq('id', dayId)
      .select()
      .single();

    if (error) throw error;

    return buildItineraryDay(data.id, data);
  },

  /**
   * Eliminar un día del itinerario (y sus actividades)
   */
  async deleteDay(dayId: string): Promise<void> {
    const { error } = await supabase
      .from('itinerary_days')
      .delete()
      .eq('id', dayId);

    if (error) throw error;
  },

  // ── Activities ─────────────────────────────────────────────────────────────────

  /**
   * Obtener todas las actividades de un día
   */
  async getActivitiesByDay(dayId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('day_id', dayId)
      .order('time', { ascending: true });

    if (error) throw error;

    return (data || []).map(act => ({
      id: act.id,
      title: act.title,
      time: act.time,
      duration: act.duration || undefined,
      location: act.location || undefined,
      googleMapsUrl: act.google_maps_url || undefined,
      placeInfo: act.place_info as PlaceInfo | null,
      notes: act.notes || undefined,
      category: act.category as ActivityCategory,
    }));
  },

  /**
   * Obtener una actividad específica
   */
  async getActivity(activityId: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      time: data.time,
      duration: data.duration || undefined,
      location: data.location || undefined,
      googleMapsUrl: data.google_maps_url || undefined,
      placeInfo: data.place_info as PlaceInfo | null,
      notes: data.notes || undefined,
      category: data.category as ActivityCategory,
    };
  },

  /**
   * Crear una nueva actividad
   */
  async createActivity({
    dayId,
    title,
    time,
    duration,
    location,
    googleMapsUrl,
    placeInfo,
    notes,
    category,
  }: CreateActivityParams): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        day_id: dayId,
        title,
        time,
        duration,
        location,
        google_maps_url: googleMapsUrl,
        place_info: placeInfo,
        notes,
        category,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      time: data.time,
      duration: data.duration || undefined,
      location: data.location || undefined,
      googleMapsUrl: data.google_maps_url || undefined,
      placeInfo: data.place_info as PlaceInfo | null,
      notes: data.notes || undefined,
      category: data.category as ActivityCategory,
    };
  },

  /**
   * Actualizar una actividad
   */
  async updateActivity(activityId: string, params: UpdateActivityParams): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .update({
        title: params.title,
        time: params.time,
        duration: params.duration,
        location: params.location,
        google_maps_url: params.googleMapsUrl,
        place_info: params.placeInfo,
        notes: params.notes,
        category: params.category,
      })
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      time: data.time,
      duration: data.duration || undefined,
      location: data.location || undefined,
      googleMapsUrl: data.google_maps_url || undefined,
      placeInfo: data.place_info as PlaceInfo | null,
      notes: data.notes || undefined,
      category: data.category as ActivityCategory,
    };
  },

  /**
   * Eliminar una actividad
   */
  async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────────

async function buildItineraryDay(
  dayId: string,
  dayData: { id: string; date: string; title: string | null }
): Promise<ItineraryDay> {
  const activities = await itineraryService.getActivitiesByDay(dayId);

  return {
    id: dayData.id,
    date: dayData.date,
    title: dayData.title || undefined,
    activities,
  };
}