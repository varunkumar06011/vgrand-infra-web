'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Edit, 
  ExternalLink,
  Save,
  X,
  Loader2
} from 'lucide-react';

interface Project {
  id: string | number;
  name: string;
  type: string;
  location: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed';
  images: string[];
  description?: string;
  area?: string;
  handover?: string;
  starting_price?: string;
  rera?: string;
  highlights?: string[] | string;
  amenities?: string[] | string;
  brochure_url?: string;
}

const MOCK_PROJECTS: Project[] = [
  { 
    id: '1', 
    name: 'Elite Homes', 
    type: '3BHK Apartments', 
    location: 'Koppolu, Ongole', 
    status: 'Ongoing',
    images: ['/images/elite-homes.jpg'],
    brochure_url: 'link-to-pdf'
  },
  { 
    id: '2', 
    name: 'V Grand Paradise', 
    type: 'Luxury Villa Plots', 
    location: 'Surareddypalem, Ongole', 
    status: 'Upcoming',
    images: ['/images/tripura.jpg']
  },
];

export default function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    status: 'Ongoing',
    description: '',
    area: '',
    handover: '',
    starting_price: '',
    rera: '',
    highlights: '', // will be comma separated
    amenities: '',  // will be comma separated
    images: [] as File[],
    brochure: null as File | null
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      if (editingProject) {
        payload.append('id', editingProject.id.toString());
      }
      payload.append('name', formData.name);
      payload.append('type', formData.type);
      payload.append('location', formData.location);
      payload.append('status', formData.status);
      payload.append('description', formData.description);
      payload.append('area', formData.area);
      payload.append('handover', formData.handover);
      payload.append('starting_price', formData.starting_price);
      payload.append('rera', formData.rera);
      
      const highlightsArray = formData.highlights.split(',').map(h => h.trim()).filter(h => h);
      const amenitiesArray = formData.amenities.split(',').map(a => a.trim()).filter(a => a);
      payload.append('highlights', JSON.stringify(highlightsArray));
      payload.append('amenities', JSON.stringify(amenitiesArray));
      payload.append('specs', JSON.stringify({})); 

      formData.images.forEach(img => payload.append('images', img));
      if (formData.brochure) payload.append('brochure', formData.brochure);

      const res = await fetch('/api/projects', {
        method: editingProject ? 'PUT' : 'POST',
        body: payload
      });

      if (!res.ok) throw new Error(`Failed to ${editingProject ? 'update' : 'create'} project`);

      await fetchProjects();
      setIsAdding(false);
      setEditingProject(null);
      setFormData({ 
        name: '', type: '', location: '', status: 'Ongoing', 
        description: '', area: '', handover: '', starting_price: '', rera: '',
        highlights: '', amenities: '',
        images: [], brochure: null 
      });
      alert(`Project ${editingProject ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Project operation failed', error);
      alert('Failed to save project. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      type: project.type || '',
      location: project.location || '',
      status: project.status || 'Ongoing',
      description: project.description || '',
      area: project.area || '',
      handover: project.handover || '',
      starting_price: project.starting_price || '',
      rera: project.rera || '',
      highlights: Array.isArray(project.highlights) ? project.highlights.join(', ') : (project.highlights || ''),
      amenities: Array.isArray(project.amenities) ? project.amenities.join(', ') : (project.amenities || ''),
      images: [],
      brochure: null
    });
    setIsAdding(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1: Trigger the modal
  const openDeleteModal = (id: string | number) => {
    setDeleteConfirmId(id);
  };

  // Step 2: User confirmed in the modal
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/projects?id=${id}`, { 
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server Error: ${res.status}`);

      setDeleteConfirmId(null); // Close modal
      alert(`SUCCESS: Project ${id} deleted.`);
      await fetchProjects();
    } catch (error: any) {
      console.error('[FRONTEND] Delete failed', error);
      alert(`CRITICAL ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Project Management (System v2.2)">
      {/* Debug & Manual Tools */}
      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-4">
        <div className="flex-1">
          <h4 className="font-bold text-orange-800 text-sm">Diagnostic Power Tools</h4>
          <p className="text-xs text-orange-600">Use this if the trash icon doesn't respond. Type the ID number to delete.</p>
        </div>
        <div className="flex gap-2">
          <input 
            id="manual-id"
            type="number" 
            placeholder="Project ID" 
            className="px-3 py-1.5 border border-orange-200 rounded-lg text-sm w-32 outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button 
            onClick={() => {
              const input = document.getElementById('manual-id') as HTMLInputElement;
              if (input && input.value) openDeleteModal(Number(input.value));
            }}
            className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 shadow-sm"
          >
            Delete by ID
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Active Listings</h3>
          <p className="text-sm text-slate-500">Manage the projects displayed on the public website.</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) {
              setEditingProject(null);
              setFormData({ 
                name: '', type: '', location: '', status: 'Ongoing', 
                description: '', area: '', handover: '', starting_price: '', rera: '',
                highlights: '', amenities: '',
                images: [], brochure: null 
              });
            }
            setIsAdding(!isAdding);
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            isAdding ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
          }`}
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'Cancel' : 'Add New Project'}
        </button>
      </div>

      {/* Add Project Form */}
      {isAdding && (
        <div className="bg-white border-2 border-blue-100 rounded-2xl p-8 mb-10 shadow-xl animate-in slide-in-from-top duration-300">
          <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., Grand Residency Phase II"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="3BHK / Villa"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Area / City"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" 
                  placeholder="Detailed project description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Starting Price</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., ₹76 Lakhs"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">RERA No.</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="P08..."
                    value={formData.rera}
                    onChange={(e) => setFormData({...formData, rera: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Total Area</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., 1771 sq.ft"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Handover Date</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., June 2026"
                    value={formData.handover}
                    onChange={(e) => setFormData({...formData, handover: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Key Highlights (Comma Separated)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Feature 1, Feature 2, Feature 3..."
                  value={formData.highlights}
                  onChange={(e) => setFormData({...formData, highlights: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amenities (Comma Separated)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Pool, Gym, Security..."
                  value={formData.amenities}
                  onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                />
              </div>
              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Media (Images)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" size={28} />
                    <p className="text-xs text-slate-500">Click to upload multiple project photos</p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files) {
                        setFormData({...formData, images: Array.from(e.target.files)});
                      }
                    }}
                  />
                </label>
                {formData.images.length > 0 && (
                  <p className="mt-2 text-xs text-blue-600 font-bold">{formData.images.length} images selected</p>
                )}
              </div>

              {/* Brochure Upload Area */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Brochure (PDF)</label>
                <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="p-2 bg-white border border-slate-200 rounded-md">
                    <FileText className="text-red-500" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Select PDF Brochure</p>
                    <p className="text-[10px] text-slate-400">Max size 10MB</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({...formData, brochure: e.target.files[0]});
                      }
                    }}
                  />
                </label>
                {formData.brochure && (
                  <p className="mt-2 text-xs text-red-600 font-bold">Brochure: {formData.brochure.name}</p>
                )}
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={20} />}
                  <span>{loading ? 'Processing...' : (editingProject ? 'Update Project' : 'Publish Project')}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-slate-100">
              <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-1">
                <h4 className="text-lg font-bold text-slate-800">{project.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">ID: {project.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    project.status === 'Ongoing' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                    project.status === 'Upcoming' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                    'text-green-600 border-green-200 bg-green-50'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600">{project.type}</p>
              <p className="text-xs text-slate-400 mt-1">{project.location}</p>
            </div>

            <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <button 
                onClick={() => handleEditClick(project)}
                title="Edit Project"
                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all active:scale-95"
              >
                <Edit size={20} />
              </button>
              <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(project.id);
                }}
                title="Delete Project"
                className="relative z-50 p-2.5 text-red-500 hover:text-white hover:bg-red-600 rounded-md transition-all active:scale-90 border border-red-100 hover:border-red-600 shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Are you absolutely sure?</h3>
            <p className="text-slate-500 text-center mb-8">
              You are about to delete project <span className="font-bold text-slate-800">#{deleteConfirmId}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
