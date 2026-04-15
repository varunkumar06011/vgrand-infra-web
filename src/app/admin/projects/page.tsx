'use client';

import React, { useState } from 'react';
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
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed';
  images: string[];
  brochure?: string;
}

const MOCK_PROJECTS: Project[] = [
  { 
    id: '1', 
    name: 'Elite Homes', 
    type: '3BHK Apartments', 
    location: 'Koppolu, Ongole', 
    status: 'Ongoing',
    images: ['/images/project1.png'],
    brochure: 'link-to-pdf'
  },
  { 
    id: '2', 
    name: 'V Grand Paradise', 
    type: 'Luxury Villa Plots', 
    location: 'Surareddypalem, Ongole', 
    status: 'Upcoming',
    images: ['/images/project2.png']
  },
];

export default function ProjectsManagement() {
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    status: 'Ongoing',
    images: [] as File[],
    brochure: null as File | null
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call to Cloudinary/DB
    setTimeout(() => {
      const newProject: Project = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        location: formData.location,
        status: formData.status as any,
        images: ['/images/placeholder.jpg']
      };
      setProjects([newProject, ...projects]);
      setLoading(false);
      setIsAdding(false);
      setFormData({ name: '', type: '', location: '', status: 'Ongoing', images: [], brochure: null });
    }, 1500);
  };

  return (
    <AdminLayout title="Project Management">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Active Listings</h3>
          <p className="text-sm text-slate-500">Manage the projects displayed on the public website.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
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
            </div>

            <div className="space-y-6">
              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Project Media (Images)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" size={28} />
                    <p className="text-xs text-slate-500">Click to upload multiple project photos</p>
                  </div>
                  <input type="file" multiple className="hidden" accept="image/*" />
                </label>
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
                  <input type="file" className="hidden" accept=".pdf" />
                </label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={20} />}
                  <span>{loading ? 'Processing...' : 'Publish Project'}</span>
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  project.status === 'Ongoing' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                  project.status === 'Upcoming' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                  'text-green-600 border-green-200 bg-green-50'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600">{project.type}</p>
              <p className="text-xs text-slate-400 mt-1">{project.location}</p>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-all">
                <Edit size={18} />
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-all">
                <ExternalLink size={18} />
              </button>
              <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
