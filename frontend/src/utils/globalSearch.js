import isFuzzyMatch from "./is-fuzzy-match.js";
import jwt from "./jwt.js";

const RESULTS_LIMIT_PER_CATEGORY = 8;

export const searchGlobally = async (query, { users = [], dashboards = [] }) => {
	if (!query || query.trim().length === 0) {
		return { users: [], dashboards: [] };
	}

	const results = {
		users: [],
		dashboards: [],
	};

	// Search users (admin-only)
	if (jwt.decode()?.role === "admin") {
		results.users = users
			.filter((user) => isFuzzyMatch(user.username, query) || isFuzzyMatch(user.email, query))
			.slice(0, RESULTS_LIMIT_PER_CATEGORY)
			.map((user) => ({
				id: user.id,
				title: user.username,
				subtitle: user.email,
				type: "users",
				path: "/users",
			}));
	}

	// Search dashboards
	results.dashboards = dashboards
		.filter((dash) => isFuzzyMatch(dash.name, query))
		.slice(0, RESULTS_LIMIT_PER_CATEGORY)
		.map((dash) => ({
			id: dash.id || dash.name,
			title: dash.name,
			subtitle: dash.description || "Dashboard",
			type: "dashboards",
			path: `/dashboard${dash.name === "Main" ? "" : dash.id ? "" : ""}`,
		}));

	return results;
};

export const getCategoryLabel = (category) => {
	const labels = {
		users: "Users",
		dashboards: "Dashboards",
		maps: "Maps",
	};
	return labels[category] || category;
};
