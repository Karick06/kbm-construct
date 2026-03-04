"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type Photo,
	savePhoto,
	getPhotos,
	deletePhoto,
} from "@/lib/project-management";

const PHOTO_CATEGORIES: Photo["category"][] = [
	"progress",
	"quality",
	"safety",
	"defect",
	"completion",
	"other",
];

export default function PhotosPage() {
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<Photo | null>(null);
	const [filter, setFilter] = useState<string>("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadPhotos();
	}, []);

	async function loadPhotos() {
		const loaded = await getPhotos();
		setPhotos(loaded.sort((a, b) => b.date.localeCompare(a.date)));
	}

	function handleNew() {
		setCurrent({
			id: `PHOTO-${Date.now()}`,
			project: "",
			location: "",
			category: PHOTO_CATEGORIES[0],
			date: new Date().toISOString().split("T")[0],
			url: "",
			createdAt: new Date().toISOString(),
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await savePhoto(current);
		await loadPhotos();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<Photo>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deletePhoto(current.id);
		await loadPhotos();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	const filtered = photos.filter((photo) => {
		if (filter === "all") return true;
		return photo.category === filter;
	});

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Photo Documentation" subtitle="Visual Record" />

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

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Category
								</label>
								<select
									value={current.category}
									onChange={(e) => update({ category: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{PHOTO_CATEGORIES.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
								</select>
							</div>
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
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Photo URL
							</label>
							<input
								type="url"
								value={current.url}
								onChange={(e) => update({ url: e.target.value })}
								placeholder="https://..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Description
							</label>
							<textarea
								value={current.description || ""}
								onChange={(e) => update({ description: e.target.value })}
								rows={3}
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Tags (comma-separated)
							</label>
							<input
								type="text"
								value={current.tags?.join(", ") || ""}
								onChange={(e) =>
									update({
										tags: e.target.value
											.split(",")
											.map((t) => t.trim())
											.filter((t) => t),
									})
								}
								placeholder="excavation, foundation, steel"
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
									Save Photo
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.url?.split("/").pop() || "Photo"}
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
				title="Photo Documentation"
				subtitle="Visual Record Management"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ Add Photo
					</button>
				}
			/>

			<div className="flex gap-2 mb-4 overflow-x-auto">
				<button
					onClick={() => setFilter("all")}
					className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
						filter === "all"
							? "bg-[var(--accent)] text-white"
							: "bg-[var(--surface)] text-[var(--ink)]"
					}`}
				>
					All
				</button>
				{PHOTO_CATEGORIES.map((cat) => (
					<button
						key={cat}
						onClick={() => setFilter(cat)}
						className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
							filter === cat
								? "bg-[var(--accent)] text-white"
								: "bg-[var(--surface)] text-[var(--ink)]"
						}`}
					>
						{cat}
					</button>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filtered.length === 0 ? (
					<div className="col-span-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">📷</p>
						<p className="text-[var(--muted)]">No photos uploaded yet</p>
					</div>
				) : (
					filtered.map((photo) => (
						<div
							key={photo.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(photo);
								setShowForm(true);
							}}
						>
							<div className="aspect-video bg-[var(--surface-2)] flex items-center justify-center text-5xl">
								📷
							</div>
							<div className="p-4">
								<div className="flex items-center gap-2 mb-2">
									<span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--accent)]/10 text-[var(--accent)]">
										{photo.category}
									</span>
									<p className="text-xs text-[var(--muted)]">{photo.date}</p>
								</div>
								<h3 className="text-sm font-semibold text-[var(--ink)]">
									{photo.project} - {photo.location}
								</h3>
								{photo.description && (
									<p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
										{photo.description}
									</p>
								)}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
