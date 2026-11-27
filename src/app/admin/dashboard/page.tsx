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

type Row = { name: string; total: number };
type Activity = { total: number; byEvent: Row[]; bySource: Row[] } | null;

/** plain names for the event types recorded by ClickTracker */
const EVENT_NAMES: Record<string, string> = {
  call_click: '📞 Call button',
  whatsapp_click: '💬 WhatsApp',
  directions_click: '📍 Directions / Maps',
  form_submit: '📝 Form submitted',
  '3d_open': '🏠 3D walkthrough opened',
  brochure_click: '📄 Brochure',
  email_click: '✉️ Email',
  outbound_click: '↗️ Link to another site',
  link_click: '🔗 Page link',
  button_click: '🔘 Other button',
};

// Initial states for real-time data
const visitData: any[] = [];
const materialsSummary: any[] = [];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    leads: 0,
    visits: 0,
    projects: 0,
    lowStock: 0,
    recentLeads: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<Activity>(null);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    fetch('/api/track?days=30')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setActivity(d && Array.isArray(d.byEvent) ? d : null))
      .catch(() => setActivity(null));
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [leadsRes, visitsRes, projectsRes, materialsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/visits/track'),
        fetch('/api/projects'),
        fetch('/api/materials')
      ]);

      const leadsData = await leadsRes.json();
      const visitsData = await visitsRes.json();
      const projectsData = await projectsRes.json();
      const materialsData = await materialsRes.json();

      const lowStockCount = Array.isArray(materialsData)
        ? materialsData.filter((m: any) => m.total_qty > 0 && (m.current_qty / m.total_qty) * 100 < 20).length
        : 0;

      setStats({
        leads: Array.isArray(leadsData) ? leadsData.length : 0,
        visits: visitsData.total_visits_today || 0,
        projects: Array.isArray(projectsData) ? projectsData.length : 0,
        lowStock: lowStockCount,
        recentLeads: Array.isArray(leadsData) ? leadsData.slice(0, 5) : []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data');
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
          value={loading ? '...' : stats.lowStock.toString()} 
          icon={AlertTriangle} 
          trend={{ value: 2, isUp: false }}
          color="orange"
        />
      </div>

      {/* Website activity: clicks and visitor sources (site_events) */}
      <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Website activity</h3>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 30 days</span>
        </div>
        {activity === null ? (
          <p className="text-sm text-slate-500">
            No click data yet. Run <code className="rounded bg-slate-100 px-1">supabase_lead_tracking.sql</code> in Supabase once, and clicks will start appearing here.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {[
              { title: 'What visitors tapped', rows: activity.byEvent, label: (n: string) => EVENT_NAMES[n] ?? n },
              { title: 'Where visitors came from', rows: activity.bySource, label: (n: string) => n },
            ].map((col) => {
              const max = Math.max(1, ...col.rows.map((r) => r.total));
              return (
                <div key={col.title}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{col.title}</p>
                  {col.rows.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
                  <ul className="space-y-2">
                    {col.rows.slice(0, 8).map((r) => (
                      <li key={r.name} className="text-sm">
                        <div className="flex justify-between text-slate-700">
                          <span>{col.label(r.name)}</span>
                          <span className="font-semibold tabular-nums">{r.total.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-emerald-600" style={{ width: `${(r.total / max) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
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
