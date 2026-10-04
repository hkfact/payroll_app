import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SuperAdminPanel from "../components/dashboard/SuperAdminPanel";
import AdminPanel from "../components/dashboard/AdminPanel";
import PeoplePanel from "../components/dashboard/PeoplePanel";
import ManagerPanel from "../components/dashboard/ManagerPanel";
import EmployeePanel from "../components/dashboard/EmployeePanel";
import { deleteUser } from "../api/client";
import "../css/Dashboard.css";

export default function Dashboard() {
	// No null-check needed here anymore — RequireAuth (wrapping this route)
	// guarantees `user` exists before Dashboard ever renders.
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		navigate("/login");
	}

	return (
		<div className="dashboard">
			<header className="dashboard-header">
				<div>
					<span className="dashboard-eyebrow">Payroll</span>
					<h1>Dashboard</h1>
				</div>
				<div className="dashboard-account">
					<span className="dashboard-role-badge">
						{user.role.replace("_", " ")}
					</span>
					<span className="dashboard-email">{user.email}</span>
					<button onClick={handleLogout}>Sign out</button>
				</div>
			</header>

			<main className="dashboard-body">
				{user.role === "super_admin" && <SuperAdminPanel />}

				{user.role === "admin" && <AdminPanel />}

				{user.role === "observer" && (
					<PeoplePanel scopeLabel="your organization" />
				)}

				{user.role === "manager" && (
					<ManagerPanel
						scopeLabel="your team"
						onFire={(employee) => deleteUser(employee.id)}
					/>
				)}

				{user.role === "employee" && <EmployeePanel />}
			</main>
		</div>
	);
}
