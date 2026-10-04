const pool = require("../db");
const bcrypt = require("bcrypt");
const { personScope } = require("../middleware/scope");

// Explicit column list everywhere here on purpose — never SELECT * on users,
// so password_hash can never accidentally leak into a response.
const SAFE_COLUMNS = "id, email, full_name, role, org_id, manager_id";

// IMPORTANT: this table's own identifying column is "id", not "user_id" —
// personScope defaults to "user_id" (correct for salaries/relation/history),
// so every call here must explicitly override it.
const ID_COLUMN = "id";

async function list(req, res) {
	try {
		const { clause, params } = personScope(req, "", ID_COLUMN);
		const result = await pool.query(
			`SELECT ${SAFE_COLUMNS} FROM users WHERE ${clause} ORDER BY id DESC`,
			params,
		);
		res.status(200).json(result.rows);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

async function getById(req, res) {
	try {
		const { id } = req.params;
		const { clause, params } = personScope(req, "", ID_COLUMN);
		const result = await pool.query(
			`SELECT ${SAFE_COLUMNS} FROM users WHERE id = $${params.length + 1} AND ${clause}`,
			[...params, id],
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "requested item(s) not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

async function listEmployees(req, res) {
	try {
		const { clause, params } = personScope(req, "", ID_COLUMN);
		const result = await pool.query(
			`SELECT ${SAFE_COLUMNS} FROM users WHERE role = 'employee' AND ${clause} ORDER BY id DESC`,
			params,
		);
		res.status(200).json(result.rows);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

async function getEmployeeById(req, res) {
	try {
		const { id } = req.params;
		const { clause, params } = personScope(req, "", ID_COLUMN);
		const result = await pool.query(
			`SELECT ${SAFE_COLUMNS} FROM users WHERE id = $${params.length + 1} AND role = 'employee' AND ${clause}`,
			[...params, id],
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "requested item(s) not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

async function create(req, res) {
	const targetRoleByRole = {
		manager: "employee",
		admin: "manager",
		super_admin: "admin",
	};
	const role = targetRoleByRole[req.user.role];

	if (!role || req.body.role !== role) {
		return res.status(403).json({
			error: "You don't have permission to create this type of user",
		});
	}

	const { email, full_name, password } = req.body || {};
	if (
		typeof email !== "string" ||
		!email.trim() ||
		typeof full_name !== "string" ||
		!full_name.trim() ||
		typeof password !== "string" ||
		password.length < 8
	) {
		return res.status(400).json({
			error: "Name, email, and a password of at least 8 characters are required",
		});
	}

	const orgId =
		req.user.role === "super_admin" ? req.body.org_id : req.user.org_id;
	const managerId = req.user.role === "manager" ? req.user.id : null;

	if (!Number.isInteger(Number(orgId)) || Number(orgId) < 1) {
		return res.status(400).json({ error: "An organization is required" });
	}

	try {
		const passwordHash = await bcrypt.hash(password, 12);
		const result = await pool.query(
			`INSERT INTO users (email, full_name, password_hash, role, org_id, manager_id)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING ${SAFE_COLUMNS}`,
			[
				email.trim(),
				full_name.trim(),
				passwordHash,
				role,
				orgId,
				managerId,
			],
		);

		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		if (err.code === "23505") {
			return res
				.status(409)
				.json({ error: "That email is already in use" });
		}
		if (err.code === "23503") {
			return res.status(400).json({
				error: "The selected organization does not exist",
			});
		}
		res.status(500).json({ error: "Could not create user" });
	}
}

async function remove(req, res) {
	const targetRoleByRole = {
		manager: "employee",
		admin: "manager",
		super_admin: "admin",
	};
	const targetRole = targetRoleByRole[req.user.role];

	if (!targetRole) {
		return res
			.status(403)
			.json({ error: "You don't have permission to delete users" });
	}

	try {
		const client = await pool.connect();
		let result;
		try {
			await client.query("BEGIN");
			if (targetRole === "manager") {
				await client.query(
					"UPDATE users SET manager_id = NULL WHERE manager_id = $1",
					[req.params.id],
				);
			}
			const scope =
				req.user.role === "manager"
					? { clause: "manager_id = $3", params: [req.user.id] }
					: req.user.role === "admin"
						? { clause: "org_id = $3", params: [req.user.org_id] }
						: { clause: "1=1", params: [] };
			result = await client.query(
				`DELETE FROM users WHERE id = $1 AND role = $2 AND ${scope.clause} RETURNING id`,
				[req.params.id, targetRole, ...scope.params],
			);

			if (result.rows.length === 0) {
				await client.query("ROLLBACK");
				return res
					.status(404)
					.json({ error: `requested ${targetRole} not found` });
			}
			await client.query("COMMIT");
		} catch (err) {
			await client.query("ROLLBACK");
			throw err;
		} finally {
			client.release();
		}

		res.status(204).end();
	} catch (err) {
		console.error(err.message);
		if (err.code === "23503") {
			return res.status(409).json({
				error: "User cannot be deleted while payroll records still reference them",
			});
		}
		res.status(500).json({ error: "Could not delete user" });
	}
}

module.exports = {
	list,
	getById,
	listEmployees,
	getEmployeeById,
	create,
	remove,
};
