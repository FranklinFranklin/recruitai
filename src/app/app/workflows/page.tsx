import { Workflow, Play, Info, Cpu, ShieldCheck } from 'lucide-react';
import { getDictionary } from '@/lib/i18n';

export default async function WorkflowsPage() {
  const fullDict = await getDictionary();
  const dict = fullDict.workflows;
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Page Header & Simple Explanation */}
      <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-2xl p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Cpu className="w-8 h-8 text-blue-600" />
          {dict.title}
        </h2>
        <p className="text-slate-600 max-w-3xl leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: dict.intro }} />
        
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex items-start gap-2 bg-white p-3 rounded-lg border shadow-sm">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <span className="text-sm text-slate-600">{dict.stuckTip}</span>
          </div>
          <div className="flex items-start gap-2 bg-white p-3 rounded-lg border shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-sm text-slate-600">{dict.securityTip}</span>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2">{dict.activeAutomations}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
                <Workflow className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">CV Intake &amp; Matching</h3>
                <p className="text-sm text-slate-500 mt-1">{dict.cvIntakeDesc}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ACTIVE
            </span>
          </div>
          
          <div className="border-t pt-4 mt-4 flex justify-between items-center relative z-10 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Privacy Level</span>
              <span className="text-sm font-bold text-slate-700">{dict.confidential}</span>
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm hover:shadow">
              <Play className="w-4 h-4 text-blue-600" />
              Run Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

