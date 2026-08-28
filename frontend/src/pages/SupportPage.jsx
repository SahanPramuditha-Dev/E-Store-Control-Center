import React, { useEffect, useState } from 'react';
import { 
  LifeBuoy, Plus, RefreshCw, X, Loader2, 
  ExternalLink, CheckCircle2, Clock, AlertTriangle, 
  Search, Filter, User, Building2, MessageSquare, ShieldCheck
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/ToastContext';
import { useTheme } from '../components/ThemeContext';
import { Select, Button, Badge, PageHeader, Modal, EmptyState } from '../components/UI';

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
    <div className="space-y-7 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Centralized Page Header */}
      <PageHeader
        eyebrow="Customer Engineering & Incident Support"
        title="Customer Support & Impersonation Hub"
        subtitle="Manage client inquiry tickets, SLA resolution statuses, and launch secure audited support access"
        badges={[
          { label: `${tickets.length} Total Tickets`, tone: 'indigo' },
          { label: `${tickets.filter(t => t.status === 'OPEN').length} Open Inquiries`, tone: 'amber' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchData}
              icon={RefreshCw}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="purple-gradient"
              size="sm"
              onClick={() => setShowModal(true)}
              icon={Plus}
            >
              Create Ticket
            </Button>
          </div>
        }
      />

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
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      icon={LifeBuoy}
                      title="No Support Tickets Logged"
                      description="No active customer support tickets or SLA issues are currently outstanding."
                      action={
                        <Button
                          variant="purple-gradient"
                          size="sm"
                          onClick={() => setShowModal(true)}
                          icon={Plus}
                        >
                          Log New Ticket
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className={`transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-5 py-4 font-mono font-bold text-indigo-400">
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

                    <td className="px-5 py-3 w-40">
                      <Select
                        value={t.status}
                        onChange={(val) => handleUpdateStatus(t.id, val)}
                        options={[
                          { value: 'OPEN', label: 'OPEN', badge: 'New' },
                          { value: 'IN_PROGRESS', label: 'IN_PROGRESS', badge: 'Work' },
                          { value: 'RESOLVED', label: 'RESOLVED', badge: 'Done' },
                          { value: 'CLOSED', label: 'CLOSED', badge: 'End' },
                        ]}
                        size="sm"
                        fullWidth
                      />
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
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Support Ticket"
        subtitle="Log an incident, inquiry, or hardware trouble ticket for a tenant"
        icon={LifeBuoy}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 text-slate-300">Client Organization *</label>
            <Select
              value={form.tenant_id}
              onChange={(val) => setForm({ ...form, tenant_id: String(val) })}
              options={organizations.map(o => ({
                value: String(o.id),
                label: `${o.company_name} (${o.tenant_code})`,
              }))}
              placeholder="Select client organization..."
              size="md"
              fullWidth
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">Subject / Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Printer connection timeout on POS 2"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-300">Priority Level</label>
            <Select
              value={form.priority}
              onChange={(val) => setForm({ ...form, priority: val })}
              options={[
                { value: 'LOW', label: 'LOW', badge: 'Normal' },
                { value: 'MEDIUM', label: 'MEDIUM', badge: 'Standard' },
                { value: 'HIGH', label: 'HIGH', badge: 'High' },
                { value: 'URGENT', label: 'URGENT', badge: 'Critical' },
              ]}
              size="md"
              fullWidth
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-slate-300">Issue Details *</label>
              <span className="text-[10px] text-indigo-400 font-semibold">Canned Templates:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {cannedResponses.map((cr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyCanned(cr.text)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium border transition bg-slate-950 border-slate-800 text-indigo-400 hover:border-indigo-500"
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
              className="w-full px-3.5 py-2.5 rounded-xl border focus:outline-none h-24 bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="purple-gradient"
              size="sm"
              loading={submitting}
            >
              Log Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
