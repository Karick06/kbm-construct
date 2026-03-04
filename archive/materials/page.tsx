'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { 
  loadMaterials, 
  getMaterialCategories, 
  searchMaterials, 
  saveMaterialLocally,
  getCustomMaterials,
  type Material 
} from '@/lib/materials-database';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customMaterials, setCustomMaterials] = useState<Material[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for adding new materials
  const [formData, setFormData] = useState({
    name: '',
    category: 'aggregates',
    unit: 'm³',
    density: '',
    defaultRate: '',
    description: '',
  });

  // Load materials and categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbMaterials, cats, custom] = await Promise.all([
          loadMaterials(),
          getMaterialCategories(),
          Promise.resolve(getCustomMaterials()),
        ]);
        setMaterials(dbMaterials);
        setCustomMaterials(custom);
        setCategories(cats);
        setLoading(false);
      } catch (error) {
        console.error('Error loading materials:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter materials based on category and search
  useEffect(() => {
    let filtered = [...materials, ...customMaterials];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMaterials(filtered);
  }, [materials, customMaterials, selectedCategory, searchQuery]);

  const handleAddMaterial = () => {
    if (!formData.name.trim() || !formData.defaultRate) {
      alert('Please fill in name and default rate');
      return;
    }

    const newMaterial: Material = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      density: formData.density ? parseFloat(formData.density) : undefined,
      defaultRate: parseFloat(formData.defaultRate),
      description: formData.description,
    };

    saveMaterialLocally(newMaterial);
    setCustomMaterials([...customMaterials, newMaterial]);
    
    // Reset form
    setFormData({
      name: '',
      category: 'aggregates',
      unit: 'm³',
      density: '',
      defaultRate: '',
      description: '',
    });
    setShowAddForm(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customMaterials.filter(m => m.id !== id);
    setCustomMaterials(updated);
    localStorage.setItem('kbm_custom_materials', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Materials Management" description="Loading materials..." />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-600">Loading materials database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Materials Management" 
        description="View and manage the materials database used in rate building"
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Add Material Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            + Add New Material
          </button>
        )}

        {/* Add Material Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-lg">Add New Material</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ready-mix concrete C30"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="aggregates">Aggregates</option>
                  <option value="asphalt">Asphalt & Bitumen</option>
                  <option value="brickwork">Brickwork</option>
                  <option value="concrete">Concrete</option>
                  <option value="drainage">Drainage</option>
                  <option value="formwork">Formwork</option>
                  <option value="insulation">Insulation</option>
                  <option value="kerbs">Kerbs & Edging</option>
                  <option value="paving">Paving</option>
                  <option value="reinforcement">Reinforcement</option>
                  <option value="waterproofing">Waterproofing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., m³, tonne, m, nr"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Density (tonnes/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.density}
                  onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                  placeholder="e.g., 1.8 for aggregates, 2.4 for asphalt"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - used for aggregate depth calculations</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Rate (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultRate}
                  onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                  placeholder="e.g., 35.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the material"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMaterial}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              >
                Add Material
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Materials
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-600">
          Showing {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
          {customMaterials.length > 0 && ` (${customMaterials.filter(m => filteredMaterials.includes(m)).length} custom)`}
        </div>

        {/* Materials Table */}
        {filteredMaterials.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm font-medium text-gray-700">
                  <th className="px-6 py-3">Material Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Density</th>
                  <th className="px-6 py-3">Default Rate</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMaterials.map(material => (
                  <tr key={material.id} className="text-sm text-gray-900 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{material.name}</td>
                    <td className="px-6 py-4 capitalize text-gray-600">{material.category}</td>
                    <td className="px-6 py-4 text-gray-600">{material.unit}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {material.density ? `${material.density} t/m³` : '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      £{material.defaultRate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs">{material.description}</td>
                    <td className="px-6 py-4">
                      {material.id.startsWith('custom-') && (
                        <button
                          onClick={() => handleDeleteCustom(material.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No materials found matching your criteria.</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">About Materials Database</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• The materials database is used by the Civils Rate Builder to populate material components</li>
            <li>• Add new materials as they come up - they'll be available immediately in the rate builder</li>
            <li>• Custom materials are saved locally in your browser and marked with a delete option</li>
            <li>• Density values are used for aggregate calculations (depth × density = tonnage)</li>
            <li>• Default rates can be overridden in the rate builder on a per-job basis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
