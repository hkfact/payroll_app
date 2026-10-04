import { useState } from "react";
import { updateBreakdown } from "../../api/client";

const isValidEntry = ({ name, amount }) =>
	name.trim() !== "" && amount !== "" && Number(amount) >= 0;

const formatAmount = ({ effect, amount }) => {
	const sign = effect ? "+" : "−";
	return `${sign}$${Number(amount).toLocaleString()}`;
};

function BreakdownFields({ data, onChange }) {
	return (
		<>
			<td>
				<input
					type="text"
					placeholder="Criterion"
					value={data.name}
					onChange={(e) => onChange("name", e.target.value)}
				/>
			</td>

			<td>
				<select
					value={data.effect ? "addition" : "deduction"}
					onChange={(e) =>
						onChange("effect", e.target.value === "addition")
					}
				>
					<option value="addition">Addition</option>
					<option value="deduction">Deduction</option>
				</select>
			</td>

			<td>
				<input
					type="number"
					min="0"
					placeholder="Amount"
					value={data.amount}
					onChange={(e) => onChange("amount", e.target.value)}
				/>
			</td>

		</>
	);
}

export default function SalaryBreakdown({
	breakdown,
	error,
	netPay,
	readOnly = false,
	onEdit,
	onDelete,
	onAdd,
}) {
	const [editingId, setEditingId] = useState(null);
	const [formData, setFormData] = useState({});
	const [isAdding, setIsAdding] = useState(false);

	if (error) {
		return <p className="dashboard-error">{error}</p>;
	}

	if (!breakdown) {
		return <p className="dashboard-loading">Loading details…</p>;
	}

	const handleChange = (field, value) => {
		setFormData((previous) => ({
			...previous,
			[field]: value,
		}));
	};

	const handleEdit = (item) => {
		setIsAdding(false);
		setEditingId(item.id);
		setFormData({
			name: item.name,
			effect: item.effect,
			amount: item.amount,
		});
	};

	const handleStartAdd = () => {
		setEditingId(null);
		setIsAdding(true);
		setFormData({
			name: "",
			effect: true,
			amount: "",
		});
	};

	const handleCancel = () => {
		setEditingId(null);
		setIsAdding(false);
		setFormData({});
	};

	const handleConfirmAdd = () => {
		if (!isValidEntry(formData)) return;

		onAdd({
			name: formData.name.trim(),
			effect: formData.effect,
			amount: Number(formData.amount),
		});

		handleCancel();
	};

	const handleConfirmEdit = async (item) => {
		if (!isValidEntry(formData)) return;

		const updatedItem = {
			...item,
			name: formData.name.trim(),
			effect: formData.effect,
			amount: Number(formData.amount),
		};

		try {
			const savedItem = await updateBreakdown(item.id, {
				name: updatedItem.name,
				effect: updatedItem.effect,
				amount: updatedItem.amount,
			});

			onEdit(savedItem);
			handleCancel();
		} catch (error) {
			console.error("Update failed:", error);
		}
	};

	const handleDelete = (item) => {
		if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
			onDelete(item);
		}
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
						+ Add entry
					</button>
				</div>
			)}

			<table className="panel-subtable">
				<thead>
					<tr>
						<th>Criterion</th>
						<th>Type</th>
						<th>Amount</th>
						{!readOnly && <th />}
						{!readOnly && <th />}
					</tr>
				</thead>

				<tbody>
					{isAdding && !readOnly && (
						<tr>
							<BreakdownFields
								data={formData}
								onChange={handleChange}
							/>

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

					{breakdown.map((item) => {
						const isEditing = editingId === item.id;

						return (
							<tr key={item.id}>
								{isEditing ? (
									<>
										<BreakdownFields
											data={formData}
											onChange={handleChange}
										/>

										{!readOnly && <td>
											<button
												type="button"
												className="edit-btn"
												onClick={() =>
													handleConfirmEdit(item)
												}
											>
												Confirm
											</button>
										</td>}

										{!readOnly && <td>
											<button
												type="button"
												className="delete-btn"
												onClick={handleCancel}
											>
												Cancel
											</button>
										</td>}
									</>
								) : (
									<>
										<td>{item.name}</td>
										<td>
											{item.effect
												? "Addition"
												: "Deduction"}
										</td>
										<td>{formatAmount(item)}</td>

										{!readOnly && (
											<td>
											<button
												type="button"
												className="edit-btn"
												onClick={() => handleEdit(item)}
												disabled={isAdding}
											>
												Edit
											</button>
											</td>
										)}

										{!readOnly && (
											<td>
												<button
													type="button"
													className="delete-btn"
													onClick={() =>
														handleDelete(item)
													}
													disabled={isAdding}
												>
													Delete
												</button>
											</td>
										)}
									</>
								)}
							</tr>
						);
					})}
				</tbody>
			</table>

			<div className="details-net-pay">
				<span>Net pay</span>
				<strong>${Number(netPay).toLocaleString()}</strong>
			</div>
		</>
	);
}
