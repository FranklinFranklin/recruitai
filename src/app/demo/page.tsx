"use client";

import { useState, useEffect } from "react";
import { 
  Upload, FileText, BrainCircuit, CheckCircle2, XCircle, 
  Building, Briefcase, ChevronRight, BarChart3, Users, 
  Clock, Zap, ShieldCheck, Mail, LayoutDashboard, CheckSquare, 
  UploadCloud, BarChart, Settings, LogOut, Shield, UserCircle, Workflow
} from "lucide-react";

type DemoState = 'IDLE' | 'LOADING' | 'ANALYZING' | 'REVIEW' | 'CLIFFHANGER';

export default function DemoPage() {
  const [view, setView] = useState<'RECRUITER' | 'MANAGER'>('RECRUITER');
  const [demoState, setDemoState] = useState<DemoState>('IDLE');
  
  // Fake candidate data for the storytelling
  const [parsedData, setParsedData] = useState<{ skills: string[]; matchedVacancy: string; score: number } | null>(null);

  // Hidden reset shortcut (Ctrl + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setDemoState('IDLE');
        setParsedData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const simulateIntake = () => {
    setDemoState('LOADING');
    setTimeout(() => {
      setDemoState('ANALYZING');
      setTimeout(() => {
        setParsedData({
          skills: ["Java", "Spring Boot", "React", "Cloud Architecture"],
          matchedVacancy: "Senior Fullstack Developer",
          score: 94
        });
        setDemoState('REVIEW');
      }, 2500); // AI thinking time
    }, 1500); // Upload time
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900 font-sans selection:bg-blue-100 overflow-hidden relative">
      
      {/* DEMO BANNER */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-4 animate-in slide-in-from-top-10 duration-700">
        <span className="text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Interactive Demo Mode</span>
        <div className="h-4 w-px bg-blue-700"></div>
        <div className="flex bg-blue-800 p-1 rounded-full">
          <button 
            onClick={() => setView('RECRUITER')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${view === 'RECRUITER' ? 'bg-white shadow-sm text-blue-900' : 'text-blue-200 hover:text-white'}`}
          >
            Recruiter
          </button>
          <button 
            onClick={() => setView('MANAGER')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${view === 'MANAGER' ? 'bg-white shadow-sm text-blue-900' : 'text-blue-200 hover:text-white'}`}
          >
            Manager
          </button>
        </div>
      </div>

      {/* FAKE SIDEBAR (Mimics original UI exactly) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 transition-colors duration-300 shrink-0">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-2xl font-black flex items-center gap-2 text-indigo-700 tracking-tight">
            <Workflow className="w-6 h-6" />
            Recruit<span className="text-slate-800">AI</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink icon={<LayoutDashboard />} label="Dashboard" active={view === 'MANAGER'} />
          <SidebarLink icon={<CheckSquare />} label="Approvals" badge={demoState === 'REVIEW' ? "1" : null} />
          <SidebarLink icon={<UploadCloud />} label="Upload CV" active={view === 'RECRUITER'} />
          <SidebarLink icon={<Users />} label="Candidates" />
          <SidebarLink icon={<BarChart />} label="ROI Reports" active={view === 'MANAGER'} />
          <SidebarLink icon={<Workflow />} label="Workflows" />

          {view === 'MANAGER' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2.5">Administration</p>
              </div>
              <SidebarLink icon={<Settings />} label="Settings" />
              <SidebarLink icon={<Users />} label="Team Monitor" />
            </>
          )}
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 px-2 mb-4 hover:bg-slate-200 p-2 -mx-2 rounded-xl cursor-pointer group">
            <div className={`p-2 rounded-lg ${view === 'MANAGER' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {view === 'MANAGER' ? <Shield className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Profile</span>
              <span className="text-sm font-bold text-slate-700">
                {view === 'MANAGER' ? 'Manager (Demo)' : 'Recruiter (Demo)'}
              </span>
            </div>
          </div>
          <button onClick={() => setDemoState('IDLE')} className="flex w-full justify-center items-center gap-2 p-2.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-all font-medium shadow-sm text-slate-600">
            <LogOut className="w-4 h-4" />
            Reset Demo
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50 transition-colors duration-300 relative pt-20">
        <div className="max-w-6xl mx-auto">
          {view === 'RECRUITER' ? (
            <RecruiterView 
              demoState={demoState} 
              setDemoState={setDemoState} 
              simulateIntake={simulateIntake} 
              parsedData={parsedData} 
            />
          ) : (
            <ManagerView />
          )}
        </div>
      </main>

      {/* Product-Led Growth Cliffhanger Modal */}
      {demoState === 'CLIFFHANGER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-10 text-center transform transition-all animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-slate-900">Boom. Geëxporteerd!</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              In een live omgeving staat deze kandidaat nu perfect ingevuld in jullie ATS (zoals <strong>Bullhorn, Carerix of Recruitee</strong>), inclusief de AI-match score en motivatie. Geen handwerk meer.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => alert("Hier opent de Calendly of Lead-form!")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Test dit met jullie eigen ATS
              </button>
              <button onClick={() => setDemoState('IDLE')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all">
                Demo Opnieuw Starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ icon, label, active = false, badge = null }: any) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg font-medium transition-colors cursor-pointer ${active ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'}`}>
      <div className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-500'}`}>
        {icon}
      </div>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{badge}</span>
      )}
    </div>
  );
}

// --- RECRUITER VIEW COMPONENT ---
function RecruiterView({ demoState, setDemoState, simulateIntake, parsedData }: any) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500">
      
      {/* Left Column: Input */}
      <div className="xl:col-span-5 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Upload CV</h1>
          <p className="text-slate-500">Laat de AI het voorwerk doen. Upload een CV en zie de magie.</p>
        </div>

        {/* Upload Box */}
        <div 
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 relative overflow-hidden
            ${demoState === 'IDLE' ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer shadow-inner' : 'border-slate-200 bg-white opacity-50 pointer-events-none'}`}
          onClick={demoState === 'IDLE' ? simulateIntake : undefined}
        >
          {demoState === 'IDLE' ? (
            <>
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="font-bold text-lg text-indigo-900 mb-1">Klik om "Jan_de_Vries_CV.pdf" te uploaden</p>
              <p className="text-indigo-600/70 text-sm">Of sleep het bestand hierheen</p>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Document wordt verwerkt...</p>
            </div>
          )}
        </div>

        {/* Value Prop Banner */}
        {demoState === 'REVIEW' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 animate-in slide-in-from-bottom-4 fade-in duration-700 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-emerald-900 font-bold">Tijd bespaard: ~14 minuten</p>
                <p className="text-emerald-700 text-sm">Normaal handwerk vs 4 seconden AI-verwerking.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: AI Output */}
      <div className="xl:col-span-7">
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
          
          <div className="border-b bg-slate-50/80 px-8 py-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              AI Extractie & Matching
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-3 py-1 rounded-full">Live Resultaat</span>
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center relative">
            {demoState === 'IDLE' && (
              <div className="text-center text-slate-400">
                <BrainCircuit className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Wachtend op input...</p>
              </div>
            )}

            {demoState === 'LOADING' && (
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">PDF tekst extraheren (OCR)...</p>
              </div>
            )}

            {demoState === 'ANALYZING' && (
              <div className="space-y-6 w-full max-w-md mx-auto">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse"><CheckCircle2 className="w-4 h-4 text-indigo-600" /></div>
                  <p className="text-slate-700 font-medium">Structureren van werkervaring...</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse" style={{ animationDelay: '0.5s'}}><CheckCircle2 className="w-4 h-4 text-indigo-600" /></div>
                  <p className="text-slate-700 font-medium">Matchen met actieve vacatures...</p>
                </div>
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin"></div>
                  <p className="text-slate-700 font-medium">Privacy check uitvoeren (AVG)...</p>
                </div>
              </div>
            )}

            {demoState === 'REVIEW' && parsedData && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-6 w-full">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Jan de Vries</h2>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> jan.devries@voorbeeld.nl
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex flex-col items-center shadow-sm">
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Match Score</span>
                    <span className="text-emerald-600 font-black text-3xl">{parsedData.score}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Beste Vacature Match</p>
                    <p className="font-semibold flex items-center gap-2 text-slate-800">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      {parsedData.matchedVacancy}
                    </p>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed border-l-2 border-indigo-200 pl-3">
                      "Sterke match op basis van 5+ jaar Java ervaring. Ontbrekende kennis van AWS wordt gecompenseerd door brede Cloud Architectuur ervaring."
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gevonden Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.map((s: string) => (
                        <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-100 shadow-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t flex gap-4">
                  <button onClick={() => setDemoState('IDLE')} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                    <XCircle className="w-5 h-5" /> Afwijzen
                  </button>
                  <button onClick={() => setDemoState('CLIFFHANGER')} className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    Goedkeuren & Exporteer <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MANAGER VIEW COMPONENT ---
function ManagerView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Management ROI Dashboard</h1>
          <p className="text-slate-500">Real-time inzicht in de besparingen en prestaties van je team.</p>
        </div>
        <div className="bg-white border rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm flex items-center gap-2">
          <Clock className="w-4 h-4"/> Deze Maand
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Clock className="text-indigo-600 w-6 h-6" />}
          title="Tijd Bespaard"
          value="184 uur"
          trend="+12% tov vorige maand"
          color="indigo"
        />
        <StatCard 
          icon={<Zap className="text-emerald-600 w-6 h-6" />}
          title="Verwerkte CV's"
          value="782"
          trend="100% geautomatiseerd"
          color="emerald"
        />
        <StatCard 
          icon={<BarChart3 className="text-purple-600 w-6 h-6" />}
          title="Geschatte ROI"
          value="€ 6.440"
          trend="Gebaseerd op €35/uur"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Integrations Mock */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Actieve Koppelingen</h3>
            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Gezond</span>
          </div>
          
          <div className="space-y-4">
            <IntegrationRow name="Bullhorn ATS" status="Actief" syncs="782 syncs" />
            <IntegrationRow name="Slack Notificaties" status="Actief" syncs="144 alerts" />
            <IntegrationRow name="Microsoft Teams" status="Pauze" syncs="0 syncs" inactive />
          </div>
        </div>

        {/* Compliance & Audit */}
        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-400"/> AVG Compliance Log</h3>
          </div>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
             <AuditRow time="10:42" text="CV data geëxporteerd naar Bullhorn (Kandidaat: Jan D.)" />
             <AuditRow time="10:42" text="Origineel PDF document definitief vernietigd van server." highlight />
             <AuditRow time="09:15" text="CV data geëxporteerd naar Bullhorn (Kandidaat: Sarah M.)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend, color }: any) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorMap[color] || 'bg-gray-50'}`}>
        {icon}
      </div>
      <p className="text-slate-500 font-medium mb-1">{title}</p>
      <p className="text-4xl font-black text-slate-900 mb-2">{value}</p>
      <p className={`text-sm font-bold ${colorMap[color]?.split(' ')[1]}`}>{trend}</p>
    </div>
  );
}

function IntegrationRow({ name, status, syncs, inactive = false }: any) {
  return (
    <div className={`flex items-center justify-between p-4 border rounded-2xl ${inactive ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-indigo-200 transition-colors shadow-sm'}`}>
      <div className="flex items-center gap-3">
        <Building className="w-8 h-8 text-slate-400" />
        <div>
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{syncs}</p>
        </div>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${inactive ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
        {status}
      </span>
    </div>
  );
}

function AuditRow({ time, text, highlight = false }: any) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-slate-900 bg-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow"></div>
      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] pl-4 md:pl-0">
        <div className={`p-4 rounded-xl border ${highlight ? 'bg-emerald-900/30 border-emerald-800' : 'bg-slate-800/50 border-slate-700'}`}>
          <div className="flex justify-between items-center mb-1">
            <time className="font-mono text-xs text-slate-400">{time}</time>
          </div>
          <p className={`text-sm ${highlight ? 'text-emerald-300 font-medium' : 'text-slate-300'}`}>{text}</p>
        </div>
      </div>
    </div>
  );
}
