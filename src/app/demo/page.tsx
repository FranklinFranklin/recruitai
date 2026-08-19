"use client";

import { useState, useEffect } from "react";
import { 
  Upload, FileText, BrainCircuit, CheckCircle2, XCircle, 
  Building, Briefcase, ChevronRight, BarChart3, Users, 
  Clock, Zap, ShieldCheck, Mail
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
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-blue-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">RecruitAI <span className="text-blue-600 font-medium text-sm border bg-blue-50 px-2 py-0.5 rounded-full ml-2">Live Demo</span></span>
        </div>
        
        {/* The Dual-View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('RECRUITER')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${view === 'RECRUITER' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recruiter View
          </button>
          <button 
            onClick={() => setView('MANAGER')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${view === 'MANAGER' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Manager View
          </button>
        </div>
        
        <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
          Press <kbd className="bg-slate-100 border px-1.5 py-0.5 rounded text-slate-500">Ctrl + D</kbd> to reset
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-8 py-12 transition-all duration-500">
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
              <button onClick={() => alert("Hier opent de Calendly of Lead-form!")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
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

// --- RECRUITER VIEW COMPONENT ---
function RecruiterView({ demoState, setDemoState, simulateIntake, parsedData }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      {/* Left Column: Input */}
      <div className="lg:col-span-5 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Automatische Intake</h1>
          <p className="text-slate-500 text-lg">Laat de AI het voorwerk doen. Upload een CV en zie de magie.</p>
        </div>

        {/* Upload Box */}
        <div 
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 relative overflow-hidden
            ${demoState === 'IDLE' ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 cursor-pointer' : 'border-slate-200 bg-white opacity-50 pointer-events-none'}`}
          onClick={demoState === 'IDLE' ? simulateIntake : undefined}
        >
          {demoState === 'IDLE' ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="font-bold text-lg text-blue-900 mb-1">Klik om "Jan de Vries.pdf" te uploaden</p>
              <p className="text-blue-600/70 text-sm">Of sleep het bestand hierheen</p>
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
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
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
      <div className="lg:col-span-7">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
          
          <div className="border-b bg-slate-50/80 px-8 py-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-600" />
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
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">PDF tekst extraheren (OCR)...</p>
              </div>
            )}

            {demoState === 'ANALYZING' && (
              <div className="space-y-6 w-full max-w-md mx-auto">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse"><CheckCircle2 className="w-4 h-4 text-blue-600" /></div>
                  <p className="text-slate-700">Structureren van werkervaring...</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse" style={{ animationDelay: '0.5s'}}><CheckCircle2 className="w-4 h-4 text-blue-600" /></div>
                  <p className="text-slate-700">Matchen met actieve vacatures...</p>
                </div>
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                  <p className="text-slate-700">Privacy check uitvoeren (AVG)...</p>
                </div>
              </div>
            )}

            {demoState === 'REVIEW' && parsedData && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8 w-full">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Jan de Vries</h2>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> jan.devries@voorbeeld.nl
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex flex-col items-center">
                    <span className="text-emerald-600 text-xs font-bold uppercase">Match Score</span>
                    <span className="text-emerald-600 font-black text-2xl">{parsedData.score}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Beste Vacature Match</p>
                    <p className="font-semibold flex items-center gap-2 text-slate-800">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      {parsedData.matchedVacancy}
                    </p>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed border-l-2 border-blue-200 pl-3">
                      "Sterke match op basis van 5+ jaar Java ervaring. Ontbrekende kennis van AWS wordt gecompenseerd door brede Cloud Architectuur ervaring."
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Gevonden Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.map((s: string) => (
                        <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t flex gap-4">
                  <button onClick={() => setDemoState('IDLE')} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Afwijzen
                  </button>
                  <button onClick={() => setDemoState('CLIFFHANGER')} className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    Goedkeuren & Exporteer ATS <ChevronRight className="w-5 h-5" />
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
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Management ROI Dashboard</h1>
          <p className="text-slate-500 text-lg">Real-time inzicht in de besparingen en prestaties van je team.</p>
        </div>
        <div className="bg-white border rounded-xl px-4 py-2 text-sm font-bold shadow-sm">
          Deze Maand
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Clock className="text-blue-600 w-6 h-6" />}
          title="Tijd Bespaard"
          value="184 uur"
          trend="+12% tov vorige maand"
          color="blue"
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
            <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Gezond</span>
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
  // Map standard tailwind colors for safelist or use direct styles if arbitrary
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
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
    <div className={`flex items-center justify-between p-4 border rounded-2xl ${inactive ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-blue-300 transition-colors'}`}>
      <div className="flex items-center gap-3">
        <Building className="w-8 h-8 text-slate-400" />
        <div>
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{syncs}</p>
        </div>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${inactive ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
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
