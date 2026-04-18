'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';

interface EnquireModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnquireModal: React.FC<EnquireModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    interested_flat: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client-side phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/save-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'enquire_now'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset states after closing
          setTimeout(() => {
            setSuccess(false);
            setFormData({ name: '', phone: '', interested_flat: '' });
          }, 500);
        }, 2000);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit enquiry. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 sm:p-10">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Thank You!</h2>
              <p className="text-slate-600">Your enquiry has been submitted successfully. We will get back to you soon.</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Enquire Now</h2>
                <p className="text-slate-500 mt-2 text-sm">Please fill in your details and select the property you are interested in.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-slate-800"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    maxLength={10}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-slate-800"
                    placeholder="10 digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div>
                  <label htmlFor="property" className="block text-sm font-semibold text-slate-700 mb-1">Interested In *</label>
                  <select
                    id="property"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-slate-800 appearance-none bg-[url('https://cdn-icons-png.flaticon.com/512/2985/2985150.png')] bg-[length:12px] bg-[right_1.25rem_center] bg-no-repeat"
                    value={formData.interested_flat}
                    onChange={(e) => setFormData({ ...formData, interested_flat: e.target.value })}
                  >
                    <option value="" disabled>Select a property</option>
                    <option value="Elite">Elite</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Landmark">Landmark</option>
                  </select>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg animate-shake">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#C0392B] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:bg-[#a93226] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    'SUBMIT ENQUIRY'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default EnquireModal;
