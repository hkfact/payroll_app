import { useEffect, useState } from "react";
import {
	createUser,
	deleteUser,
	getOrganizations,
	getUsers,
} from "../../api/client";
import UserCreateForm from "./UserCreateForm";

export default function SuperAdminPanel() {
	const [orgs, setOrgs] = useState(null);
	const [admins, setAdmins] = useState(null);
	const [creatingForOrg, setCreatingForOrg] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		Promise.all([getOrganizations(), getUsers()])
			.then(([organizations, users]) => {
				setOrgs(organizations);
				setAdmins(users.filter((user) => user.role === "admin"));
			})
			.catch((err) => setError(err.message));
	}, []);

	if (error) return <p className="dashboard-error">{error}</p>;
	if (!orgs || !admins)
		return <p className="dashboard-loading">Loading organizations…</p>;

	async function handleCreateAdmin(data) {
		const admin = await createUser(data);
		setAdmins((previous) => [admin, ...previous]);
		setCreatingForOrg(null);
	}

	async function handleDeleteAdmin(admin) {
		if (!window.confirm(`Delete admin ${admin.full_name}?`)) return;

		try {
			await deleteUser(admin.id);
			setAdmins((previous) =>
				previous.filter((user) => user.id !== admin.id),
			);
		} catch (err) {
			setError(err.message);
		}
	}

	return (
		<section className="panel">
			<h2>Organizations</h2>
			{orgs.length === 0 ? (
				<p className="dashboard-empty">No organizations yet.</p>
			) : (
				<table className="panel-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Created</th>
							<th>Admins</th>
						</tr>
					</thead>
					<tbody>
						{orgs.map((org) => (
							<tr key={org.id}>
								<td>{org.name}</td>
								<td>
									{new Date(
										org.created_at,
									).toLocaleDateString()}
								</td>
								<td>
									{admins.filter(
										(admin) => admin.org_id === org.id,
									).length > 0 ? (
										<ul className="organization-admin-list">
											{admins
												.filter(
													(admin) =>
														admin.org_id === org.id,
												)
												.map((admin) => (
													<li key={admin.id}>
														{admin.full_name} (
														{admin.email})
														<button
															type="button"
															className="delete-btn"
															onClick={() =>
																handleDeleteAdmin(
																	admin,
																)
															}
														>
															Delete
														</button>
													</li>
												))}
										</ul>
									) : (
										<span className="dashboard-empty">
											No admins
										</span>
									)}
									<div className="organization-admin-actions">
										<button
											type="button"
											className="add-btn"
											onClick={() =>
												setCreatingForOrg(
													creatingForOrg === org.id
														? null
														: org.id,
												)
											}
										>
											Add admin
										</button>
										{creatingForOrg === org.id && (
											<UserCreateForm
												role="admin"
												organizations={orgs}
												organizationId={org.id}
												onSubmit={handleCreateAdmin}
												onCancel={() =>
													setCreatingForOrg(null)
												}
											/>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</section>
	);
}
