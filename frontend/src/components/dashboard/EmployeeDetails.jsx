import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
	getSalaries,
	getSalaryBreakdown,
	getUserById,
	createSalary,
	deleteSalary,
	createBreakdown,
	deleteBreakdown,
} from "../../api/client";
import Salaries from "../Helper/Salaries";
import "../../css/Dashboard.css";

export default function EmployeeDetails() {
	const id = Number(useParams().id);

	const [user, setUser] = useState(null);
	const [salaries, setSalaries] = useState([]);
	const [error, setError] = useState("");

	const [openMonth, setOpenMonth] = useState(null);
	const [breakdowns, setBreakdowns] = useState({});
	const [breakdownErrors, setBreakdownErrors] = useState({});

	useEffect(() => {
		getSalaries()
			.then((data) => {
				const filtered = data?.filter(
					(salary) => salary.user_id === id,
				);

				setSalaries(filtered || []);
			})
			.catch((err) => setError(err.message));

		getUserById(id)
			.then((data) => setUser(data))
			.catch((err) => setError(err.message));
	}, [id]);

	async function toggleDetails(salaryId) {
		if (openMonth === salaryId) {
			setOpenMonth(null);
			return;
		}

		setOpenMonth(salaryId);

		if (breakdowns[salaryId]) {
			return;
		}

		try {
			const data = await getSalaryBreakdown(salaryId);

			setBreakdowns((prev) => ({
				...prev,
				[salaryId]: data,
			}));
		} catch (err) {
			setBreakdownErrors((prev) => ({
				...prev,
				[salaryId]: err.message,
			}));
		}
	}

	async function handleUpdateSalary(updatedSalary) {
		setSalaries((prev) =>
			prev.map((salary) =>
				salary.id === updatedSalary.id ? updatedSalary : salary,
			),
		);
	}

	async function handleAddSalary(newSalary) {
		try {
			const savedSalary = await createSalary({
				...newSalary,
				user_id: id,
			});
			setSalaries((prev) => [savedSalary, ...prev]);
		} catch (err) {
			setError(err.message);
		}
	}

	async function handleDeleteSalary(salary) {
		try {
			await deleteSalary(salary.id);
			setSalaries((prev) => prev.filter((item) => item.id !== salary.id));
			setOpenMonth((current) => (current === salary.id ? null : current));
		} catch (err) {
			setError(err.message);
		}
	}

	async function refreshSalary(salaryId) {
		try {
			const data = await getSalaries();
			const refreshedSalary = data.find(
				(salary) => salary.id === salaryId,
			);
			if (refreshedSalary) {
				setSalaries((prev) =>
					prev.map((salary) =>
						salary.id === salaryId ? refreshedSalary : salary,
					),
				);
			}
		} catch (err) {
			setError(err.message);
		}
	}

	async function handleAddBreakdown(salaryId, item) {
		try {
			const savedItem = await createBreakdown({
				...item,
				salary_id: salaryId,
			});
			setBreakdowns((prev) => ({
				...prev,
				[salaryId]: [savedItem, ...(prev[salaryId] || [])],
			}));
			await refreshSalary(salaryId);
		} catch (err) {
			setBreakdownErrors((prev) => ({
				...prev,
				[salaryId]: err.message,
			}));
		}
	}

	function handleUpdateBreakdown(updatedItem) {
		setBreakdowns((prev) =>
			Object.fromEntries(
				Object.entries(prev).map(([salaryId, items]) => [
					salaryId,
					items.map((item) =>
						item.id === updatedItem.id ? updatedItem : item,
					),
				]),
			),
		);
		const salaryId = Object.entries(breakdowns).find(([, items]) =>
			items.some((item) => item.id === updatedItem.id),
		)?.[0];
		if (salaryId) {
			refreshSalary(Number(salaryId));
		}
	}

	async function handleDeleteBreakdown(item) {
		try {
			await deleteBreakdown(item.id);
			setBreakdowns((prev) =>
				Object.fromEntries(
					Object.entries(prev).map(([salaryId, items]) => [
						salaryId,
						items.filter((entry) => entry.id !== item.id),
					]),
				),
			);
			await refreshSalary(item.salary_id);
		} catch (err) {
			setError(err.message);
		}
	}

	if (error) {
		return <p className="dashboard-error">{error}</p>;
	}

	if (!user) {
		return <p className="dashboard-loading">Loading…</p>;
	}

	return (
		<>
			<section className="panel">
				<h2>
					Current salary of {user.full_name} ({user.email})
				</h2>

				{salaries.length > 0 ? (
					<div className="panel-stat-grid">
						<div className="panel-stat">
							<span>Base pay</span>
							<strong>
								$
								{Number(
									salaries[0].base_amount,
								).toLocaleString()}
							</strong>
						</div>

						<div className="panel-stat">
							<span>Month</span>
							<strong>
								{new Date(
									salaries[0].month,
								).toLocaleDateString()}
							</strong>
						</div>

						<div className="panel-stat">
							<span>Received</span>
							<strong>
								{salaries[0].received ? "Yes" : "No"}
							</strong>
						</div>
					</div>
				) : (
					<p className="dashboard-empty">No salary record yet.</p>
				)}
			</section>

			<section className="panel">
				<h2>Payout by month</h2>

				<Salaries
					salaries={salaries}
					openMonth={openMonth}
					breakdowns={breakdowns}
					breakdownErrors={breakdownErrors}
					onToggle={toggleDetails}
					onEdit={handleUpdateSalary}
					onDelete={handleDeleteSalary}
					onAdd={handleAddSalary}
					onBreakdownEdit={handleUpdateBreakdown}
					onBreakdownDelete={handleDeleteBreakdown}
					onBreakdownAdd={handleAddBreakdown}
				/>
			</section>
		</>
	);
}
