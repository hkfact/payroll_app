import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createUser, getUsers } from "../../api/client";
import UserCreateForm from "./UserCreateForm";

export default function ManagerPanel({ scopeLabel, onFire }) {
	const navigate = useNavigate();

	const [users, setUsers] = useState(null);
	const [error, setError] = useState("");
	const [showCreateForm, setShowCreateForm] = useState(false);

	useEffect(() => {
		getUsers()
			.then((data) => setUsers(data || null))
			.catch((err) => setError(err.message));
	}, []);

	const handleFire = (employee) => {
		const confirmed = window.confirm(
			`Are you sure you want to fire ${employee.full_name}?`,
		);

		if (!confirmed) {
			return;
		}

		onFire(employee)
			.then(() =>
				setUsers((previous) =>
					previous.filter((user) => user.id !== employee.id),
				),
			)
			.catch((err) => setError(err.message));
	};

	async function handleCreateEmployee(data) {
		const employee = await createUser(data);
		setUsers((previous) => [employee, ...previous]);
		setShowCreateForm(false);
	}

	if (error) {
		return <p className="dashboard-error">{error}</p>;
	}

	return (
		<>
			<section className="Panel">
				<h2>Employees — {scopeLabel}</h2>
				<button
					type="button"
					className="add-btn"
					onClick={() => setShowCreateForm((show) => !show)}
				>
					Add employee
				</button>
				{showCreateForm && (
					<UserCreateForm
						role="employee"
						onSubmit={handleCreateEmployee}
						onCancel={() => setShowCreateForm(false)}
					/>
				)}

				<table className="panel-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th></th>
							<th></th>
						</tr>
					</thead>

					<tbody>
						{users
							?.filter((u) => u.role === "employee")
							.map((u) => (
								<tr key={u.id}>
									<td>{u.full_name}</td>

									<td>{u.email}</td>

									<td>
										<button
											type="button"
											className="details-btn"
											onClick={() =>
												navigate(
													`/dashboard/EmployeeDetails/${u.id}`,
												)
											}
										>
											Details
										</button>
									</td>

									<td>
										<button
											type="button"
											className="delete-btn"
											onClick={() => handleFire(u)}
										>
											Fire
										</button>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</section>
		</>
	);
}
