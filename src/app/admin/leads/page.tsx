'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  MessageSquare, 
  MoreVertical,
  Calendar,
  X,
  CreditCard,
  Home,
  Clock,
  CheckCircle2,
  MessageCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  // 1. Fetch leads and setup real-time listener
  useEffect(() => {
    fetchLeads();
    
    // We still keep the real-time for instant updates if RLS allows
    const client = supabase();
    const channel = client
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
        fetchLeads(); // Simplest way to keep sync
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirm(null);
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  // 2. Stats calculation
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status?.toLowerCase() === 'new' || !l.status).length,
    whatsapp: leads.filter(l => l.source?.toLowerCase() === 'whatsapp').length,
    brochure: leads.filter(l => l.source?.toLowerCase() === 'brochure_download').length,
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

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Source', 'Status', 'Location', 'Budget', 'Property Type', 'Interested Flat', 'Date'];
    const rows = filteredLeads.map(lead => [
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.source || '',
      lead.status || 'new',
      lead.location || '',
      lead.budget || '',
      lead.property_type || '',
      lead.interested_flat || '',
      new Date(lead.created_at).toLocaleDateString('en-IN')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Lead Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Leads" value={stats.total} icon={<Users className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="New" value={stats.new} icon={<Clock className="text-amber-500" />} color="bg-amber-50" />
        <StatCard title="WhatsApp" value={stats.whatsapp} icon={<MessageCircle className="text-green-500" />} color="bg-green-50" />
        <StatCard title="Brochure Downloads" value={stats.brochure} icon={<Download className="text-amber-500" />} color="bg-amber-50" />
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
            <option value="brochure_download">Brochure Download</option>
            <option value="enquire_now">Enquire Now</option>
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

        <button
          onClick={exportToCSV}
          disabled={filteredLeads.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
                <th className="px-6 py-4">Flat Interest</th>
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
                      {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      lead.source?.toLowerCase() === 'whatsapp' ? 'bg-green-100 text-green-700' :
                      lead.source?.toLowerCase() === 'brochure_download' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.source?.toLowerCase() === 'whatsapp' ? <MessageSquare size={10} /> : lead.source?.toLowerCase() === 'brochure_download' ? <Download size={10} /> : <Filter size={10} />}
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
                    <span className="text-sm font-semibold text-slate-700">{lead.interested_flat || '—'}</span>
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
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <a href={`tel:${lead.phone}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Call">
                        <Phone size={16} />
                      </a>
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Email">
                          <Mail size={16} />
                        </a>
                      )}
                      <a href={`https://wa.me/${lead.phone}`} target="_blank" className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="WhatsApp">
                        <MessageSquare size={16} />
                      </a>
                      <button 
                        onClick={() => setDeleteConfirm(lead)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                        title="Delete Lead"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" /> Lead Information
                </h3>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-black">
                    {selectedLead.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedLead.name}</h4>
                    <p className="text-slate-500 font-medium">Customer ID: #{selectedLead.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Phone size={10} /> Phone Number
                    </p>
                    <p className="text-sm font-bold text-slate-700">{selectedLead.phone}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Calendar size={10} /> Submitted On
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(selectedLead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {selectedLead.email && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Mail size={10} /> Email
                      </p>
                      <p className="text-sm font-bold text-slate-700 break-all">{selectedLead.email}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Home size={10} /> Interested In
                    </p>
                    <p className="text-sm font-bold text-slate-700">{selectedLead.interested_flat || 'General'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Filter size={10} /> Inquiry Source
                    </p>
                    <p className="text-sm font-bold text-slate-700 uppercase">{selectedLead.source || 'Website'}</p>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <a href={`tel:${selectedLead.phone}`} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                    <Phone size={18} /> Call
                  </a>
                  {selectedLead.email && (
                    <a href={`mailto:${selectedLead.email}`} className="flex-1 bg-slate-600 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                      <Mail size={18} /> Email
                    </a>
                  )}
                  <a href={`https://wa.me/${selectedLead.phone}`} target="_blank" className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                    <MessageSquare size={18} /> WhatsApp
                  </a>
                </div>

                <button
                  onClick={() => setDeleteConfirm(selectedLead)}
                  className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-red-100"
                >
                  <Trash2 size={16} /> Delete Lead
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Lead?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to delete <strong className="text-slate-700">{deleteConfirm.name}</strong>'s lead? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteLead(deleteConfirm.id)}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
}
