require("dotenv").config();

const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const pool = require("./db");

const { requireAuth } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const organizationsRoutes = require("./routes/organizations");
const usersRoutes = require("./routes/users");
const employeesRoutes = require("./routes/employees");
const salariesRoutes = require("./routes/salaries");
const criteriaRoutes = require("./routes/criteria");
const relationRoutes = require("./routes/relation");
const historyRoutes = require("./routes/history");

// middleware
app.use(express.json());
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);
app.use(cookieParser());

// auth routes are public (login needs to work before you're logged in)
app.use("/payroll_app/auth", authRoutes);

// everything below this line requires a valid login
app.use(requireAuth);

app.use("/payroll_app/orgs", organizationsRoutes);
app.use("/payroll_app/users", usersRoutes);
app.use("/payroll_app/employees", employeesRoutes);
app.use("/payroll_app/salaries", salariesRoutes);
app.use("/payroll_app/criteria", criteriaRoutes);
app.use("/payroll_app/relation", relationRoutes);
app.use("/payroll_app/history", historyRoutes);

async function startServer() {
	try {
		// Direct relation entries no longer depend on the legacy criteria table.
		await pool.query(
			"ALTER TABLE relation ALTER COLUMN criteria_id DROP NOT NULL",
		);
		app.listen(5000, () => {
			console.log("server started on port 5000");
		});
	} catch (err) {
		console.error("Failed to prepare relation schema:", err.message);
		process.exitCode = 1;
	}
}

startServer();
