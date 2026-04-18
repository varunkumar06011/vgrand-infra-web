'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import MetricCard from '@/components/admin/MetricCard';
import { 
  Users, 
  Eye, 
  Building2, 
  AlertTriangle,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// Initial states for real-time data
const visitData: any[] = [];
const materialsSummary: any[] = [];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    leads: 0,
    visits: 0,
    projects: 0,
    recentLeads: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, visitsRes, projectsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/visits/track'),
        fetch('/api/projects')
      ]);

      const leadsData = await leadsRes.json();
      const visitsData = await visitsRes.json();
      const projectsData = await projectsRes.json();

      setStats({
        leads: Array.isArray(leadsData) ? leadsData.length : 0,
        visits: visitsData.total_visits_today || 0,
        projects: Array.isArray(projectsData) ? projectsData.length : 0,
        recentLeads: Array.isArray(leadsData) ? leadsData.slice(0, 5) : []
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <AdminLayout title="Dashboard Overview">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Leads" 
          value={loading ? '...' : stats.leads.toLocaleString()} 
          icon={Users} 
          trend={{ value: 12, isUp: true }}
          color="blue"
        />
        <MetricCard 
          title="Visits Today" 
          value={loading ? '...' : stats.visits.toLocaleString()} 
          icon={Eye} 
          trend={{ value: 8, isUp: true }}
          color="purple"
        />
        <MetricCard 
          title="Active Projects" 
          value={loading ? '...' : stats.projects.toLocaleString()} 
          icon={Building2} 
          color="green"
        />
        <MetricCard 
          title="Low Stock Items" 
          value="12" 
          icon={AlertTriangle} 
          trend={{ value: 2, isUp: false }}
          color="orange"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Visits Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Weekly Site Traffic</h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 7 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                  {visitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === visitData.length - 2 ? '#2563eb' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Leads</h3>
            <a href="/admin/leads" className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentLeads.length > 0 ? (
              stats.recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {lead.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.project || 'General Inquiry'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      lead.source === 'WhatsApp' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {lead.source || 'Web'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(lead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 text-sm">
                No recent leads found.
              </div>
            )}
          </div>
        </div>

        {/* Project Quick Form Placeholder */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 font-Inter">Quick Project Add</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Project Name" 
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <div className="grid grid-cols-2 gap-4">
              <select className="px-4 py-3 rounded-lg border border-slate-200 outline-none">
                <option>Select Type</option>
                <option>3BHK</option>
                <option>Villa</option>
              </select>
              <select className="px-4 py-3 rounded-lg border border-slate-200 outline-none">
                <option>Ongoing</option>
                <option>Upcoming</option>
              </select>
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Plus size={18} /> Add Project
            </button>
          </div>
        </div>

        {/* Materials Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Materials Alert</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-3">Material</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {materialsSummary.length > 0 ? (
                  materialsSummary.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="px-6 py-4 font-semibold text-slate-700">{item.name}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full min-w-[100px]">
                          <div 
                            className={`h-full rounded-full ${item.status === 'Critical' ? 'bg-red-500' : item.status === 'Low' ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: item.stock }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                            item.status === 'Critical' ? 'bg-red-50 text-red-600' : item.status === 'Low' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No material alerts at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
