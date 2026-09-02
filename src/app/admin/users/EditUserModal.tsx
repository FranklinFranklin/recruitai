'use client';

import { useState } from 'react';
import { updateUserRole } from './actions';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    globalRole: string;
  };
}

export default function EditUserModal({ user }: EditUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(user.globalRole);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserRole(user.id, role);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:underline cursor-pointer font-medium"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Edit User Role</h3>
              <p className="text-sm text-slate-500 mb-6 truncate">
                Update permissions for <span className="font-semibold text-slate-700">{user.email}</span>
              </p>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Global Role</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="USER">USER (Standard Access)</option>
                    <option value="SYSTEM_AUDITOR">SYSTEM_AUDITOR (Read-only Admin)</option>
                    <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Full Global Control)</option>
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Saving...' : 'Save Changes'}
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
