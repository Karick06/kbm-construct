export default function MaintenancePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Maintenance</h1>
        <p className="mt-2 text-gray-300">Track vehicle and equipment maintenance</p>
      </div>
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Maintenance Schedule</h2>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Schedule Maintenance</button>
        </div>
        <div className="text-center py-12"><p className="text-5xl mb-4">🔧</p><p className="text-gray-400">No maintenance scheduled</p></div>
      </div>
    </div>
  );
}
