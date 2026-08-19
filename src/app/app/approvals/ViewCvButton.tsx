'use client';

import { useState } from 'react';
import { FileText, X } from 'lucide-react';

export default function ViewCvButton({ url }: { url: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm font-medium"
      >
        <FileText className="w-3 h-3" />
        View Original CV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Original Candidate CV
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* PDF Viewer using iframe */}
            <div className="flex-1 w-full h-full bg-slate-100 p-2 md:p-4 overflow-hidden relative">
              <iframe 
                src={`${url}#view=FitH`} 
                className="w-full h-full border-0 rounded bg-white shadow-inner"
                title="Candidate CV"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
