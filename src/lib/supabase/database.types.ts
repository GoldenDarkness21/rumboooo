export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          name: string
          destination: string
          description: string | null
          start_date: string
          end_date: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          destination: string
          description?: string | null
          start_date: string
          end_date: string
          currency: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          destination?: string
          description?: string | null
          start_date?: string
          end_date?: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      trip_participants: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          paid_by_id: string
          description: string
          amount: number
          currency: string
          split_method: 'equal' | 'percentage' | 'custom'
          date: string
          category: 'alojamiento' | 'transporte' | 'comida' | 'actividades' | 'compras' | 'otros'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          paid_by_id: string
          description: string
          amount: number
          currency: string
          split_method: 'equal' | 'percentage' | 'custom'
          date: string
          category: 'alojamiento' | 'transporte' | 'comida' | 'actividades' | 'compras' | 'otros'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          paid_by_id?: string
          description?: string
          amount?: number
          currency?: string
          split_method?: 'equal' | 'percentage' | 'custom'
          date?: string
          category?: 'alojamiento' | 'transporte' | 'comida' | 'actividades' | 'compras' | 'otros'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          participant_id: string
          amount: number
          percentage: number | null
        }
        Insert: {
          id?: string
          expense_id: string
          participant_id: string
          amount: number
          percentage?: number | null
        }
        Update: {
          id?: string
          expense_id?: string
          participant_id?: string
          amount?: number
          percentage?: number | null
        }
      }
      itinerary_days: {
        Row: {
          id: string
          trip_id: string
          date: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          date: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          date?: string
          title?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          day_id: string
          title: string
          time: string
          duration: number | null
          location: string | null
          google_maps_url: string | null
          place_info: Json | null
          notes: string | null
          category: 'transporte' | 'alojamiento' | 'comida' | 'turismo' | 'ocio' | 'otro'
          created_at: string
        }
        Insert: {
          id?: string
          day_id: string
          title: string
          time: string
          duration?: number | null
          location?: string | null
          google_maps_url?: string | null
          place_info?: Json | null
          notes?: string | null
          category: 'transporte' | 'alojamiento' | 'comida' | 'turismo' | 'ocio' | 'otro'
          created_at?: string
        }
        Update: {
          id?: string
          day_id?: string
          title?: string
          time?: string
          duration?: number | null
          location?: string | null
          google_maps_url?: string | null
          place_info?: Json | null
          notes?: string | null
          category?: 'transporte' | 'alojamiento' | 'comida' | 'turismo' | 'ocio' | 'otro'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}