'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Plus, 
  Search, 
  History, 
  TrendingDown,
  ArrowRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  current_qty: number;
  total_qty: number;
  unit: string;
  last_updated: string;
}

const MOCK_MATERIALS: Material[] = [
  { id: '1', name: 'Cement (OPC 53)', category: 'Binding', current_qty: 45, total_qty: 500, unit: 'Bags', last_updated: '2025-05-15' }, // 9% - CRITICAL
  { id: '2', name: 'Steel Rods (12mm)', category: 'Structure', current_qty: 120, total_qty: 250, unit: 'Rods', last_updated: '2025-05-14' }, // 48%
  { id: '3', name: 'Bricks (First Class)', category: 'Masonry', current_qty: 1500, total_qty: 10000, unit: 'Units', last_updated: '2025-05-15' }, // 15% - LOW
  { id: '4', name: 'Sand (VSI)', category: 'Structure', current_qty: 400, total_qty: 1000, unit: 'Units', last_updated: '2025-05-12' }, // 40%
  { id: '5', name: 'Plumbing Pipes (PVC)', category: 'Services', current_qty: 85, total_qty: 100, unit: 'Pipes', last_updated: '2025-05-10' }, // 85%
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState(MOCK_MATERIALS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Materials Inventory">
      {/* Alert Banner for Low Stock */}
      <div className="mb-8 flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <TrendingDown className="text-orange-600" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-orange-800">Low Stock Alert</p>
            <p className="text-xs text-orange-600 font-medium">
              3 items are below the 20% critical threshold. Restock recommended.
            </p>
          </div>
        </div>
        <button className="text-xs font-bold text-orange-800 bg-white px-4 py-2 rounded-lg border border-orange-200 shadow-sm hover:bg-orange-100 transition-all">
          Generate Order
        </button>
      </div>

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
            <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all text-sm font-bold shadow-lg shadow-slate-200">
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
                {filteredMaterials.map((item) => {
                  const percentage = (item.current_qty / item.total_qty) * 100;
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
                })}
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
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Top Consumers</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Elite Homes</span>
                  <span className="text-xs text-blue-600 font-bold">12 Orders</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Monthly Spend</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">₹4.2 Lakhs</span>
                  <span className="text-xs text-green-600 font-bold">+18% Exp.</span>
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
    </AdminLayout>
  );
}
