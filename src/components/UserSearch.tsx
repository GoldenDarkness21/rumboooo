import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, User, Loader2 } from 'lucide-react';
import { invitationsService, type SearchableProfile } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserSearchProps {
	onUserSelect: (user: SearchableProfile) => void;
	selectedUsers: SearchableProfile[];
	onRemoveUser: (userId: string) => void;
	placeholder?: string;
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

export function UserSearch({
	onUserSelect,
	selectedUsers,
	onRemoveUser,
	placeholder = 'Buscar usuarios por nombre o email...',
}: UserSearchProps) {
	const { user: currentUser } = useAuth();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchableProfile[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const debouncedQuery = useDebounce(query, 300);

	// Search users when debounced query changes
	const searchUsers = useCallback(async (searchTerm: string) => {
		if (!searchTerm.trim() || !currentUser) {
			setResults([]);
			return;
		}

		setLoading(true);
		try {
			const users = await invitationsService.searchUsers(
				searchTerm,
				currentUser.id,
				8
			);
			// Filter out already selected users
			const filtered = users.filter(
				(u) => !selectedUsers.some((s) => s.id === u.id)
			);
			setResults(filtered);
			setIsOpen(filtered.length > 0);
		} catch (error) {
			console.error('Error searching users:', error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	}, [currentUser, selectedUsers]);

	useEffect(() => {
		searchUsers(debouncedQuery);
	}, [debouncedQuery, searchUsers]);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSelectUser = (user: SearchableProfile) => {
		onUserSelect(user);
		setQuery('');
		setResults([]);
		setIsOpen(false);
	};

	const isUserSelected = (userId: string) =>
		selectedUsers.some((u) => u.id === userId);

	return (
		<div className="space-y-3" ref={containerRef}>
			{/* Selected users chips */}
			{selectedUsers.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedUsers.map((user) => (
						<div
							key={user.id}
							className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm"
						>
							<div className="flex items-center gap-2">
								{user.avatarUrl ? (
									<img
										src={user.avatarUrl}
										alt={user.displayName}
										className="w-5 h-5 rounded-full"
									/>
								) : (
									<User className="w-4 h-4 text-primary" />
								)}
								<span className="font-medium">{user.displayName}</span>
							</div>
							<button
								onClick={() => onRemoveUser(user.id)}
								className="text-muted-foreground hover:text-destructive transition-colors"
								type="button"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Search input */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder={placeholder}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
					className="pl-9 pr-9 h-11 rounded-lg"
				/>
				{loading && (
					<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
				)}
				{query && !loading && (
					<button
						onClick={() => {
							setQuery('');
							setResults([]);
							setIsOpen(false);
						}}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						type="button"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Search results dropdown */}
			{isOpen && results.length > 0 && (
				<div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
					{results.map((user) => (
						<button
							key={user.id}
							onClick={() => handleSelectUser(user)}
							className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
							type="button"
						>
							{user.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt={user.displayName}
									className="w-8 h-8 rounded-full"
								/>
							) : (
								<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
									<User className="w-4 h-4 text-primary" />
								</div>
							)}
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">
									{user.displayName}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{user.email}
								</p>
							</div>
							{isUserSelected(user.id) && (
								<span className="text-xs text-primary font-medium">
									Agregado
								</span>
							)}
						</button>
					))}
				</div>
			)}

			{/* No results message */}
			{query.trim() && !loading && results.length === 0 && isOpen && (
				<div className="text-center py-4 text-sm text-muted-foreground">
					No se encontraron usuarios con "{query}"
				</div>
			)}
		</div>
	);
}