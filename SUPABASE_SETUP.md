# Guía de Configuración de Supabase para Rumboo

Esta guía te ayudará a integrar Supabase como backend para tu aplicación Rumboo.

## 📋 Prerrequisitos

- Tener Node.js instalado (ya lo tienes)
- Tener una cuenta en [Supabase](https://supabase.com)
- Las credenciales de tu proyecto Supabase

## 🚀 Paso 1: Configurar la Base de Datos en Supabase

### 1.1 Ejecutar el Script SQL

1. Inicia sesión en tu dashboard de Supabase
2. Selecciona tu proyecto (`tyuzejfqvnkvdljfoiyp`)
3. Ve a **SQL Editor** (en el menú lateral)
4. Haz clic en **New Query**
5. Copia y pega el contenido completo del archivo `supabase-schema.sql`
6. Haz clic en **Run** para ejecutar el script

El script creará:
- ✅ Tabla `profiles` (extiende auth.users)
- ✅ Tabla `trips` (viajes)
- ✅ Tabla `trip_participants` (participantes de viajes)
- ✅ Tabla `expenses` (gastos)
- ✅ Tabla `expense_splits` (divisiones de gastos)
- ✅ Tabla `itinerary_days` (días del itinerario)
- ✅ Tabla `activities` (actividades)
- ✅ Triggers para manejo automático de perfiles
- ✅ Políticas de seguridad RLS (Row Level Security)

### 1.2 Verificar la Configuración

Después de ejecutar el script, verifica que las tablas se crearon correctamente:

1. Ve a **Table Editor** en el menú lateral
2. Deberías ver todas las tablas listadas:
   - profiles
   - trips
   - trip_participants
   - expenses
   - expense_splits
   - itinerary_days
   - activities

## 🔧 Paso 2: Configurar el Proyecto Frontend

### 2.1 Instalar Dependencias

Las dependencias de Supabase ya están instaladas, pero si necesitas reinstalar:

```bash
npm install @supabase/supabase-js
```

### 2.2 Verificar Configuración del Cliente

El cliente de Supabase ya está configurado en `src/lib/supabase/client.ts` con tus credenciales:

```typescript
const supabaseUrl = 'https://tyuzejfqvnkvdljfoiyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## 🔐 Paso 3: Configurar Autenticación

### 3.1 Habilitar Email/Contraseña

1. En Supabase, ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado
3. Configura las plantillas de email si deseas personalizarlos

### 3.2 (Opcional) Habilitar Google OAuth

Si deseas agregar login con Google:

1. Ve a **Authentication** → **Providers**
2. Habilita **Google**
3. Necesitarás:
   - Client ID de Google
   - Client Secret de Google
4. Sigue las instrucciones de Supabase para configurar Google Cloud Console

## 🧪 Paso 4: Probar la Integración

### 4.1 Iniciar la Aplicación

```bash
npm run dev
```

### 4.2 Probar Registro de Usuario

1. Ve a `/login`
2. Selecciona "Regístrate"
3. Ingresa:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Contraseña: una contraseña segura
4. Haz clic en "Crear cuenta"

Si todo está configurado correctly:
- ✅ Se creará el usuario en Supabase
- ✅ Se creará automáticamente el perfil en la tabla `profiles`
- ✅ Serás redirigido al dashboard

### 4.3 Probar Creación de Viajes

1. Una vez en el dashboard, haz clic en "Nuevo viaje"
2. Completa los pasos:
   - Destino del viaje
   - Fechas
   - Participantes (ingresa emails de otros usuarios registrados)
   - Itinerario
   - Moneda
3. Haz clic en "🚀 Crear viaje"

El viaje se guardará en Supabase y estará disponible para todos los participantes.

## 📁 Estructura de Archivos del Backend

```
src/lib/supabase/
├── client.ts              # Configuración del cliente Supabase
├── database.types.ts      # Tipos de TypeScript para la base de datos
├── auth.ts                # Funciones de autenticación
├── trips.ts               # Funciones CRUD para viajes
├── expenses.ts            # Funciones CRUD para gastos
├── itinerary.ts           # Funciones CRUD para itinerario y actividades
└── index.ts               # Exportaciones principales
```

## 🔒 Políticas de Seguridad (RLS)

Las políticas de seguridad implementadas garantizan que:

- ✅ Los usuarios solo pueden ver sus propios viajes
- ✅ Los participantes de un viaje pueden ver/editar gastos y actividades
- ✅ Solo el propietario del viaje puede eliminarlo o modificar participantes
- ✅ Cada usuario solo puede editar sus propios gastos (o si es propietario)

## 🛠️ Uso de las Funciones del Backend

### Autenticación

```typescript
import { useAuth } from '@/context/AuthContext';

const { signIn, signUp, signOut, user } = useAuth();

// Registro
await signUp('email@test.com', 'password123', 'Juan Pérez');

// Login
await signIn('email@test.com', 'password123');

// Logout
await signOut();
```

### Viajes

```typescript
import { tripsService } from '@/lib/supabase';

// Obtener mis viajes
const trips = await tripsService.getMyTrips();

// Crear viaje
const trip = await tripsService.createTrip({
  name: 'Barcelona 2024',
  destination: 'Barcelona, España',
  startDate: '2024-06-01',
  endDate: '2024-06-10',
  currency: 'EUR',
  participantEmails: ['amigo1@email.com', 'amigo2@email.com']
});

// Actualizar viaje
await tripsService.updateTrip(tripId, { name: 'Nuevo nombre' });

// Eliminar viaje
await tripsService.deleteTrip(tripId);
```

### Gastos

```typescript
import { expensesService } from '@/lib/supabase';

// Crear gasto
await expensesService.createExpense({
  tripId: trip.id,
  paidById: userId,
  description: 'Cena',
  amount: 100,
  currency: 'EUR',
  splitMethod: 'equal',
  splits: [
    { participantId: user1Id, amount: 25 },
    { participantId: user2Id, amount: 25 },
    { participantId: user3Id, amount: 25 },
    { participantId: user4Id, amount: 25 },
  ],
  date: '2024-06-05',
  category: 'comida'
});
```

### Itinerario y Actividades

```typescript
import { itineraryService } from '@/lib/supabase';

// Crear día
await itineraryService.createDay({
  tripId: trip.id,
  date: '2024-06-05',
  title: 'Día en la playa'
});

// Crear actividad
await itineraryService.createActivity({
  dayId: dayId,
  title: 'Visita a la Sagrada Familia',
  time: '10:00',
  duration: 180,
  location: 'Sagrada Familia, Barcelona',
  category: 'turismo'
});
```

## 🐛 Solución de Problemas

### Error: "Invalid API key"

**Solución:** Verifica que las credenciales en `src/lib/supabase/client.ts` sean correctas.

### Error: "Row Level Security policy violation"

**Solución:** Esto significa que las políticas RLS están funcionando. Asegúrate de que:
- El usuario está autenticado
- El usuario es participante del viaje que intenta acceder

### Los datos no se guardan

**Solución:**
1. Verifica que el script SQL se ejecutó correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de que el usuario está autenticado

### Error en el registro de usuarios

**Solución:**
1. Verifica que el trigger `on_auth_user_created` esté creado
2. Revisa que la tabla `profiles` exista
3. Comprueba que el email no esté ya registrado

## 📊 Ver Datos en Supabase

Puedes ver los datos guardados en:

1. **Table Editor**: Para ver/editar datos directamente
2. **SQL Editor**: Para ejecutar consultas personalizadas
3. **API Docs**: Para probar las APIs directamente desde el dashboard

## 🔄 Actualizar el Frontend

El frontend ya está configurado para usar Supabase. Las páginas principales que interactúan con el backend son:

- `src/pages/Login.tsx` - Autenticación
- `src/pages/Dashboard.tsx` - Lista de viajes
- `src/pages/CreateTrip.tsx` - Crear viaje
- `src/pages/TripDetail.tsx` - Detalles del viaje, gastos y actividades

## 📞 Soporte

Si tienes problemas:

1. Revisa la [documentación oficial de Supabase](https://supabase.com/docs)
2. Verifica los logs en **Logs** del dashboard de Supabase
3. Revisa la consola del navegador (F12) para errores del frontend

---

**¡Listo! Tu backend con Supabase está configurado y funcionando.** 🎉