const pool = require("../db");
const { personScope } = require("../middleware/scope");

async function list(req, res) {
	try {
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`SELECT * FROM relation WHERE ${clause} ORDER BY id DESC`,
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
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`SELECT * FROM relation WHERE id = $${params.length + 1} AND ${clause}`,
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
	try {
		const { salary_id, name, effect, amount, monthly } = req.body;
		const { clause, params } = personScope(req, "s", "user_id");
		const result = await pool.query(
			`INSERT INTO relation (salary_id, user_id, org_id, name, effect, amount, monthly)
			 SELECT s.id, s.user_id, s.org_id, $2, $3, $4, $5
			 FROM salaries s
			 WHERE s.id = $1
			 AND ${clause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 5}`)}
			 RETURNING *`,
			[
				salary_id,
				name,
				Boolean(effect),
				amount,
				Boolean(monthly),
				...params,
			],
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "requested salary not found" });
		}

		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(400).json({ error: "Invalid breakdown data" });
	}
}

async function update(req, res) {
	try {
		const { name, effect, amount, monthly } = req.body;
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`UPDATE relation SET name = $1, effect = $2, amount = $3, monthly = $4
			 WHERE id = $5
			 AND ${clause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 5}`)}
			 RETURNING *`,
			[
				name,
				Boolean(effect),
				amount,
				Boolean(monthly),
				req.params.id,
				...params,
			],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "requested item not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(400).json({ error: "Invalid breakdown data" });
	}
}

async function remove(req, res) {
	try {
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`DELETE FROM relation WHERE id = $${params.length + 1} AND ${clause} RETURNING id`,
			[...params, req.params.id],
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

module.exports = { list, getById, create, update, remove };
