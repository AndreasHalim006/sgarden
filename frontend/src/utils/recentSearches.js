const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

export const getRecentSearches = () => {
	try {
		const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
};

export const addRecentSearch = (query) => {
	if (!query || query.trim().length === 0) return;

	const recent = getRecentSearches();
	const filtered = recent.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
	const updated = [{ query: query.trim(), timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);

	try {
		window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
	} catch {
		// Silently fail if localStorage is unavailable
	}
};

export const clearRecentSearches = () => {
	try {
		window.localStorage.removeItem(RECENT_SEARCHES_KEY);
	} catch {
		// Silently fail if localStorage is unavailable
	}
};
