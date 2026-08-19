"use client";

import { useState } from "react";
import { Users, X, Loader2 } from "lucide-react";
import { createUserAction } from "./actions";

export default function AddUserModal({ tenants }: { tenants: { id: string, name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("RECRUITER");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createUserAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
      >
        <Users className="w-4 h-4" />
        Nieuwe Gebruiker
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Gebruiker Toevoegen</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volledige Naam</label>
                <input type="text" name="name" required placeholder="Jan de Vries" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google E-mailadres</label>
                <input type="email" name="email" required placeholder="jan@bedrijf.nl" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol / Functie</label>
                <select 
                  name="roleType" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <optgroup label="Klant (Tenant)">
                    <option value="RECRUITER">Recruiter (Standaard)</option>
                    <option value="MANAGER">Manager (Tenant Beheerder)</option>
                  </optgroup>
                  <optgroup label="Systeem (Global)">
                    <option value="AUDITOR">Auditor (Alleen lezen)</option>
                    <option value="ADMIN">Administrator (Volledige toegang)</option>
                  </optgroup>
                </select>
              </div>

              {(role === 'RECRUITER' || role === 'MANAGER') && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijf (Tenant)</label>
                  <select name="tenantId" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Selecteer een bedrijf...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {tenants.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">Let op: Je moet eerst een Tenant aanmaken.</p>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">
                  Annuleren
                </button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-70">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gebruiker Uitnodigen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
