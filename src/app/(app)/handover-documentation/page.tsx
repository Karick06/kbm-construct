"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type HandoverDocument,
	saveHandoverDocument,
	getHandoverDocuments,
	deleteHandoverDocument,
} from "@/lib/additional-modules";

const DOCUMENT_TYPES = ["O&M Manual", "Warranty", "Test Certificate", "As-Built", "Compliance Cert", "Other"] as const;
const STATUS_OPTIONS = ["required", "in-progress", "review", "approved", "handed-over"] as const;

export default function HandoverDocumentationPage() {
	const [documents, setDocuments] = useState<HandoverDocument[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<HandoverDocument | null>(null);
	const [filter, setFilter] = useState<string>("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadDocuments();
	}, []);

	async function loadDocuments() {
		const loaded = await getHandoverDocuments();
		setDocuments(
			loaded.sort(
				(a: HandoverDocument, b: HandoverDocument) =>
					(b.completedDate || b.dueDate).localeCompare(a.completedDate || a.dueDate)
			)
		);
	}

	function handleNew() {
		setCurrent({
			id: `HOD-${Date.now()}`,
			project: "",
			documentType: "O&M Manual",
			title: "",
			status: "required",
			dueDate: new Date().toISOString().split("T")[0],
			responsiblePerson: "",
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveHandoverDocument(current);
		await loadDocuments();
		setShowForm(false);
		setCurrent(null);
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteHandoverDocument(current.id);
		await loadDocuments();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	function update(updates: Partial<HandoverDocument>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	const filtered = documents.filter((doc: HandoverDocument) => {
		if (filter === "all") return true;
		return doc.status === (filter as HandoverDocument["status"]);
	});

	if (showForm && current) {
		return (
		  <PermissionGuard permission="projects">
			<div className="flex flex-col gap-6">
				<PageHeader title="Handover Documentation" subtitle="Project completion management" />

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
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Document Type</label>
								<select
									value={current.documentType}
									onChange={(e) =>
										update({ documentType: e.target.value as HandoverDocument["documentType"] })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{DOCUMENT_TYPES.map((type: string) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>
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
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Responsible Person
								</label>
								<input
									type="text"
									value={current.responsiblePerson}
									onChange={(e) => update({ responsiblePerson: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Location</label>
								<input
									type="text"
									value={current.location || ""}
									onChange={(e) => update({ location: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Due Date</label>
								<input
									type="date"
									value={current.dueDate}
									onChange={(e) => update({ dueDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Completed Date</label>
								<input
									type="date"
									value={current.completedDate || ""}
									onChange={(e) => update({ completedDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Status</label>
								<select
									value={current.status}
									onChange={(e) =>
										update({ status: e.target.value as HandoverDocument["status"] })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{STATUS_OPTIONS.map((status: string) => (
										<option key={status} value={status}>
											{status.replace(/-/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
										</option>
									))}
								</select>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Notes</label>
							<textarea
								value={current.notes || ""}
								onChange={(e) => update({ notes: e.target.value })}
								rows={3}
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
									Save
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.title}
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
				title="Handover Documentation"
				subtitle="Manage project completion checklists and handovers"
				actions={
					<button
						onClick={handleNew}
						className="rounded-xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600"
					>
						New Document
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
					{STATUS_OPTIONS.map((status: string) => (
						<button
							key={status}
							onClick={() => setFilter(status)}
							className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300 capitalize ${
								filter === status
									? "bg-[var(--accent)] text-white"
									: "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
							}`}
						>
							{status.replace(/-/g, " ")}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<p className="text-center py-12 text-[var(--muted)]">No documents to display</p>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{filtered.map((doc: HandoverDocument) => (
							<button
								key={doc.id}
								onClick={() => setCurrent(doc)}
								className="group relative bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-4 hover:shadow-lg transition-all duration-300 text-left border border-[var(--line)]"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1">
										<p className="font-semibold text-[var(--ink)]">{doc.title}</p>
										<p className="text-sm text-[var(--muted)] mt-1">{doc.project}</p>
									</div>
									<span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 capitalize">
										{doc.status}
									</span>
								</div>
								<p className="text-xs text-[var(--muted)] mt-3">
									{doc.documentType} • {doc.dueDate}
									{doc.responsiblePerson && ` • ${doc.responsiblePerson}`}
								</p>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
