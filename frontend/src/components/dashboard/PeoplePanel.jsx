import { useEffect, useState } from "react";
import { getEmployees, getSalaries } from "../../api/client";

export default function PeoplePanel({ scopeLabel }) {
	const [rows, setRows] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		Promise.all([getEmployees(), getSalaries()])
			.then(([employees, salaries]) => {
				// Salaries are returned most-recent-id-first (see salaries.controller.js),
				// so the first match per user_id is their current record. This is a
				// stand-in until utils/payCalculator.js exists — no net pay here yet,
				// just the raw base_amount straight off the salaries row.
				const salaryByUser = {};
				for (const s of salaries) {
					if (!(s.user_id in salaryByUser))
						salaryByUser[s.user_id] = s;
				}

				setRows(
					employees.map((emp) => ({
						...emp,
						salary: salaryByUser[emp.id] || null,
					})),
				);
			})
			.catch((err) => setError(err.message));
	}, []);

	if (error) return <p className="dashboard-error">{error}</p>;
	if (!rows) return <p className="dashboard-loading">Loading…</p>;

	return (
		<section className="panel">
			<h2>Employees — {scopeLabel}</h2>
			{rows.length === 0 ? (
				<p className="dashboard-empty">No employees to show.</p>
			) : (
				<table className="panel-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Base pay</th>
							<th>Month</th>
							<th>Received</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((emp) => (
							<tr key={emp.id}>
								<td>{emp.full_name}</td>
								<td>{emp.email}</td>
								<td>
									{emp.salary
										? `$${Number(emp.salary.base_amount).toLocaleString()}`
										: "—"}
								</td>
								<td>
									{emp.salary
										? new Date(
												emp.salary.month,
											).toLocaleDateString("en-GB")
										: "—"}
								</td>
								<td>
									{emp.salary
										? emp.salary.received
											? "Yes"
											: "No"
										: "—"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<p className="panel-note">
				Base pay only — additions/deductions from criteria aren't
				factored into this figure yet.
			</p>
		</section>
	);
}
