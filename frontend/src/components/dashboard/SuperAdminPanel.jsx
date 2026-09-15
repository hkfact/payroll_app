import { useEffect, useState } from "react";
import { getOrganizations } from "../../api/client";

export default function SuperAdminPanel() {
	const [orgs, setOrgs] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		getOrganizations()
			.then(setOrgs)
			.catch((err) => setError(err.message));
	}, []);

	if (error) return <p className="dashboard-error">{error}</p>;
	if (!orgs)
		return <p className="dashboard-loading">Loading organizations…</p>;

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
							</tr>
						))}
					</tbody>
				</table>
			)}
		</section>
	);
}
