import { requireTenantMember } from '@/lib/auth/utils';
import Dropzone from './Dropzone';
import { Bot, ShieldCheck } from 'lucide-react';
import { getDictionary } from '@/lib/i18n';

export default async function UploadPage() {
  await requireTenantMember();
  const fullDict = await getDictionary();
  const dict = fullDict.upload;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{dict.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl text-lg">
          {dict.desc}
        </p>
      </div>

      <Dropzone dict={dict} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
          <Bot className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
          <p><strong>Automated Extraction:</strong> We use advanced LLMs to intelligently parse PDF formats without relying on rigid templates.</p>
        </div>
        <div className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <p><strong>Privacy First:</strong> Documents are stored in secure isolation. AI processing is strictly sandboxed via the Policy Engine.</p>
        </div>
      </div>
    </div>
  );
}
