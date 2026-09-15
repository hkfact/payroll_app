import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/login.css";

const TICKER_ROWS = Array.from({ length: 14 }, (_, i) => i);

export default function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [status, setStatus] = useState("idle"); // idle | submitting | stamped

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		setStatus("submitting");

		try {
			await login(email, password);
			setStatus("stamped");
			// brief pause so the stamp animation actually gets seen before navigating
			setTimeout(() => navigate("/dashboard"), 550);
		} catch (err) {
			setError(
				err.message === "Invalid credentials"
					? "Incorrect email or password."
					: err.message,
			);
			setStatus("idle");
		}
	}

	return (
		<div className="login-screen">
			<aside className="login-brand" aria-hidden="true">
				<div className="ledger-ticker">
					{TICKER_ROWS.map((row) => (
						<div
							className="ledger-row"
							key={row}
							style={{ animationDelay: `${row * -1.1}s` }}
						>
							<span className="ledger-id">
								{String(1000 + row * 7).padStart(4, "0")}
							</span>
							<span className="ledger-mask">••••••••••</span>
							<span className="ledger-amount">
								${(1200 + row * 137) % 5000}.00
							</span>
						</div>
					))}
				</div>
				<div className="login-brand-copy">
					<span className="login-eyebrow">Payroll</span>
					<h1>Every account, every org, one ledger.</h1>
					<p>Sign in with the account your organization gave you.</p>
				</div>
			</aside>

			<main className="login-panel">
				<form className="login-form" onSubmit={handleSubmit} noValidate>
					<h2>Sign in</h2>

					<label htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						autoComplete="username"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>

					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>

					{error && (
						<p className="login-error" role="alert">
							{error}
						</p>
					)}

					<button type="submit" disabled={status !== "idle"}>
						<span
							className={`stamp ${status === "stamped" ? "stamp-hit" : ""}`}
							aria-hidden="true"
						/>
						{status === "submitting" && "Signing in…"}
						{status === "stamped" && "Signed in"}
						{status === "idle" && "Sign in"}
					</button>
				</form>
			</main>
		</div>
	);
}
