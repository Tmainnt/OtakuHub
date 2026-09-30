'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide navbar on auth pages if desired
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/catalog" className="text-xl font-bold text-indigo-600">
              OtakuHub
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/catalog"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/catalog' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Catalog
              </Link>
              <Link
                href="/community"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/community' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Community
              </Link>
              <Link
                href="/chat"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/chat' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Chat Rooms
              </Link>
              <Link
                href="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/profile' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Profile
              </Link>
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
