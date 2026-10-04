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

async function create(req, res) {
	const name = req.body?.name;
	if (typeof name !== "string" || !name.trim()) {
		return res.status(400).json({ error: "Organization name is required" });
	}

	try {
		const result = await pool.query(
			"INSERT INTO organizations (name) VALUES ($1) RETURNING *",
			[name.trim()],
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		console.error(err.message);
		if (err.code === "23505") {
			return res
				.status(409)
				.json({ error: "An organization with that name already exists" });
		}
		res.status(500).json({ error: "Could not create organization" });
	}
}

module.exports = { list, getById, create };
