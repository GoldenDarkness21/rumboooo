# RUMBOO - Gestor de Viajes Compartidos

**Rumboo** es una aplicación web para organizar y gestionar viajes en grupo, permitiendo llevar un control de gastos, itinerarios y actividades de manera colaborativa.

## 🚀 Características

- **Gestión de Viajes**: Crea y organiza viajes con toda la información necesaria
- **Control de Gastos**: Registra gastos y divídelos entre participantes (igual, por porcentaje o montos personalizados)
- **Balances Automáticos**: Calcula automáticamente quién le debe a quién
- **Itinerarios**: Organiza actividades por día con información detallada
- **Colaborativo**: Múltiples usuarios pueden participar en el mismo viaje
- **Autenticación Segura**: Sistema de login/registro con Supabase

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** para build rápido
- **React Router** para navegación
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes UI
- **React Hook Form** + **Zod** para formularios
- **TanStack React Query** para gestión de estado del servidor

### Backend
- **Supabase** (PostgreSQL + Auth + RLS)
- **Row Level Security** para protección de datos

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o bun
- Cuenta en Supabase

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/25natalia/Rumboo_gestion.git
cd Rumboo_gestion
```

2. **Instalar dependencias**
```bash
npm install
# o
bun install
```

3. **Configurar Supabase**

   Sigue la guía detallada en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):
   
   a. Crea un proyecto en [Supabase](https://supabase.com)
   
   b. Ejecuta el script SQL (`supabase-schema.sql`) en el SQL Editor
   
   c. Copia tus credenciales de Supabase

4. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

5. **Iniciar la aplicación**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
Rumboo_gestion/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── context/             # Contextos de React (Auth, Trips)
│   ├── hooks/               # Custom hooks
│   ├── lib/
│   │   └── supabase/        # Integración con Supabase
│   │       ├── client.ts    # Cliente de Supabase
│   │       ├── auth.ts      # Funciones de autenticación
│   │       ├── trips.ts     # CRUD de viajes
│   │       ├── expenses.ts  # CRUD de gastos
│   │       └── itinerary.ts # CRUD de itinerario
│   ├── pages/               # Páginas de la aplicación
│   ├── types/               # Tipos de TypeScript
│   └── App.tsx              # Componente principal
├── public/                  # Archivos estáticos
├── supabase-schema.sql      # Script SQL para Supabase
├── SUPABASE_SETUP.md        # Guía de configuración
└── package.json
```

## 🔑 Funcionalidades Principales

### Autenticación
- Registro con email y contraseña
- Login seguro
- Recuperación de contraseña
- Sesiones persistentes

### Viajes
- Crear viajes con nombre, destino, fechas y moneda
- Añadir participantes (usuarios registrados)
- Editar y eliminar viajes
- Ver todos los viajes donde participas

### Gastos
- Registrar gastos con descripción, monto y categoría
- Dividir gastos de múltiples formas:
  - **Igual**: Divide equitativamente entre participantes
  - **Porcentaje**: Divide según porcentajes personalizados
  - **Montos personalizados**: Asigna montos específicos
- Editar y eliminar gastos
- Ver detalle de quién pagó qué

### Balances
- Cálculo automático de balances
- Sugerencias de liquidación ("quién le paga a quién")
- Balance por persona

### Itinerario
- Organizar actividades por día
- Añadir información detallada (hora, ubicación, notas)
- Integración con Google Maps
- Categorías de actividades (transporte, turismo, comida, etc.)

## 🗄️ Base de Datos

El esquema de la base de datos incluye:

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuarios (extiende auth.users) |
| `trips` | Viajes creados |
| `trip_participants` | Participantes de cada viaje |
| `expenses` | Gastos registrados |
| `expense_splits` | División de cada gasto |
| `itinerary_days` | Días del itinerario |
| `activities` | Actividades del itinerario |

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Los usuarios solo pueden acceder a sus propios viajes
- Los participantes pueden ver/editar gastos y actividades de sus viajes
- Solo el propietario puede eliminar el viaje o gestionar participantes

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Tests
npm run test
```

## 📱 Uso de la API

### Autenticación
```typescript
import { useAuth } from '@/context/AuthContext';

const { signIn, signUp, signOut, user } = useAuth();

// Registro
await signUp('email@test.com', 'password', 'Nombre Completo');

// Login
await signIn('email@test.com', 'password');

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
  participantEmails: ['amigo@email.com']
});
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
  splits: [{ participantId: user1Id, amount: 50 }, ...],
  date: '2024-06-05',
  category: 'comida'
});
```

## 📄 Licencia

Este proyecto es de código abierto.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request.

## 📞 Soporte

- Documentación completa: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Issues: [GitHub Issues](https://github.com/25natalia/Rumboo_gestion/issues)

---

**¡Disfruta organizando tus viajes con Rumboo!** 🧳✈️