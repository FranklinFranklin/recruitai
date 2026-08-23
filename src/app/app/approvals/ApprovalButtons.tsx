"use client";
import { submitApproval, updateCandidateData } from '@/lib/workflows/actions';
import { useState, useEffect } from 'react';
import { Check, X, Loader2, Pencil, Save, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApprovalButtons({ candidate, dict }: { candidate: any, dict: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<boolean | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: candidate.firstName || '',
    lastName: candidate.lastName || '',
    jobTitle: candidate.jobTitle || '',
    skills: candidate.skills?.join(', ') || '',
    yearsOfExperience: candidate.yearsOfExperience || 0,
    matchedVacancyId: candidate.matchedVacancyId || ''
  });

  // 4. Undo functionality & Toast
  async function handleAction(approved: boolean) {
    if (pendingAction !== null) return;
    setPendingAction(approved);
    setToastMessage(approved ? 'Approving candidate...' : 'Rejecting candidate...');
    
    // Give user 3 seconds to undo
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        await submitApproval(candidate.id, approved);
        setToastMessage('');
        router.refresh();
      } catch (e) {
        console.error(e);
        alert('Failed to submit approval.');
        setPendingAction(null);
        setToastMessage('');
        setIsLoading(false);
      }
    }, 3000);

    // Attach timeout ID to a ref or window to clear it if undone
    (window as any)[`undoTimeout_${candidate.id}`] = timeoutId;
  }

  function handleUndo() {
    clearTimeout((window as any)[`undoTimeout_${candidate.id}`]);
    setPendingAction(null);
    setToastMessage('');
  }

  // 2. Keyboard Shortcuts (Power Users)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in the edit modal
      if (isEditing || pendingAction !== null) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'a') handleAction(true);
      if (e.key.toLowerCase() === 'r') handleAction(false);
      if (e.key.toLowerCase() === 'e') setIsEditing(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, pendingAction]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateCandidateData(candidate.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle,
        skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
        yearsOfExperience: Number(formData.yearsOfExperience),
        matchedVacancyId: formData.matchedVacancyId
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to save changes.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full py-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (toastMessage) {
    return (
      <div className="flex justify-between items-center bg-slate-800 text-white px-4 py-3 rounded-lg w-full animate-in slide-in-from-right-4 shadow-lg">
        <span className="text-sm font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> {toastMessage}
        </span>
        <button 
          onClick={handleUndo}
          className="text-xs font-bold text-blue-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> UNDO
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <button 
          onClick={() => handleAction(true)}
          className="flex justify-between items-center bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm w-full group"
        >
          <span className="flex items-center gap-2"><Check className="w-4 h-4" /> APPROVE</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-emerald-800/50 rounded text-[10px] text-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity">A</kbd>
        </button>
        <button 
          onClick={() => setIsEditing(true)}
          className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium w-full group"
        >
          <span className="flex items-center gap-2"><Pencil className="w-4 h-4" /> EDIT</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-slate-300/50 rounded text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">E</kbd>
        </button>
        <button 
          onClick={() => handleAction(false)}
          className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/40 px-4 py-2 rounded-lg hover:bg-rose-100 transition-colors font-medium w-full group"
        >
          <span className="flex items-center gap-2"><X className="w-4 h-4" /> REJECT</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-rose-200/50 rounded text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">R</kbd>
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl dark:border dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Correct AI Extraction
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 dark:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Function / Job Title</label>
                <input 
                  type="text" 
                  className="w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.jobTitle}
                  onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                  placeholder="e.g. Logistiek Coördinator, Financieel Analist"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Extracted Skills (Comma separated)</label>
                <textarea 
                  className="w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                  value={formData.skills}
                  onChange={e => setFormData({...formData, skills: e.target.value})}
                />
                <p className="text-xs text-slate-400 mt-1">Example: WMS, Supply Chain, Planning, SAP</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Experience (Years)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.yearsOfExperience}
                    onChange={e => setFormData({...formData, yearsOfExperience: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Matched Vacancy ID</label>
                  <input 
                    type="text" 
                    className="w-full border dark:border-slate-700 dark:bg-slate-800 rounded-lg dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.matchedVacancyId}
                    onChange={e => setFormData({...formData, matchedVacancyId: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
