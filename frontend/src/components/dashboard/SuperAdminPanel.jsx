import { Fragment, useEffect, useState } from "react";
import {
	createOrganization,
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
	const [expandedOrg, setExpandedOrg] = useState(null);
	const [showOrganizationForm, setShowOrganizationForm] = useState(false);
	const [organizationName, setOrganizationName] = useState("");
	const [organizationError, setOrganizationError] = useState("");
	const [creatingOrganization, setCreatingOrganization] = useState(false);
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

	async function handleCreateOrganization(event) {
		event.preventDefault();
		setOrganizationError("");
		setCreatingOrganization(true);

		try {
			const organization = await createOrganization({
				name: organizationName,
			});
			setOrgs((previous) => [organization, ...previous]);
			setOrganizationName("");
			setShowOrganizationForm(false);
		} catch (err) {
			setOrganizationError(err.message);
		} finally {
			setCreatingOrganization(false);
		}
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
			<button
				type="button"
				className="add-btn"
				onClick={() => {
					setOrganizationError("");
					setShowOrganizationForm((show) => !show);
				}}
			>
				{showOrganizationForm ? "Cancel" : "Add organization"}
			</button>
			{showOrganizationForm && (
				<form
					className="organization-create-form"
					onSubmit={handleCreateOrganization}
				>
					<label>
						Organization name
						<input
							type="text"
							value={organizationName}
							onChange={(event) =>
								setOrganizationName(event.target.value)
							}
							required
						/>
					</label>
					<button
						type="submit"
						className="add-btn"
						disabled={creatingOrganization}
					>
						{creatingOrganization
							? "Creating…"
							: "Create organization"}
					</button>
					{organizationError && (
						<p className="dashboard-error" role="alert">
							{organizationError}
						</p>
					)}
				</form>
			)}
			{orgs.length === 0 ? (
				<p className="dashboard-empty">No organizations yet.</p>
			) : (
				<table className="panel-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Created</th>
							<th>Admins</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{orgs.map((org) => {
							const orgAdmins = admins.filter(
								(admin) => admin.org_id === org.id,
							);
							const isExpanded = expandedOrg === org.id;

							return (
								<Fragment key={org.id}>
									<tr>
										<td>{org.name}</td>
										<td>
											{new Date(
												org.created_at,
											).toLocaleDateString()}
										</td>
										<td>{orgAdmins.length}</td>
										<td>
											<button
												type="button"
												className="details-btn"
												aria-expanded={isExpanded}
												onClick={() =>
													setExpandedOrg(
														isExpanded
															? null
															: org.id,
													)
												}
											>
												{isExpanded
													? "Hide details"
													: "Details"}
											</button>
										</td>
									</tr>
									{isExpanded && (
										<tr>
											<td
												colSpan={4}
												className="details-cell"
											>
												<h3>{org.name}</h3>
												<p>
													Created{" "}
													{new Date(
														org.created_at,
													).toLocaleDateString()}
												</p>
												<h4>Organization admins</h4>
												{orgAdmins.length > 0 ? (
													<ul className="organization-admin-list">
														{orgAdmins.map(
															(admin) => (
																<li key={admin.id}>
																	<span>
																		{admin.full_name}{" "}
																		(
																		{admin.email}
																		)
																	</span>
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
															),
														)}
													</ul>
												) : (
													<p className="dashboard-empty">
														No admins yet.
													</p>
												)}
												<div className="organization-admin-actions">
													<button
														type="button"
														className="add-btn"
														onClick={() =>
															setCreatingForOrg(
																creatingForOrg ===
																	org.id
																	? null
																	: org.id,
															)
														}
													>
														Add admin
													</button>
												</div>
												{creatingForOrg === org.id && (
													<UserCreateForm
														role="admin"
														organizations={orgs}
														organizationId={org.id}
														onSubmit={handleCreateAdmin}
														onCancel={() =>
															setCreatingForOrg(
																null,
															)
														}
													/>
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
	);
}
