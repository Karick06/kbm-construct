"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import CameraCapture from "@/components/CameraCapture";
import { useSharePointUpload } from "@/lib/use-sharepoint-upload";
import {
	type SiteDiaryEntry,
	createSiteDiaryEntry,
	getSiteDiaryEntries,
	saveSiteDiaryEntry,
	deleteSiteDiaryEntry,
	WEATHER_CONDITIONS,
	COMMON_TRADES,
	COMMON_PLANT,
} from "@/lib/site-diary";

export default function SiteDiaryPage() {
	const [entries, setEntries] = useState<SiteDiaryEntry[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [currentEntry, setCurrentEntry] = useState<SiteDiaryEntry | null>(
		null
	);
	const [selectedEntry, setSelectedEntry] = useState<SiteDiaryEntry | null>(
		null
	);
	const [showCameraCapture, setShowCameraCapture] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { uploadFile, isUploading } = useSharePointUpload();

	useEffect(() => {
		loadEntries();
	}, []);

	async function loadEntries() {
		const loadedEntries = await getSiteDiaryEntries();
		setEntries(loadedEntries.sort((a, b) => b.date.localeCompare(a.date)));
	}

	function handleNew() {
		setCurrentEntry(createSiteDiaryEntry({}));
		setShowForm(true);
		setSelectedEntry(null);
	}

	function handleEdit(entry: SiteDiaryEntry) {
		setCurrentEntry({ ...entry });
		setShowForm(true);
		setSelectedEntry(null);
	}

	async function handleSave() {
		if (!currentEntry) return;
		await saveSiteDiaryEntry(currentEntry);
		await loadEntries();
		setShowForm(false);
		setCurrentEntry(null);
	}

	async function handleDelete(id: string) {
		if (confirm("Delete this diary entry?")) {
			await deleteSiteDiaryEntry(id);
			await loadEntries();
			setSelectedEntry(null);
		}
	}

	function updateEntry(updates: Partial<SiteDiaryEntry>) {
		if (currentEntry) {
			setCurrentEntry({ ...currentEntry, ...updates });
		}
	}

	function addLabour() {
		if (!currentEntry) return;
		updateEntry({
			labourOnSite: [
				...currentEntry.labourOnSite,
				{ company: "", trade: "", count: 0 },
			],
		});
	}

	function updateLabour(
		index: number,
		field: keyof SiteDiaryEntry["labourOnSite"][0],
		value: string | number
	) {
		if (!currentEntry) return;
		const updated = [...currentEntry.labourOnSite];
		updated[index] = { ...updated[index], [field]: value };
		updateEntry({ labourOnSite: updated });
	}

	function removeLabour(index: number) {
		if (!currentEntry) return;
		updateEntry({
			labourOnSite: currentEntry.labourOnSite.filter((_, i) => i !== index),
		});
	}

	function addPlant() {
		if (!currentEntry) return;
		updateEntry({
			plantOnSite: [
				...currentEntry.plantOnSite,
				{ type: "", quantity: 1 },
			],
		});
	}

	function updatePlant(
		index: number,
		field: keyof SiteDiaryEntry["plantOnSite"][0],
		value: string | number
	) {
		if (!currentEntry) return;
		const updated = [...currentEntry.plantOnSite];
		updated[index] = { ...updated[index], [field]: value };
		updateEntry({ plantOnSite: updated });
	}

	function removePlant(index: number) {
		if (!currentEntry) return;
		updateEntry({
			plantOnSite: currentEntry.plantOnSite.filter((_, i) => i !== index),
		});
	}

	function addVisitor() {
		if (!currentEntry) return;
		updateEntry({
			visitors: [
				...currentEntry.visitors,
				{ name: "", company: "", purpose: "", timeIn: "" },
			],
		});
	}

	function updateVisitor(
		index: number,
		field: keyof SiteDiaryEntry["visitors"][0],
		value: string
	) {
		if (!currentEntry) return;
		const updated = [...currentEntry.visitors];
		updated[index] = { ...updated[index], [field]: value };
		updateEntry({ visitors: updated });
	}

	function removeVisitor(index: number) {
		if (!currentEntry) return;
		updateEntry({
			visitors: currentEntry.visitors.filter((_, i) => i !== index),
		});
	}

	function addDelivery() {
		if (!currentEntry) return;
		updateEntry({
			materialDeliveries: [
				...currentEntry.materialDeliveries,
				{ supplier: "", description: "", quantity: "" },
			],
		});
	}

	function updateDelivery(
		index: number,
		field: keyof SiteDiaryEntry["materialDeliveries"][0],
		value: string
	) {
		if (!currentEntry) return;
		const updated = [...currentEntry.materialDeliveries];
		updated[index] = { ...updated[index], [field]: value };
		updateEntry({ materialDeliveries: updated });
	}

	function removeDelivery(index: number) {
		if (!currentEntry) return;
		updateEntry({
			materialDeliveries: currentEntry.materialDeliveries.filter(
				(_, i) => i !== index
			),
		});
	}

	async function handleCapturedPhoto(imageDataUrl: string) {
		if (!currentEntry) return;

		// Generate file name based on entry date and timestamp
		const timestamp = Date.now();
		const fileName = `site-photo-${currentEntry.date}-${timestamp}.jpg`;
		const folderPath = `Site Diary/${currentEntry.project}/${currentEntry.date}`;

		// Upload to SharePoint (or fall back to base64)
		const uploadedFile = await uploadFile(imageDataUrl, fileName, folderPath);

		if (uploadedFile) {
			// Store the downloadUrl (SharePoint) or base64 (fallback)
			updateEntry({ photos: [...currentEntry.photos, uploadedFile.downloadUrl] });
		}

		setShowCameraCapture(false);
	}

	async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (!files?.length || !currentEntry) return;

		const readers = Array.from(files).map(
			(file) =>
				new Promise<{ data: string; name: string }>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => {
						if (typeof reader.result === "string") {
							resolve({ data: reader.result, name: file.name });
						} else {
							reject(new Error("Invalid image data"));
						}
					};
					reader.onerror = () => reject(new Error("Failed to read image"));
					reader.readAsDataURL(file);
				})
		);

		try {
			const images = await Promise.all(readers);
			const folderPath = `Site Diary/${currentEntry.project}/${currentEntry.date}`;

			// Upload each image to SharePoint
			const uploadPromises = images.map(({ data, name }) => {
				const timestamp = Date.now();
				const fileName = `${name.replace(/\.[^/.]+$/, "")}-${timestamp}${name.match(/\.[^/.]+$/)?.[0] || ".jpg"}`;
				return uploadFile(data, fileName, folderPath);
			});

			const uploadedFiles = await Promise.all(uploadPromises);
			const photoUrls = uploadedFiles
				.filter((file) => file !== null)
				.map((file) => file!.downloadUrl);

			updateEntry({ photos: [...currentEntry.photos, ...photoUrls] });
		} catch (error) {
			console.error("Photo upload failed", error);
		}
	}

	function removePhoto(index: number) {
		if (!currentEntry) return;
		updateEntry({
			photos: currentEntry.photos.filter((_, i) => i !== index),
		});
	}

	if (showCameraCapture) {
		return (
			<CameraCapture
				onCapture={handleCapturedPhoto}
				onClose={() => setShowCameraCapture(false)}
			/>
		);
	}

	if (showForm && currentEntry) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader
					title={currentEntry.id.startsWith("DIARY-") ? "New Diary Entry" : "Edit Diary Entry"}
					subtitle="Site Diary"
				/>

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
					<div className="space-y-6">
						{/* Basic Info */}
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Date
								</label>
								<input
									type="date"
									value={currentEntry.date}
									onChange={(e) => updateEntry({ date: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Project
								</label>
								<input
									type="text"
									value={currentEntry.project}
									onChange={(e) => updateEntry({ project: e.target.value })}
									placeholder="Project name/number"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						{/* Weather */}
						<div>
							<h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
								Weather Conditions
							</h3>
							<div className="grid gap-4 md:grid-cols-3">
								<div>
									<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
										Condition
									</label>
									<select
										value={currentEntry.weather.condition}
										onChange={(e) =>
											updateEntry({
												weather: {
													...currentEntry.weather,
													condition: e.target.value,
												},
											})
										}
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									>
										{WEATHER_CONDITIONS.map((cond) => (
											<option key={cond} value={cond}>
												{cond}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
										Temperature (°C)
									</label>
									<input
										type="text"
										value={currentEntry.weather.temperature}
										onChange={(e) =>
											updateEntry({
												weather: {
													...currentEntry.weather,
													temperature: e.target.value,
												},
											})
										}
										placeholder="e.g., 12°C"
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									/>
								</div>
								<div>
									<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
										Wind Speed (optional)
									</label>
									<input
										type="text"
										value={currentEntry.weather.windSpeed || ""}
										onChange={(e) =>
											updateEntry({
												weather: {
													...currentEntry.weather,
													windSpeed: e.target.value,
												},
											})
										}
										placeholder="e.g., Light/Moderate"
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									/>
								</div>
							</div>
						</div>

						{/* Labour on Site */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-[var(--ink)]">
									Labour on Site
								</h3>
								<button
									onClick={addLabour}
									className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									+ Add
								</button>
							</div>
							<div className="space-y-3">
								{currentEntry.labourOnSite.map((labour, idx) => (
									<div
										key={idx}
										className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto] items-end"
									>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Company/Gang
											</label>
											<input
												type="text"
												value={labour.company}
												onChange={(e) =>
													updateLabour(idx, "company", e.target.value)
												}
												placeholder="e.g., ABC Groundworks"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Trade
											</label>
											<select
												value={labour.trade}
												onChange={(e) =>
													updateLabour(idx, "trade", e.target.value)
												}
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											>
												<option value="">Select...</option>
												{COMMON_TRADES.map((trade) => (
													<option key={trade} value={trade}>
														{trade}
													</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Count
											</label>
											<input
												type="number"
												value={labour.count}
												onChange={(e) =>
													updateLabour(idx, "count", parseInt(e.target.value) || 0)
												}
												min="0"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<button
											onClick={() => removeLabour(idx)}
											className="rounded-xl border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
										>
											✕
										</button>
									</div>
								))}
								{currentEntry.labourOnSite.length === 0 && (
									<p className="text-sm text-[var(--muted)] italic">
										No labour recorded
									</p>
								)}
							</div>
						</div>

						{/* Plant on Site */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-[var(--ink)]">
									Plant & Equipment
								</h3>
								<button
									onClick={addPlant}
									className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									+ Add
								</button>
							</div>
							<div className="space-y-3">
								{currentEntry.plantOnSite.map((plant, idx) => (
									<div
										key={idx}
										className="grid gap-3 md:grid-cols-[2fr_1fr_2fr_auto] items-end"
									>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Equipment Type
											</label>
											<select
												value={plant.type}
												onChange={(e) => updatePlant(idx, "type", e.target.value)}
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											>
												<option value="">Select...</option>
												{COMMON_PLANT.map((p) => (
													<option key={p} value={p}>
														{p}
													</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Qty
											</label>
											<input
												type="number"
												value={plant.quantity}
												onChange={(e) =>
													updatePlant(idx, "quantity", parseInt(e.target.value) || 1)
												}
												min="1"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Operator (optional)
											</label>
											<input
												type="text"
												value={plant.operator || ""}
												onChange={(e) =>
													updatePlant(idx, "operator", e.target.value)
												}
												placeholder="Operator name"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<button
											onClick={() => removePlant(idx)}
											className="rounded-xl border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
										>
											✕
										</button>
									</div>
								))}
								{currentEntry.plantOnSite.length === 0 && (
									<p className="text-sm text-[var(--muted)] italic">
										No plant recorded
									</p>
								)}
							</div>
						</div>

						{/* Visitors */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-[var(--ink)]">
									Visitors
								</h3>
								<button
									onClick={addVisitor}
									className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									+ Add
								</button>
							</div>
							<div className="space-y-3">
								{currentEntry.visitors.map((visitor, idx) => (
									<div
										key={idx}
										className="grid gap-3 md:grid-cols-[2fr_2fr_2fr_1fr_1fr_auto] items-end"
									>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Name
											</label>
											<input
												type="text"
												value={visitor.name}
												onChange={(e) =>
													updateVisitor(idx, "name", e.target.value)
												}
												placeholder="Visitor name"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Company
											</label>
											<input
												type="text"
												value={visitor.company}
												onChange={(e) =>
													updateVisitor(idx, "company", e.target.value)
												}
												placeholder="Company name"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Purpose
											</label>
											<input
												type="text"
												value={visitor.purpose}
												onChange={(e) =>
													updateVisitor(idx, "purpose", e.target.value)
												}
												placeholder="Reason for visit"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												In
											</label>
											<input
												type="time"
												value={visitor.timeIn}
												onChange={(e) =>
													updateVisitor(idx, "timeIn", e.target.value)
												}
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Out
											</label>
											<input
												type="time"
												value={visitor.timeOut || ""}
												onChange={(e) =>
													updateVisitor(idx, "timeOut", e.target.value)
												}
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<button
											onClick={() => removeVisitor(idx)}
											className="rounded-xl border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
										>
											✕
										</button>
									</div>
								))}
								{currentEntry.visitors.length === 0 && (
									<p className="text-sm text-[var(--muted)] italic">
										No visitors recorded
									</p>
								)}
							</div>
						</div>

						{/* Material Deliveries */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-[var(--ink)]">
									Material Deliveries
								</h3>
								<button
									onClick={addDelivery}
									className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									+ Add
								</button>
							</div>
							<div className="space-y-3">
								{currentEntry.materialDeliveries.map((delivery, idx) => (
									<div
										key={idx}
										className="grid gap-3 md:grid-cols-[2fr_3fr_2fr_2fr_auto] items-end"
									>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Supplier
											</label>
											<input
												type="text"
												value={delivery.supplier}
												onChange={(e) =>
													updateDelivery(idx, "supplier", e.target.value)
												}
												placeholder="Supplier name"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Description
											</label>
											<input
												type="text"
												value={delivery.description}
												onChange={(e) =>
													updateDelivery(idx, "description", e.target.value)
												}
												placeholder="Material description"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Quantity
											</label>
											<input
												type="text"
												value={delivery.quantity}
												onChange={(e) =>
													updateDelivery(idx, "quantity", e.target.value)
												}
												placeholder="e.g., 10t"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<div>
											<label className="block text-xs text-[var(--muted)] mb-1">
												Note No.
											</label>
											<input
												type="text"
												value={delivery.deliveryNote || ""}
												onChange={(e) =>
													updateDelivery(idx, "deliveryNote", e.target.value)
												}
												placeholder="Optional"
												className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink)]"
											/>
										</div>
										<button
											onClick={() => removeDelivery(idx)}
											className="rounded-xl border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
										>
											✕
										</button>
									</div>
								))}
								{currentEntry.materialDeliveries.length === 0 && (
									<p className="text-sm text-[var(--muted)] italic">
										No deliveries recorded
									</p>
								)}
							</div>
						</div>

						{/* Photo Capture */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-[var(--ink)]">Site Photos</h3>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setShowCameraCapture(true)}
										className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
									>
										📷 Capture
									</button>
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
									>
										Upload
									</button>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										multiple
										onChange={handlePhotoUpload}
										className="hidden"
									/>
								</div>
							</div>

							{currentEntry.photos.length === 0 ? (
								<p className="text-sm text-[var(--muted)] italic">No photos attached</p>
							) : (
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{currentEntry.photos.map((photo, idx) => (
										<div key={`${photo.slice(0, 20)}-${idx}`} className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
											<img src={photo} alt={`Site photo ${idx + 1}`} className="h-36 w-full object-cover" />
											<button
												type="button"
												onClick={() => removePhoto(idx)}
												className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white"
											>
												Remove
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Work Completed */}
						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Work Completed Today
							</label>
							<textarea
								value={currentEntry.workCompleted}
								onChange={(e) => updateEntry({ workCompleted: e.target.value })}
								rows={4}
								placeholder="Describe work activities and progress made..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						{/* Issues & Delays */}
						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Issues & Delays
							</label>
							<textarea
								value={currentEntry.issuesDelays}
								onChange={(e) => updateEntry({ issuesDelays: e.target.value })}
								rows={3}
								placeholder="Record any issues, delays, or concerns..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						{/* Health & Safety */}
						<div>
							<h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
								Health & Safety
							</h3>
							<div className="space-y-3">
								<div>
									<label className="block text-sm text-[var(--ink)] mb-2">
										Toolbox Talk
									</label>
									<input
										type="text"
										value={currentEntry.healthSafety.toolboxTalk || ""}
										onChange={(e) =>
											updateEntry({
												healthSafety: {
													...currentEntry.healthSafety,
													toolboxTalk: e.target.value,
												},
											})
										}
										placeholder="Topic covered (if applicable)"
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									/>
								</div>
								<div>
									<label className="block text-sm text-[var(--ink)] mb-2">
										Incidents
									</label>
									<input
										type="text"
										value={currentEntry.healthSafety.incidents || ""}
										onChange={(e) =>
											updateEntry({
												healthSafety: {
													...currentEntry.healthSafety,
													incidents: e.target.value,
												},
											})
										}
										placeholder="Any incidents? (Leave blank if none)"
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									/>
								</div>
								<div>
									<label className="block text-sm text-[var(--ink)] mb-2">
										Near Misses
									</label>
									<input
										type="text"
										value={currentEntry.healthSafety.nearMisses || ""}
										onChange={(e) =>
											updateEntry({
												healthSafety: {
													...currentEntry.healthSafety,
													nearMisses: e.target.value,
												},
											})
										}
										placeholder="Any near misses? (Leave blank if none)"
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
									/>
								</div>
							</div>
						</div>

						{/* Notes */}
						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Additional Notes
							</label>
							<textarea
								value={currentEntry.notes}
								onChange={(e) => updateEntry({ notes: e.target.value })}
								rows={3}
								placeholder="Any other relevant information..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 justify-end pt-4 border-t border-[var(--line)]">
							<button
								onClick={() => {
									setShowForm(false);
									setCurrentEntry(null);
								}}
								className="rounded-xl border border-[var(--line)] px-6 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
							>
								Cancel
							</button>
							<button
								onClick={handleSave}
								className="rounded-xl bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
							>
								Save Entry
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (selectedEntry) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader
					title="Diary Entry"
					subtitle="Site Diary"
					actions={
						<>
							<button
								onClick={() => setSelectedEntry(null)}
								className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)]"
							>
								← Back
							</button>
							<button
								onClick={() => handleEdit(selectedEntry)}
								className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
							>
								Edit
							</button>
						</>
					}
				/>

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
					<div className="space-y-6">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
									{selectedEntry.date}
								</p>
								<h2 className="font-display text-2xl font-semibold text-[var(--ink)] mt-1">
									{selectedEntry.project || "No Project"}
								</h2>
							</div>
							<button
								onClick={() => handleDelete(selectedEntry.id)}
								className="text-sm text-red-500 hover:underline"
							>
								Delete
							</button>
						</div>

						{/* Weather */}
						<div className="rounded-2xl bg-[var(--surface-2)] p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-2">
								Weather
							</p>
							<p className="text-[var(--ink)]">
								{selectedEntry.weather.condition} • {selectedEntry.weather.temperature}
								{selectedEntry.weather.windSpeed && ` • ${selectedEntry.weather.windSpeed}`}
							</p>
						</div>

						{/* Labour */}
						{selectedEntry.labourOnSite.length > 0 && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
									Labour on Site ({selectedEntry.labourOnSite.reduce((sum, l) => sum + l.count, 0)} total)
								</p>
								<div className="space-y-2">
									{selectedEntry.labourOnSite.map((labour, idx) => (
										<div
											key={idx}
											className="flex justify-between items-center rounded-xl bg-[var(--surface-2)] px-4 py-3"
										>
											<div>
												<p className="text-sm font-semibold text-[var(--ink)]">
													{labour.company}
												</p>
												<p className="text-xs text-[var(--muted)]">{labour.trade}</p>
											</div>
											<p className="text-lg font-semibold text-[var(--accent)]">
												×{labour.count}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Plant */}
						{selectedEntry.plantOnSite.length > 0 && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
									Plant & Equipment
								</p>
								<div className="space-y-2">
									{selectedEntry.plantOnSite.map((plant, idx) => (
										<div
											key={idx}
											className="flex justify-between items-center rounded-xl bg-[var(--surface-2)] px-4 py-3"
										>
											<div>
												<p className="text-sm font-semibold text-[var(--ink)]">
													{plant.type}
												</p>
												{plant.operator && (
													<p className="text-xs text-[var(--muted)]">{plant.operator}</p>
												)}
											</div>
											<p className="text-lg font-semibold text-[var(--accent)]">
												×{plant.quantity}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Visitors */}
						{selectedEntry.visitors.length > 0 && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
									Visitors
								</p>
								<div className="space-y-2">
									{selectedEntry.visitors.map((visitor, idx) => (
										<div
											key={idx}
											className="rounded-xl bg-[var(--surface-2)] px-4 py-3"
										>
											<p className="text-sm font-semibold text-[var(--ink)]">
												{visitor.name} - {visitor.company}
											</p>
											<p className="text-xs text-[var(--muted)]">
												{visitor.purpose} • {visitor.timeIn}
												{visitor.timeOut && ` - ${visitor.timeOut}`}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Deliveries */}
						{selectedEntry.materialDeliveries.length > 0 && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
									Material Deliveries
								</p>
								<div className="space-y-2">
									{selectedEntry.materialDeliveries.map((delivery, idx) => (
										<div
											key={idx}
											className="rounded-xl bg-[var(--surface-2)] px-4 py-3"
										>
											<p className="text-sm font-semibold text-[var(--ink)]">
												{delivery.description} - {delivery.quantity}
											</p>
											<p className="text-xs text-[var(--muted)]">
												{delivery.supplier}
												{delivery.deliveryNote && ` • Note: ${delivery.deliveryNote}`}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Photos */}
						{selectedEntry.photos.length > 0 && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
									Site Photos ({selectedEntry.photos.length})
								</p>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{selectedEntry.photos.map((photo, idx) => (
										<div key={`${photo.slice(0, 20)}-${idx}`} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
											<img src={photo} alt={`Site photo ${idx + 1}`} className="h-40 w-full object-cover" />
										</div>
									))}
								</div>
							</div>
						)}

						{/* Work Completed */}
						{selectedEntry.workCompleted && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-2">
									Work Completed
								</p>
								<p className="text-[var(--ink)] whitespace-pre-wrap">
									{selectedEntry.workCompleted}
								</p>
							</div>
						)}

						{/* Issues */}
						{selectedEntry.issuesDelays && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-2">
									Issues & Delays
								</p>
								<p className="text-[var(--ink)] whitespace-pre-wrap">
									{selectedEntry.issuesDelays}
								</p>
							</div>
						)}

						{/* Health & Safety */}
						{(selectedEntry.healthSafety.toolboxTalk ||
							selectedEntry.healthSafety.incidents ||
							selectedEntry.healthSafety.nearMisses) && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
									Health & Safety
								</p>
								<div className="space-y-2">
									{selectedEntry.healthSafety.toolboxTalk && (
										<div className="rounded-xl bg-[var(--surface-2)] px-4 py-3">
											<p className="text-xs text-[var(--muted)] mb-1">Toolbox Talk</p>
											<p className="text-sm text-[var(--ink)]">
												{selectedEntry.healthSafety.toolboxTalk}
											</p>
										</div>
									)}
									{selectedEntry.healthSafety.incidents && (
										<div className="rounded-xl bg-red-500/10 px-4 py-3 border border-red-500/20">
											<p className="text-xs text-red-500 mb-1">Incidents</p>
											<p className="text-sm text-[var(--ink)]">
												{selectedEntry.healthSafety.incidents}
											</p>
										</div>
									)}
									{selectedEntry.healthSafety.nearMisses && (
										<div className="rounded-xl bg-orange-500/10 px-4 py-3 border border-orange-500/20">
											<p className="text-xs text-orange-500 mb-1">Near Misses</p>
											<p className="text-sm text-[var(--ink)]">
												{selectedEntry.healthSafety.nearMisses}
											</p>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Notes */}
						{selectedEntry.notes && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-2">
									Additional Notes
								</p>
								<p className="text-[var(--ink)] whitespace-pre-wrap">
									{selectedEntry.notes}
								</p>
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
				title="Site Diary"
				subtitle="Daily Progress Records"
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
				{entries.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">📔</p>
						<p className="text-[var(--muted)]">No diary entries yet</p>
					</div>
				) : (
					entries.map((entry) => (
						<div
							key={entry.id}
							onClick={() => setSelectedEntry(entry)}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
										{entry.date}
									</p>
									<h3 className="text-lg font-semibold text-[var(--ink)] mt-1">
										{entry.project || "No Project"}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-2">
										{entry.weather.condition} • {entry.weather.temperature} •{" "}
										{entry.labourOnSite.reduce((sum, l) => sum + l.count, 0)} workers
									</p>
									{entry.workCompleted && (
										<p className="text-sm text-[var(--ink)] mt-3 line-clamp-2">
											{entry.workCompleted}
										</p>
									)}
									{entry.photos.length > 0 && (
										<p className="text-xs text-[var(--muted)] mt-2">📷 {entry.photos.length} photo(s)</p>
									)}
								</div>
								<div className="text-right">
									<p className="text-xs text-[var(--muted)]">
										{new Date(entry.lastModified).toLocaleDateString()}
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
