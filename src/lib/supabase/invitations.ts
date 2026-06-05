import { supabase } from './client';
import type { UserProfile, TripParticipant, InvitationStatus } from '@/types';

export interface SearchableProfile extends UserProfile {
	displayName: string;
}

interface TripParticipantRow {
	id: string;
	trip_id: string;
	user_id: string;
	role: 'owner' | 'member';
	status: 'pending' | 'accepted' | 'declined';
	invited_at: string;
	joined_at: string;
}

interface ProfileRow {
	id: string;
	email: string;
	full_name: string | null;
	avatar_url: string | null;
}

export const invitationsService = {
	/**
	 * Search for users by name or email with debouncing support
	 * Excludes the current user from results
	 */
	async searchUsers(query: string, currentUserId: string, limit: number = 10): Promise<SearchableProfile[]> {
		if (!query.trim()) return [];

		const searchTerm = query.trim().toLowerCase();
		
		// Search in profiles table - match against full_name or email
		const { data, error } = await supabase
			.from('profiles')
			.select('id, email, full_name, avatar_url')
			.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
			.neq('id', currentUserId)
			.limit(limit);

		if (error) {
			console.error('Error searching users:', error);
			return [];
		}

		return ((data as ProfileRow[]) || []).map((profile) => ({
			id: profile.id,
			email: profile.email,
			fullName: profile.full_name,
			avatarUrl: profile.avatar_url,
			displayName: profile.full_name || profile.email.split('@')[0],
		}));
	},

	/**
	 * Invite a user to a trip
	 * Creates a trip_participant record with pending status
	 */
	async inviteUser(tripId: string, userId: string, _inviterId: string): Promise<{ success: boolean; error?: string }> {
		// Check if user is already a participant
		const { data: existing, error: fetchError } = await supabase
			.from('trip_participants')
			.select('id, status')
			.eq('trip_id', tripId)
			.eq('user_id', userId)
			.single();

		if (fetchError && fetchError.code !== 'PGRST116') {
			console.error('Error checking existing participant:', fetchError);
			return { success: false, error: 'Error al verificar participante' };
		}

		const existingParticipant = existing as TripParticipantRow | null;

		if (existingParticipant) {
			if (existingParticipant.status === 'accepted') {
				return { success: false, error: 'Este usuario ya es participante del viaje' };
			}
			if (existingParticipant.status === 'pending') {
				return { success: false, error: 'Ya se ha enviado una invitación a este usuario' };
			}
			// If declined, allow re-inviting by updating the record
			const { error: updateError } = await supabase
				.from('trip_participants')
				.update({
					status: 'pending',
					role: 'member',
					invited_at: new Date().toISOString(),
					joined_at: null,
				})
				.eq('id', existingParticipant.id);

			if (updateError) {
				console.error('Error re-inviting user:', updateError);
				return { success: false, error: 'Error al reenviar invitación' };
			}
			return { success: true };
		}

		// Insert new participant with pending status
		const { error: insertError } = await supabase
			.from('trip_participants')
			.insert({
				trip_id: tripId,
				user_id: userId,
				role: 'member',
				status: 'pending',
				invited_at: new Date().toISOString(),
			});

		if (insertError) {
			console.error('Error inviting user:', insertError);
			return { success: false, error: 'Error al enviar invitación' };
		}

		return { success: true };
	},

	/**
	 * Get pending invitations for the current user
	 */
	async getPendingInvitations(userId: string): Promise<TripParticipant[]> {
		const { data, error } = await supabase
			.from('trip_participants')
			.select('id, trip_id, user_id, role, status, invited_at, joined_at')
			.eq('user_id', userId)
			.eq('status', 'pending');

		if (error) {
			console.error('Error fetching pending invitations:', error);
			return [];
		}

		return ((data as TripParticipantRow[]) || []).map((participant) => ({
			id: participant.id,
			tripId: participant.trip_id,
			userId: participant.user_id,
			role: participant.role,
			status: participant.status,
			invitedAt: participant.invited_at,
			joinedAt: participant.joined_at,
		}));
	},

	/**
	 * Accept an invitation to a trip
	 */
	async acceptInvitation(tripId: string, userId: string): Promise<{ success: boolean; error?: string }> {
		const { error } = await supabase
			.from('trip_participants')
			.update({
				status: 'accepted',
				joined_at: new Date().toISOString(),
			})
			.eq('trip_id', tripId)
			.eq('user_id', userId);

		if (error) {
			console.error('Error accepting invitation:', error);
			return { success: false, error: 'Error al aceptar invitación' };
		}

		return { success: true };
	},

	/**
	 * Decline an invitation to a trip
	 */
	async declineInvitation(tripId: string, userId: string): Promise<{ success: boolean; error?: string }> {
		const { error } = await supabase
			.from('trip_participants')
			.update({
				status: 'declined',
			})
			.eq('trip_id', tripId)
			.eq('user_id', userId);

		if (error) {
			console.error('Error declining invitation:', error);
			return { success: false, error: 'Error al declinar invitación' };
		}

		return { success: true };
	},

	/**
	 * Remove a participant from a trip (owner only)
	 */
	async removeParticipant(tripId: string, participantUserId: string, currentUserId: string): Promise<{ success: boolean; error?: string }> {
		// First check if current user is owner
		const { data: ownerCheck, error: checkError } = await supabase
			.from('trip_participants')
			.select('role')
			.eq('trip_id', tripId)
			.eq('user_id', currentUserId)
			.single();

		if (checkError || !ownerCheck) {
			return { success: false, error: 'Solo el creador puede eliminar participantes' };
		}

		if ((ownerCheck as TripParticipantRow).role !== 'owner') {
			return { success: false, error: 'Solo el creador puede eliminar participantes' };
		}

		// Cannot remove the owner
		if (participantUserId === currentUserId) {
			return { success: false, error: 'No puedes eliminarte a ti mismo' };
		}

		const { error } = await supabase
			.from('trip_participants')
			.delete()
			.eq('trip_id', tripId)
			.eq('user_id', participantUserId);

		if (error) {
			console.error('Error removing participant:', error);
			return { success: false, error: 'Error al eliminar participante' };
		}

		return { success: true };
	},

	/**
	 * Get trip participants with their profiles
	 */
	async getTripParticipants(tripId: string): Promise<Array<TripParticipant & { profile: SearchableProfile }>> {
		const { data: participants, error: participantsError } = await supabase
			.from('trip_participants')
			.select('id, trip_id, user_id, role, status, invited_at, joined_at')
			.eq('trip_id', tripId);

		if (participantsError) {
			console.error('Error fetching participants:', participantsError);
			return [];
		}

		const participantsData = participants as TripParticipantRow[];
		if (!participantsData || participantsData.length === 0) return [];

		const userIds = participantsData.map((p) => p.user_id);
		const { data: profiles, error: profilesError } = await supabase
			.from('profiles')
			.select('id, email, full_name, avatar_url')
			.in('id', userIds);

		if (profilesError) {
			console.error('Error fetching profiles:', profilesError);
			return [];
		}

		const profilesData = profiles as ProfileRow[];

		return participantsData.map((participant) => {
			const profile = profilesData?.find((p) => p.id === participant.user_id);
			return {
				id: participant.id,
				tripId: participant.trip_id,
				userId: participant.user_id,
				role: participant.role,
				status: participant.status,
				invitedAt: participant.invited_at,
				joinedAt: participant.joined_at,
				profile: {
					id: profile?.id || participant.user_id,
					email: profile?.email || '',
					fullName: profile?.full_name ?? null,
					avatarUrl: profile?.avatar_url ?? null,
					displayName: profile?.full_name || profile?.email?.split('@')[0] || 'Usuario',
				},
			};
		});
	},
};