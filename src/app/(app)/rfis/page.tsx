"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type RFI,
	saveRFI,
	getRFIs,
	deleteRFI,
	RFI_DISCIPLINES,
} from "@/lib/project-management";
import { getProjectNames } from "@/lib/operations-data";

export default function RFIsPage() {
	const [rfis, setRfis] = useState<RFI[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<RFI | null>(null);
	const [filter, setFilter] = useState<"all" | "open" | "answered" | "closed">("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [projectNames, setProjectNames] = useState<string[]>([]);

	useEffect(() => {
		loadRFIs();
		setProjectNames(getProjectNames());
	}, []);

	async function loadRFIs() {
		const loaded = await getRFIs();
		setRfis(loaded.sort((a, b) => b.rfiNumber.localeCompare(a.rfiNumber)));
	}

	function handleNew() {
		const nextNum = rfis.length + 1;
		setCurrent({
			id: `RFI-${Date.now()}`,
			rfiNumber: `RFI-${String(nextNum).padStart(4, "0")}`,
			project: "",
			subject: "",
			discipline: RFI_DISCIPLINES[0],
			question: "",
			priority: "medium",
			raisedBy: "",
			raisedDate: new Date().toISOString().split("T")[0],
			responseRequired: new Date().toISOString().split("T")[0],
			status: "open",
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveRFI(current);
		await loadRFIs();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<RFI>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteRFI(current.id);
		await loadRFIs();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	const filtered = rfis.filter((rfi) => {
		if (filter === "all") return true;
		return rfi.status === filter;
	});

	if (showForm && current) {
		return (
		  <PermissionGuard permission="projects">
			<div className="flex flex-col gap-6">
				<PageHeader title="Request for Information" subtitle="Design & Technical Queries" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-3">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									RFI Number
								</label>
								<input
									type="text"
									value={current.rfiNumber}
									onChange={(e) => update({ rfiNumber: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Priority
								</label>
								<select
									value={current.priority}
									onChange={(e) => update({ priority: e.target.value as RFI["priority"] })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="urgent">Urgent</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Status
								</label>
								<select
									value={current.status}
									onChange={(e) => update({ status: e.target.value as RFI["status"] })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="open">Open</option>
									<option value="answered">Answered</option>
									<option value="closed">Closed</option>
								</select>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Project
								</label>
							<select
								value={current.project}
								onChange={(e) => update({ project: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							>
								<option value="">Select a project...</option>
								{projectNames.map((name) => (
									<option key={name} value={name}>{name}</option>
								))}
							</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Discipline
								</label>
								<select
									value={current.discipline}
									onChange={(e) => update({ discipline: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{RFI_DISCIPLINES.map((disc) => (
										<option key={disc} value={disc}>
											{disc}
										</option>
									))}
								</select>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Question
							</label>
							<textarea
								value={current.question}
								onChange={(e) => update({ question: e.target.value })}
								rows={6}
								placeholder="Describe the information required..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						{current.status !== "open" && (
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Response
								</label>
								<textarea
									value={current.response || ""}
									onChange={(e) => update({ response: e.target.value })}
									rows={6}
									placeholder="Response from design team..."
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						)}

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
							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
										Responded By
									</label>
									<input
										type="text"
										value={current.respondedBy || ""}
										onChange={(e) => update({ respondedBy: e.target.value })}
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
										Response Date
									</label>
									<input
										type="date"
										value={current.respondedDate || ""}
										onChange={(e) => update({ respondedDate: e.target.value })}
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
									Save RFI
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={`RFI ${current.rfiNumber}`}
						onConfirm={handleDelete}
						onCancel={() => setShowDeleteConfirm(false)}
						isLoading={deleteLoading}
					/>
				)}
			</div>
		  </PermissionGuard>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="RFIs"
				subtitle="Requests for Information"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New RFI
					</button>
				}
			/>

			<div className="flex items-center gap-3">
				{(["all", "open", "answered", "closed"] as const).map((status) => (
					<button
						key={status}
						onClick={() => setFilter(status)}
						className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
							filter === status
								? "bg-[var(--accent)] text-white"
								: "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
						}`}
					>
						{status.toUpperCase()} ({status === "all" ? rfis.length : rfis.filter((r) => r.status === status).length})
					</button>
				))}
			</div>

			<div className="grid gap-4">
				{filtered.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">❓</p>
						<p className="text-[var(--muted)]">No RFIs found</p>
					</div>
				) : (
					filtered.map((rfi) => (
						<div
							key={rfi.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(rfi);
								setShowForm(true);
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
											{rfi.rfiNumber}
										</p>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												rfi.priority === "urgent"
													? "bg-red-500/10 text-red-600"
													: rfi.priority === "high"
													? "bg-orange-500/10 text-orange-600"
													: rfi.priority === "medium"
													? "bg-yellow-500/10 text-yellow-600"
													: "bg-gray-500/10 text-gray-600"
											}`}
										>
											{rfi.priority.toUpperCase()}
										</span>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												rfi.status === "closed"
													? "bg-green-500/10 text-green-600"
													: rfi.status === "answered"
													? "bg-blue-500/10 text-blue-600"
													: "bg-gray-500/10 text-gray-600"
											}`}
										>
											{rfi.status.toUpperCase()}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-[var(--ink)]">
										{rfi.question.substring(0, 80)}
										{rfi.question.length > 80 && "..."}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
									<Link 
										href="/projects" 
										className="text-[var(--accent)] hover:underline"
										onClick={(e) => e.stopPropagation()}
									>
										{rfi.project}
									</Link> • {rfi.discipline} • Raised by {rfi.raisedBy} on {rfi.raisedDate}
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
