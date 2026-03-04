"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type PermitToWork,
	type PermitType,
	createPermitToWork,
	getPermitsToWork,
	savePermitToWork,
	deletePermitToWork,
	PERMIT_TYPES,
} from "@/lib/permits-to-work";

export default function PermitsToWorkPage() {
	const [permits, setPermits] = useState<PermitToWork[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<PermitToWork | null>(null);
	const [selected, setSelected] = useState<PermitToWork | null>(null);
	const [filter, setFilter] = useState<string>("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadPermits();
	}, []);

	async function loadPermits() {
		const loaded = await getPermitsToWork();
		setPermits(loaded.sort((a, b) => b.startDate.localeCompare(a.startDate)));
	}

	function handleNew() {
		setCurrent(createPermitToWork({}));
		setShowForm(true);
		setSelected(null);
	}

	async function handleSave() {
		if (!current) return;
		await savePermitToWork(current);
		await loadPermits();
		setShowForm(false);
		setCurrent(null);
	}

	async function handleDelete(id: string) {
		if (confirm("Delete this permit?")) {
			await deletePermitToWork(id);
			await loadPermits();
			setSelected(null);
		}
	}

	function update(updates: Partial<PermitToWork>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	function handleTypeChange(type: PermitType) {
		const newPermit = createPermitToWork({ ...current, permitType: type });
		setCurrent(newPermit);
	}

	const statusColor = (status: string) => {
		switch (status) {
			case "approved":
			case "active":
				return "bg-green-500/20 text-green-500 border-green-500/30";
			case "completed":
				return "bg-blue-500/20 text-blue-500 border-blue-500/30";
			case "suspended":
			case "cancelled":
				return "bg-red-500/20 text-red-500 border-red-500/30";
			default:
				return "bg-gray-500/20 text-gray-500 border-gray-500/30";
		}
	};

	const filtered =
		filter === "all"
			? permits.filter(p => p.status !== "completed" && p.status !== "cancelled")
			: filter === "current"
			? permits.filter(p => p.status === "approved" || p.status === "active")
			: permits.filter((p) => p.status === filter);

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader
					title={current.id.startsWith("PTW-") ? "New Permit" : "Edit Permit"}
					subtitle="Permits to Work"
				/>

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-5xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Permit Type
								</label>
								<select
									value={current.permitType}
									onChange={(e) => handleTypeChange(e.target.value as PermitType)}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{PERMIT_TYPES.map((type) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Permit Number
								</label>
								<input
									value={current.permitNumber}
									onChange={(e) => update({ permitNumber: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Project
								</label>
								<input
									type="text"
									value={current.project}
									onChange={(e) => update({ project: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Location
								</label>
								<input
									type="text"
									value={current.location}
									onChange={(e) => update({ location: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Work Description
							</label>
							<textarea
								value={current.workDescription}
								onChange={(e) => update({ workDescription: e.target.value })}
								rows={3}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Contractor
								</label>
								<input
									type="text"
									value={current.contractor}
									onChange={(e) => update({ contractor: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Supervisor
								</label>
								<input
									type="text"
									value={current.supervisor}
									onChange={(e) => update({ supervisor: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Start Date
								</label>
								<input
									type="date"
									value={current.startDate}
									onChange={(e) => update({ startDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Start Time
								</label>
								<input
									type="time"
									value={current.startTime}
									onChange={(e) => update({ startTime: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									End Date
								</label>
								<input
									type="date"
									value={current.endDate}
									onChange={(e) => update({ endDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									End Time
								</label>
								<input
									type="time"
									value={current.endTime}
									onChange={(e) => update({ endTime: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						{/* Preconditions Checklist */}
						<div>
							<h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
								Preconditions Checklist
							</h3>
							<div className="space-y-2">
								{current.preconditions.map((precond, idx) => (
									<label
										key={idx}
										className="flex items-start gap-3 rounded-xl bg-[var(--surface-2)] px-4 py-3 cursor-pointer hover:bg-[var(--surface-3)]"
									>
										<input
											type="checkbox"
											checked={precond.completed}
											onChange={(e) => {
												const updated = [...current.preconditions];
												updated[idx] = {
													...updated[idx],
													completed: e.target.checked,
												};
												update({ preconditions: updated });
											}}
											className="mt-1 w-5 h-5"
										/>
										<span className="text-sm text-[var(--ink)]">
											{precond.description}
										</span>
									</label>
								))}
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Special Requirements
							</label>
							<textarea
								value={current.specialRequirements || ""}
								onChange={(e) => update({ specialRequirements: e.target.value })}
								rows={2}
								placeholder="Any additional requirements or restrictions..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Status
							</label>
							<select
								value={current.status}
								onChange={(e) =>
									update({ status: e.target.value as PermitToWork["status"] })
								}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							>
								<option value="pending">Pending</option>
								<option value="approved">Approved</option>
								<option value="active">Active</option>
								<option value="completed">Completed</option>
								<option value="suspended">Suspended</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</div>

						<div className="flex gap-3 justify-end pt-4 border-t border-[var(--line)]">
							{current?.id && (
								<button
									onClick={() => setShowDeleteConfirm(true)}
									className="rounded-xl border border-red-200 px-6 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
								>
									Delete
								</button>
							)}
							<div className="flex gap-3 ml-auto">
								<button
									onClick={() => {
										setShowForm(false);
										setCurrent(null);
									}}
									className="rounded-xl border border-[var(--line)] px-6 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									className="rounded-xl bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									Save Permit
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.permitNumber || "Permit"}
						onConfirm={() => current.id && handleDelete(current.id)}
						onCancel={() => setShowDeleteConfirm(false)}
						isLoading={deleteLoading}
					/>
				)}

			</div>
		);
	}

	if (selected) {
		const completedPreconditions = selected.preconditions.filter(
			(p) => p.completed
		).length;

		return (
			<div className="flex flex-col gap-6">
				<PageHeader
					title="Permit Details"
					subtitle="Permits to Work"
					actions={
						<>
							<button
								onClick={() => setSelected(null)}
								className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)]"
							>
								← Back
							</button>
							<button
								onClick={() => {
									setCurrent({ ...selected });
									setShowForm(true);
									setSelected(null);
								}}
								className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
							>
								Edit
							</button>
						</>
					}
				/>

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-4xl">
					<div className="space-y-6">
						<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h2 className="font-display text-2xl font-semibold text-[var(--ink)]">
										{selected.permitType}
									</h2>
									<div
										className={`rounded-full px-4 py-1 text-sm font-semibold border ${statusColor(
											selected.status
										)}`}
									>
										{selected.status.toUpperCase()}
									</div>
								</div>
								<p className="text-[var(--muted)]">Permit #{selected.permitNumber}</p>
							</div>
							<button
								onClick={() => handleDelete(selected.id)}
								className="text-sm text-red-500 hover:underline"
							>
								Delete
							</button>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-2xl bg-[var(--surface-2)] p-4">
								<p className="text-xs text-[var(--muted)] mb-1">Project</p>
								<p className="text-[var(--ink)] font-semibold">{selected.project}</p>
							</div>
							<div className="rounded-2xl bg-[var(--surface-2)] p-4">
								<p className="text-xs text-[var(--muted)] mb-1">Location</p>
								<p className="text-[var(--ink)] font-semibold">{selected.location}</p>
							</div>
						</div>

						<div className="rounded-2xl bg-[var(--surface-2)] p-4">
							<p className="text-xs text-[var(--muted)] mb-2">Work Description</p>
							<p className="text-[var(--ink)]">{selected.workDescription}</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="rounded-2xl bg-[var(--surface-2)] p-4">
								<p className="text-xs text-[var(--muted)] mb-1">Contractor</p>
								<p className="text-[var(--ink)] font-semibold">{selected.contractor}</p>
							</div>
							<div className="rounded-2xl bg-[var(--surface-2)] p-4">
								<p className="text-xs text-[var(--muted)] mb-1">Supervisor</p>
								<p className="text-[var(--ink)] font-semibold">{selected.supervisor}</p>
							</div>
						</div>

						<div className="rounded-2xl bg-[var(--surface-2)] p-4">
							<p className="text-xs text-[var(--muted)] mb-2">Validity Period</p>
							<p className="text-[var(--ink)] font-semibold">
								{selected.startDate} {selected.startTime} → {selected.endDate}{" "}
								{selected.endTime}
							</p>
						</div>

						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
								Preconditions ({completedPreconditions}/{selected.preconditions.length} complete)
							</p>
							<div className="space-y-2">
								{selected.preconditions.map((precond, idx) => (
									<div
										key={idx}
										className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
											precond.completed
												? "bg-green-500/10 border border-green-500/20"
												: "bg-red-500/10 border border-red-500/20"
										}`}
									>
										<span className="text-lg">
											{precond.completed ? "✓" : "✗"}
										</span>
										<span className="text-sm text-[var(--ink)]">
											{precond.description}
										</span>
									</div>
								))}
							</div>
						</div>

						{selected.specialRequirements && (
							<div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500 mb-2">
									Special Requirements
								</p>
								<p className="text-[var(--ink)]">{selected.specialRequirements}</p>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Permits to Work"
				subtitle="Safe System of Work"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Permit
					</button>
				}
			/>

			<div className="flex gap-2">
				{["current", "all", "pending", "approved", "completed"].map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
							filter === f
								? "bg-[var(--accent)] text-white"
								: "border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
						}`}
					>
						{f.charAt(0).toUpperCase() + f.slice(1)}
					</button>
				))}
			</div>

			<div className="grid gap-4">
				{filtered.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">📋</p>
						<p className="text-[var(--muted)]">No permits found</p>
					</div>
				) : (
					filtered.map((permit) => (
						<div
							key={permit.id}
							onClick={() => setSelected(permit)}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-lg font-semibold text-[var(--ink)]">
											{permit.permitType}
										</h3>
										<div
											className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusColor(
												permit.status
											)}`}
										>
											{permit.status.toUpperCase()}
										</div>
									</div>
									<p className="text-sm text-[var(--muted)]">
										#{permit.permitNumber} • {permit.project} • {permit.location}
									</p>
									<p className="text-sm text-[var(--ink)] mt-2">
										{permit.startDate} {permit.startTime} - {permit.endDate}{" "}
										{permit.endTime}
									</p>
									<p className="text-xs text-[var(--muted)] mt-2">
										{permit.preconditions.filter((p) => p.completed).length}/
										{permit.preconditions.length} preconditions complete
									</p>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
