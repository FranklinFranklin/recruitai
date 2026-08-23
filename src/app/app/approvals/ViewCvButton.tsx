'use client';

import { useState, useEffect } from 'react';
import { FileText, X, Download, ExternalLink } from 'lucide-react';

export default function ViewCvButton({ url, candidateName }: { url: string; candidateName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    if (url.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Data = url.replace('data:application/pdf;base64,', '');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (e) {
        console.error('Failed to parse base64 PDF data:', e);
        setBlobUrl(url);
      }
    } else {
      setBlobUrl(url);
    }
  }, [url]);

  const isPdf = !!blobUrl;

  const handleDownload = () => {
    if (!blobUrl && !url) return;
    const a = document.createElement('a');
    a.href = blobUrl || url;
    a.download = `${(candidateName || 'Candidate_CV').replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer"
      >
        <FileText className="w-3.5 h-3.5" />
        View Original CV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {candidateName ? `${candidateName} - Original CV` : 'Original Candidate CV'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secure Document Viewer</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPdf && (
                  <>
                    <button 
                      onClick={handleOpenNewTab}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-950 p-2 md:p-4 overflow-hidden flex items-center justify-center">
              {blobUrl ? (
                <iframe 
                  src={`${blobUrl}#view=FitH`} 
                  className="w-full h-full border-0 rounded-xl bg-white shadow-sm"
                  title="Candidate CV Document"
                />
              ) : (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-md text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Document Information</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 break-all bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-700">
                    {url || 'No document URL available'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload a new CV on the upload page to view full inline PDF rendering.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
