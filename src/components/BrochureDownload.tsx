'use client';

import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { X, Loader2, CheckCircle2, Download } from 'lucide-react';

interface BrochureDownloadProps {
  brochureUrl: string;
  projectName: string;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function BrochureDownload({ brochureUrl, projectName }: BrochureDownloadProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        setGoogleUser({ name: profile.name, email: profile.email });
        setFormData((prev) => ({ ...prev, name: profile.name, email: profile.email }));
        setGoogleLoading(false);
      } catch {
        setError('Failed to get Google profile. Please fill manually.');
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in failed. Please fill manually.');
      setGoogleLoading(false);
    },
  });

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError(null);
    googleLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/brochure-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          project: projectName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = brochureUrl;
          link.download = '';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => {
            setShowModal(false);
            setSuccess(false);
            setFormData({ name: '', phone: '', email: '' });
            setGoogleUser(null);
          }, 1500);
        }, 800);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Failed to submit. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          flex: 1,
          textAlign: 'center',
          border: '2px solid #C0392B',
          color: '#C0392B',
          padding: '14px 32px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 15,
          background: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#C0392B';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#C0392B';
        }}
      >
        <Download size={18} /> Download Brochure
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !loading && !success && !googleLoading && setShowModal(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={() => !loading && !success && !googleLoading && setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
              disabled={loading || success || googleLoading}
            >
              <X size={22} />
            </button>

            <div className="p-6 sm:p-8">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Thank You!</h2>
                  <p className="text-slate-600 text-sm">Your brochure is downloading now. We have saved your details and will be in touch soon.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Download Brochure</h2>
                    <p className="text-slate-500 mt-1 text-sm">
                      Please share your details to download the <strong>{projectName}</strong> brochure.
                    </p>
                  </div>

                  {!googleUser && (
                    <>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="w-full py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm mb-4"
                      >
                        {googleLoading ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <GoogleIcon /> Sign in with Google
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400 font-medium">or fill manually</span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    </>
                  )}

                  {googleUser && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                        {googleUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{googleUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{googleUser.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setGoogleUser(null);
                          setFormData((prev) => ({ ...prev, name: '', email: '' }));
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 font-medium"
                        disabled={loading}
                      >
                        Change
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!googleUser && (
                      <div>
                        <label htmlFor="bd-name" className="block text-sm font-semibold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="bd-name"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-slate-800 text-sm"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="bd-phone" className="block text-sm font-semibold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="bd-phone"
                        required
                        maxLength={10}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-slate-800 text-sm"
                        placeholder="10 digit mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>

                    {!googleUser && (
                      <div>
                        <label htmlFor="bd-email" className="block text-sm font-semibold text-slate-700 mb-1">
                          Email <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="email"
                          id="bd-email"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-slate-800 text-sm"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#C0392B] text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:bg-[#a93226] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <Download size={18} /> Download Now
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-slate-400">
                      Your details are safe with us. We will only contact you regarding this project.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
