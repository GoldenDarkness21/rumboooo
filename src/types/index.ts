export interface Participant {
	id: string;
	name: string;
	email?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined';
export type ParticipantRole = 'owner' | 'member';

export interface TripParticipant {
	id: string;
	tripId: string;
	userId: string;
	role: ParticipantRole;
	status: InvitationStatus;
	invitedAt: string;
	joinedAt: string;
}

export interface UserProfile {
	id: string;
	email: string;
	fullName: string | null;
	avatarUrl: string | null;
}

export type SplitMethod = 'equal' | 'percentage' | 'custom';

export interface ExpenseSplit {
	participantId: string;
	amount: number;
	percentage?: number;
}

export type ExpenseCategory = 'alojamiento' | 'transporte' | 'comida' | 'actividades' | 'compras' | 'otros';

export interface Expense {
	id: string;
	description: string;
	amount: number;
	currency: string;
	paidById: string;
	splitMethod: SplitMethod;
	splits: ExpenseSplit[];
	date: string;
	category: ExpenseCategory;
	notes?: string;
}

export type ActivityCategory = 'transporte' | 'alojamiento' | 'comida' | 'turismo' | 'ocio' | 'otro';

export interface PlaceInfo {
	name: string;
	address?: string;
	description?: string;
	googleMapsUrl?: string;
	openingHours?: string;
	rating?: number;
}

export interface Activity {
	id: string;
	title: string;
	time: string;
	duration?: number;
	location?: string;
	googleMapsUrl?: string;
	placeInfo?: PlaceInfo;
	notes?: string;
	category: ActivityCategory;
}

export interface ItineraryDay {
	id: string;
	date: string;
	title?: string;
	activities: Activity[];
}

export interface Balance {
	participantId: string;
	totalPaid: number;
	totalOwed: number;
	net: number;
}

export interface Settlement {
	fromId: string;
	toId: string;
	amount: number;
}

export interface Trip {
	id: string;
	name: string;
	destination: string;
	description?: string;
	startDate: string;
	endDate: string;
	currency: string;
	participants: Participant[];
	expenses: Expense[];
	itinerary: ItineraryDay[];
	createdAt: string;
}
