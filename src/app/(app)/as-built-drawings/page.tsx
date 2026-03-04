"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type AsBuiltDrawing,
	saveAsBuiltDrawing,
	getAsBuiltDrawings,
	deleteAsBuiltDrawing,
	DRAWING_DISCIPLINES,
} from "@/lib/additional-modules";

export default function AsBuiltDrawingsPage() {
	const [drawings, setDrawings] = useState<AsBuiltDrawing[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<AsBuiltDrawing | null>(null);
	const [filter, setFilter] = useState<string>("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadDrawings();
	}, []);

	async function loadDrawings() {
		const loaded = await getAsBuiltDrawings();
		setDrawings(loaded.sort((a: AsBuiltDrawing, b: AsBuiltDrawing) => b.issueDate.localeCompare(a.issueDate)));
	}

	function handleNew() {
		setCurrent({
			id: `DWG-${Date.now()}`,
			project: "",
			drawingNumber: "",
			title: "",
			discipline: DRAWING_DISCIPLINES[0],
			revisionNumber: "P01",
			issueDate: new Date().toISOString().split("T")[0],
			changesDescription: "",
			status: "draft",
			issuedBy: "",
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveAsBuiltDrawing(current);
		await loadDrawings();
		setShowForm(false);
		setCurrent(null);
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteAsBuiltDrawing(current.id);
		await loadDrawings();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	function update(updates: Partial<AsBuiltDrawing>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	const filtered = drawings.filter((dwg: AsBuiltDrawing) => {
		if (filter === "all") return true;
		return dwg.status === filter;
	});

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="As-Built Drawings" subtitle="Construction Documentation" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Project</label>
								<input
									type="text"
									value={current.project}
									onChange={(e) => update({ project: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Drawing Number</label>
								<input
									type="text"
									value={current.drawingNumber}
									onChange={(e) => update({ drawingNumber: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Title</label>
							<input
								type="text"
								value={current.title}
								onChange={(e) => update({ title: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Discipline</label>
								<select
									value={current.discipline}
									onChange={(e) => update({ discipline: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{DRAWING_DISCIPLINES.map((d: string) => (
										<option key={d} value={d}>
											{d}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Revision</label>
								<input
									type="text"
									value={current.revisionNumber}
									onChange={(e) => update({ revisionNumber: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Issue Date</label>
								<input
									type="date"
									value={current.issueDate}
									onChange={(e) => update({ issueDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Status</label>
								<select
									value={current.status}
									onChange={(e) => update({ status: e.target.value as AsBuiltDrawing["status"] })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="draft">Draft</option>
									<option value="for-review">For Review</option>
									<option value="approved">Approved</option>
									<option value="superseded">Superseded</option>
								</select>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Changes Description</label>
							<textarea
								value={current.changesDescription}
								onChange={(e) => update({ changesDescription: e.target.value })}
								rows={3}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Issued By</label>
								<input
									type="text"
									value={current.issuedBy}
									onChange={(e) => update({ issuedBy: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Approved By</label>
								<input
									type="text"
									value={current.approvedBy || ""}
									onChange={(e) => update({ approvedBy: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

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
									Save
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.title || current.drawingNumber}
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
				title="As-Built Drawings"
				subtitle="Construction drawing version control and management"
				actions={
					<button
						onClick={handleNew}
						className="rounded-xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600"
					>
						New Drawing
					</button>
				}
			/>

			<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
				<div className="flex gap-3 mb-6 flex-wrap">
					<button
						onClick={() => setFilter("all")}
						className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
							filter === "all"
								? "bg-[var(--accent)] text-white"
								: "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
						}`}
					>
						All
					</button>
					{["draft", "for-review", "approved", "superseded"].map((status: string) => (
						<button
							key={status}
							onClick={() => setFilter(status)}
							className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300 capitalize ${
								filter === status
									? "bg-[var(--accent)] text-white"
									: "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
							}`}
						>
							{status}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<p className="text-center py-12 text-[var(--muted)]">No drawings to display</p>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{filtered.map((dwg: AsBuiltDrawing) => (
							<button
								key={dwg.id}
								onClick={() => setCurrent(dwg)}
								className="group relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-4 hover:shadow-lg transition-all duration-300 text-left border border-[var(--line)]"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1">
										<p className="font-semibold text-[var(--ink)]">
											{dwg.drawingNumber} Rev. {dwg.revisionNumber}
										</p>
										<p className="text-sm text-[var(--muted)] mt-1">{dwg.title}</p>
									</div>
									<span className="inline-flex items-center rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 capitalize">
										{dwg.status}
									</span>
								</div>
								<p className="text-xs text-[var(--muted)] mt-3">
									{dwg.discipline} • Issued: {dwg.issueDate}
									{dwg.issuedBy && ` • By ${dwg.issuedBy}`}
								</p>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
