const pool = require("../db");
const { personScope } = require("../middleware/scope");

async function list(req, res) {
	try {
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`SELECT s.*
			 FROM salaries s WHERE ${clause.replace(/\b(user_id|org_id)\b/g, "s.$1")}
			 ORDER BY s.id DESC`,
			params,
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "requested item(s) not found" });
		}

		res.status(200).json(result.rows);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

async function getById(req, res) {
	try {
		const { id } = req.params;
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`SELECT s.*
			 FROM salaries s
			 WHERE s.id = $${params.length + 1}
			 AND ${clause.replace(/\b(user_id|org_id)\b/g, "s.$1")}`,
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

async function getBreakdown(req, res) {
	try {
		const salaryId = parseInt(req.params.salaryId, 10);
		if (!Number.isInteger(salaryId)) {
			return res.status(400).json({ error: "Invalid salary id" });
		}

		const { clause, params } = personScope(req, "c");

		const breakdown = (
			await pool.query(
				`SELECT c.* FROM criteria c
				 WHERE c.salary_id = $${params.length + 1} AND ${clause}`,
				[...params, salaryId],
			)
		).rows;

		res.status(200).json(breakdown);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

async function create(req, res) {
	try {
		const { user_id, month, base_amount, attendance_counter, received } =
			req.body;
		const normalizedMonth =
			typeof month === "string" && /^\d{4}-\d{2}$/.test(month)
				? `${month}-01`
				: month;
		const { clause, params } = personScope(req, "u", "id");
		const result = await pool.query(
			`INSERT INTO salaries (user_id, org_id, month, base_amount, attendance_counter, received)
			 SELECT u.id, u.org_id, $2, $3, $4, $5
			 FROM users u
			 WHERE u.id = $1 AND ${clause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 5}`)}
			 RETURNING *`,
			[
				user_id,
				normalizedMonth,
				base_amount,
				attendance_counter,
				Boolean(received),
				...params,
			],
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "requested employee not found" });
		}

		const saved = await pool.query(
			`SELECT s.* FROM salaries s WHERE s.id = $1`,
			[result.rows[0].id],
		);
		res.status(201).json(saved.rows[0]);
	} catch (err) {
		console.error(err.message);
		if (err.code === "23505") {
			return res.status(409).json({
				error: "A salary already exists for this user and month",
			});
		}
		res.status(400).json({ error: "Invalid salary data" });
	}
}

async function update(req, res) {
	try {
		console.log("called");
		console.log("Update request body:", req.body);
		const salaryId = parseInt(req.params.id, 10);

		if (!Number.isInteger(salaryId)) {
			return res.status(400).json({ error: "Invalid salary id" });
		}

		const allowedFields = {
			base_amount: "base_amount",
			attendance_counter: "attendance_counter",
			received: "received",
		};

		const updates = [];
		const params = [];
		let paramIndex = 1;

		for (const [field, value] of Object.entries(req.body)) {
			if (!Object.prototype.hasOwnProperty.call(allowedFields, field)) {
				return res.status(400).json({
					error: `Field '${field}' cannot be modified`,
				});
			}

			updates.push(`${allowedFields[field]} = $${paramIndex}`);
			params.push(value);
			paramIndex += 1;
		}

		if (updates.length === 0) {
			return res.status(400).json({
				error: "No valid fields provided for update",
			});
		}

		const { clause, params: scopeParams } = personScope(req);
		const shiftedClause = clause.replace(
			/\$(\d+)/g,
			(_, n) => `$${Number(n) + params.length}`,
		);
		const idParam = params.length + scopeParams.length + 1;

		const result = await pool.query(
			`
			UPDATE salaries
			SET ${updates.join(", ")}
			WHERE id = $${idParam}
			  AND ${shiftedClause}
			RETURNING *;
			`,
			[...params, ...scopeParams, salaryId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				error: "requested item not found",
			});
		}

		const saved = await pool.query(
			`SELECT s.* FROM salaries s WHERE s.id = $1`,
			[result.rows[0].id],
		);
		return res.status(200).json(saved.rows[0]);
	} catch (err) {
		console.error(err);

		// PostgreSQL unique constraint violation
		if (err.code === "23505") {
			return res.status(409).json({
				error: "A salary already exists for this user and month",
			});
		}

		// PostgreSQL check / invalid data errors
		if (
			err.code === "22P02" ||
			err.code === "22003" ||
			err.code === "22007"
		) {
			return res.status(400).json({
				error: "Invalid salary data",
			});
		}

		res.status(500).json({ error: "Server error" });
	}
}

async function remove(req, res) {
	try {
		const salaryId = parseInt(req.params.id, 10);
		if (!Number.isInteger(salaryId)) {
			return res.status(400).json({ error: "Invalid salary id" });
		}

		const { clause, params } = personScope(req);
		const result = await pool.query(
			`DELETE FROM salaries WHERE id = $${params.length + 1} AND ${clause} RETURNING id`,
			[...params, salaryId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "requested item not found" });
		}

		res.status(204).end();
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

module.exports = { list, getById, getBreakdown, create, update, remove };
