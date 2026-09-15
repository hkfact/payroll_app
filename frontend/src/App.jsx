import { Routes, Route } from "react-router-dom";

import RootRedirect from "./components/RootRedirect";
import RequireGuest from "./components/RequireGuest";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDetails from "./components/dashboard/EmployeeDetails";

function App() {
	return (
		<Routes>
			<Route path="/" element={<RootRedirect />} />
			<Route
				path="/login"
				element={
					<RequireGuest>
						<Login />
					</RequireGuest>
				}
			/>
			<Route
				path="/dashboard"
				element={
					<RequireAuth>
						<Dashboard />
					</RequireAuth>
				}
			/>
			<Route
				path="/dashboard/EmployeeDetails/:id"
				element={
					<RequireAuth>
						<EmployeeDetails />
					</RequireAuth>
				}
			/>
		</Routes>
	);
}

export default App;
