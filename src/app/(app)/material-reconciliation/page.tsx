"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type MaterialReconciliation,
	saveMaterialReconciliation,
	getMaterialReconciliations,
	deleteMaterialReconciliation,
	MATERIAL_UNITS,
} from "@/lib/additional-modules";

export default function MaterialReconciliationPage() {
	const [reconciliations, setReconciliations] = useState<MaterialReconciliation[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<MaterialReconciliation | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadReconciliations();
	}, []);

	async function loadReconciliations() {
		const loaded = await getMaterialReconciliations();
		setReconciliations(loaded.sort((a, b) => b.reconciliationDate.localeCompare(a.reconciliationDate)));
	}

	function handleNew() {
		setCurrent({
			id: `MAT-${Date.now()}`,
			project: "",
			material: "",
			reconciliationDate: new Date().toISOString().split("T")[0],
			unit: MATERIAL_UNITS[0],
			ordered: 0,
			delivered: 0,
			used: 0,
			wasted: 0,
			remaining: 0,
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveMaterialReconciliation(current);
		await loadReconciliations();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<MaterialReconciliation>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteMaterialReconciliation(current.id);
		await loadReconciliations();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	if (showForm && current) {
		const variance = current.delivered - (current.used + current.wasted);
		const wastePercent = current.delivered > 0 ? (current.wasted / current.delivered) * 100 : 0;

		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Material Reconciliation" subtitle="Material Tracking" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
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
									Date
								</label>
								<input
									type="date"
									value={current.reconciliationDate}
									onChange={(e) => update({ reconciliationDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Material
								</label>
								<input
									type="text"
									value={current.material}
									onChange={(e) => update({ material: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Unit
								</label>
								<select
									value={current.unit}
									onChange={(e) => update({ unit: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{MATERIAL_UNITS.map((unit) => (
										<option key={unit} value={unit}>
											{unit}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-4">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Ordered
								</label>
								<input
									type="number"
									value={current.ordered}
									onChange={(e) => update({ ordered: parseFloat(e.target.value) })}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Delivered
								</label>
								<input
									type="number"
									value={current.delivered}
									onChange={(e) => update({ delivered: parseFloat(e.target.value) })}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Used
								</label>
								<input
									type="number"
									value={current.used}
									onChange={(e) => update({ used: parseFloat(e.target.value) })}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Wasted
								</label>
								<input
									type="number"
									value={current.wasted}
									onChange={(e) => update({ wasted: parseFloat(e.target.value) })}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="rounded-xl bg-[var(--surface-2)] p-4">
							<div className="grid gap-3 md:grid-cols-2">
								<div>
									<p className="text-xs text-[var(--muted)] mb-1">Variance</p>
									<p
										className={`text-2xl font-bold ${
											variance >= 0 ? "text-green-600" : "text-red-600"
										}`}
									>
										{variance > 0 ? "+" : ""}
										{variance.toFixed(2)} {current.unit}
									</p>
								</div>
								<div>
									<p className="text-xs text-[var(--muted)] mb-1">Waste %</p>
									<p
										className={`text-2xl font-bold ${
											wastePercent > 5 ? "text-red-600" : "text-[var(--ink)]"
										}`}
									>
										{wastePercent.toFixed(1)}%
									</p>
								</div>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Notes
							</label>
							<textarea
								value={current.notes || ""}
								onChange={(e) => update({ notes: e.target.value })}
								rows={3}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
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
									Save Reconciliation
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.material || "Reconciliation"}
						onConfirm={handleDelete}
						onCancel={() => setShowDeleteConfirm(false)}
						isLoading={deleteLoading}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Material Reconciliation"
				subtitle="Material Tracking & Waste Analysis"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Entry
					</button>
				}
			/>

			<div className="grid gap-4">
				{reconciliations.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">📦</p>
						<p className="text-[var(--muted)]">No material reconciliations yet</p>
					</div>
				) : (
					reconciliations.map((rec) => {
						const variance = rec.delivered - (rec.used + rec.wasted);
						const wastePercent = rec.delivered > 0 ? (rec.wasted / rec.delivered) * 100 : 0;

						return (
							<div
								key={rec.id}
								className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
								onClick={() => {
									setCurrent(rec);
									setShowForm(true);
								}}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
											{rec.reconciliationDate}
										</p>
										<h3 className="text-lg font-semibold text-[var(--ink)] mt-1">
											{rec.material}
										</h3>
										<p className="text-sm text-[var(--muted)] mt-1">
											{rec.project} • Delivered: {rec.delivered} {rec.unit} • Used:{" "}
											{rec.used} {rec.unit} • Wasted: {rec.wasted} {rec.unit} (
											{wastePercent.toFixed(1)}%)
										</p>
										<p
											className={`text-sm font-semibold mt-2 ${
												variance >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											Variance: {variance > 0 ? "+" : ""}
											{variance.toFixed(2)} {rec.unit}
										</p>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
