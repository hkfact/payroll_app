import { Fragment, useEffect, useState } from "react";
import { getSalaries, getSalaryBreakdown } from "../../api/client";

export default function EmployeePanel() {
	const [salary, setSalary] = useState(null);
	const [error, setError] = useState("");

	// Which row's details are open, and the fetched breakdown data per month —
	// cached so re-opening a row already viewed doesn't refetch.
	const [openMonth, setOpenMonth] = useState(null);
	const [breakdowns, setBreakdowns] = useState({});
	const [breakdownError, setBreakdownError] = useState("");

	useEffect(() => {
		getSalaries()
			.then((salaries) => setSalary(salaries || null))
			.catch((err) => setError(err.message));
	},[]);

	
	async function toggleDetails(salaryId) {
		if (openMonth === salaryId) {
			setOpenMonth(null);
			return;
		}

		setOpenMonth(salaryId);
		setBreakdownError("");

		if (!breakdowns[salaryId]) {
			try {
				const data = await getSalaryBreakdown(salaryId);
				setBreakdowns((prev) => ({ ...prev, [salaryId]: data }));
			} catch (err) {
				setBreakdownError(err.message);
			}
		}
	}

	if (error) return <p className="dashboard-error">{error}</p>;
	if (!salary) return <p className="dashboard-loading">Loading…</p>;

	return (
		<>
			<section className="panel">
				<h2>Current salary</h2>
				{salary.length > 0 ? (
					<div className="panel-stat-grid">
						<div className="panel-stat">
							<span>Base pay</span>
							<strong>${Number(salary[0].base_amount).toLocaleString()}</strong>
						</div>
						<div className="panel-stat">
							<span>Month</span>
							<strong>{new Date(salary[0].month).toLocaleDateString()}</strong>
						</div>
						<div className="panel-stat">
							<span>Received</span>
							<strong>{salary[0].received ? "Yes" : "No"}</strong>
						</div>
					</div>
				) : (
					<p className="dashboard-empty">No salary record yet.</p>
				)}
			</section>

			<section className="panel">
				<h2>Payout by month</h2>
				{salary.length === 0 ? (
					<p className="dashboard-empty">No salary on record yet.</p>
				) : (
					<table className="panel-table">
						<thead>
							<tr>
								<th>Month</th>
								<th>Base pay</th>
								<th>Days / Hours</th>
								<th>Additions</th>
								<th>Deductions</th>
								<th>Total</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{salary.map((m) => {
								const isOpen = openMonth === m.id;
								const breakdown = breakdowns[m.id];

								return (
									<Fragment key={m.id}>
										<tr>
											<td>{new Date(m.month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</td>
											<td>${Number(m.base_amount).toLocaleString()}</td>
											<td>{Number(m.attendance_counter).toLocaleString()}</td>
											<td>${Number(m.additions).toLocaleString()}</td>
											<td>${Number(m.deductions).toLocaleString()}</td>
											<td>${Number(m.net_pay).toLocaleString()}</td>
											<td>
												<button className="details-btn" onClick={() => toggleDetails(m.id)}>
													{isOpen ? "Hide" : "Details"}
												</button>
											</td>
										</tr>
										{isOpen && (
											<tr>
												<td colSpan={7} className="details-cell">
													{breakdownError && <p className="dashboard-error">{breakdownError}</p>}
													{!breakdown && !breakdownError && <p className="dashboard-loading">Loading details…</p>}
													{breakdown && (
														<>
															{breakdown.length === 0 ? (
																<p className="dashboard-empty">No bonuses or deductions this month.</p>
															) : (
																<table className="panel-subtable">
																	<thead>
																		<tr>
																			<th>Criterion</th>
																			<th>Type</th>
																			<th>Amount</th>
																		</tr>
																	</thead>
																	<tbody>
																		{breakdown.map((item) => (
																			<tr key={item.id}>
																				<td>{item.name}</td>
																				<td>{item.effect ? "Addition" : "Deduction"}</td>
																				<td>
																					{item.effect ? "+" : "−"}${Number(item.amount).toLocaleString()}
																				</td>
																			</tr>
																		))}
																	</tbody>
																</table>
															)}
															<div className="details-net-pay">
																<span>Net pay</span>
																<strong>${m.net_pay.toLocaleString()}</strong>
															</div>
														</>
													)}
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}
						</tbody>
					</table>
				)}
			</section>
		</>
	);
}