-- ============================================================
-- RUMBOO - Esquema de Base de Datos para Supabase
-- ============================================================

-- 1. TABLA DE PERFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. TABLA DE VIAJES
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- 3. TABLA DE PARTICIPANTES DE VIAJES
CREATE TABLE IF NOT EXISTS public.trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON public.trip_participants(user_id);

-- 4. TABLA DE GASTOS
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  paid_by_id UUID NOT NULL REFERENCES public.profiles(id),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  split_method TEXT NOT NULL CHECK (split_method IN ('equal', 'percentage', 'custom')),
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alojamiento', 'transporte', 'comida', 'actividades', 'compras', 'otros')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);

-- 5. TABLA DE DIVISIONES DE GASTOS
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  percentage NUMERIC(5,2) CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

-- 6. TABLA DE DÍAS DEL ITINERARIO
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE ACTIVIDADES
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TIME NOT NULL,
  duration INTEGER,
  location TEXT,
  google_maps_url TEXT,
  place_info JSONB,
  notes TEXT,
  category TEXT NOT NULL CHECK (category IN ('transporte', 'alojamiento', 'comida', 'turismo', 'ocio', 'otro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NULL), COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. RLS - POLÍTICAS CON CONTROL DE ROLES
-- Las políticas ahora distinguen entre owner (creador) y members (invitados)
-- Solo los owners tienen permisos de escritura, los members solo lectura

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "public.profiles: users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "public.profiles: users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "public.profiles: users can view other profiles in same trips" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants tp1
    JOIN public.trip_participants tp2 ON tp1.trip_id = tp2.trip_id
    WHERE tp1.user_id = auth.uid() 
      AND tp1.status = 'accepted'
      AND tp2.user_id = public.profiles.id
  )
);

-- TRIPS - Policies with read-only enforcement for non-owners
CREATE POLICY "public.trips: users can view trips where they are accepted participant" ON public.trips FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = id 
      AND user_id = auth.uid() 
      AND status = 'accepted'
  )
);
CREATE POLICY "public.trips: users can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public.trips: owners can update their trips" ON public.trips FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);
CREATE POLICY "public.trips: owners can delete their trips" ON public.trips FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);

-- TRIP_PARTICIPANTS - Policies with read-only for non-owners
CREATE POLICY "public.trip_participants: users can view their own participation" ON public.trip_participants FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "public.trip_participants: owners can view participants in their trips" ON public.trip_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants tp
    WHERE tp.trip_id = trip_participants.trip_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.trip_participants: owners can manage participants" ON public.trip_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_participants tp
    WHERE tp.trip_id = trip_participants.trip_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.trip_participants: owners can update participants in their trips" ON public.trip_participants FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants tp
    WHERE tp.trip_id = trip_participants.trip_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.trip_participants: owners can remove participants from their trips" ON public.trip_participants FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants tp
    WHERE tp.trip_id = trip_participants.trip_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.trip_participants: users can update their own status" ON public.trip_participants FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid() AND
  (
    -- Users can only update their own status (for accepting/declining invitations)
    (status IN ('accepted', 'declined') AND joined_at IS NOT NULL) OR
    -- Or they can update their own record to decline
    status = 'declined'
  )
);

-- EXPENSES - Only owners can write, all accepted participants can read
CREATE POLICY "public.expenses: accepted participants can view expenses in their trips" ON public.expenses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND status = 'accepted'
  )
);
CREATE POLICY "public.expenses: only owners can insert expenses" ON public.expenses FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);
CREATE POLICY "public.expenses: only owners can update expenses" ON public.expenses FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);
CREATE POLICY "public.expenses: only owners can delete expenses" ON public.expenses FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);

-- EXPENSE_SPLITS - Only owners can write, all accepted participants can read
CREATE POLICY "public.expense_splits: accepted participants can view splits in their trips" ON public.expense_splits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    JOIN public.trip_participants tp ON e.trip_id = tp.trip_id 
    WHERE e.id = expense_id 
      AND tp.user_id = auth.uid() 
      AND tp.status = 'accepted'
  )
);
CREATE POLICY "public.expense_splits: only owners can manage splits" ON public.expense_splits FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    JOIN public.trip_participants tp ON e.trip_id = tp.trip_id 
    WHERE e.id = expense_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.expense_splits: only owners can update splits" ON public.expense_splits FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    JOIN public.trip_participants tp ON e.trip_id = tp.trip_id 
    WHERE e.id = expense_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.expense_splits: only owners can delete splits" ON public.expense_splits FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    JOIN public.trip_participants tp ON e.trip_id = tp.trip_id 
    WHERE e.id = expense_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);

-- ITINERARY_DAYS - Only owners can write, all accepted participants can read
CREATE POLICY "public.itinerary_days: accepted participants can view days in their trips" ON public.itinerary_days FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND status = 'accepted'
  )
);
CREATE POLICY "public.itinerary_days: only owners can insert days" ON public.itinerary_days FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);
CREATE POLICY "public.itinerary_days: only owners can update days" ON public.itinerary_days FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);
CREATE POLICY "public.itinerary_days: only owners can delete days" ON public.itinerary_days FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.trip_participants 
    WHERE trip_id = trip_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
  )
);

-- ACTIVITIES - Only owners can write, all accepted participants can read
CREATE POLICY "public.activities: accepted participants can view activities in their trips" ON public.activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d 
    JOIN public.trip_participants tp ON d.trip_id = tp.trip_id 
    WHERE d.id = day_id 
      AND tp.user_id = auth.uid() 
      AND tp.status = 'accepted'
  )
);
CREATE POLICY "public.activities: only owners can insert activities" ON public.activities FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d 
    JOIN public.trip_participants tp ON d.trip_id = tp.trip_id 
    WHERE d.id = day_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.activities: only owners can update activities" ON public.activities FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d 
    JOIN public.trip_participants tp ON d.trip_id = tp.trip_id 
    WHERE d.id = day_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
CREATE POLICY "public.activities: only owners can delete activities" ON public.activities FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.itinerary_days d 
    JOIN public.trip_participants tp ON d.trip_id = tp.trip_id 
    WHERE d.id = day_id 
      AND tp.user_id = auth.uid() 
      AND tp.role = 'owner'
  )
);
