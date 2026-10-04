import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, deleteUser, getUsers } from "../../api/client";
import UserCreateForm from "./UserCreateForm";

export default function AdminPanel() {
	const navigate = useNavigate();
	const [users, setUsers] = useState(null);
	const [expandedManager, setExpandedManager] = useState(null);
	const [showUnassigned, setShowUnassigned] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		getUsers()
			.then(setUsers)
			.catch((err) => setError(err.message));
	}, []);

	if (error) return <p className="dashboard-error">{error}</p>;
	if (!users) return <p className="dashboard-loading">Loading people…</p>;

	const managers = users.filter((user) => user.role === "manager");
	const employees = users.filter((user) => user.role === "employee");
	const managerIds = new Set(managers.map((manager) => manager.id));
	const unassignedEmployees = employees.filter(
		(employee) => !managerIds.has(employee.manager_id),
	);

	function renderEmployees(employeeList) {
		if (employeeList.length === 0) {
			return <p className="dashboard-empty">No employees to show.</p>;
		}

		return (
			<table className="panel-table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{employeeList.map((employee) => (
						<tr key={employee.id}>
							<td>{employee.full_name}</td>
							<td>{employee.email}</td>
							<td>
								<button
									type="button"
									className="details-btn"
									onClick={() =>
										navigate(
											`/dashboard/EmployeeDetails/${employee.id}`,
										)
									}
								>
									Details
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	async function handleCreateManager(data) {
		const manager = await createUser(data);
		setUsers((previous) => [manager, ...previous]);
		setShowCreateForm(false);
	}

	async function handleDeleteManager(manager) {
		if (!window.confirm(`Delete manager ${manager.full_name}?`)) return;

		try {
			await deleteUser(manager.id);
			setUsers((previous) =>
				previous
					.filter((user) => user.id !== manager.id)
					.map((user) =>
						user.manager_id === manager.id
							? { ...user, manager_id: null }
							: user,
					),
			);
		} catch (err) {
			setError(err.message);
		}
	}

	return (
		<section className="panel">
			<h2>Managers — your organization</h2>
			<button
				type="button"
				className="add-btn"
				onClick={() => setShowCreateForm((show) => !show)}
			>
				Add manager
			</button>
			{showCreateForm && (
				<UserCreateForm
					role="manager"
					onSubmit={handleCreateManager}
					onCancel={() => setShowCreateForm(false)}
				/>
			)}
			{managers.length === 0 ? (
				<p className="dashboard-empty">No managers to show.</p>
			) : (
				<table className="panel-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Employees</th>
							<th></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{managers.map((manager) => {
							const managerEmployees = employees.filter(
								(employee) =>
									employee.manager_id === manager.id,
							);
							const isExpanded =
								expandedManager === manager.id;

							return (
								<Fragment key={manager.id}>
									<tr>
										<td>{manager.full_name}</td>
										<td>{manager.email}</td>
										<td>{managerEmployees.length}</td>
										<td>
											<button
												type="button"
												className="details-btn"
												aria-expanded={isExpanded}
												onClick={() =>
													setExpandedManager(
														isExpanded
															? null
															: manager.id,
													)
												}
											>
												{isExpanded
													? "Hide employees"
													: "View employees"}
											</button>
										</td>
										<td>
											<button
												type="button"
												className="delete-btn"
												onClick={() =>
													handleDeleteManager(manager)
												}
											>
												Delete
											</button>
										</td>
									</tr>
									{isExpanded && (
										<tr key={`${manager.id}-employees`}>
											<td
												colSpan={5}
												className="details-cell"
											>
												{renderEmployees(
													managerEmployees,
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

			{unassignedEmployees.length > 0 && (
				<section className="admin-unassigned">
					<h3>Employees without a manager</h3>
					<button
						type="button"
						className="details-btn"
						aria-expanded={showUnassigned}
						onClick={() => setShowUnassigned((open) => !open)}
					>
						{showUnassigned
							? "Hide employees"
							: `View employees (${unassignedEmployees.length})`}
					</button>
					{showUnassigned && renderEmployees(unassignedEmployees)}
				</section>
			)}
		</section>
	);
}
