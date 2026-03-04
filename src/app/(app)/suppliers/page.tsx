export default function SuppliersPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Supplier List</h2>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Add Supplier</button>
        </div>
        <div className="text-center py-12"><p className="text-5xl mb-4">🏭</p><p className="text-gray-400">No suppliers</p></div>
      </div>
    </div>
  );
}
