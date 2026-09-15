const pool = require("../db");
const { personScope } = require("../middleware/scope");

async function list(req, res) {
	try {
		const { clause, params } = personScope(req);
		const result = await pool.query(
			`SELECT * FROM history WHERE ${clause} ORDER BY id DESC`,
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
			`SELECT * FROM history WHERE id = $${params.length + 1} AND ${clause}`,
			[...params, id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "requested item(s) not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
}

module.exports = { list, getById };
