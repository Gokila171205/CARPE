import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Trash2,
  Truck,
  Map,
  TrendingUp,
  Bell,
  BrainCircuit,
  LineChart,
  FileText,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Collections', path: '/collections', icon: Trash2 },
    { name: 'Vehicles', path: '/vehicles', icon: Truck },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Map', path: '/map', icon: Map },
    { name: 'Forecast', path: '/forecast', icon: LineChart },
    { name: 'AI Insights', path: '/ai-insights', icon: BrainCircuit },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const currentPageTitle =
    navItems.find((i) => location.pathname.startsWith(i.path))?.name || 'CARPE System';

  return (
    <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on Desktop, Slide-over on Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 select-none transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <Trash2 className="h-7 w-7 text-emerald-600 mr-2.5" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">CARPE</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Staff'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@carpe.org'}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 text-xs font-semibold text-red-600 hover:text-red-800 hover:underline flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column with Fixed Header and Scrollable Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Fixed Header */}
        <header className="bg-white shadow-sm h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 z-10 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {currentPageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <Link
              to="/alerts"
              className="relative p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none"
              title="View Alerts"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-sm select-none">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Independently Scrollable Center Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
