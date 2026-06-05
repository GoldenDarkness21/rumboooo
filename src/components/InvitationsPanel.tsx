import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { invitationsService, tripsService } from '@/lib/supabase';
import type { TripParticipant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, MapPin, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface TripInfo {
	id: string;
	name: string;
	destination: string;
	startDate: string;
	endDate: string;
	participantCount: number;
}

export function InvitationsPanel() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [invitations, setInvitations] = useState<Array<TripParticipant & { trip?: TripInfo }>>([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState<string | null>(null);

	const loadInvitations = async () => {
		if (!user) return;

		setLoading(true);
		try {
			const pendingInvitations = await invitationsService.getPendingInvitations(user.id);
			
			// Fetch trip details for each invitation
			const invitationsWithTrip = await Promise.all(
				pendingInvitations.map(async (invitation) => {
					try {
						const trip = await tripsService.getTripById(invitation.tripId);
						const participants = await tripsService.getParticipants(invitation.tripId);
						return {
							...invitation,
							trip: trip ? {
								id: trip.id,
								name: trip.name,
								destination: trip.destination,
								startDate: trip.startDate,
								endDate: trip.endDate,
								participantCount: participants.length,
							} : undefined,
						};
					} catch {
						return { ...invitation, trip: undefined };
					}
				})
			);

			setInvitations(invitationsWithTrip.filter((i) => i.trip));
		} catch (error) {
			console.error('Error loading invitations:', error);
			toast.error('Error al cargar invitaciones');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadInvitations();
	}, [user]);

	const handleAccept = async (tripId: string) => {
		if (!user) return;

		setProcessing(tripId);
		try {
			const result = await invitationsService.acceptInvitation(tripId, user.id);
			if (result.success) {
				toast.success('¡Invitación aceptada! El viaje ahora aparece en tu lista.');
				setInvitations((prev) => prev.filter((i) => i.tripId !== tripId));
			} else {
				toast.error(result.error || 'Error al aceptar invitación');
			}
		} catch (error) {
			console.error('Error accepting invitation:', error);
			toast.error('Error al aceptar invitación');
		} finally {
			setProcessing(null);
		}
	};

	const handleDecline = async (tripId: string) => {
		if (!user) return;

		setProcessing(tripId);
		try {
			const result = await invitationsService.declineInvitation(tripId, user.id);
			if (result.success) {
				toast.success('Invitación declinada');
				setInvitations((prev) => prev.filter((i) => i.tripId !== tripId));
			} else {
				toast.error(result.error || 'Error al declinar invitación');
			}
		} catch (error) {
			console.error('Error declining invitation:', error);
			toast.error('Error al declinar invitación');
		} finally {
			setProcessing(null);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (invitations.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-4">
				<h2 className="text-lg font-semibold">Invitaciones Pendientes</h2>
				<Badge variant="secondary">{invitations.length}</Badge>
			</div>

			<div className="grid gap-4">
				{invitations.map((invitation) => (
					<Card key={invitation.id} className="border-primary/20">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="text-lg">{invitation.trip?.name}</CardTitle>
									<CardDescription className="flex items-center gap-1 mt-1">
										<MapPin className="w-3.5 h-3.5" />
										{invitation.trip?.destination}
									</CardDescription>
								</div>
								<Badge variant="outline" className="text-primary border-primary">
									Pendiente
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="pb-3">
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Calendar className="w-3.5 h-3.5" />
									{new Date(invitation.trip?.startDate || '').toLocaleDateString('es-ES', {
										day: 'numeric',
										month: 'short',
									})}
									{' - '}
									{new Date(invitation.trip?.endDate || '').toLocaleDateString('es-ES', {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
									})}
								</div>
								<div className="flex items-center gap-1">
									<Users className="w-3.5 h-3.5" />
									{invitation.trip?.participantCount || 0} participantes
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex gap-2 pt-0">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleDecline(invitation.tripId)}
								disabled={processing === invitation.tripId}
								className="flex-1"
							>
								{processing === invitation.tripId ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<>
										<X className="w-4 h-4 mr-1" />
										Declinar
									</>
								)}
							</Button>
							<Button
								variant="default"
								size="sm"
								onClick={() => handleAccept(invitation.tripId)}
								disabled={processing === invitation.tripId}
								className="flex-1"
							>
								{processing === invitation.tripId ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<>
										<Check className="w-4 h-4 mr-1" />
										Aceptar
									</>
								)}
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}