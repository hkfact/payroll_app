const pool = require("../db");

async function list(req, res) {
	try {
		const result = await pool.query(
			"SELECT * FROM organizations ORDER BY id DESC",
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
		const result = await pool.query(
			"SELECT * FROM organizations WHERE id = $1",
			[id],
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
