import { useState } from "react";

export default function UserCreateForm({
	role,
	organizations = [],
	organizationId,
	onSubmit,
	onCancel,
}) {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [orgId, setOrgId] = useState(
		organizationId === undefined ? "" : String(organizationId),
	);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSubmitting(true);
		try {
			await onSubmit({
				full_name: fullName,
				email,
				password,
				role,
				...(role === "admin" ? { org_id: Number(orgId) } : {}),
			});
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form className="user-create-form" onSubmit={handleSubmit}>
			<label>
				Full name
				<input
					type="text"
					value={fullName}
					onChange={(event) => setFullName(event.target.value)}
					required
				/>
			</label>
			<label>
				Email
				<input
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					required
				/>
			</label>
			<label>
				Temporary password
				<input
					type="password"
					minLength={8}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
				/>
			</label>
			{role === "admin" && (
				<label>
					Organization
					<select
						value={orgId}
						onChange={(event) => setOrgId(event.target.value)}
						required
					>
						<option value="">Choose an organization</option>
						{organizations.map((organization) => (
							<option
								key={organization.id}
								value={organization.id}
							>
								{organization.name}
							</option>
						))}
					</select>
				</label>
			)}
			{error && (
				<p className="dashboard-error" role="alert">
					{error}
				</p>
			)}
			<div className="user-create-actions">
				<button className="add-btn" type="submit" disabled={submitting}>
					{submitting ? "Creating…" : `Create ${role}`}
				</button>
				<button
					className="details-btn"
					type="button"
					onClick={onCancel}
					disabled={submitting}
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
