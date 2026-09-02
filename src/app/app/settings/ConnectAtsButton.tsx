'use client';

import { useState } from 'react';
import { connectAtsIntegration } from './actions';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ConnectAtsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState('bullhorn');
  const [token, setToken] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await connectAtsIntegration(provider, token);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to connect ATS');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-md text-sm font-bold shadow-sm transition-colors"
      >
        Connect ATS
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Connect ATS Integration</h3>
              <p className="text-sm text-slate-500 mb-6">Enter your API details to synchronize vacancies automatically.</p>
              
              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Provider</label>
                  <select 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bullhorn">Bullhorn</option>
                    <option value="recruitee">Recruitee</option>
                    <option value="carerix">Carerix</option>
                    <option value="otys">OTYS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">API Token</label>
                  <input 
                    type="password"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your secret token here..."
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tokens are encrypted securely before storing.</p>
                </div>

                <div className="pt-4 flex gap-3 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending || !token}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isPending ? 'Connecting...' : 'Save Connection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
