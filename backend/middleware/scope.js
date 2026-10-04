// These helpers turn "who is asking" into "what SQL WHERE clause they're allowed to see."
// Every route calls one of these instead of hand-writing role logic per-route.

// For tables scoped to a specific PERSON — salaries, relation, history (all have a
// user_id column), AND the users table itself (whose own identifying column is "id",
// not "user_id" — that's what idColumn is for).
function personScope(req, alias = "", idColumn = "user_id") {
	const col = alias ? `${alias}.` : "";
	switch (req.user.role) {
		case "super_admin":
			return { clause: "1=1", params: [] };
		case "admin":
		case "observer":
			// everyone in their own org
			return { clause: `${col}org_id = $1`, params: [req.user.org_id] };
		case "manager":
			// only employees whose manager_id points back to this manager
			return {
				clause: `${col}${idColumn} IN (SELECT id FROM users WHERE manager_id = $1)`,
				params: [req.user.id],
			};
		case "employee":
			// only their own row(s)
			return { clause: `${col}${idColumn} = $1`, params: [req.user.id] };
		default:
			return { clause: "1=0", params: [] }; // unknown role, allow nothing
	}
}

module.exports = { personScope };
