import { Fragment, useState } from "react";
import { updateSalary } from "../../api/client";
import SalaryBreakdown from "./SalaryBreakdown";

export default function Salaries({
	salaries,
	readOnly = false,
	openMonth,
	breakdowns,
	breakdownErrors,
	onToggle,
	onEdit,
	onDelete,
	onAdd,
	onBreakdownEdit,
	onBreakdownDelete,
	onBreakdownAdd,
}) {
	const [editingId, setEditingId] = useState(null);
	const [editData, setEditData] = useState({});
	const [isAdding, setIsAdding] = useState(false);

	if (salaries.length === 0 && !isAdding) {
		return (
			<>
				{!readOnly && (
					<button
						type="button"
						className="add-btn"
						onClick={() => {
							setIsAdding(true);
							setEditData({
								month: "",
								base_amount: "",
								attendance_counter: "",
							});
						}}
					>
						+ Add salary
					</button>
				)}

				<p className="dashboard-empty">No salary on record yet.</p>
			</>
		);
	}

	const handleEdit = (salary) => {
		setIsAdding(false);
		setEditingId(salary.id);

		setEditData({
			base_amount: salary.base_amount,
			attendance_counter: salary.attendance_counter,
			received: Boolean(salary.received),
		});
	};

	const handleChange = (field, value) => {
		setEditData((previous) => ({
			...previous,
			[field]: value,
		}));
	};

	const handleConfirmEdit = async (salary) => {
		const payload = {
			base_amount: Number(editData.base_amount),
			attendance_counter: Number(editData.attendance_counter),
			received: Boolean(editData.received),
		};

		// Only send explicitly editable salary fields. The record identity is the
		// salary id in the URL, not a mutable value in the request body.
		const safePayload = Object.fromEntries(
			Object.entries(payload).filter(([key]) =>
				["base_amount", "attendance_counter", "received"].includes(key),
			),
		);

		try {
			const updatedSalary = await updateSalary(salary.id, safePayload);

			onEdit(updatedSalary);
			setEditingId(null);
			setEditData({});
		} catch (error) {
			console.error("Failed to update salary:", error);
		}
	};

	const handleStartAdd = () => {
		setIsAdding(true);
		setEditingId(null);

		setEditData({
			month: "",
			base_amount: "",
			attendance_counter: "",
			received: false,
		});
	};

	const handleConfirmAdd = () => {
		if (
			!editData.month ||
			editData.base_amount === "" ||
			editData.attendance_counter === ""
		) {
			return;
		}

		const newSalary = {
			month: editData.month,
			base_amount: Number(editData.base_amount),
			attendance_counter: Number(editData.attendance_counter),
			received: Boolean(editData.received),
		};

		onAdd(newSalary);

		setIsAdding(false);
		setEditData({});
	};

	const handleDelete = (salary) => {
		const month = new Date(salary.month).toLocaleDateString(undefined, {
			month: "long",
			year: "numeric",
		});

		const confirmed = window.confirm(
			`Are you sure you want to delete the salary for ${month}?`,
		);

		if (!confirmed) {
			return;
		}

		onDelete(salary);
	};

	const handleCancel = () => {
		setEditingId(null);
		setIsAdding(false);
		setEditData({});
	};

	return (
		<>
			{!readOnly && (
				<div className="salary-actions">
					<button
						type="button"
						className="add-btn"
						onClick={handleStartAdd}
						disabled={isAdding || editingId !== null}
					>
						+ Add salary
					</button>
				</div>
			)}

			<table className="panel-table">
				<thead>
					<tr>
						<th>Month</th>
						<th>Base pay</th>
						<th>Days / Hours</th>
						<th>Additions</th>
						<th>Deductions</th>
						<th>Total</th>
						<th>Received</th>
						<th></th>
						{!readOnly && <th></th>}
						{!readOnly && <th></th>}
					</tr>
				</thead>

				<tbody>
					{isAdding && (
						<tr>
							<td>
								<input
									type="month"
									value={editData.month}
									onChange={(e) =>
										handleChange("month", e.target.value)
									}
								/>
							</td>

							<td>
								<input
									type="number"
									min="0"
									placeholder="Base pay"
									value={editData.base_amount}
									onChange={(e) =>
										handleChange(
											"base_amount",
											e.target.value,
										)
									}
								/>
							</td>

							<td>
								<input
									type="number"
									min="0"
									placeholder="Days / Hours"
									value={editData.attendance_counter}
									onChange={(e) =>
										handleChange(
											"attendance_counter",
											e.target.value,
										)
									}
								/>
							</td>

							<td>$0</td>
							<td>$0</td>
							<td>$0</td>

							<td>
								<select
									value={String(Boolean(editData.received))}
									onChange={(e) =>
										handleChange(
											"received",
											e.target.value === "true",
										)
									}
								>
									<option value="true">Yes</option>
									<option value="false">No</option>
								</select>
							</td>

							<td></td>

							<td>
								<button
									type="button"
									className="edit-btn"
									onClick={handleConfirmAdd}
								>
									Confirm
								</button>
							</td>

							<td>
								<button
									type="button"
									className="delete-btn"
									onClick={handleCancel}
								>
									Cancel
								</button>
							</td>
						</tr>
					)}

					{salaries.map((salary) => {
						const isOpen = openMonth === salary.id;
						const isEditing = editingId === salary.id;

						return (
							<Fragment key={salary.id}>
								<tr>
									<td>
										{new Date(
											salary.month,
										).toLocaleDateString(undefined, {
											month: "long",
											year: "numeric",
										})}
									</td>

									<td>
										{isEditing ? (
											<input
												type="number"
												min="0"
												value={editData.base_amount}
												onChange={(e) =>
													handleChange(
														"base_amount",
														e.target.value,
													)
												}
											/>
										) : (
											<>
												$
												{Number(
													salary.base_amount,
												).toLocaleString()}
											</>
										)}
									</td>

									<td>
										{isEditing ? (
											<input
												type="number"
												min="0"
												value={
													editData.attendance_counter
												}
												onChange={(e) =>
													handleChange(
														"attendance_counter",
														e.target.value,
													)
												}
											/>
										) : (
											Number(
												salary.attendance_counter,
											).toLocaleString()
										)}
									</td>

									<td>
										$
										{Number(
											salary.additions,
										).toLocaleString()}
									</td>

									<td>
										$
										{Number(
											salary.deductions,
										).toLocaleString()}
									</td>

									<td>
										$
										{Number(
											salary.net_pay,
										).toLocaleString()}
									</td>

									<td>
										{isEditing ? (
											<select
												value={String(
													Boolean(editData.received),
												)}
												onChange={(e) =>
													handleChange(
														"received",
														e.target.value ===
															"true",
													)
												}
											>
												<option value="true">
													Yes
												</option>
												<option value="false">
													No
												</option>
											</select>
										) : salary.received ? (
											"Yes"
										) : (
											"No"
										)}
									</td>

									<td>
										<button
											type="button"
											className="details-btn"
											onClick={() => onToggle(salary.id)}
											disabled={isEditing}
										>
											{isOpen ? "Hide" : "Details"}
										</button>
									</td>

									{!readOnly && <td>
										{isEditing ? (
											<button
												type="button"
												className="edit-btn"
												onClick={() =>
													handleConfirmEdit(salary)
												}
											>
												Confirm
											</button>
										) : (
											<button
												type="button"
												className="edit-btn"
												onClick={() =>
													handleEdit(salary)
												}
												disabled={isAdding}
											>
												Edit
											</button>
										)}
									</td>}

									{!readOnly && <td>
										{isEditing ? (
											<button
												type="button"
												className="delete-btn"
												onClick={handleCancel}
											>
												Cancel
											</button>
										) : (
											<button
												type="button"
												className="delete-btn"
												onClick={() =>
													handleDelete(salary)
												}
												disabled={isAdding}
											>
												Delete
											</button>
										)}
									</td>}
								</tr>

								{isOpen && (
									<tr>
										<td
											colSpan={readOnly ? 8 : 10}
											className="details-cell"
										>
											<SalaryBreakdown
												breakdown={
													breakdowns[salary.id]
												}
												error={
													breakdownErrors[salary.id]
												}
												netPay={salary.net_pay}
												readOnly={readOnly}
												onEdit={onBreakdownEdit}
												onDelete={onBreakdownDelete}
												onAdd={(item) =>
													onBreakdownAdd(
														salary.id,
														item,
													)
												}
											/>
										</td>
									</tr>
								)}
							</Fragment>
						);
					})}
				</tbody>
			</table>
		</>
	);
}
