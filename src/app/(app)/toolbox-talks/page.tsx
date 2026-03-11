"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type ToolBoxTalk,
	saveToolBoxTalk,
	deleteToolBoxTalk,
	getToolBoxTalks,
	COMMON_TOOLBOX_TOPICS,
} from "@/lib/project-management";

export default function ToolBoxTalksPage() {
	const [talks, setTalks] = useState<ToolBoxTalk[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<ToolBoxTalk | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadTalks();
	}, []);

	async function loadTalks() {
		const loaded = await getToolBoxTalks();
		setTalks(loaded.sort((a, b) => b.date.localeCompare(a.date)));
	}

	function handleNew() {
		setCurrent({
			id: `TBT-${Date.now()}`,
			date: new Date().toISOString().split("T")[0],
			project: "",
			topic: "",
			presenter: "",
			duration: 15,
			keyPoints: [""],
			attendees: [],
			createdAt: new Date().toISOString(),
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveToolBoxTalk(current);
		await loadTalks();
		setShowForm(false);
		setCurrent(null);
	}

	async function handleDelete() {
		if (!current) return;
		setDeleteLoading(true);
		await deleteToolBoxTalk(current.id);
		await loadTalks();
		setDeleteLoading(false);
		setShowDeleteConfirm(false);
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<ToolBoxTalk>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	if (showForm && current) {
		return (
		  <PermissionGuard permission="projects">
			<div className="flex flex-col gap-6">
				<PageHeader title="Toolbox Talk" subtitle="Safety Briefings" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Date
								</label>
								<input
									type="date"
									value={current.date}
									onChange={(e) => update({ date: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Duration (min)
								</label>
								<input
									type="number"
									value={current.duration}
									onChange={(e) => update({ duration: parseInt(e.target.value) })}
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
									Presenter
								</label>
								<input
									type="text"
									value={current.presenter}
									onChange={(e) => update({ presenter: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Topic
							</label>
							<select
								value={current.topic}
								onChange={(e) => update({ topic: e.target.value })}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							>
								<option value="">Select topic...</option>
								{COMMON_TOOLBOX_TOPICS.map((topic) => (
									<option key={topic} value={topic}>
										{topic}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-3">
								Key Points
							</label>
							<div className="space-y-2">
								{current.keyPoints.map((point, idx) => (
									<div key={idx} className="flex gap-2">
										<input
											type="text"
											value={point}
											onChange={(e) => {
												const updated = [...current.keyPoints];
												updated[idx] = e.target.value;
												update({ keyPoints: updated });
											}}
											placeholder={`Point ${idx + 1}`}
											className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
										/>
										<button
											onClick={() => {
												const updated = current.keyPoints.filter((_, i) => i !== idx);
												update({ keyPoints: updated });
											}}
											className="rounded-xl border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
										>
											✕
										</button>
									</div>
								))}
								<button
									onClick={() => update({ keyPoints: [...current.keyPoints, ""] })}
									className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white"
								>
									+ Add Point
								</button>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-3">
								Attendees
							</label>
							<div className="space-y-2">
								{current.attendees.map((attendee, idx) => (
									<div key={idx} className="flex gap-2">
										<input
											type="text"
											value={attendee.name}
											onChange={(e) => {
												const updated = [...current.attendees];
												updated[idx] = { ...updated[idx], name: e.target.value };
												update({ attendees: updated });
											}}
											placeholder="Name"
											className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
										/>
										<input
											type="text"
											value={attendee.company || ""}
											onChange={(e) => {
												const updated = [...current.attendees];
												updated[idx] = { ...updated[idx], company: e.target.value };
												update({ attendees: updated });
											}}
											placeholder="Company"
											className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
										/>
										<button
											onClick={() => {
												const updated = current.attendees.filter((_, i) => i !== idx);
												update({ attendees: updated });
											}}
											className="rounded-xl border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
										>
											✕
										</button>
									</div>
								))}
								<button
									onClick={() =>
										update({
											attendees: [...current.attendees, { name: "" }],
										})
									}
									className="rounded-xl bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white"
								>
									+ Add Attendee
								</button>
							</div>
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
									Save Talk
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.topic || "Talk"}
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
				title="Toolbox Talks"
				subtitle="Safety Briefings & Training"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Talk
					</button>
				}
			/>

			<div className="grid gap-4">
				{talks.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">👷</p>
						<p className="text-[var(--muted)]">No toolbox talks recorded yet</p>
					</div>
				) : (
					talks.map((talk) => (
						<div
							key={talk.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(talk);
								setShowForm(true);
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
										{talk.date}
									</p>
									<h3 className="text-lg font-semibold text-[var(--ink)] mt-1">
										{talk.topic}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
										{talk.presenter} • {talk.attendees.length} attendees
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
