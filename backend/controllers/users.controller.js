const pool = require("../db");
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

async function remove(req, res) {
	try {
		const { clause, params } = personScope(req, "", ID_COLUMN);
		const shiftedClause = clause.replace(
			/\$(\d+)/g,
			(_, n) => `$${Number(n) + 1}`,
		);
		const result = await pool.query(
			`DELETE FROM users WHERE id = $1 AND role = 'employee' AND ${shiftedClause} RETURNING id`,
			[req.params.id, ...params],
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "requested employee not found" });
		}

		res.status(204).end();
	} catch (err) {
		console.error(err.message);
		res.status(409).json({
			error: "Employee cannot be removed while records still reference them",
		});
	}
}

module.exports = { list, getById, listEmployees, getEmployeeById, remove };
