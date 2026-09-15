import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Handles "/" — there's nothing to actually show at the root, it just decides
// where to send the visitor based on whether a session exists.
export default function RootRedirect() {
	const { user, loading } = useAuth();

	// Still waiting on the initial /me check — same reasoning as RequireAuth/
	// RequireGuest: don't guess before we actually know.
	if (loading) return null;

	return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}
