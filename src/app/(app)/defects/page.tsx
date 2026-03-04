"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type Defect,
	saveDefect,
	getDefects,
	deleteDefect,
	TRADES,
} from "@/lib/project-management";
import { getProjectNames } from "@/lib/operations-data";

export default function DefectsPage() {
	const [defects, setDefects] = useState<Defect[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<Defect | null>(null);
	const [filter, setFilter] = useState<"all" | "open" | "in-progress" | "resolved" | "verified" | "closed">("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [projectNames, setProjectNames] = useState<string[]>([]);

	useEffect(() => {
		loadDefects();
		setProjectNames(getProjectNames());
	}, []);

	async function loadDefects() {
		const loaded = await getDefects();
		setDefects(loaded.sort((a, b) => b.raisedDate.localeCompare(a.raisedDate)));
	}

	function handleNew() {
		setCurrent({
			id: `DEF-${Date.now()}`,
			defectNumber: `DEF-${Date.now()}`,
			project: "",
			location: "",
			description: "",
			severity: "minor",
			trade: TRADES[0],
			raisedBy: "",
			raisedDate: new Date().toISOString().split("T")[0],
			status: "open",
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveDefect(current);
		await loadDefects();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<Defect>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteDefect(current.id);
		await loadDefects();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	const filtered = defects.filter((def) => {
		if (filter === "all") return true;
		return def.status === filter;
	});

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Defect / Snag" subtitle="Quality Management" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Severity
								</label>
								<select
									value={current.severity}
									onChange={(e) =>
										update({ severity: e.target.value as Defect["severity"] })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="minor">Minor</option>
									<option value="major">Major</option>
									<option value="critical">Critical</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Status
								</label>
								<select
									value={current.status}
									onChange={(e) => update({ status: e.target.value as Defect["status"] })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="open">Open</option>
									<option value="in-progress">In Progress</option>
									<option value="resolved">Resolved</option>
									<option value="verified">Verified</option>
									<option value="closed">Closed</option>
								</select>
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
								Description
							</label>
							<textarea
								value={current.description}
								onChange={(e) => update({ description: e.target.value })}
								rows={4}
								placeholder="Describe the defect..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Trade
								</label>
								<select
									value={current.trade}
									onChange={(e) => update({ trade: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{TRADES.map((trade) => (
										<option key={trade} value={trade}>
											{trade}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Target Date
								</label>
								<input
									type="date"
									value={current.targetDate || ""}
									onChange={(e) => update({ targetDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Raised By
								</label>
								<input
									type="text"
									value={current.raisedBy}
									onChange={(e) => update({ raisedBy: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Raised Date
								</label>
								<input
									type="date"
									value={current.raisedDate}
									onChange={(e) => update({ raisedDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						{current.status !== "open" && (
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Assigned To
								</label>
								<input
									type="text"
									value={current.assignedTo || ""}
									onChange={(e) => update({ assignedTo: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						)}

						{(current.status === "resolved" ||
							current.status === "verified" ||
							current.status === "closed") && (
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Resolved Date
								</label>
								<input
									type="date"
									value={current.resolvedDate || ""}
									onChange={(e) => update({ resolvedDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						)}

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Photo URLs (one per line)
							</label>
							<textarea
								value={current.photos?.join("\n") || ""}
								onChange={(e) =>
									update({ photos: e.target.value.split("\n").filter((p) => p.trim()) })
								}
								rows={3}
								placeholder="https://..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
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
									Save Defect
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.defectNumber || "Defect"}
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
				title="Defects & Snagging"
				subtitle="Quality Management"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Defect
					</button>
				}
			/>

			<div className="flex gap-2 mb-4">
				{(["all", "open", "in-progress", "resolved", "verified"] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`rounded-full px-4 py-2 text-sm font-semibold ${
							filter === f
								? "bg-[var(--accent)] text-white"
								: "bg-[var(--surface)] text-[var(--ink)]"
						}`}
					>
						{f === "all"
							? "All"
							: f === "in-progress"
							? "In Progress"
							: f.charAt(0).toUpperCase() + f.slice(1)}
					</button>
				))}
			</div>

			<div className="grid gap-4">
				{filtered.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">✅</p>
						<p className="text-[var(--muted)]">No defects found</p>
					</div>
				) : (
					filtered.map((def) => (
						<div
							key={def.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(def);
								setShowForm(true);
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												def.severity === "critical"
													? "bg-red-500/10 text-red-600"
													: def.severity === "major"
													? "bg-orange-500/10 text-orange-600"
													: "bg-yellow-500/10 text-yellow-600"
											}`}
										>
											{def.severity.toUpperCase()}
										</span>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												def.status === "verified" || def.status === "closed"
													? "bg-green-500/10 text-green-600"
													: def.status === "resolved"
													? "bg-blue-500/10 text-blue-600"
													: def.status === "in-progress"
													? "bg-yellow-500/10 text-yellow-600"
													: "bg-gray-500/10 text-gray-600"
											}`}
										>
											{def.status.toUpperCase()}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-[var(--ink)]">
										{def.description}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
										{def.project} • {def.location} • {def.trade} • Raised by{" "}
										{def.raisedBy} on {def.raisedDate}
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
