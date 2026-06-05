import { supabase } from './client';
import type { Trip, Participant, Expense, ItineraryDay, Activity, ExpenseSplit, SplitMethod, ExpenseCategory, ActivityCategory, PlaceInfo } from '@/types';

export interface CreateTripParams {
  name: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  currency: string;
  participantEmails: string[];
}

export interface UpdateTripParams {
  name?: string;
  destination?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
}

interface TripRow {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  description: string | null;
  start_date: string;
  end_date: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
}

export const tripsService = {
  /**
   * Obtener todos los viajes del usuario actual
   */
  async getMyTrips(): Promise<Trip[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Primero obtener los IDs de viajes donde el usuario es participante
    const { data: participantData, error: participantError } = await supabase
      .from('trip_participants')
      .select('trip_id')
      .eq('user_id', user.id);

    if (participantError) {
      console.error('Error fetching participant trips:', participantError);
      throw participantError;
    }

    if (!participantData || participantData.length === 0) return [];

    const tripIds = participantData.map((p: { trip_id: string }) => p.trip_id);

    // Luego obtener los detalles de esos viajes
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('created_at', { ascending: false });

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
      throw tripsError;
    }

    if (!trips || trips.length === 0) return [];

    // Construir objetos Trip completos
    const tripsWithDetails: Trip[] = [];
    for (const trip of trips) {
      try {
        const fullTrip = await buildTripObject(trip as TripRow);
        tripsWithDetails.push(fullTrip);
      } catch (error) {
        console.error('Error building trip:', error);
      }
    }

    return tripsWithDetails;
  },

  /**
   * Obtener un viaje específico por ID
   */
  async getTripById(tripId: string): Promise<Trip | null> {
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return buildTripObject(trip as TripRow);
  },

  /**
   * Crear un nuevo viaje
   */
  async createTrip({ name, destination, description, startDate, endDate, currency, participantEmails }: CreateTripParams): Promise<Trip> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Crear el viaje
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name,
        destination,
        description: description || null,
        start_date: startDate,
        end_date: endDate,
        currency,
        user_id: user.id,
      })
      .select()
      .single();

    if (tripError) {
      console.error('Error creating trip:', tripError);
      throw tripError;
    }

    // Añadir al creador como propietario
    const { error: ownerError } = await supabase
      .from('trip_participants')
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'owner',
      });

    if (ownerError) {
      console.error('Error adding owner as participant:', ownerError);
      throw ownerError;
    }

    // Invitar a otros participantes (por email)
    if (participantEmails.length > 0) {
      try {
        const { data: invitedUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', participantEmails);

        if (usersError) {
          console.error('Error fetching invited users:', usersError);
        } else if (invitedUsers && invitedUsers.length > 0) {
          const participantsToInsert = invitedUsers
            .filter((u: ProfileRow) => u.id !== user.id)
            .map((u: ProfileRow) => ({
              trip_id: trip.id,
              user_id: u.id,
              role: 'member' as const,
            }));

          if (participantsToInsert.length > 0) {
            const { error: participantsError } = await supabase
              .from('trip_participants')
              .insert(participantsToInsert);

            if (participantsError) {
              console.error('Error adding participants:', participantsError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing participant invitations:', error);
      }
    }

    return buildTripObject(trip as TripRow);
  },

  /**
   * Actualizar un viaje
   */
  async updateTrip(tripId: string, params: UpdateTripParams): Promise<Trip> {
    const updateData: any = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.destination !== undefined) updateData.destination = params.destination;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.startDate !== undefined) updateData.start_date = params.startDate;
    if (params.endDate !== undefined) updateData.end_date = params.endDate;
    if (params.currency !== undefined) updateData.currency = params.currency;
    updateData.updated_at = new Date().toISOString();

    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return buildTripObject(trip as TripRow);
  },

  /**
   * Eliminar un viaje
   */
  async deleteTrip(tripId: string): Promise<void> {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;
  },

  /**
   * Obtener participantes de un viaje
   */
  async getParticipants(tripId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId);

    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Obtener perfiles de los participantes
    const userIds = data.map((d: { user_id: string }) => d.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    return (profiles || []).map((profile: ProfileRow) => ({
      id: profile.id,
      name: profile.full_name || profile.email?.split('@')[0] || 'Usuario',
      email: profile.email,
    }));
  },
};

// ── Helpers para construir objetos Trip ──────────────────────────────────────────

async function buildTripObject(trip: TripRow): Promise<Trip> {
  // Obtener participantes
  const participants = await tripsService.getParticipants(trip.id);

  // Obtener gastos
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('trip_id', trip.id);

  if (expensesError) throw expensesError;

  const expenses: Expense[] = [];
  for (const exp of (expensesData || [])) {
    // Obtener splits para cada gasto
    const { data: splitsData, error: splitsError } = await supabase
      .from('expense_splits')
      .select('participant_id, amount, percentage')
      .eq('expense_id', exp.id);

    if (splitsError) throw splitsError;

    expenses.push({
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency,
      paidById: exp.paid_by_id,
      splitMethod: exp.split_method as SplitMethod,
      splits: (splitsData || []) as ExpenseSplit[],
      date: exp.date,
      category: exp.category as ExpenseCategory,
      notes: exp.notes || undefined,
    });
  }

  // Obtener días del itinerario
  const { data: daysData, error: daysError } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', trip.id)
    .order('date', { ascending: true });

  if (daysError) throw daysError;

  const itinerary: ItineraryDay[] = [];
  for (const day of (daysData || [])) {
    // Obtener actividades para cada día
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('day_id', day.id)
      .order('time', { ascending: true });

    if (activitiesError) throw activitiesError;

    const activities: Activity[] = (activitiesData || []).map((act: any) => ({
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

    itinerary.push({
      id: day.id,
      date: day.date,
      title: day.title || undefined,
      activities,
    });
  }

  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    description: trip.description || undefined,
    startDate: trip.start_date,
    endDate: trip.end_date,
    currency: trip.currency,
    participants,
    expenses,
    itinerary,
    createdAt: trip.created_at,
  };
}