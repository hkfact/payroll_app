import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap routes that require a logged-in user (e.g. /dashboard).
// If there's no valid session, redirect to /login instead of rendering
// a page that assumes `user` exists.
export default function RequireAuth({ children }) {
	const { user, loading } = useAuth();

	// Still waiting on the initial /me check — render nothing rather than
	// bouncing to /login before we actually know whether a session exists.
	// This is what makes a page refresh on /dashboard work correctly instead
	// of flashing the login page for a logged-in user.
	if (loading) return null;

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return children;
}
