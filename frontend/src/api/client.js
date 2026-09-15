const API_BASE = "http://localhost:5000/payroll_app";

async function request(path, options = {}) {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		...options,
	});

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(data.error || "Something went wrong");
	}

	return data;
}

// ---- auth ----

export function login(email, password) {
	return request("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});
}

export function logout() {
	return request("/auth/logout", { method: "POST" });
}

export function getMe() {
	return request("/auth/me");
}

// ---- read-only data ----
export function getUserById(id) {
	return request(`/users/${id}`);
}

export function getOrganizations() {
	return request("/orgs");
}

export function getUsers() {
	return request("/users");
}

export function getEmployees() {
	return request("/employees");
}

export function getSalaries() {
	return request("/salaries");
}

export function getSalaryBreakdown(salaryId) {
	return request(`/salaries/breakdown/${salaryId}`);
}

export function updateSalary(salaryId, data) {
	return request(`/salaries/${salaryId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export function createSalary(data) {
	return request("/salaries", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function deleteSalary(salaryId) {
	return request(`/salaries/${salaryId}`, { method: "DELETE" });
}

export function createBreakdown(data) {
	return request("/relation", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function updateBreakdown(itemId, data) {
	return request(`/relation/${itemId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export function deleteBreakdown(itemId) {
	return request(`/relation/${itemId}`, { method: "DELETE" });
}

export function deleteEmployee(employeeId) {
	return request(`/users/${employeeId}`, { method: "DELETE" });
}
