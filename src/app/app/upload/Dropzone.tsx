'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { uploadCandidateCV } from '@/lib/workflows/actions';
import { useRouter } from 'next/navigation';

export default function Dropzone({ dict }: { dict: any }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setStatus('error');
      setErrorMessage('Please upload a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setStatus('uploading');
      
      const formData = new FormData();
      formData.append('cv_file', file);
      
      // Instantly trigger real backend action
      await uploadCandidateCV(formData);
      
      setStatus('success');
      
      setTimeout(() => {
        router.push('/app/approvals');
        router.refresh();
      }, 1500);
      
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An error occurred during upload.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8">
      
      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
        } ${status === 'success' ? 'border-emerald-500 bg-emerald-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => status === 'idle' && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".pdf" 
          className="hidden" 
        />
        
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 text-emerald-600 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="w-16 h-16" />
            <div>
              <h3 className="text-xl font-bold">{dict.success}</h3>
              <p className="text-sm text-emerald-700 mt-1">The AI is now extracting and matching the candidate.</p>
              <p className="text-xs text-emerald-600/70 mt-2 animate-pulse">Redirecting to pipeline...</p>
            </div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{file.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            
            {status === 'idle' && (
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" /> Start AI Intake
                </button>
              </div>
            )}

            {(status === 'uploading' || status === 'processing') && (
              <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-sm">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full w-full transition-all duration-300 animate-pulse"
                  ></div>
                </div>
                <p className="text-sm font-medium text-blue-700 text-center animate-pulse">
                  Encrypting & Uploading to Secure Storage...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 cursor-pointer">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 transition-colors">
              <UploadCloud className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{dict.uploadBox}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400"></p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border">
              <span></span>
              {dict.pdfOnly}
            </div>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Upload Failed</h4>
            <p className="text-sm mt-1 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
