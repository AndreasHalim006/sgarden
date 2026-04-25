import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Route, Routes, BrowserRouter as Router, useLocation } from "react-router-dom";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ErrorBoundary } from "react-error-boundary";
import { CssBaseline } from "@mui/material";

import "./index.scss";
import colors from "./_colors.scss";
import "react-table-6/react-table.css";
import Header from "./components/Header.js";
import Footer from "./components/Footer.js";
import AdminOnly from "./components/AdminOnly.js";
import Protected from "./components/Protected.js";
import GuestOnly from "./components/GuestOnly.js";
import ErrorFallback from "./components/ErrorFallback.js";
import Snackbar from "./components/Snackbar.js";
import NotFound from "./screens/NotFound.js";
import SignIn from "./screens/SignIn.js";
import ForgotPassword from "./screens/ForgotPassword.js";
import ResetPassword from "./screens/ResetPassword.js";
import SignUp from "./screens/SignUp.js";
import InvitedSignUp from "./screens/InvitedSignUp.js";
import Auth from "./screens/Auth.js";
import Users from "./screens/Users.js";
import Dashboard from "./screens/Dashboard.js";
import Dashboard1 from "./screens/Dashboard1.js";
import Dashboard2 from "./screens/Dashboard2.js";
import { adjustColors, jwt, colorSuggestions } from "./utils/index.js";
import Map from "./components/Map.js";

const getInitialMode = () => {
	const storedMode = window.localStorage.getItem("themeMode");
	return storedMode === "dark" || storedMode === "light" ? storedMode : "light";
};

const App = () => {
	const location = useLocation();
	const [authenticated, setAuthenticated] = useState(false);
	const [mode, setMode] = useState(() => getInitialMode());

	useEffect(() => {
		setAuthenticated(jwt.isAuthenticated());
	}, [location]);

	useEffect(() => {
		window.localStorage.setItem("themeMode", mode);
		document.body.classList.toggle("dark-mode", mode === "dark");
	}, [mode]);

	const toggleColorMode = () => setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));

	const theme = useMemo(() => createTheme({
		palette: {
			mode,
			primary: { main: colors.primary },
			secondary: { main: colors.secondary || colorSuggestions.secondary },
			third: { main: colors.third || colorSuggestions.third },

			primaryLight: { main: adjustColors(colors.primary, 100) },
			primaryDark: { main: adjustColors(colors.primary, -80) },
			secondaryLight: { main: adjustColors(colors.secondary || colorSuggestions.secondary, 100) },
			secondaryDark: { main: adjustColors(colors.secondary || colorSuggestions.secondary, -80) },
			thirdLight: { main: adjustColors(colors.third || colorSuggestions.third, 100) },
			thirdDark: { main: adjustColors(colors.third || colorSuggestions.third, -80) },

			success: { main: colors.success },
			error: { main: colors.error },
			warning: { main: colors.warning },
			info: { main: colors.info },

			dark: { main: colors.dark },
			light: { main: colors.light },
			grey: { main: colors.grey },
			greyDark: { main: colors.greyDark },
			green: { main: colors.green },
			white: { main: "#ffffff" },
			background: {
				default: mode === "dark" ? "#121212" : "#ffffff",
				paper: mode === "dark" ? "#1f1f1f" : "#ffffff",
			},
			text: {
				primary: mode === "dark" ? "#f5f5f5" : "#000000",
				secondary: mode === "dark" ? "#cfcfcf" : "#4f4f4f",
			},
		},
	}), [mode]);

	return (
		<StyledEngineProvider injectFirst>
			<CssBaseline />
			<ThemeProvider theme={theme}>
				<ErrorBoundary FallbackComponent={ErrorFallback}>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<Header isAuthenticated={authenticated} mode={mode} toggleColorMode={toggleColorMode} />
						<main style={{ position: "relative", zIndex: 0, height: `calc(100vh - ${authenticated ? "160" : "70"}px)` }}>
							<Routes>
								<Route index element={<GuestOnly c={<SignIn />} />} />
								<Route path="auth" element={<GuestOnly c={<Auth />} />} />
								<Route path="forgot-password" element={<GuestOnly c={<ForgotPassword />} />} />
								<Route path="reset-password" element={<GuestOnly c={<ResetPassword />} />} />
								<Route path="sign-up" element={<GuestOnly c={<SignUp />} />} />
								<Route path="register" element={<GuestOnly c={<InvitedSignUp />} />} />
								<Route path="users" element={<AdminOnly c={<Users />} />} />
								<Route path="dashboard" element={<Protected c={<Dashboard />} />} />
								<Route path="dashboard1" element={<Protected c={<Dashboard1 />} />} />
								<Route path="dashboard2" element={<Protected c={<Dashboard2 />} />} />
								<Route path="map" element={<Protected c={<Map />} />} />
								<Route path="*" element={<NotFound />} />
							</Routes>
						</main>
						{authenticated && <Footer /> }
						<Snackbar />
					</LocalizationProvider>
				</ErrorBoundary>
			</ThemeProvider>
		</StyledEngineProvider>
	);
};

const root = ReactDOM.createRoot(document.querySelector("#root"));
root.render(
	<Router>
		<App />
	</Router>,
);
