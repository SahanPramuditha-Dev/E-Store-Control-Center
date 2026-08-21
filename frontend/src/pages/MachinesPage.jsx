import React, { useEffect, useState } from 'react';
import { Laptop, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api';

export default function MachinesPage() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/licenses');
        setLicenses(res.data);
      } catch (err) {
        console.error('Failed to load machines', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLicenses();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Machine Telemetry & Terminal Bindings</h1>
        <p className="text-sm text-slate-400 mt-1">Hardware installations and active computers bound to client licenses</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Shop & Customer</th>
                  <th className="px-6 py-4">License Key</th>
                  <th className="px-6 py-4">Active Terminals</th>
                  <th className="px-6 py-4">Max Capacity</th>
                  <th className="px-6 py-4">Hardware Resets</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{lic.shop_name}</p>
                      <span className="text-xs text-slate-400">{lic.tenant_name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-teal-400">
                      {lic.license_key}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{lic.active_machines_count}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {lic.max_machines} Machine(s)
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {lic.replacement_count} / 3 Allowed
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Bound</span>
                      </span>
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
