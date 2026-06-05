import { useState, useEffect, useCallback } from 'react';
import { X, User, Search, Loader2 } from 'lucide-react';
import { invitationsService, type SearchableProfile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { TripParticipant } from '@/types';

// Extended type with profile info
interface TripParticipantWithProfile extends TripParticipant {
	profile?: {
		displayName: string;
	};
}

interface AddParticipantModalProps {
	open: boolean;
	onClose: () => void;
	onAddParticipant: (userId: string) => Promise<boolean>;
	existingParticipants: TripParticipantWithProfile[];
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function AddParticipantModal({
	open,
	onClose,
	onAddParticipant,
	existingParticipants,
}: AddParticipantModalProps) {
	const { user } = useAuth();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchableProfile[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const debouncedQuery = useDebounce(query, 300);

	// Search users when debounced query changes
	const searchUsers = useCallback(async (searchTerm: string) => {
		if (!searchTerm.trim() || !user) {
			setResults([]);
			return;
		}

		setLoading(true);
		try {
			const users = await invitationsService.searchUsers(
				searchTerm,
				user.id,
				8
			);
			// Filter out existing participants
			const filtered = users.filter(
				(u) => !existingParticipants.some((p) => p.userId === u.id)
			);
			setResults(filtered);
		} catch (error) {
			console.error('Error searching users:', error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	}, [user, existingParticipants]);

	useEffect(() => {
		searchUsers(debouncedQuery);
	}, [debouncedQuery, searchUsers]);

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setQuery('');
			setResults([]);
			setSubmitting(false);
		}
	}, [open]);

	const handleSelectUser = async (selectedUser: SearchableProfile) => {
		setSubmitting(true);
		const success = await onAddParticipant(selectedUser.id);
		if (success) {
			onClose();
		}
		setSubmitting(false);
	};

	const isParticipant = (userId: string) =>
		existingParticipants.some((p) => p.userId === userId);

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Añadir participante</DialogTitle>
					<DialogDescription>
						Busca un usuario registrado por nombre o email para invitarlo a
						este viaje.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search input */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Buscar usuarios..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-9 pr-9 h-10"
							disabled={submitting}
						/>
						{loading && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
						)}
						{query && !loading && (
							<button
								onClick={() => {
									setQuery('');
									setResults([]);
								}}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								type="button"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>

					{/* Search results */}
					{results.length > 0 && (
						<div className="max-h-64 overflow-y-auto border border-border rounded-lg">
							{results.map((userResult) => (
								<button
									key={userResult.id}
									onClick={() => handleSelectUser(userResult)}
									disabled={submitting || isParticipant(userResult.id)}
									className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
									type="button"
								>
									{userResult.avatarUrl ? (
										<img
											src={userResult.avatarUrl}
											alt={userResult.displayName}
											className="w-8 h-8 rounded-full"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											<User className="w-4 h-4 text-primary" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{userResult.displayName}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{userResult.email}
										</p>
									</div>
									{isParticipant(userResult.id) ? (
										<span className="text-xs text-muted-foreground">
											Ya invitado
										</span>
									) : (
										<span className="text-xs text-primary">Invitar</span>
									)}
								</button>
							))}
						</div>
					)}

					{/* No results */}
					{query.trim() && !loading && results.length === 0 && (
						<div className="text-center py-4 text-sm text-muted-foreground">
							No se encontraron usuarios con "{query}"
						</div>
					)}

					{/* Existing participants info */}
					{existingParticipants.length > 0 && (
						<div className="text-xs text-muted-foreground">
							<p className="font-medium mb-1">Participantes actuales:</p>
							<div className="flex flex-wrap gap-1">
								{existingParticipants.map((p) => (
									<span
										key={p.id}
										className="px-2 py-0.5 bg-muted rounded-full text-xs"
									>
										{p.profile?.displayName || 'Usuario'}
										{p.status === 'pending' && ' (pendiente)'}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-end">
					<Button variant="outline" onClick={onClose} disabled={submitting}>
						Cancelar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}