"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type QualityInspection,
	type InspectionCheckItem,
	createQualityInspection,
	getQualityInspections,
	saveQualityInspection,
	deleteQualityInspection,
	INSPECTION_TYPES,
	type InspectionType,
} from "@/lib/quality-inspections";

export default function QualityInspectionsPage() {
	const [inspections, setInspections] = useState<QualityInspection[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [currentInspection, setCurrentInspection] =
		useState<QualityInspection | null>(null);
	const [selectedInspection, setSelectedInspection] =
		useState<QualityInspection | null>(null);
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadInspections();
	}, []);

	async function loadInspections() {
		const loaded = await getQualityInspections();
		setInspections(loaded.sort((a, b) => b.date.localeCompare(a.date)));
	}

	function handleNew() {
		setCurrentInspection(createQualityInspection({}));
		setShowForm(true);
		setSelectedInspection(null);
	}

	function handleEdit(inspection: QualityInspection) {
		setCurrentInspection({ ...inspection });
		setShowForm(true);
		setSelectedInspection(null);
	}

	async function handleSave() {
		if (!currentInspection) return;

		// Calculate overall status based on check items
		const hasFailures = currentInspection.checkItems.some(
			(item) => item.status === "fail"
		);
		const hasPending = currentInspection.checkItems.some(
			(item) => item.status === "pending"
		);
		const allPass = currentInspection.checkItems.every(
			(item) => item.status === "pass" || item.status === "n/a"
		);

		let overallStatus: QualityInspection["overallStatus"];
		if (allPass) overallStatus = "pass";
		else if (hasFailures) overallStatus = "fail";
		else if (hasPending) overallStatus = "pending";
		else overallStatus = "conditional";

		await saveQualityInspection({ ...currentInspection, overallStatus });
		await loadInspections();
		setShowForm(false);
		setCurrentInspection(null);
	}

	async function handleDelete(id: string) {
		if (confirm("Delete this inspection record?")) {
			await deleteQualityInspection(id);
			await loadInspections();
			setSelectedInspection(null);
		}
	}

	function updateInspection(updates: Partial<QualityInspection>) {
		if (currentInspection) {
			setCurrentInspection({ ...currentInspection, ...updates });
		}
	}

	function handleTypeChange(type: InspectionType) {
		const newInspection = createQualityInspection({
			...currentInspection,
			inspectionType: type,
		});
		setCurrentInspection(newInspection);
	}

	function updateCheckItem(id: string, updates: Partial<InspectionCheckItem>) {
		if (!currentInspection) return;
		const updatedItems = currentInspection.checkItems.map((item) =>
			item.id === id ? { ...item, ...updates } : item
		);
		updateInspection({ checkItems: updatedItems });
	}

	function addCheckItem() {
		if (!currentInspection) return;
		const newItem: InspectionCheckItem = {
			id: `CHECK-${Date.now()}`,
			description: "",
			requirement: "",
			status: "pending",
		};
		updateInspection({
			checkItems: [...currentInspection.checkItems, newItem],
		});
	}

	function removeCheckItem(id: string) {
		if (!currentInspection) return;
		updateInspection({
			checkItems: currentInspection.checkItems.filter(
				(item) => item.id !== id
			),
		});
	}

	const filteredInspections =
		filterStatus === "all"
			? inspections
			: inspections.filter((i) => i.overallStatus === filterStatus);

	const statusColor = (status: string) => {
		switch (status) {
			case "pass":
				return "bg-green-500/20 text-green-500 border-green-500/30";
			case "fail":
				return "bg-red-500/20 text-red-500 border-red-500/30";
			case "conditional":
				return "bg-orange-500/20 text-orange-500 border-orange-500/30";
			default:
				return "bg-gray-500/20 text-gray-500 border-gray-500/30";
		}
	};

	if (showForm && currentInspection) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader
					title={
						currentInspection.id.startsWith("INSPECT-")
							? "New Quality Inspection"
							: "Edit Quality Inspection"
					}
					subtitle="Quality Inspections"
				/>

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
					<div className="space-y-6">
						{/* Basic Info */}
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Inspection Type
								</label>
								<select
									value={currentInspection.inspectionType}
									onChange={(e) =>
										handleTypeChange(e.target.value as InspectionType)
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{INSPECTION_TYPES.map((type) => (
										<option key={type} value={type}>
											{type.replace(/-/g, " ")}
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
									value={currentInspection.date}
									onChange={(e) => updateInspection({ date: e.target.value })}
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
									value={currentInspection.project}
									onChange={(e) => updateInspection({ project: e.target.value })}
									placeholder="Project name/number"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Location
								</label>
								<input
									type="text"
									value={currentInspection.location}
									onChange={(e) =>
										updateInspection({ location: e.target.value })
									}
									placeholder="e.g., Chainage 100-150"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Inspector
								</label>
								<input
									type="text"
									value={currentInspection.inspector}
									onChange={(e) =>
										updateInspection({ inspector: e.target.value })
									}
									placeholder="Inspector name"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Contractor (optional)
								</label>
								<input
									type="text"
									value={currentInspection.contractor || ""}
									onChange={(e) =>
										updateInspection({ contractor: e.target.value })
									}
									placeholder="Contractor name"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Trade Package
								</label>
								<input
									type="text"
									value={currentInspection.tradePackage}
									onChange={(e) =>
										updateInspection({ tradePackage: e.target.value })
									}
									placeholder="e.g., Groundworks"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						{/* Inspection Checklist */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-[var(--ink)]">
									Inspection Checklist
								</h3>
								<button
									onClick={addCheckItem}
									className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									+ Add Check
								</button>
							</div>

							<div className="space-y-4">
								{currentInspection.checkItems.map((item) => (
									<div
										key={item.id}
										className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4"
									>
										<div className="grid gap-3 md:grid-cols-[2fr_2fr_auto] mb-3">
											<div>
												<label className="block text-xs text-[var(--muted)] mb-1">
													Check Description
												</label>
												<input
													type="text"
													value={item.description}
													onChange={(e) =>
														updateCheckItem(item.id, {
															description: e.target.value,
														})
													}
													placeholder="What to check"
													className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
												/>
											</div>
											<div>
												<label className="block text-xs text-[var(--muted)] mb-1">
													Requirement
												</label>
												<input
													type="text"
													value={item.requirement}
													onChange={(e) =>
														updateCheckItem(item.id, {
															requirement: e.target.value,
														})
													}
													placeholder="Acceptance criteria"
													className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
												/>
											</div>
											<div>
												<label className="block text-xs text-[var(--muted)] mb-1">
													Status
												</label>
												<select
													value={item.status}
													onChange={(e) =>
														updateCheckItem(item.id, {
															status: e.target.value as InspectionCheckItem["status"],
														})
													}
													className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
												>
													<option value="pending">Pending</option>
													<option value="pass">Pass</option>
													<option value="fail">Fail</option>
													<option value="n/a">N/A</option>
												</select>
											</div>
										</div>

										<div className="grid gap-3 md:grid-cols-[2fr_auto] items-end">
											<div>
												<label className="block text-xs text-[var(--muted)] mb-1">
													Notes / Measured Value
												</label>
												<input
													type="text"
													value={item.notes || ""}
													onChange={(e) =>
														updateCheckItem(item.id, { notes: e.target.value })
													}
													placeholder="Additional notes or measurements"
													className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
												/>
											</div>
											<button
												onClick={() => removeCheckItem(item.id)}
												className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white"
											>
												Remove
											</button>
										</div>
									</div>
								))}

								{currentInspection.checkItems.length === 0 && (
									<div className="text-center py-8 text-[var(--muted)] italic">
										No check items yet - click "Add Check" to create one
									</div>
								)}
							</div>
						</div>

						{/* General Notes */}
						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								General Notes
							</label>
							<textarea
								value={currentInspection.generalNotes}
								onChange={(e) =>
									updateInspection({ generalNotes: e.target.value })
								}
								rows={3}
								placeholder="Overall observations or comments..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						{/* Corrective Actions */}
						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Corrective Actions Required
							</label>
							<textarea
								value={currentInspection.correctiveActions || ""}
								onChange={(e) =>
									updateInspection({ correctiveActions: e.target.value })
								}
								rows={3}
								placeholder="Actions needed to address failures (if any)..."
								className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ink)]"
							/>
						</div>

						{/* Reinspection */}
						<div className="rounded-2xl bg-[var(--surface-2)] p-4">
							<label className="flex items-center gap-3">
								<input
									type="checkbox"
									checked={currentInspection.reinspectionRequired}
									onChange={(e) =>
										updateInspection({
											reinspectionRequired: e.target.checked,
										})
									}
									className="w-5 h-5"
								/>
								<span className="text-sm font-semibold text-[var(--ink)]">
									Reinspection Required
								</span>
							</label>
							{currentInspection.reinspectionRequired && (
								<div className="mt-3">
									<label className="block text-xs text-[var(--muted)] mb-1">
										Scheduled Reinspection Date
									</label>
									<input
										type="date"
										value={currentInspection.reinspectionDate || ""}
										onChange={(e) =>
											updateInspection({ reinspectionDate: e.target.value })
										}
										className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
									/>
								</div>
							)}
						</div>

						{/* Approval */}
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Approved By (optional)
								</label>
								<input
									type="text"
									value={currentInspection.approvedBy || ""}
									onChange={(e) =>
										updateInspection({ approvedBy: e.target.value })
									}
									placeholder="Name"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Approval Date
								</label>
								<input
									type="date"
									value={currentInspection.approvalDate || ""}
									onChange={(e) =>
										updateInspection({ approvalDate: e.target.value })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 justify-end pt-4 border-t border-[var(--line)]">
							{currentInspection?.id && (
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
										setCurrentInspection(null);
									}}
									className="rounded-xl border border-[var(--line)] px-6 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									className="rounded-xl bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
								>
									Save Inspection
								</button>
							</div>
						</div>
					</div>
				</div>

				{currentInspection && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={currentInspection.inspectionType || "Inspection"}
						onConfirm={() => currentInspection.id && handleDelete(currentInspection.id)}
						onCancel={() => setShowDeleteConfirm(false)}
						isLoading={deleteLoading}
					/>
				)}

			</div>
		);
	}

	if (selectedInspection) {
		const passCount = selectedInspection.checkItems.filter(
			(item) => item.status === "pass"
		).length;
		const failCount = selectedInspection.checkItems.filter(
			(item) => item.status === "fail"
		).length;
		const naCount = selectedInspection.checkItems.filter(
			(item) => item.status === "n/a"
		).length;

		return (
			<div className="flex flex-col gap-6">
				<PageHeader
					title="Inspection Details"
					subtitle="Quality Inspections"
					actions={
						<>
							<button
								onClick={() => setSelectedInspection(null)}
								className="h-11 rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)]"
							>
								← Back
							</button>
							<button
								onClick={() => handleEdit(selectedInspection)}
								className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
							>
								Edit
							</button>
						</>
					}
				/>

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
					<div className="space-y-6">
						{/* Header */}
						<div className="flex items-start justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
									{selectedInspection.date}
								</p>
								<h2 className="font-display text-2xl font-semibold text-[var(--ink)] mt-1">
									{selectedInspection.inspectionType}
								</h2>
								<p className="text-[var(--muted)] mt-1">
									{selectedInspection.project} • {selectedInspection.location}
								</p>
							</div>
							<div className="flex flex-col items-end gap-2">
								<div
									className={`rounded-full px-4 py-1 text-sm font-semibold border ${statusColor(
										selectedInspection.overallStatus
									)}`}
								>
									{selectedInspection.overallStatus.toUpperCase()}
								</div>
								<button
									onClick={() => handleDelete(selectedInspection.id)}
									className="text-sm text-red-500 hover:underline"
								>
									Delete
								</button>
							</div>
						</div>

						{/* Info Grid */}
						<div className="grid gap-4 md:grid-cols-3">
							<div className="rounded-2xl bg-[var(--surface-2)] p-4">
								<p className="text-xs text-[var(--muted)] mb-1">Inspector</p>
								<p className="text-[var(--ink)] font-semibold">
									{selectedInspection.inspector}
								</p>
							</div>
							{selectedInspection.contractor && (
								<div className="rounded-2xl bg-[var(--surface-2)] p-4">
									<p className="text-xs text-[var(--muted)] mb-1">Contractor</p>
									<p className="text-[var(--ink)] font-semibold">
										{selectedInspection.contractor}
									</p>
								</div>
							)}
							<div className="rounded-2xl bg-[var(--surface-2)] p-4">
								<p className="text-xs text-[var(--muted)] mb-1">Trade Package</p>
								<p className="text-[var(--ink)] font-semibold">
									{selectedInspection.tradePackage}
								</p>
							</div>
						</div>

						{/* Results Summary */}
						<div className="rounded-2xl bg-[var(--surface-2)] p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
								Inspection Results
							</p>
							<div className="flex gap-6">
								<div>
									<p className="text-2xl font-bold text-green-500">{passCount}</p>
									<p className="text-xs text-[var(--muted)]">Passed</p>
								</div>
								<div>
									<p className="text-2xl font-bold text-red-500">{failCount}</p>
									<p className="text-xs text-[var(--muted)]">Failed</p>
								</div>
								<div>
									<p className="text-2xl font-bold text-gray-500">{naCount}</p>
									<p className="text-xs text-[var(--muted)]">N/A</p>
								</div>
							</div>
						</div>

						{/* Check Items */}
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-3">
								Checklist Items
							</p>
							<div className="space-y-3">
								{selectedInspection.checkItems.map((item) => (
									<div
										key={item.id}
										className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4"
									>
										<div className="flex items-start justify-between mb-2">
											<div className="flex-1">
												<p className="text-sm font-semibold text-[var(--ink)]">
													{item.description}
												</p>
												<p className="text-xs text-[var(--muted)] mt-1">
													{item.requirement}
												</p>
											</div>
											<div
												className={`ml-4 rounded-full px-3 py-1 text-xs font-semibold border ${statusColor(
													item.status
												)}`}
											>
												{item.status.toUpperCase()}
											</div>
										</div>
										{item.notes && (
											<p className="text-sm text-[var(--ink)] mt-2 pl-4 border-l-2 border-[var(--accent)]">
												{item.notes}
											</p>
										)}
									</div>
								))}
							</div>
						</div>

						{/* General Notes */}
						{selectedInspection.generalNotes && (
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] mb-2">
									General Notes
								</p>
								<p className="text-[var(--ink)] whitespace-pre-wrap">
									{selectedInspection.generalNotes}
								</p>
							</div>
						)}

						{/* Corrective Actions */}
						{selectedInspection.correctiveActions && (
							<div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500 mb-2">
									Corrective Actions Required
								</p>
								<p className="text-[var(--ink)] whitespace-pre-wrap">
									{selectedInspection.correctiveActions}
								</p>
							</div>
						)}

						{/* Reinspection */}
						{selectedInspection.reinspectionRequired && (
							<div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500 mb-2">
									Reinspection Required
								</p>
								{selectedInspection.reinspectionDate && (
									<p className="text-[var(--ink)]">
										Scheduled: {selectedInspection.reinspectionDate}
									</p>
								)}
							</div>
						)}

						{/* Approval */}
						{selectedInspection.approvedBy && (
							<div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-500 mb-2">
									Approved
								</p>
								<p className="text-[var(--ink)]">
									By: {selectedInspection.approvedBy}
									{selectedInspection.approvalDate &&
										` on ${selectedInspection.approvalDate}`}
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
				title="Quality Inspections"
				subtitle="ITP & Quality Control"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Inspection
					</button>
				}
			/>

			{/* Filter */}
			<div className="flex gap-2">
				{["all", "pass", "fail", "conditional", "pending"].map((status) => (
					<button
						key={status}
						onClick={() => setFilterStatus(status)}
						className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
							filterStatus === status
								? "bg-[var(--accent)] text-white"
								: "border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
						}`}
					>
						{status === "all"
							? "All"
							: status.charAt(0).toUpperCase() + status.slice(1)}
					</button>
				))}
			</div>

			{/* Inspections List */}
			<div className="grid gap-4">
				{filteredInspections.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">📋</p>
						<p className="text-[var(--muted)]">
							{filterStatus === "all"
								? "No inspections yet"
								: `No ${filterStatus} inspections`}
						</p>
					</div>
				) : (
					filteredInspections.map((inspection) => (
						<div
							key={inspection.id}
							onClick={() => setSelectedInspection(inspection)}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
											{inspection.date}
										</p>
										<div
											className={`rounded-full px-3 py-1 text-xs font-semibold border ${statusColor(
												inspection.overallStatus
											)}`}
										>
											{inspection.overallStatus.toUpperCase()}
										</div>
									</div>
									<h3 className="text-lg font-semibold text-[var(--ink)]">
										{inspection.inspectionType}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
										{inspection.project} • {inspection.location} •{" "}
										{inspection.inspector}
									</p>
									<p className="text-sm text-[var(--ink)] mt-2">
										{inspection.checkItems.filter((i) => i.status === "pass").length}/
										{inspection.checkItems.length} checks passed
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
