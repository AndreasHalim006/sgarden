import { Dialog, DialogContent, DialogTitle, TextField, Box, Typography, List, ListItem, ListItemButton, CircularProgress, IconButton, Divider } from "@mui/material";
import { Close, Search as SearchIcon } from "@mui/icons-material";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeStyles } from "@mui/styles";
import { searchGlobally, getCategoryLabel } from "../utils/globalSearch.js";
import { getRecentSearches, addRecentSearch } from "../utils/recentSearches.js";

const useStyles = makeStyles((theme) => ({
	dialog: {
		"& .MuiDialog-paper": {
			maxWidth: "600px",
			width: "90%",
		},
	},
	dialogTitle: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		paddingBottom: theme.spacing(1),
		borderBottom: `1px solid ${theme.palette.divider}`,
	},
	searchInput: {
		marginBottom: theme.spacing(2),
	},
	resultsContainer: {
		maxHeight: "400px",
		overflowY: "auto",
	},
	categoryHeader: {
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(1),
		fontSize: "0.875rem",
		fontWeight: 600,
		color: theme.palette.text.secondary,
		textTransform: "uppercase",
		letterSpacing: "0.5px",
	},
	resultItem: {
		paddingY: theme.spacing(1),
		"&:hover": {
			backgroundColor: theme.palette.action.hover,
		},
	},
	resultTitle: {
		fontWeight: 500,
		fontSize: "0.95rem",
	},
	resultSubtitle: {
		fontSize: "0.85rem",
		color: theme.palette.text.secondary,
	},
	noResults: {
		paddingY: theme.spacing(3),
		textAlign: "center",
		color: theme.palette.text.secondary,
	},
	recentSection: {
		paddingBottom: theme.spacing(2),
	},
	recentItem: {
		paddingY: theme.spacing(1),
		"&:hover": {
			backgroundColor: theme.palette.action.hover,
		},
	},
	centerContent: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		paddingY: theme.spacing(3),
	},
	closeButton: {
		marginLeft: theme.spacing(1),
	},
}));

const GlobalSearchDialog = ({ open, onClose, users = [], dashboards = [] }) => {
	const classes = useStyles();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState({ users: [], dashboards: [] });
	const [isSearching, setIsSearching] = useState(false);
	const [recentSearches, setRecentSearches] = useState([]);

	// Load recent searches on mount or when dialog opens
	useEffect(() => {
		if (open) {
			setRecentSearches(getRecentSearches());
			setQuery("");
			setResults({ users: [], dashboards: [] });
		}
	}, [open]);

	// Perform search
	useEffect(() => {
		const performSearch = async () => {
			if (!query.trim()) {
				setResults({ users: [], dashboards: [] });
				return;
			}

			setIsSearching(true);
			try {
				const searchResults = await searchGlobally(query, { users, dashboards });
				setResults(searchResults);
			} catch (error) {
				console.error("Search error:", error);
				setResults({ users: [], dashboards: [] });
			}
			setIsSearching(false);
		};

		const debounceTimer = setTimeout(performSearch, 300);
		return () => clearTimeout(debounceTimer);
	}, [query, users, dashboards]);

	const handleResultClick = useCallback((result) => {
		addRecentSearch(query);
		onClose();
		navigate(result.path);
	}, [query, navigate, onClose]);

	const handleRecentClick = useCallback((recentQuery) => {
		setQuery(recentQuery.query);
	}, []);

	const hasResults = useMemo(() => {
		return results.users.length > 0 || results.dashboards.length > 0;
	}, [results]);

	const isLoading = useMemo(() => {
		return query.trim().length > 0 && isSearching;
	}, [query, isSearching]);

	const showRecent = useMemo(() => {
		return !query.trim() && recentSearches.length > 0;
	}, [query, recentSearches]);

	return (
		<Dialog
			id="global-search-dialog"
			open={open}
			onClose={onClose}
			className={classes.dialog}
		>
			<DialogTitle className={classes.dialogTitle}>
				<SearchIcon sx={{ marginRight: 1, opacity: 0.7 }} />
				<span>Search</span>
				<IconButton
					id="global-search-close"
					size="small"
					onClick={onClose}
					className={classes.closeButton}
				>
					<Close fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<TextField
					id="global-search-input"
					fullWidth
					placeholder="Search users, dashboards..."
					variant="outlined"
					size="small"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className={classes.searchInput}
					autoFocus
					InputProps={{
						startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.5 }} />,
					}}
				/>

				<Box id="global-search-results" className={classes.resultsContainer}>
					{isLoading && (
						<Box className={classes.centerContent}>
							<CircularProgress size={40} />
						</Box>
					)}

					{!isLoading && !hasResults && !showRecent && query.trim() && (
						<Box id="global-search-no-results" className={classes.noResults}>
							<Typography>No results found for "{query}"</Typography>
						</Box>
					)}

					{!isLoading && showRecent && (
						<Box id="global-search-recent" className={classes.recentSection}>
							<Typography variant="subtitle2" className={classes.categoryHeader}>
								Recent Searches
							</Typography>
							<List disablePadding>
								{recentSearches.map((item, index) => (
									<ListItem
										key={`recent-${index}`}
										id={`global-search-recent-item-${index}`}
										disablePadding
									>
										<ListItemButton
											onClick={() => handleRecentClick(item)}
											className={classes.recentItem}
										>
											<Typography className={classes.resultTitle}>
												{item.query}
											</Typography>
										</ListItemButton>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{!isLoading && hasResults && (
						<>
							{results.users.length > 0 && (
								<>
									<Typography
										id="global-search-category-users"
										variant="subtitle2"
										className={classes.categoryHeader}
									>
										{getCategoryLabel("users")}
									</Typography>
									<List disablePadding>
										{results.users.map((result) => (
											<ListItem
												key={`user-${result.id}`}
												id={`global-search-result-${result.id}`}
												disablePadding
											>
												<ListItemButton
													onClick={() => handleResultClick(result)}
													className={classes.resultItem}
												>
													<Box sx={{ width: "100%" }}>
														<Typography
															id={`global-search-result-title-${result.id}`}
															className={classes.resultTitle}
														>
															{result.title}
														</Typography>
														<Typography className={classes.resultSubtitle}>
															{result.subtitle}
														</Typography>
													</Box>
												</ListItemButton>
											</ListItem>
										))}
									</List>
									{results.dashboards.length > 0 && <Divider sx={{ my: 1 }} />}
								</>
							)}

							{results.dashboards.length > 0 && (
								<>
									<Typography
										id="global-search-category-dashboards"
										variant="subtitle2"
										className={classes.categoryHeader}
									>
										{getCategoryLabel("dashboards")}
									</Typography>
									<List disablePadding>
										{results.dashboards.map((result) => (
											<ListItem
												key={`dashboard-${result.id}`}
												id={`global-search-result-${result.id}`}
												disablePadding
											>
												<ListItemButton
													onClick={() => handleResultClick(result)}
													className={classes.resultItem}
												>
													<Box sx={{ width: "100%" }}>
														<Typography
															id={`global-search-result-title-${result.id}`}
															className={classes.resultTitle}
														>
															{result.title}
														</Typography>
														<Typography className={classes.resultSubtitle}>
															{result.subtitle}
														</Typography>
													</Box>
												</ListItemButton>
											</ListItem>
										))}
									</List>
								</>
							)}
						</>
					)}
				</Box>
			</DialogContent>
		</Dialog>
	);
};

export default memo(GlobalSearchDialog);
