export default function EstimateHistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Estimate History</h1>
        <p className="mt-2 text-gray-300">View past estimates and their status</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Historical Estimates</h2>
        </div>

        <div className="text-center py-12">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-gray-400">No history yet</p>
        </div>
      </div>
    </div>
  );
}
