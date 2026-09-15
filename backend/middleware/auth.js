const jwt = require("jsonwebtoken");

// Verifies the JWT cookie exists and is valid.
// On success, attaches req.user = { id, email, role, org_id } for every route after this one.
function requireAuth(req, res, next) {
	const token = req.cookies.token;

	if (!token) {
		return res.status(401).json({ error: "Not logged in" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // { id, email, role, org_id }
		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
}

// Factory function: requireRole('admin', 'super_admin') returns a middleware
// that only lets those specific roles through. Must run AFTER requireAuth,
// since it depends on req.user already being set.
function requireRole(...allowedRoles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: "Not logged in" });
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res
				.status(403)
				.json({ error: "You don't have permission to do this" });
		}

		next();
	};
}

module.exports = { requireAuth, requireRole };
