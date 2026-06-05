# Invitation Workflow Implementation Guide

## Overview

This document explains the complete invitation workflow implementation for the Rumboo travel and expense-splitting app. The implementation includes:

1. **Dynamic User Search** - Real-time search for registered users
2. **Trip Invitation System** - Send invitations with pending status
3. **Accept/Decline Workflow** - Users can accept or decline invitations
4. **Read-Only Access Control** - RLS policies ensure only owners can edit

## Database Schema Changes

### New Columns in `trip_participants` Table

```sql
-- Add status column for invitation tracking
ALTER TABLE public.trip_participants 
ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted' 
CHECK (status IN ('pending', 'accepted', 'declined'));

-- Add invited_at timestamp
ALTER TABLE public.trip_participants 
ADD COLUMN invited_at TIMESTAMPTZ DEFAULT NOW();

-- Add joined_at timestamp (when invitation is accepted)
ALTER TABLE public.trip_participants 
ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
```

### Status Values

- **pending**: Invitation sent, waiting for user response
- **accepted**: User accepted the invitation and joined the trip
- **declined**: User declined the invitation

## Implementation Files

### 1. Frontend Components

#### `src/components/UserSearch.tsx`
- Debounced search input (300ms delay)
- Real-time user search from `profiles` table
- Displays search results in dropdown
- Shows selected users as removable chips
- Filters out already selected users

#### `src/components/InvitationsPanel.tsx`
- Displays pending invitations for the current user
- Shows trip details (name, destination, dates, participant count)
- Accept/Decline buttons with loading states
- Auto-refreshes on action completion

### 2. Services

#### `src/lib/supabase/invitations.ts`
```typescript
// Key functions:
- searchUsers(query, currentUserId, limit) // Search registered users
- inviteUser(tripId, userId, inviterId) // Send invitation
- getPendingInvitations(userId) // Get user's pending invitations
- acceptInvitation(tripId, userId) // Accept invitation
- declineInvitation(tripId, userId) // Decline invitation
- removeParticipant(tripId, participantUserId, currentUserId) // Owner removes participant
- getTripParticipants(tripId) // Get all participants with profiles
```

### 3. Updated Pages

#### `src/pages/CreateTrip.tsx`
- Step 3 now uses `UserSearch` component
- Invites selected users after trip creation
- Shows invitation status and instructions

#### `src/pages/Dashboard.tsx`
- Includes `InvitationsPanel` at the top
- Shows pending invitations before the trip list

## Row Level Security (RLS) Policies

### Key Principles

1. **Owners (trip creators)** have full CRUD access
2. **Members (invited users)** have SELECT-only access
3. **Pending users** cannot access trip data until they accept

### Policy Summary

| Table | Operation | Owner | Member (Accepted) | Pending |
|-------|-----------|-------|-------------------|---------|
| trips | SELECT | ✅ | ✅ | ❌ |
| trips | INSERT | ✅ (own trips) | ❌ | ❌ |
| trips | UPDATE | ✅ | ❌ | ❌ |
| trips | DELETE | ✅ | ❌ | ❌ |
| expenses | SELECT | ✅ | ✅ | ❌ |
| expenses | INSERT/UPDATE/DELETE | ✅ | ❌ | ❌ |
| itinerary_days | SELECT | ✅ | ✅ | ❌ |
| itinerary_days | INSERT/UPDATE/DELETE | ✅ | ❌ | ❌ |
| activities | SELECT | ✅ | ✅ | ❌ |
| activities | INSERT/UPDATE/DELETE | ✅ | ❌ | ❌ |
| trip_participants | SELECT | ✅ (all in trip) | ✅ (own only) | ✅ (own only) |
| trip_participants | INSERT/UPDATE/DELETE | ✅ | ❌ | ❌ |

### Special Cases

- Users can update their own `status` to accept/decline invitations
- Owners can view all participants in their trips
- Users can only view their own participation record

## Database Migration

To apply these changes to your Supabase database, run the updated schema:

```bash
# Option 1: Using Supabase CLI
supabase db reset  # WARNING: This will delete all data!

# Option 2: Run SQL directly in Supabase SQL Editor
# Copy the contents of supabase-schema.sql and run it
```

### Migration Script (Non-Destructive)

If you have existing data and want to preserve it, run this migration script instead:

```sql
-- Add new columns to trip_participants
DO $$ 
BEGIN 
  -- Add status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_participants' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.trip_participants 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted' 
    CHECK (status IN ('pending', 'accepted', 'declined'));
  END IF;

  -- Add invited_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_participants' AND column_name = 'invited_at'
  ) THEN
    ALTER TABLE public.trip_participants 
    ADD COLUMN invited_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add joined_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_participants' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.trip_participants 
    ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Set existing participants as accepted with joined_at = created_at
  UPDATE public.trip_participants 
  SET status = 'accepted', 
      joined_at = COALESCE(joined_at, created_at),
      invited_at = COALESCE(invited_at, created_at)
  WHERE status IS NULL OR status = '';
END $$;

-- Enable RLS on trip_participants (was previously disabled)
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate with new ones
DROP POLICY IF EXISTS "public.trip_participants: users can view their own participation" ON public.trip_participants;
DROP POLICY IF EXISTS "public.trip_participants: owners can view participants in their trips" ON public.trip_participants;
DROP POLICY IF EXISTS "public.trip_participants: owners can manage participants" ON public.trip_participants;
DROP POLICY IF EXISTS "public.trip_participants: owners can update participants in their trips" ON public.trip_participants;
DROP POLICY IF EXISTS "public.trip_participants: owners can remove participants from their trips" ON public.trip_participants;
DROP POLICY IF EXISTS "public.trip_participants: users can update their own status" ON public.trip_participants;

-- (Continue with all the RLS policies from supabase-schema.sql...)
```

## Testing the Implementation

### Test Scenario 1: Create Trip and Invite Users

1. Log in as User A
2. Go to "Nuevo viaje" (Create Trip)
3. Fill in trip details
4. In Step 3 (Grupo), search for User B by name or email
5. Select User B from search results
6. Complete trip creation
7. Verify User B receives an invitation (check Dashboard)

### Test Scenario 2: Accept/Decline Invitation

1. Log in as User B
2. Go to Dashboard
3. See pending invitation in "Invitaciones Pendientes" section
4. Click "Aceptar" or "Declinar"
5. Verify trip appears/disappears from "Mis viajes" accordingly

### Test Scenario 3: Read-Only Access

1. User B (member) accepts invitation
2. User B navigates to trip details
3. Verify User B can view:
   - Trip information
   - Expenses
   - Itinerary and activities
4. Verify User B CANNOT:
   - Add/edit/delete expenses
   - Modify itinerary
   - Add/remove activities
   - Invite/remove participants

### Test Scenario 4: Owner Permissions

1. User A (owner) navigates to trip
2. Verify User A can:
   - Edit trip details
   - Add/edit/delete expenses
   - Modify itinerary
   - Invite additional participants
   - Remove participants

## Troubleshooting

### Issue: Search returns no results

**Solution**: Ensure the `profiles` table has data and the search query matches `full_name` or `email` fields.

### Issue: Cannot invite users

**Solution**: Check that:
- The trip was created successfully
- The creator is marked as 'owner' in `trip_participants`
- The invited user exists in `profiles` table

### Issue: RLS permission denied errors

**Solution**: 
1. Verify RLS is enabled on all tables
2. Check that all policies from `supabase-schema.sql` are applied
3. Ensure user's `status` is 'accepted' for the trip

### Issue: Invitations not showing

**Solution**:
1. Check `trip_participants` table for records with `status = 'pending'`
2. Verify the user_id matches the logged-in user
3. Refresh the Dashboard page

## Security Considerations

1. **Always validate on the server**: RLS policies provide database-level security, but also validate in your application logic
2. **Never expose sensitive data**: The search function excludes the current user and only returns public profile information
3. **Rate limiting**: Consider adding rate limiting to the search function to prevent abuse
4. **Audit logging**: Consider adding audit logs for invitation actions

## Future Enhancements

1. **Email notifications**: Send email when invitation is sent/accepted/declined
2. **Invitation expiration**: Auto-expire pending invitations after X days
3. **Bulk invitations**: Allow inviting multiple users at once
4. **Invitation message**: Let creators add a personal message to invitations
5. **Re-invite**: Allow re-sending invitations to declined users

## Support

For issues or questions:
1. Check the Supabase logs in the dashboard
2. Review the RLS policies in `supabase-schema.sql`
3. Test queries directly in Supabase SQL Editor
4. Check browser console for frontend errors