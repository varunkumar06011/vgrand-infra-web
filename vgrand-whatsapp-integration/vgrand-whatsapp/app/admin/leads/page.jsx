'use client';
// ============================================================
// V Grand Admin — Leads Dashboard
// Shows all WhatsApp + Form leads in real-time
// ============================================================

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STATUS_COLORS = {
  new:       'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800',
  lost:      'bg-red-100 text-red-800',
};

const SOURCE_ICONS = {
  whatsapp: '💬',
  form:     '📝',
  website:  '🌐',
};

export default function LeadsDashboard() {
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');   // all | new | contacted | converted
  const [source, setSource]     = useState('all');   // all | whatsapp | form
  const [search, setSearch]     = useState('');

  // ─── Initial load ────────────────────────────────────────
  useEffect(() => {
    fetchLeads();

    // Real-time subscription
    const channel = supabase
      .channel('leads_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev =>
            prev.map(l => l.id === payload.new.id ? payload.new : l)
          );
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setLeads(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);
  }

  // ─── Filter leads ────────────────────────────────────────
  const filtered = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (source !== 'all' && l.source !== source) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ─── Stats ───────────────────────────────────────────────
  const stats = {
    total:     leads.length,
    new:       leads.filter(l => l.status === 'new').length,
    converted: leads.filter(l => l.status === 'converted').length,
    whatsapp:  leads.filter(l => l.source === 'whatsapp').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">All WhatsApp &amp; form leads in one place</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Leads',    value: stats.total,     color: 'bg-white' },
            { label: 'New',            value: stats.new,       color: 'bg-blue-50' },
            { label: 'Converted',      value: stats.converted, color: 'bg-green-50' },
            { label: 'From WhatsApp',  value: stats.whatsapp,  color: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 border border-gray-100 shadow-sm`}>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="Search name, phone, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Status filter */}
            <div className="flex gap-2">
              {['all','new','contacted','converted','lost'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    filter === s
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Source filter */}
            <div className="flex gap-2">
              {['all','whatsapp','form'].map(s => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    source === s
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {SOURCE_ICONS[s] || ''} {s}
                </button>
              ))}
            </div>

            <button
              onClick={fetchLeads}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Leads table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No leads found</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Source','Name','Phone','Location','Budget','Type','Status','Time','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-lg">
                      {SOURCE_ICONS[lead.source] || '?'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lead.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-green-600"
                        >
                          {lead.phone}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.budget || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.property_type || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', {
                        day:   '2-digit',
                        month: 'short',
                        hour:  '2-digit',
                        minute:'2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
