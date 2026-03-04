"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type LessonLearned,
	saveLessonLearned,
	getLessonsLearned,
	deleteLessonLearned,
} from "@/lib/additional-modules";

const LESSON_CATEGORIES = ["technical", "safety", "quality", "commercial", "programme", "management"] as const;

export default function LessonsLearnedPage() {
	const [lessons, setLessons] = useState<LessonLearned[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<LessonLearned | null>(null);
	const [filter, setFilter] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadLessons();
	}, []);

	async function loadLessons() {
		const loaded = await getLessonsLearned();
		setLessons(loaded.sort((a, b) => b.date.localeCompare(a.date)));
	}

	function handleNew() {
		setCurrent({
			id: `LL-${Date.now()}`,
			project: "",
			category: "technical",
			title: "",
			description: "",
			whatWentWell: "",
			challenge: "",
			solution: "",
			recommendation: "",
			submittedBy: "",
			date: new Date().toISOString().split("T")[0],
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveLessonLearned(current);
		await loadLessons();
		setShowForm(false);
		setCurrent(null);
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteLessonLearned(current.id);
		await loadLessons();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	function update(updates: Partial<LessonLearned>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	const filtered = lessons.filter((lesson) => {
		const matchesFilter = filter === "all" || lesson.category === filter;
		const matchesSearch =
			!searchTerm ||
			lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(lesson.challenge?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
			(lesson.solution?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
			(lesson.whatWentWell?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
			lesson.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
		return matchesFilter && matchesSearch;
	});

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Lessons Learned" subtitle="Knowledge management and continuous improvement" />

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
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Date</label>
								<input
									type="date"
									value={current.date}
									onChange={(e) => update({ date: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Category</label>
								<select
									value={current.category}
									onChange={(e) =>
										update({ category: e.target.value as LessonLearned["category"] })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{LESSON_CATEGORIES.map((cat) => (
										<option key={cat} value={cat}>
											{cat.charAt(0).toUpperCase() + cat.slice(1)}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Submitted By</label>
								<input
									type="text"
									value={current.submittedBy}
									onChange={(e) => update({ submittedBy: e.target.value })}
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

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Description</label>
							<textarea
								value={current.description}
								onChange={(e) => update({ description: e.target.value })}
								rows={2}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">What Went Well</label>
								<textarea
									value={current.whatWentWell || ""}
									onChange={(e) => update({ whatWentWell: e.target.value })}
									rows={2}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Challenge</label>
								<textarea
									value={current.challenge || ""}
									onChange={(e) => update({ challenge: e.target.value })}
									rows={2}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Solution</label>
								<textarea
									value={current.solution || ""}
									onChange={(e) => update({ solution: e.target.value })}
									rows={2}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">Recommendation</label>
								<textarea
									value={current.recommendation}
									onChange={(e) => update({ recommendation: e.target.value })}
									rows={2}
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
						itemName={current.title}
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
				title="Lessons Learned"
				subtitle="Knowledge base for continuous improvement"
				actions={
					<button
						onClick={handleNew}
						className="rounded-xl bg-blue-500 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600"
					>
						New Lesson
					</button>
				}
			/>

			<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
				<div className="flex gap-4 mb-6 flex-wrap items-center">
					<input
						type="text"
						placeholder="Search lessons..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink)] placeholder-[var(--muted)]"
					/>
					<div className="flex gap-3 flex-wrap">
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
						{LESSON_CATEGORIES.map((cat: string) => (
							<button
								key={cat}
								onClick={() => setFilter(cat)}
								className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300 capitalize ${
									filter === cat
										? "bg-[var(--accent)] text-white"
										: "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
								}`}
							>
								{cat}
							</button>
						))}
					</div>
				</div>

				{filtered.length === 0 ? (
					<p className="text-center py-12 text-[var(--muted)]">No lessons to display</p>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{filtered.map((lesson: LessonLearned) => (
							<button
								key={lesson.id}
								onClick={() => setCurrent(lesson)}
								className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-4 hover:shadow-lg transition-all duration-300 text-left border border-[var(--line)]"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1">
										<p className="font-semibold text-[var(--ink)]">{lesson.title}</p>
										<p className="text-sm text-[var(--muted)] mt-1">{lesson.project}</p>
									</div>
									<span className="inline-flex items-center rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-600 capitalize">
										{lesson.category}
									</span>
								</div>
								<p className="text-xs text-[var(--muted)] mt-3">
									{lesson.date}
									{lesson.submittedBy && ` • ${lesson.submittedBy}`}
								</p>
								{lesson.challenge && (
									<p className="text-xs text-[var(--ink)] mt-2 line-clamp-2">
										Challenge: {lesson.challenge.substring(0, 80)}...
									</p>
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
