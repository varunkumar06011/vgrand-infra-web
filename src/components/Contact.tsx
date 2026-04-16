import { useState } from 'react';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Submission failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-black overflow-hidden text-Inter">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
            >
              Get in Touch
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight mb-8"
            >
              Let's build something <span className="text-orange-500 italic font-serif">Legendary.</span>
            </motion.h2>

            <div className="space-y-8 mt-12">
              <div className="flex items-center space-x-6 group">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Call Us</div>
                  <div className="text-white text-xl font-medium">+91 90301 43333</div>
                </div>
              </div>

              <div className="flex items-center space-x-6 group">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Email Us</div>
                  <div className="text-white text-xl font-medium">contact@vgrandinfra.com</div>
                </div>
              </div>

              <div className="flex items-center space-x-6 group">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Our Office</div>
                  <div className="text-white text-xl font-medium">Koppolu Road, Ongole, AP</div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/5 p-10 rounded-[2rem] border border-white/10 backdrop-blur-sm relative"
          >
            {success ? (
              <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-Inter">Thank You!</h3>
                <p className="text-white/60">Your message has been received. Our team will contact you shortly.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-8 text-orange-500 font-bold uppercase tracking-widest text-sm hover:text-orange-400"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-white/60 text-xs uppercase tracking-widest ml-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/60 text-xs uppercase tracking-widest ml-1">Email / Phone</label>
                    <input
                      type="text"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="Email or Phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-white/60 text-xs uppercase tracking-widest ml-1">Project Brief / Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                    placeholder="Tell us about your vision..."
                  ></textarea>
                </div>
                <button 
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-900 text-white font-bold py-5 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 group"
                >
                  <span className="uppercase tracking-widest">{loading ? 'Sending...' : 'Submit Proposal'}</span>
                  {!loading && <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
