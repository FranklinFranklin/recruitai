import { Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import Link from 'next/link';
import AddTenantModal from './AddTenantModal';

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Fetch real data from the database
  let totalTenants = { count: 0 };
  let data: any[] = [];
  try {
    const [res] = await db.select({ count: count() }).from(tenants);
    if (res) totalTenants = res;
    data = await db.select().from(tenants).limit(pageSize).offset(offset);
  } catch (error) {
    console.error("Database connection failed on Tenants Page", error);
  }
  
  const totalPages = Math.ceil(totalTenants.count / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tenant Management</h2>
        <AddTenantModal />
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Name</th>
              <th className="p-4 font-medium text-gray-500">Plan</th>
              <th className="p-4 font-medium text-gray-500">Created</th>
              <th className="p-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">No tenants found.</td>
              </tr>
            ) : (
              data.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-2 font-medium">
                    <Building className="w-4 h-4 text-gray-400" />
                    {tenant.name}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs uppercase">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4">{tenant.createdAt.toISOString().split('T')[0]}</td>
                  <td className="p-4 text-blue-600 hover:underline cursor-pointer">Manage</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <span className="text-sm text-gray-500">
            Showing {data.length} of {totalTenants.count} tenants
          </span>
          <div className="flex items-center gap-2">
            <Link 
              href={`/admin/tenants?page=${Math.max(1, page - 1)}`}
              className={`p-1 border rounded bg-white hover:bg-gray-100 ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-medium">Page {page} of {Math.max(1, totalPages)}</span>
            <Link 
              href={`/admin/tenants?page=${Math.min(totalPages, page + 1)}`}
              className={`p-1 border rounded bg-white hover:bg-gray-100 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
