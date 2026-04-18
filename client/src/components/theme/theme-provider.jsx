import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const THEME_STORAGE_KEY = "prep-hub-theme";
const ThemeContext = createContext(null);

function getPreferredTheme() {
	if (typeof window === "undefined") {
		return "light";
	}

	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (storedTheme === "light" || storedTheme === "dark") {
		return storedTheme;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme) {
	if (typeof document === "undefined") {
		return;
	}

	const root = document.documentElement;
	root.classList.toggle("dark", theme === "dark");
	root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState(getPreferredTheme);

	useEffect(() => {
		applyTheme(theme);
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	}, [theme]);

	const value = useMemo(
		() => ({
			theme,
			isDark: theme === "dark",
			setTheme,
			toggleTheme: () =>
				setTheme((currentTheme) =>
					currentTheme === "dark" ? "light" : "dark"
				),
		}),
		[theme]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider.");
	}

	return context;
}

