/**
 * Supabase Integration for Rumboo
 * 
 * This module exports all the Supabase services and utilities for the application.
 */

// Cliente de Supabase
export { supabase } from './client';

// Tipos de base de datos
export type { Database } from './database.types';

// Servicios
export { authService } from './auth';
export type { SignUpParams, SignInParams } from './auth';

export { tripsService } from './trips';
export type { CreateTripParams, UpdateTripParams } from './trips';

export { expensesService } from './expenses';
export type { CreateExpenseParams, UpdateExpenseParams } from './expenses';

export { itineraryService } from './itinerary';
export type {
  CreateItineraryDayParams,
  UpdateItineraryDayParams,
  CreateActivityParams,
  UpdateActivityParams,
} from './itinerary';