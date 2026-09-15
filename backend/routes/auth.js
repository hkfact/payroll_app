const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTIONS = {
	httpOnly: true,
	sameSite: "lax",
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res
				.status(400)
				.json({ error: "Email and password are required" });
		}

		const result = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email],
		);

		if (result.rows.length === 0) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const user = result.rows[0];
		const passwordMatches = await bcrypt.compare(
			password,
			user.password_hash,
		);

		if (!passwordMatches) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Everything the app needs for role/scope checks goes in the token,
		// since JWTs are stateless — no DB lookup needed on future requests.
		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
				org_id: user.org_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "7d" },
		);

		res.cookie("token", token, COOKIE_OPTIONS);

		res.status(200).json({
			user: {
				id: user.id,
				email: user.email,
				full_name: user.full_name,
				role: user.role,
				org_id: user.org_id,
			},
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Server error" });
	}
});

router.post("/logout", (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ message: "Logged out" });
});

// Lets the React app check "am I logged in, and as who" on page load/refresh.
router.get("/me", requireAuth, (req, res) => {
	res.status(200).json({ user: req.user });
});

module.exports = router;
