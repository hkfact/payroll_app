import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true); // true while checking for an existing session

	// On first load, ask the backend "am I already logged in?" — this is what
	// keeps someone logged in across a page refresh, since the cookie already
	// exists in the browser even though React's state just reset.
	useEffect(() => {
		api.getMe()
			.then((data) => setUser(data.user))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	async function login(email, password) {
		const data = await api.login(email, password);
		setUser(data.user);
		return data.user;
	}

	async function logout() {
		await api.logout();
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
	return ctx;
}
