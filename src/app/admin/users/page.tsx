import { Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import Link from 'next/link';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  // Fetch real data from the database
  let totalUsers = { count: 0 };
  let data: any[] = [];
  try {
    const [res] = await db.select({ count: count() }).from(users);
    if (res) totalUsers = res;
    data = await db.select().from(users).limit(pageSize).offset(offset);
  } catch (error) {
    console.error("Database connection failed on Users Page", error);
  }
  
  const totalPages = Math.ceil(totalUsers.count / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Global User Management</h2>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-500">Name</th>
              <th className="p-4 font-medium text-gray-500">Email</th>
              <th className="p-4 font-medium text-gray-500">Global Role</th>
              <th className="p-4 font-medium text-gray-500">Created</th>
              <th className="p-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No users found.</td>
              </tr>
            ) : (
              data.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{user.name || 'Unknown'}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.globalRole === 'SYSTEM_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.globalRole}
                    </span>
                  </td>
                  <td className="p-4">{user.createdAt.toISOString().split('T')[0]}</td>
                  <td className="p-4 text-blue-600 hover:underline cursor-pointer">Edit</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <span className="text-sm text-gray-500">
            Showing {data.length} of {totalUsers.count} users
          </span>
          <div className="flex items-center gap-2">
            <Link 
              href={`/admin/users?page=${Math.max(1, page - 1)}`}
              className={`p-1 border rounded bg-white hover:bg-gray-100 ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-medium">Page {page} of {Math.max(1, totalPages)}</span>
            <Link 
              href={`/admin/users?page=${Math.min(totalPages, page + 1)}`}
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
