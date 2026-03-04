"use client";

interface DeleteConfirmDialogProps {
	isOpen: boolean;
	itemName: string;
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
}

export default function DeleteConfirmDialog({
	isOpen,
	itemName,
	onConfirm,
	onCancel,
	isLoading = false,
}: DeleteConfirmDialogProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-lg max-w-sm">
				<h2 className="text-xl font-bold text-[var(--ink)] mb-2">Delete Item?</h2>
				<p className="text-sm text-[var(--muted)] mb-6">
					Are you sure you want to delete <span className="font-semibold text-[var(--ink)]">{itemName}</span>? This action cannot be undone.
				</p>
				<div className="flex gap-3 justify-end">
					<button
						onClick={onCancel}
						disabled={isLoading}
						className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={isLoading}
						className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
					>
						{isLoading ? "Deleting..." : "Delete"}
					</button>
				</div>
			</div>
		</div>
	);
}
