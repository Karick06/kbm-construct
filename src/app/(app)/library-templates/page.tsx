export default function LibraryTemplatesPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Template Library</h2>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Upload Template</button>
        </div>
        <div className="text-center py-12"><p className="text-5xl mb-4">📄</p><p className="text-gray-400">No templates</p></div>
      </div>
    </div>
  );
}
