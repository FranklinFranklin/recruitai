import { requireSystemAdmin } from '@/lib/auth/utils';
import { Settings, Sliders, Shield, Key } from 'lucide-react';
import IntegrationForm from './IntegrationForm';

export default async function SettingsPage() {
  // Ensure the user is a system admin (auditors get read-only)
  await requireSystemAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Settings className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Global System Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Core Configuration */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sliders className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">Core Configuration</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage global application features and UI defaults.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Disable access for all tenants.</p>
              </div>
              <div className="w-10 h-5 bg-gray-200 rounded-full cursor-not-allowed"></div>
            </div>
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Auto-Provisioning</p>
                <p className="text-xs text-gray-500">Allow new tenants via public API.</p>
              </div>
              <div className="w-10 h-5 bg-blue-500 rounded-full cursor-not-allowed flex justify-end">
                <div className="w-5 h-5 bg-white rounded-full border shadow-sm"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-4 italic">* Editing settings is disabled in this MVP placeholder.</p>
        </div>

        {/* Security Policies */}
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">Security Policies</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Manage AI constraints and SSO requirements.</p>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1 pb-3">
              <label className="font-medium text-sm">Required MFA</label>
              <select disabled className="border rounded p-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                <option>All Users</option>
                <option>System Admins Only</option>
                <option>Optional</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1 pb-3">
              <label className="font-medium text-sm">Default AI Model</label>
              <select disabled className="border rounded p-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                <option>gpt-4o-mini (EU Hosted)</option>
                <option>gpt-4 (US Hosted)</option>
              </select>
            </div>
          </div>
        </div>
        
      </div>

      <IntegrationForm />
    </div>
  );
}
