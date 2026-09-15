import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap routes that should only be reachable when logged OUT (e.g. /login).
// If a session already exists, skip straight to the dashboard instead of
// showing the login form again.
export default function RequireGuest({ children }) {
	const { user, loading } = useAuth();

	// Still waiting on the initial /me check — render nothing rather than
	// briefly flashing the login form before we actually know the answer.
	if (loading) return null;

	if (user) {
		return <Navigate to="/dashboard" replace />;
	}

	return children;
}
