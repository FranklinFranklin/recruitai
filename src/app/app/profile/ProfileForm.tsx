'use client';

import { useState, useRef, useEffect } from 'react';
import { UserCircle, Camera, Moon, Sun, Bell, Shield, Globe, CheckCircle2, Activity, ArrowUpRight, Hash, MessageSquare } from 'lucide-react';
import { updateProfile, updateProfilePicture } from './actions';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ user, role, stats, dict, initialLang }: { user: any, role: string, stats: any, dict: any, initialLang: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState(initialLang);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState(user.image);
  
  let slackChannel = '#recruiter-ai-recruiter';
  let teamsChannel = 'Recruitment / General';
  
  if (user.globalRole === 'SYSTEM_ADMIN') {
    slackChannel = '#recruiter-ai-Alert';
    teamsChannel = 'IT / Alerts';
  } else if (role === 'TENANT_ADMIN') {
    slackChannel = '#recruiter-ai-mngr';
    teamsChannel = 'Management / Approvals';
  }
  


  // Initialize Dark Mode from localStorage on mount
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleDarkModeToggle = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        await updateProfilePicture(base64);
        router.refresh();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    // Save to DB
    await updateProfile(formData);
    
    // Save preferences locally
    localStorage.setItem('language', language);
    
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  // Split name for UI
  const nameParts = (user.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 dark:text-white">
      
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{dict.myProfile || "Profile Settings"}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{dict.manageSettings || "Manage your personal account, preferences, and security."}</p>
        </div>
        {saved && (
          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/50 px-4 py-2 rounded-lg">
            <CheckCircle2 className="w-5 h-5" /> Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <div className="h-24 w-full bg-gradient-to-r from-blue-500 to-indigo-600 absolute top-0 left-0"></div>
            
            <div className="relative mt-8 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
              <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center overflow-hidden bg-cover bg-center" style={{ backgroundImage: avatar ? `url(${avatar})` : 'none' }}>
                {!avatar && <UserCircle className="w-20 h-20 text-slate-400 group-hover:opacity-50 transition-opacity" />}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-slate-900/60 p-2 rounded-full backdrop-blur-sm text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{user.name || 'User'}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full">
              {role === 'TENANT_ADMIN' ? <Shield className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />} 
              {role === 'TENANT_ADMIN' ? 'Manager' : 'Recruiter'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Performance Monitor
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{dict.approvedToday || "Approved Today"}</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{stats.today}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{dict.thisMonth || "This Month"}</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{stats.month}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{dict.totalApprovals || "Total Approved"}</span>
                <span className="text-xl font-black text-slate-800 dark:text-white">{stats.total}</span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 block mb-1">{dict.exportedToAts || "Exported to ATS"}</span>
                <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  {stats.exported} <ArrowUpRight className="w-4 h-4 opacity-50" />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" /> Account Security
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{dict.ssoManaged || "Managed by SSO"}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Authentication and password management are securely handled by your organization's Single Sign-On (SSO) provider. 
                  Please contact your IT administrator to update credentials or 2FA settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms & Preferences */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-6 text-lg border-b border-slate-200 dark:border-slate-800 pb-4">{dict.personalInfo || "Personal Information"}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{dict.firstName || "First Name"}</label>
                <input name="firstName" type="text" defaultValue={firstName} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{dict.lastName || "Last Name"}</label>
                <input name="lastName" type="text" defaultValue={lastName} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white" required />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{dict.email || "Email Address"}</label>
                <input type="email" defaultValue={user.email} disabled className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 rounded-xl p-3 outline-none cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-1">Email address cannot be changed. Contact IT support.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-6 text-lg border-b border-slate-200 dark:border-slate-800 pb-4">{dict.preferences || "App Preferences"}</h4>
            
            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm">{dict.appearance || "Appearance (Dark Mode)"}</h5>
                    <p className="text-xs text-slate-500">{dict.darkModeDesc || "Toggle dark theme for late-night sourcing."}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleDarkModeToggle}
                  className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Communication Gateways (Role-Based) */}
              <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm">{dict.commGateways || "Communication Gateways"}</h5>
                    <p className="text-xs text-slate-500">{dict.commDesc}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <div className="flex-1 flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm opacity-80">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Slack</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">{slackChannel}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm opacity-80">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">MS Teams</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">{teamsChannel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm">{dict.language || "System Language"}</h5>
                    <p className="text-xs text-slate-500">{dict.languageDesc || "Select your preferred interface language."}</p>
                  </div>
                </div>
                <select 
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setLanguage(newLang);
                    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
                    router.refresh();
                  }}
                  className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2 text-sm font-medium text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="en">English (US)</option>
                  <option value="nl">Nederlands (NL)</option>
                </select>
              </div>

            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </div>
      </div>
      </form>


    </>
  );
}
