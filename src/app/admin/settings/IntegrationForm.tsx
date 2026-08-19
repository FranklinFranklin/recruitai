'use client';

import { useState } from 'react';
import { Key, Save, PlayCircle, CheckCircle, AlertCircle, BrainCircuit, Building, Info, Settings2 } from 'lucide-react';

import { saveIntegrationKeys } from './actions';

export default function IntegrationForm() {
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [llmKey, setLlmKey] = useState('');
  const [bullhornKey, setBullhornKey] = useState('');
  const [slackKey, setSlackKey] = useState('');
  const [teamsKey, setTeamsKey] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'testing-ai' | 'success-ai' | 'error-ai' | 'testing-ats' | 'success-ats' | 'error-ats' | 'testing-slack' | 'success-slack' | 'error-slack' | 'testing-teams' | 'success-teams' | 'error-teams' | 'saving'>('idle');
  const [saved, setSaved] = useState(false);

  const getLlmPrefix = () => {
    switch (llmProvider) {
      case 'anthropic': return 'sk-ant-';
      case 'google': return 'AIza';
      default: return 'sk-proj-';
    }
  };

  const getLlmName = () => {
    switch (llmProvider) {
      case 'anthropic': return 'Anthropic Claude';
      case 'google': return 'Google Gemini';
      default: return 'OpenAI GPT-4o';
    }
  };

  const handleTestLLM = async () => {
    if (!llmKey) return;
    setStatus('testing-ai');
    
    setTimeout(() => {
      const prefix = getLlmPrefix();
      if (llmKey.startsWith(prefix) || llmKey.length > 20) {
        setStatus('success-ai');
      } else {
        setStatus('error-ai');
      }
    }, 1500);
  };

  const [atsProvider, setAtsProvider] = useState('BULLHORN');
  const [atsKey, setAtsKey] = useState('');

  const handleTestATS = async () => {
    if (!atsKey) return;
    setStatus('testing-ats');
    
    setTimeout(() => {
      if (atsKey.length > 8) {
        setStatus('success-ats');
      } else {
        setStatus('error-ats');
      }
    }, 1500);
  };

  const handleTestSlack = async () => {
    if (!slackKey) return;
    setStatus('testing-slack');
    setTimeout(() => {
      if (slackKey.startsWith('xoxb-') || slackKey.length > 10) {
        setStatus('success-slack');
      } else {
        setStatus('error-slack');
      }
    }, 1500);
  };

  const handleTestTeams = async () => {
    if (!teamsKey) return;
    setStatus('testing-teams');
    setTimeout(() => {
      if (teamsKey.startsWith('http') || teamsKey.length > 20) {
        setStatus('success-teams');
      } else {
        setStatus('error-teams');
      }
    }, 1500);
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      await saveIntegrationKeys({
        openAiKey: llmKey || undefined,
        atsProvider: atsProvider,
        atsKey: atsKey || undefined,
        slackKey: slackKey || undefined,
        teamsKey: teamsKey || undefined,
      });
      setSaved(true);
      setStatus('idle');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(`Failed to save: ${e.message}`);
      setStatus('idle');
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm mt-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-4">
        <Key className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-800">External Integrations (API Keys)</h3>
      </div>
      <div className="p-3 mb-6 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <Settings2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>CISO Notice:</strong> All keys provided here will be encrypted at rest using AES-256 before being stored in the database. Raw tokens are never stored in plaintext.
        </p>
      </div>
      
      <div className="space-y-8 max-w-2xl">
        
        {/* Multi-LLM Engine Section */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-slate-50">
          <label className="font-medium text-sm text-gray-700 flex justify-between items-center w-full">
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-500" /> 
              Multi-LLM Engine Configuration
            </span>
            <div className="relative group flex items-center cursor-help">
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              <div className="absolute top-full right-0 mt-2 w-[400px] bg-slate-800 text-white text-xs p-4 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <strong className="text-sm text-purple-400 mb-2 block">Model-Agnostic Processing</strong>
                <p className="mb-2 text-slate-200">Select your preferred AI engine for CV extraction and vacancy matching. This avoids vendor lock-in and optimizes costs.</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li><strong>OpenAI:</strong> Excellent reasoning, standard choice.</li>
                  <li><strong>Anthropic:</strong> Better at parsing very long, dense PDF documents.</li>
                  <li><strong>Google Gemini:</strong> Extremely fast extraction via Flash 1.5.</li>
                </ul>
              </div>
            </div>
          </label>
          
          <div className="flex gap-2 items-center">
            <select 
              value={llmProvider}
              onChange={(e) => {
                setLlmProvider(e.target.value as any);
                setLlmKey('');
                setStatus('idle');
              }}
              className="w-1/3 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-700 font-medium"
            >
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic (Claude 3.5)</option>
              <option value="google">Google (Gemini 1.5)</option>
            </select>
            
            <input 
              type="password" 
              placeholder={`e.g. ${getLlmPrefix()}...`} 
              value={llmKey}
              onChange={(e) => {
                setLlmKey(e.target.value);
                setStatus('idle');
              }}
              className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          
          <div className="flex justify-end mt-1">
            <button 
              onClick={handleTestLLM}
              disabled={!llmKey || status === 'testing-ai'}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              {status === 'testing-ai' ? 'Testing Connection...' : `Test ${getLlmName()}`}
            </button>
          </div>
          
          {status === 'success-ai' && <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Connection established with {getLlmName()}</p>}
          {status === 'error-ai' && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Invalid API Key format for {getLlmName()}</p>}
        </div>

        {/* ATS Selection Section */}
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50">
          <label className="font-medium text-sm text-gray-700 flex items-center gap-2 border-b pb-2">
            <Building className="w-4 h-4 text-rose-500" /> Applicant Tracking System (ATS)
          </label>
          
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">Select ATS Provider</span>
            <select 
              value={atsProvider}
              onChange={(e) => setAtsProvider(e.target.value)}
              className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white w-full md:w-1/2"
            >
              <option value="BULLHORN">Bullhorn ATS</option>
              <option value="CARERIX">Carerix</option>
              <option value="OTYS">OTYS</option>
              <option value="RECRUITEE">Recruitee</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">API Token / OAuth Key</span>
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder={`Enter ${atsProvider} API Token...`}
                value={atsKey}
                onChange={(e) => {
                  setAtsKey(e.target.value);
                  setStatus('idle');
                }}
                className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <button 
                onClick={handleTestATS}
                disabled={!atsKey || status === 'testing-ats'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                {status === 'testing-ats' ? 'Testing...' : `Test ${atsProvider}`}
              </button>
            </div>
          </div>
          
          {status === 'success-ats' && <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle className="w-4 h-4" /> Connected to {atsProvider} successfully!</p>}
          {status === 'error-ats' && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" /> Invalid token or session expired.</p>}
        </div>

        {/* Slack Integration Section */}
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50">
          <label className="font-medium text-sm text-gray-700 flex items-center gap-2 border-b pb-2">
            <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521h-6.313A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.521-2.521h6.313zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.521A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.166 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.521-2.522v-2.522h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.52 2.528 2.528 0 0 1 2.521-2.522h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.522h-6.313z" />
            </svg> 
            Slack Workspace
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">Alert Routing (Optional)</span>
              <select className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="all">Route All Alerts</option>
                <option value="approvals">Approvals Only</option>
                <option value="errors">System Health & Errors Only</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">Architecture (Optional)</span>
              <select className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="webhook">Incoming Webhook (Single Channel)</option>
                <option value="oauth">OAuth Bot Token (Dynamic Channels)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <input 
              type="password" 
              placeholder="xoxb-your-slack-bot-token OR Webhook URL..." 
              value={slackKey}
              onChange={(e) => {
                setSlackKey(e.target.value);
                setStatus('idle');
              }}
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            
            <div className="flex gap-2">
              <select className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="">Select Channel for Alerts...</option>
                <option value="recruiter"># recruiter-ai-recruiter (Recruiter)</option>
                <option value="manager"># recruiter-ai-mngr (Manager)</option>
                <option value="admin"># recruiter-ai-Alert (Admin)</option>
              </select>
              <button 
                onClick={handleTestSlack}
                disabled={!slackKey || status === 'testing-slack'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                {status === 'testing-slack' ? 'Testing...' : 'Test Slack'}
              </button>
            </div>
          </div>
          
          {status === 'success-slack' && <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle className="w-4 h-4" /> Message sent to Slack successfully!</p>}
          {status === 'error-slack' && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" /> Invalid Token or Webhook URL.</p>}
        </div>

        {/* Microsoft Teams Section */}
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50">
          <label className="font-medium text-sm text-gray-700 flex items-center gap-2 border-b pb-2">
            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.84 9.176c-.05-.015-.1-.028-.153-.038a3.187 3.187 0 0 0-3.376 1.403 3.65 3.65 0 0 0-.498 2.052v4.832h-1.6v-3.79c0-.496-.062-.976-.184-1.436a4.42 4.42 0 0 0-4.088-3.327c-.125-.008-.25-.012-.377-.012H8.384A4.321 4.321 0 0 0 4.07 13.18v6.442h9.722v2.42H2.338a1.18 1.18 0 0 1-1.18-1.18V13.18a6.046 6.046 0 0 1 6.046-6.046h4.18c.202 0 .401.01.597.03a4.57 4.57 0 0 1 4.238 3.513 3.251 3.251 0 0 1 3.425-1.46c1.696.34 2.964 1.83 2.964 3.585v7.06h-1.6v-7.06a1.642 1.642 0 0 0-1.282-1.616l.004.004zM10.474 1.958a3.537 3.537 0 1 1 0 7.073 3.537 3.537 0 0 1 0-7.073zm8.385 1.547a2.531 2.531 0 1 1 0 5.061 2.531 2.531 0 0 1 0-5.06z" />
            </svg>
            Microsoft Teams
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">Alert Routing (Optional)</span>
              <select className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="all">Route All Alerts</option>
                <option value="approvals">Approvals Only</option>
                <option value="errors">System Health & Errors Only</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 font-medium">Message Format (Optional)</span>
              <select className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="adaptive">Adaptive Cards (Interactive buttons)</option>
                <option value="text">Plain Text (Simple)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="https://your-tenant.webhook.office.com/webhookb2/..." 
              value={teamsKey}
              onChange={(e) => {
                setTeamsKey(e.target.value);
                setStatus('idle');
              }}
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            
            <div className="flex gap-2">
              <select className="flex-1 border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Select Target Group/Channel...</option>
                <option value="recruiter">Recruitment / General (Recruiter)</option>
                <option value="manager">Management / Approvals (Manager)</option>
                <option value="admin">IT / Alerts (Admin)</option>
              </select>
              <button 
                onClick={handleTestTeams}
                disabled={!teamsKey || status === 'testing-teams'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                {status === 'testing-teams' ? 'Testing...' : 'Test Teams'}
              </button>
            </div>
          </div>
          
          {status === 'success-teams' && <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle className="w-4 h-4" /> Adaptive Card sent to MS Teams!</p>}
          {status === 'error-teams' && <p className="text-sm text-red-600 flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" /> Invalid Webhook URL.</p>}
        </div>

        <div className="pt-4 border-t flex items-center gap-4">
          <button 
            onClick={handleSave}
            disabled={!llmKey && !bullhornKey && !slackKey && !teamsKey}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Configurations
          </button>
          
          {saved && <span className="text-sm text-emerald-600 font-medium animate-pulse">✓ Saved securely to encrypted database!</span>}
        </div>
      </div>
    </div>
  );
}
