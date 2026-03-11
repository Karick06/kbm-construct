"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type PlantBooking,
	savePlantBooking,
	getPlantBookings,
	deletePlantBooking,
	PLANT_TYPES,
} from "@/lib/additional-modules";

export default function PlantBookingPage() {
	const [bookings, setBookings] = useState<PlantBooking[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<PlantBooking | null>(null);
	const [filter, setFilter] = useState<string>("all");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadBookings();
	}, []);

	async function loadBookings() {
		const loaded = await getPlantBookings();
		setBookings(loaded.sort((a, b) => b.startDate.localeCompare(a.startDate)));
	}

	function handleNew() {
		setCurrent({
			id: `PLT-${Date.now()}`,
			project: "",
			equipment: PLANT_TYPES[0],
			requestedBy: "",
			startDate: new Date().toISOString().split("T")[0],
			endDate: new Date().toISOString().split("T")[0],
			status: "requested",
			hireCompany: "",
			dailyRate: 0,
			registration: "",
			deliveryAddress: "",
			notes: "",
			createdAt: new Date().toISOString(),
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await savePlantBooking(current);
		await loadBookings();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<PlantBooking>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deletePlantBooking(current.id);
		await loadBookings();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	const filtered = bookings.filter((booking) => {
		if (filter === "all") return true;
		return booking.status === filter;
	});

	if (showForm && current) {
		return (
		  <PermissionGuard permission="projects">
			<div className="flex flex-col gap-6">
				<PageHeader title="Plant Booking" subtitle="Equipment Hire Management" />

				<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm max-w-3xl">
					<div className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Plant Type
								</label>
								<select
									value={current.equipment}
									onChange={(e) => update({ equipment: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									{PLANT_TYPES.map((type) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Status
								</label>
								<select
									value={current.status}
									onChange={(e) =>
										update({ status: e.target.value as PlantBooking["status"] })
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="requested">Requested</option>
									<option value="confirmed">Confirmed</option>
									<option value="on-hire">On Hire</option>
									<option value="returned">Returned</option>
									<option value="cancelled">Cancelled</option>
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
									Supplier
								</label>
								<input
									type="text"
									value={current.hireCompany}
									onChange={(e) => update({ hireCompany: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Start Date
								</label>
								<input
									type="date"
									value={current.startDate}
									onChange={(e) => update({ startDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									End Date
								</label>
								<input
									type="date"
									value={current.endDate || ""}
									onChange={(e) => update({ endDate: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Daily Rate (£)
								</label>
								<input
									type="number"
									value={current.dailyRate}
									onChange={(e) => update({ dailyRate: parseFloat(e.target.value) })}
									step="0.01"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Description
							</label>
							<textarea
								value={current.notes || ""}
								onChange={(e) => update({ notes: e.target.value })}
								rows={3}
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
									Save Booking
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={`${current.equipment} - ${current.startDate}`}
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
				title="Plant Booking"
				subtitle="Equipment Hire & Management"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Booking
					</button>
				}
			/>

			<div className="flex gap-2 mb-4">
				{(["all", "requested", "confirmed", "on-hire", "returned"] as const).map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
							filter === f
								? "bg-[var(--accent)] text-white"
								: "bg-[var(--surface)] text-[var(--ink)]"
						}`}
					>
						{f === "all"
							? "All"
							: f === "on-hire"
							? "On Hire"
							: f.charAt(0).toUpperCase() + f.slice(1)}
					</button>
				))}
			</div>

			<div className="grid gap-4">
				{filtered.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">🚜</p>
						<p className="text-[var(--muted)]">No plant bookings found</p>
					</div>
				) : (
					filtered.map((booking) => (
						<div
							key={booking.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(booking);
								setShowForm(true);
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
											{booking.equipment}
										</p>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												booking.status === "on-hire"
													? "bg-green-500/10 text-green-600"
													: booking.status === "confirmed"
													? "bg-blue-500/10 text-blue-600"
													: booking.status === "returned"
													? "bg-gray-500/10 text-gray-600"
													: booking.status === "cancelled"
													? "bg-red-500/10 text-red-600"
													: "bg-yellow-500/10 text-yellow-600"
											}`}
										>
											{booking.status.toUpperCase()}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-[var(--ink)]">
										{booking.project}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
										{booking.hireCompany} • {booking.startDate}
										{booking.endDate && ` - ${booking.endDate}`} • £
										{booking.dailyRate}/day
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
