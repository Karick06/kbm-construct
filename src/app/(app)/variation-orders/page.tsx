"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type VariationOrder,
	saveVariationOrder,
	getVariationOrders,
	deleteVariationOrder,
	VO_REASONS,
} from "@/lib/project-management";

export default function VariationOrdersPage() {
	const [vos, setVos] = useState<VariationOrder[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<VariationOrder | null>(null);
	const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadVOs();
	}, []);

	async function loadVOs() {
		const loaded = await getVariationOrders();
		setVos(loaded.sort((a, b) => b.voNumber.localeCompare(a.voNumber)));
	}

	function handleNew() {
		const nextNum = vos.length + 1;
		setCurrent({
			id: `VO-${Date.now()}`,
			voNumber: `VO-${String(nextNum).padStart(4, "0")}`,
			project: "",
			title: "",
			description: "",
			reason: VO_REASONS[0],
			estimatedCost: 0,
			estimatedDays: 0,
			status: "draft",
			createdBy: "",
			createdAt: new Date().toISOString(),
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveVariationOrder(current);
		await loadVOs();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<VariationOrder>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteVariationOrder(current.id);
		await loadVOs();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	const filtered = vos.filter((vo) => {
		if (filter === "all") return true;
			if (filter === "pending") return vo.status === "draft" || vo.status === "submitted";

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Variation Order" subtitle="Contract Change Management" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									VO Number
								</label>
								<input
									type="text"
									value={current.voNumber}
									onChange={(e) => update({ voNumber: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Status
								</label>
								<select
									value={current.status}
									onChange={(e) =>
										update({ status: e.target.value as VariationOrder["status"] })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="pending">Pending</option>
									<option value="approved">Approved</option>
									<option value="rejected">Rejected</option>
								</select>
							</div>
						</div>

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
								Title
							</label>
							<input
								type="text"
								value={current.title}
								onChange={(e) => update({ title: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Description
							</label>
							<textarea
								value={current.description}
								onChange={(e) => update({ description: e.target.value })}
								rows={4}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Reason
							</label>
							<select
								value={current.reason}
								onChange={(e) => update({ reason: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							>
								{VO_REASONS.map((reason) => (
									<option key={reason} value={reason}>
										{reason}
									</option>
								))}
							</select>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Estimated Cost (£)
								</label>
								<input
									type="number"
									value={current.estimatedCost}
									onChange={(e) => update({ estimatedCost: parseFloat(e.target.value) })}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Estimated Days
								</label>
								<input
									type="number"
									value={current.estimatedDays}
									onChange={(e) => update({ estimatedDays: parseInt(e.target.value) })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Created By
							</label>
							<input
								type="text"
								value={current.createdBy}
								onChange={(e) => update({ createdBy: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Submitted Date
							</label>
							<input
								type="date"
								value={current.submittedDate || ""}
								onChange={(e) => update({ submittedDate: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>
					</div>

						{current.status === "approved" && (
							<div className="grid gap-4 md:grid-cols-3">
								<div>
									<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Actual Cost (£)
								</label>
								<input
									type="number"
									value={current.actualCost || 0}
									onChange={(e) =>
										update({ actualCost: parseFloat(e.target.value) })
									}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Approved By
								</label>
								<input
									type="text"
									value={current.approvedBy || ""}
									onChange={(e) => update({ approvedBy: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Approval Date
								</label>
								<input
									type="date"
									value={current.approvedDate || ""}
									onChange={(e) => update({ approvedDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>
				)}

				<div className="flex gap-3 justify-end pt-4 border-t border-[var(--line)]">
					{current.id && (
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
							Save VO
						</button>
					</div>
				</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Variation Orders"
				subtitle="Contract Change Management"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New VO
					</button>
				}
			/>

			<div className="flex gap-2 mb-4">
				{(["all", "pending", "approved", "rejected"] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`rounded-full px-4 py-2 text-sm font-semibold ${
							filter === f
								? "bg-[var(--accent)] text-white"
								: "bg-[var(--surface)] text-[var(--ink)]"
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
						<p className="text-[var(--muted)]">No variation orders found</p>
					</div>
				) : (
					filtered.map((vo) => (
						<div
							key={vo.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(vo);
								setShowForm(true);
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
											{vo.voNumber}
										</p>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												vo.status === "approved"
													? "bg-green-500/10 text-green-600"
													: vo.status === "rejected"
													? "bg-red-500/10 text-red-600"
													: "bg-yellow-500/10 text-yellow-600"
											}`}
										>
											{vo.status.toUpperCase()}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-[var(--ink)]">
										{vo.description}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
										{vo.project} • {vo.reason} • £
										{vo.status === "approved" && vo.actualCost
											? vo.actualCost.toLocaleString()
											: vo.estimatedCost.toLocaleString()}{" "}
										• {vo.estimatedDays} days
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
