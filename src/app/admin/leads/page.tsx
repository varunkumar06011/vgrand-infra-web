'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Phone,
  MessageSquare,
  Users,
  MessageCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // 1. Fetch leads and setup real-time listener
  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setLeads(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id);
  };

  // 2. Stats calculation
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status?.toLowerCase() === 'new' || !l.status).length,
    whatsapp: leads.filter(l => l.source?.toLowerCase() === 'whatsapp').length,
    contacted: leads.filter(l => l.status?.toLowerCase() === 'contacted').length
  };

  // 3. Filtering logic
  const filteredLeads = leads.filter(lead => {
    const name = lead.name || '';
    const phone = lead.phone || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    const matchesSource = sourceFilter === 'All' || lead.source?.toLowerCase() === sourceFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || lead.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesSource && matchesStatus;
  });

  return (
    <AdminLayout title="Lead Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Leads" value={stats.total} icon={<Users className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="New" value={stats.new} icon={<Clock className="text-amber-500" />} color="bg-amber-50" />
        <StatCard title="WhatsApp" value={stats.whatsapp} icon={<MessageCircle className="text-green-500" />} color="bg-green-50" />
        <StatCard title="Contacted" value={stats.contacted} icon={<CheckCircle2 className="text-purple-500" />} color="bg-purple-50" />
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-4 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="All">All Sources</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Form">Form Submission</option>
          </select>
          <select
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold">
          <Download size={18} /> Export
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Requirements</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800">{lead.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      lead.source?.toLowerCase() === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.source?.toLowerCase() === 'whatsapp' ? <MessageSquare size={10} /> : <Filter size={10} />}
                      {lead.source || 'Form'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      {lead.location && <p><span className="text-slate-400">Loc:</span> <span className="font-medium text-slate-700">{lead.location}</span></p>}
                      {lead.budget && <p><span className="text-slate-400">Budget:</span> <span className="font-medium text-slate-700">{lead.budget}</span></p>}
                      {lead.property_type && <p><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-700">{lead.property_type}</span></p>}
                      {!lead.location && !lead.budget && <span className="text-slate-400 italic">General Inquiry</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status || 'new'}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase rounded-md px-2 py-1 border outline-none
                        ${lead.status === 'converted' ? 'bg-green-50 text-green-600 border-green-200' : 
                          lead.status === 'contacted' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          lead.status === 'lost' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'}
                      `}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`tel:${lead.phone}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Call">
                        <Phone size={16} />
                      </a>
                      <a href={`https://wa.me/${lead.whatsapp || lead.phone}`} target="_blank" className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="WhatsApp">
                        <MessageSquare size={16} />
                      </a>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-4">
              <Search size={24} />
            </div>
            <p className="text-slate-500 font-medium">No leads found matching your filters.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className={`p-5 rounded-2xl border border-slate-100 shadow-sm ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className="p-2 bg-white/80 rounded-xl shadow-inner">
          {React.cloneElement(icon, { size: 20 })}
        </div>
      </div>
    </div>
  );
  );
}
