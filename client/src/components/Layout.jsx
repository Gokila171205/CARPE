import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import tnGovtEmblem from '../assets/tn-government-emblem.png';
import {
  LayoutDashboard,
  Trash2,
  Truck,
  Map as MapIcon,
  TrendingUp,
  Bell,
  BrainCircuit,
  LineChart,
  FileText,
  Menu,
  X,
  Building2,
  Shield,
  Phone,
  LogOut,
  ChevronRight,
  PlusCircle
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, fontSizeLevel, setFontSizeLevel } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections = [
    {
      title: t('nav.sectionCore'),
      items: [
        {
          name: t('nav.dashboard'),
          subtitle: t('nav.dashboardSubtitle'),
          path: '/dashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      title: t('nav.sectionWaste'),
      items: [
        {
          name: t('nav.collections'),
          subtitle: t('nav.collectionsSubtitle'),
          path: '/collections',
          icon: Trash2
        },
        {
          name: t('nav.logCollection'),
          subtitle: t('nav.logCollectionSubtitle'),
          path: '/collections/add',
          icon: PlusCircle
        },
        {
          name: t('nav.vehicles'),
          subtitle: t('nav.vehiclesSubtitle'),
          path: '/vehicles',
          icon: Truck
        }
      ]
    },
    {
      title: t('nav.sectionAnalytics'),
      items: [
        {
          name: t('nav.analytics'),
          subtitle: t('nav.analyticsSubtitle'),
          path: '/analytics',
          icon: TrendingUp
        },
        {
          name: t('nav.map'),
          subtitle: t('nav.mapSubtitle'),
          path: '/map',
          icon: MapIcon
        },
        {
          name: t('nav.forecast'),
          subtitle: t('nav.forecastSubtitle'),
          path: '/forecast',
          icon: LineChart
        }
      ]
    },
    {
      title: t('nav.sectionGov'),
      items: [
        {
          name: t('nav.alerts'),
          subtitle: t('nav.alertsSubtitle'),
          path: '/alerts',
          icon: Bell
        },
        {
          name: t('nav.reports'),
          subtitle: t('nav.reportsSubtitle'),
          path: '/reports',
          icon: FileText
        },
        {
          name: t('nav.aiInsights'),
          subtitle: t('nav.aiInsightsSubtitle'),
          path: '/ai-insights',
          icon: BrainCircuit
        }
      ]
    }
  ];

  const allNavItems = navSections.flatMap((s) => s.items);
  const currentPage = allNavItems.find((i) =>
    i.path === '/collections/add'
      ? location.pathname === '/collections/add'
      : location.pathname === i.path ||
        (i.path !== '/collections' && i.path !== '/dashboard' && location.pathname.startsWith(i.path))
  );
  const currentPageTitle = currentPage?.name || t('nav.portalTitle');

  const todayFormatted = new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const fontScaleClass = fontSizeLevel === 0 ? 'text-xs' : fontSizeLevel === 2 ? 'text-base' : 'text-sm';

  return (
    <div className={`h-screen w-screen bg-[#f4f6f9] flex flex-col overflow-hidden text-slate-900 ${fontScaleClass}`}>
      {/* 1. Official Government Top Utility Ribbon */}
      <a href="#main-content" className="skip-link">
        {t('header.skipToMain')}
      </a>

      <div className="bg-[#002244] text-slate-200 text-xs py-1.5 px-4 sm:px-6 flex justify-between items-center border-b border-[#001833] flex-shrink-0 select-none z-30">
        <div className="flex items-center gap-3">
          <span className="font-bold text-amber-400 tracking-wide">
            {t('header.govtTamilNadu')}
          </span>
          <span className="hidden md:inline-block text-slate-400 text-[11px] border-l border-slate-700 pl-3">
            {t('header.deptFull')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Accessibility Font Size Controls */}
          <div className="hidden sm:flex items-center gap-1 border-r border-slate-700 pr-3">
            <span className="text-[10px] text-slate-400 mr-1">{t('header.textSize')}</span>
            <button
              type="button"
              onClick={() => setFontSizeLevel(0)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                fontSizeLevel === 0 ? 'bg-amber-500 text-slate-900' : 'hover:bg-slate-700 text-slate-300'
              }`}
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel(1)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                fontSizeLevel === 1 ? 'bg-amber-500 text-slate-900' : 'hover:bg-slate-700 text-slate-300'
              }`}
              title="Standard Font Size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel(2)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                fontSizeLevel === 2 ? 'bg-amber-500 text-slate-900' : 'hover:bg-slate-700 text-slate-300'
              }`}
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Bilingual Language Switcher with Active Persistence */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-3">
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                language === 'ta'
                  ? 'bg-amber-500 text-slate-900 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-label="தமிழ் மொழிக்கு மாறவும்"
            >
              தமிழ்
            </button>
            <span className="text-slate-500">|</span>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-900 shadow-xs ring-1 ring-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-label="Switch to English language"
            >
              English
            </button>
          </div>

          {/* Screen Reader & Helpline Notice */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-300">
            <Phone className="h-3 w-3 text-amber-400" />
            <span>{t('header.tollFree')} {t('header.tollFreeNumber')}</span>
          </div>
        </div>
      </div>

      {/* 2. Official Government Department Identity Header Banner - Centered Layout */}
      <header className="bg-white border-b-2 border-[#003366] px-4 sm:px-6 py-2 sm:py-2.5 flex-shrink-0 flex items-center justify-between z-20 shadow-xs">
        {/* Left Side: Mobile Menu Button or Clean Spacer */}
        <div className="flex items-center w-12 md:w-44 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded text-slate-700 hover:bg-slate-100 border border-slate-300"
            aria-label="Open portal navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Center: Main Government of Tamil Nadu Identity */}
        <div className="flex-1 flex items-center justify-center gap-3 sm:gap-4.5 px-2">
          <img
            src={tnGovtEmblem}
            alt="Government of Tamil Nadu Emblem"
            className="h-13 sm:h-16 md:h-[68px] w-auto object-contain flex-shrink-0"
          />

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm sm:text-base md:text-lg font-black text-[#003366] uppercase tracking-wider">
                {t('header.govtTamilNadu')}
              </span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold">
                {t('header.statePortal')}
              </span>
            </div>
            <p className="text-xs sm:text-[13px] font-bold text-slate-700 leading-tight mt-0.5">
              {t('header.deptName')}
            </p>
          </div>
        </div>

        {/* Right Side: System Date, Officer Metadata & Logout */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 md:w-44 flex-shrink-0">
          <div className="hidden lg:block text-right text-xs">
            <span className="text-slate-400 text-[11px] block">{t('header.systemDate')}</span>
            <p className="font-bold text-slate-700 text-xs">{todayFormatted}</p>
          </div>

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                {user?.name || t('header.municipalOfficer')}
              </p>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold uppercase block">
                {user?.role || t('header.authorizedAdmin')}
              </span>
            </div>

            <div className="h-8.5 w-8.5 rounded-full bg-[#003366] text-amber-300 border border-amber-400 flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
              {user?.name?.charAt(0) || 'O'}
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors ml-0.5"
              title={t('header.signOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Workspace Shell with Fixed Department Navigation and Scrollable Center */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Official Department Navigation Sidebar (Fixed on Desktop, Slide-over on Mobile) */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#00284d] text-slate-200 border-r border-[#001f38] flex flex-col h-full flex-shrink-0 select-none transition-transform duration-200 ease-in-out md:static md:translate-x-0 shadow-lg ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Drawer Header */}
          <div className="h-14 flex items-center justify-between px-4 bg-[#001f38] md:hidden border-b border-[#001833]">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              <span className="font-bold text-sm text-white">{t('nav.sectionCore')}</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-3 bg-[#001f38] border-b border-[#001833] hidden md:block">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              {t('nav.portalTitle')}
            </span>
          </div>

          <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-2 pb-1 text-[10px] uppercase font-bold tracking-wider text-amber-400/80">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const isActive =
                    item.path === '/collections/add'
                      ? location.pathname === '/collections/add'
                      : location.pathname === item.path ||
                        (item.path !== '/collections' &&
                          item.path !== '/dashboard' &&
                          location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#004d80] text-white font-bold border-l-4 border-amber-400 shadow-xs'
                          : 'text-slate-300 hover:bg-[#003859] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <Icon
                          className={`mr-2.5 h-4 w-4 flex-shrink-0 ${
                            isActive ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        />
                        <div className="truncate">
                          <span className="block leading-tight">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Departmental Footer Badge & Emblem License Attribution in Sidebar */}
          <div className="p-3 bg-[#001a33] border-t border-[#001833] flex-shrink-0 text-center text-[10px] text-slate-400">
            <p className="font-semibold text-slate-300">{t('nav.portalTitle')}</p>
            <p className="mt-0.5">{t('nav.footerCopyright', { year: new Date().getFullYear() })}</p>
            <a
              href="https://commons.wikimedia.org/wiki/File:Tamil_Nadu_Emblem.png"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-amber-400 underline block mt-1.5 text-[9px]"
              title="Wikimedia Commons Licensing Credit"
            >
              {t('nav.emblemAttribution')}
            </a>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#f4f6f9]">
          {/* Breadcrumb & Section Identifier Ribbon */}
          <div className="bg-white border-b border-slate-300 px-4 sm:px-6 py-2 flex items-center justify-between flex-shrink-0 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
              <span className="font-semibold text-[#003366]">{t('nav.breadcrumbPortal')}</span>
              <span>/</span>
              <span className="font-bold text-slate-900 truncate">{currentPageTitle}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                <Shield className="h-3 w-3 mr-1 text-[#003366]" />
                {t('common.officialGovtRecord')}
              </span>
            </div>
          </div>

          {/* Independently Scrollable Center Content Area */}
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

