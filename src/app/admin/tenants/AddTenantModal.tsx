"use client";

import { useState } from "react";
import { Building, X, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { createTenantAction, testIntegrationAction } from "./actions";

export default function AddTenantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Integration test state
  const [provider, setProvider] = useState("BULLHORN");
  const [apiKey, setApiKey] = useState("");
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState("");

  async function handleTestConnection() {
    setTestStatus('testing');
    setTestMessage("");
    const result = await testIntegrationAction(provider, apiKey);
    
    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message || "Verbinding geslaagd!");
    } else {
      setTestStatus('error');
      setTestMessage(result.error || "Fout bij verbinden.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createTenantAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setIsOpen(false);
      setLoading(false);
      // Reset state for next time
      setApiKey("");
      setTestStatus('idle');
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold shadow-sm transition-colors"
      >
        <Building className="w-4 h-4" />
        New Tenant
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Nieuwe Klant (Tenant)
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={onSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              {/* Basis Informatie */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Basis Informatie</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
                  <input type="text" name="name" required placeholder="Bijv. Techuis Recruitment B.V." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Abonnement</label>
                  <select name="plan" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="trial">Trial (14 dagen)</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Integratie / Credentials */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                  <span>ATS Integratie (Optioneel)</span>
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ATS Systeem</label>
                    <select 
                      name="provider" 
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    >
                      <option value="BULLHORN">Bullhorn</option>
                      <option value="RECRUITEE">Recruitee</option>
                      <option value="CARERIX">Carerix</option>
                      <option value="OTYS">OTYS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Token</label>
                    <input 
                      type="password" 
                      name="apiKey" 
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setTestStatus('idle'); // reset status on edit
                      }}
                      placeholder="API sleutel..." 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono" 
                    />
                  </div>
                </div>

                {/* Test knop */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                  <button 
                    type="button" 
                    onClick={handleTestConnection}
                    disabled={!apiKey || testStatus === 'testing'}
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {testStatus === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
                    Test Verbinding
                  </button>
                  
                  <div className="flex-1">
                    {testStatus === 'success' && (
                      <p className="text-xs text-green-700 flex items-center gap-1 font-medium animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" /> {testMessage}
                      </p>
                    )}
                    {testStatus === 'error' && (
                      <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-in fade-in">
                        <AlertCircle className="w-4 h-4" /> {testMessage}
                      </p>
                    )}
                    {testStatus === 'idle' && (
                      <p className="text-xs text-gray-500 italic">Test de credentials voordat je opslaat.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">
                  Annuleren
                </button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-70 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opslaan & Activeer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
