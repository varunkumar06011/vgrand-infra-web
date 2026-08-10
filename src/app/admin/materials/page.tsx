'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Plus, 
  Search, 
  History, 
  TrendingDown,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  current_qty: number;
  total_qty: number;
  unit: string;
  created_at?: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', category: '', current_qty: '', total_qty: '', unit: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/materials');
      const data = await res.json();
      if (Array.isArray(data)) setMaterials(data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          category: addForm.category,
          current_qty: Number(addForm.current_qty),
          total_qty: Number(addForm.total_qty),
          unit: addForm.unit,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setShowAddForm(false);
        setAddForm({ name: '', category: '', current_qty: '', total_qty: '', unit: '' });
        fetchMaterials();
      } else {
        alert(result.error || 'Failed to add material');
      }
    } catch {
      alert('Failed to add material');
    } finally {
      setAdding(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = materials.filter(m => m.total_qty > 0 && (m.current_qty / m.total_qty) * 100 < 20).length;

  return (
    <AdminLayout title="Materials Inventory">
      {/* Alert Banner for Low Stock */}
      {lowStockCount > 0 && (
        <div className="mb-8 flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingDown className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-800">Low Stock Alert</p>
              <p className="text-xs text-orange-600 font-medium">
                {lowStockCount} {lowStockCount === 1 ? 'item is' : 'items are'} below the 20% critical threshold. Restock recommended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Inventory List */}
        <div className="flex-1">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all text-sm font-bold shadow-lg shadow-slate-200"
            >
              <Plus size={18} /> Add Stock
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4 text-center">Remaining %</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <Loader2 className="animate-spin inline text-slate-400" size={20} />
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No materials found. Click "Add Stock" to add your first item.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((item) => {
                    const percentage = item.total_qty > 0 ? (item.current_qty / item.total_qty) * 100 : 0;
                  const isLow = percentage < 20;
                  const isCritical = percentage < 10;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCritical ? 'bg-red-50 text-red-500' : isLow ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                          }`}>
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-center">
                          <p className={`font-bold text-lg ${
                            isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-800'
                          }`}>
                            {percentage.toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.current_qty} {item.unit}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-full max-w-[120px]">
                          <div className="w-full bg-slate-100 h-2 rounded-full mb-1">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isCritical ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                                isLow ? 'bg-orange-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shadow-sm">
                            <History size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all shadow-sm">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Logistics Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4">Stock Insights</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Items</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{materials.length}</span>
                  <span className="text-xs text-blue-600 font-bold">Tracked</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Low Stock</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{lowStockCount}</span>
                  <span className="text-xs text-orange-600 font-bold">Items</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 text-white">
            <h4 className="font-bold mb-2">Request Restock</h4>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Send an automated request to suppliers for critical items.</p>
            <button className="w-full bg-blue-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-bold">
              Restock All <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !adding && setShowAddForm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Add Material</h3>
              <button onClick={() => !adding && setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. Cement (OPC 53)"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. Binding, Structure, Masonry"
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Qty *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="0"
                    value={addForm.current_qty}
                    onChange={(e) => setAddForm({ ...addForm, current_qty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Qty *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="0"
                    value={addForm.total_qty}
                    onChange={(e) => setAddForm({ ...addForm, total_qty: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Unit *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. Bags, Rods, Units"
                  value={addForm.unit}
                  onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {adding ? <Loader2 className="animate-spin" size={18} /> : 'Add Material'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
