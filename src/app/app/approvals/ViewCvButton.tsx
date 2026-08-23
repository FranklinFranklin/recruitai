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
            
            {/* PDF Viewer using iframe or placeholder */}
            <div className="flex-1 w-full h-full bg-slate-200 dark:bg-slate-900 p-4 md:p-8 overflow-y-auto flex items-center justify-center">
              {url.startsWith('s3://') ? (
                <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-lg text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Secure Document Storage</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    This file is securely stored in an isolated Amazon S3 bucket at:
                    <br/>
                    <code className="bg-slate-100 dark:bg-slate-900 p-1 px-2 rounded mt-2 block break-all border dark:border-slate-700">{url}</code>
                  </p>
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-lg text-sm border border-amber-200 dark:border-amber-800/30">
                    <strong>Demo Mode:</strong> Because this is a demonstration environment, the physical PDF was discarded after AI extraction to prevent server abuse. In a production app, the backend would generate a short-lived AWS presigned URL to render the PDF here.
                  </div>
                </div>
              ) : (
                <iframe 
                  src={`${url}#view=FitH`} 
                  className="w-full h-full border-0 rounded bg-white shadow-inner"
                  title="Candidate CV"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
