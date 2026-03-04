"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
	type WeatherLog,
	saveWeatherLog,
	getWeatherLogs,
	deleteWeatherLog,
	WEATHER_CONDITIONS,
} from "@/lib/additional-modules";

export default function WeatherLoggingPage() {
	const [logs, setLogs] = useState<WeatherLog[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [current, setCurrent] = useState<WeatherLog | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		loadLogs();
	}, []);

	async function loadLogs() {
		const loaded = await getWeatherLogs();
		setLogs(loaded.sort((a, b) => b.date.localeCompare(a.date)));
	}

	function handleNew() {
		setCurrent({
			id: `WL-${Date.now()}`,
			date: new Date().toISOString().split("T")[0],
			project: "",
			condition: WEATHER_CONDITIONS[0],
			temperature: 0,
			windSpeed: "0",
			rainfall: "0",
			workingConditions: "good",
			impact: "",
			loggedBy: "",
		});
		setShowForm(true);
	}

	async function handleSave() {
		if (!current) return;
		await saveWeatherLog(current);
		await loadLogs();
		setShowForm(false);
		setCurrent(null);
	}

	function update(updates: Partial<WeatherLog>) {
		if (current) setCurrent({ ...current, ...updates });
	}

	async function handleDelete() {
		if (!current?.id) return;
		setDeleteLoading(true);
		await deleteWeatherLog(current.id);
		await loadLogs();
		setShowForm(false);
		setCurrent(null);
		setShowDeleteConfirm(false);
		setDeleteLoading(false);
	}

	if (showForm && current) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Weather Log" subtitle="Site Conditions" />

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
									Project
								</label>
								<input
									type="text"
									value={current.project}
									onChange={(e) => update({ project: e.target.value })}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Weather Condition
								</label>
								<select
									value={current.condition}
									onChange={(e) => update({ condition: e.target.value })}
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
									Working Conditions
								</label>
								<select
									value={current.workingConditions}
									onChange={(e) =>
										update({
											workingConditions: e.target.value as WeatherLog["workingConditions"],
										})
									}
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								>
									<option value="good">Good</option>
									<option value="acceptable">Acceptable</option>
									<option value="poor">Poor</option>
									<option value="stopped">Work Stopped</option>
								</select>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Temperature (°C)
								</label>
								<input
									type="number"
									value={current.temperature || ""}
									onChange={(e) => update({ temperature: parseFloat(e.target.value) || 0 })}
									step="0.1"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Wind Speed (mph)
								</label>
								<input
									type="number"
									value={current.windSpeed || ""}
									onChange={(e) => update({ windSpeed: e.target.value })}
									step="0.1"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
									Rainfall (mm)
								</label>
								<input
									type="number"
									value={current.rainfall || ""}
									onChange={(e) => update({ rainfall: e.target.value })}
									step="0.1"
									className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-[var(--ink)]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-[var(--ink)] mb-2">
								Impact on Work
							</label>
							<textarea
								value={current.impact || ""}
								onChange={(e) => update({ impact: e.target.value })}
								rows={3}
								placeholder="Describe any delays or restrictions caused by weather..."
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
									Save Log
								</button>
							</div>
						</div>
					</div>
				</div>

				{current && (
					<DeleteConfirmDialog
						isOpen={showDeleteConfirm}
						itemName={current.date || "Weather Log"}
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
				title="Weather Logging"
				subtitle="Daily Weather & Site Conditions"
				actions={
					<button
						onClick={handleNew}
						className="h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white"
					>
						+ New Log
					</button>
				}
			/>

			<div className="grid gap-4">
				{logs.length === 0 ? (
					<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-sm">
						<p className="text-5xl mb-4">🌤️</p>
						<p className="text-[var(--muted)]">No weather logs recorded yet</p>
					</div>
				) : (
					logs.map((log) => (
						<div
							key={log.id}
							className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm hover:border-[var(--accent)] cursor-pointer transition-colors"
							onClick={() => {
								setCurrent(log);
								setShowForm(true);
							}}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
											{log.date}
										</p>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												log.workingConditions === "good"
													? "bg-green-500/10 text-green-600"
													: log.workingConditions === "acceptable"
													? "bg-yellow-500/10 text-yellow-600"
													: log.workingConditions === "poor"
													? "bg-orange-500/10 text-orange-600"
													: "bg-red-500/10 text-red-600"
											}`}
										>
											{log.workingConditions.toUpperCase()}
										</span>
									</div>
									<h3 className="text-lg font-semibold text-[var(--ink)]">
										{log.condition}
									</h3>
									<p className="text-sm text-[var(--muted)] mt-1">
										{log.project}
										{log.temperature && ` • ${log.temperature}°C`}
										{log.windSpeed && ` • ${log.windSpeed} mph wind`}
										{log.rainfall && ` • ${log.rainfall}mm rain`}
									</p>
									{log.impact && (
										<p className="text-sm text-[var(--ink)] mt-2 italic">
											"{log.impact}"
										</p>
									)}
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
