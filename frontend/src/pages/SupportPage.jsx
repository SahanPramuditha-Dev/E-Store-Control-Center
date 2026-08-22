import React, { useEffect, useState } from 'react';
import { 
  LifeBuoy, Plus, RefreshCw, X, Loader2, 
  ExternalLink, CheckCircle2, Clock, AlertTriangle, 
  Search, Filter, User, Building2, MessageSquare, ShieldCheck
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';

export default function SupportPage() {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    tenant_id: '',
    subject: '',
    description: '',
    priority: 'MEDIUM'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, orgRes] = await Promise.all([
        api.get('/admin/support/tickets'),
        api.get('/admin/organizations')
      ]);
      setTickets(Array.isArray(tRes.data) ? tRes.data : []);
      const orgList = Array.isArray(orgRes.data) ? orgRes.data : [];
      setOrganizations(orgList);
      if (orgList.length > 0 && !form.tenant_id) {
        setForm(prev => ({ ...prev, tenant_id: orgList[0].id.toString() }));
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const cannedResponses = [
    { title: 'Hardware Machine Rebind', text: 'We have verified and reset your machine hardware lock. You can now activate your license key on the new register.' },
    { title: 'Thermal Printer & ESC/POS Setup', text: 'Please ensure your thermal printer USB driver is running in RAW ESC/POS 80mm mode for instant receipts.' },
    { title: 'Enterprise Feature Activation', text: 'The requested enterprise feature module has been provisioned and enabled for your tenant organization.' }
  ];

  const handleApplyCanned = (text) => {
    setForm(prev => ({
      ...prev,
      description: prev.description ? `${prev.description}\n\n${text}` : text
    }));
    showToast('Canned response snippet inserted.', 'info');
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/support/tickets', {
        ...form,
        tenant_id: parseInt(form.tenant_id, 10)
      });
      showToast('Support ticket logged successfully.', 'success');
      setShowModal(false);
      setForm({
        tenant_id: organizations[0]?.id?.toString() || '',
        subject: '',
        description: '',
        priority: 'MEDIUM'
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.patch(`/admin/support/tickets/${ticketId}`, {
        status: newStatus
      });
      showToast(`Ticket status updated to ${newStatus}`, 'info');
      fetchData();
    } catch (err) {
      showToast('Failed to update ticket status', 'error');
    }
  };

  const handleImpersonate = async (tenantId) => {
    try {
      const res = await api.post(`/admin/organizations/${tenantId}/impersonate`);
      showToast(res.data.message, 'info');
      window.open(`/?impersonate_token=${res.data.impersonation_token}`, '_blank');
    } catch (err) {
      showToast('Impersonation failed', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Customer Support & Impersonation Hub
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage client inquiry tickets, SLA resolution statuses, and launch secure audited support access
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className={`p-2.5 rounded-2xl border transition shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-2xl text-xs transition shadow-md shadow-teal-500/20 active:scale-95 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider text-[10px] font-bold border-b ${
              isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-4">Ticket Number</th>
                <th className="px-5 py-4">Client Organization</th>
                <th className="px-5 py-4">Subject & Description</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
            }`}>
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No active support tickets logged.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-5 py-4 font-mono font-bold text-teal-500">
                      {t.ticket_number}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.company_name}</span>
                      <span className="text-[10px] text-slate-400">Agent: {t.assigned_agent}</span>
                    </td>

                    <td className="px-5 py-4 max-w-sm">
                      <span className={`font-semibold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.subject}</span>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.description}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                        t.priority === 'URGENT' || t.priority === 'HIGH'
                          ? (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200')
                          : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200')
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none border ${
                          isDark ? 'bg-slate-950 border-slate-800 text-teal-400' : 'bg-slate-50 border-slate-200 text-teal-700'
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleImpersonate(t.tenant_id)}
                        className={`p-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-sky-700 border-slate-200'
                        }`}
                        title="Enter Tenant Environment"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Enter Org</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Ticket */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-teal-500" />
                <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Create Support Ticket
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Client Organization *</label>
                <select
                  value={form.tenant_id}
                  onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                  required
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.company_name} ({o.tenant_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Subject / Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Printer connection timeout on POS 2"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Priority Level</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Issue Details *</label>
                  <span className="text-[10px] text-teal-400 font-semibold">Canned Templates:</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {cannedResponses.map((cr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyCanned(cr.text)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition ${
                        isDark ? 'bg-slate-950 border-slate-800 text-teal-400 hover:border-teal-500' : 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                      }`}
                    >
                      + {cr.title}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  placeholder="Detailed description of the customer request or troubleshooting steps..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none h-24 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600'
                  }`}
                />
              </div>


              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl shadow-md shadow-teal-500/20"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
