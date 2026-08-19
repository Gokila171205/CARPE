import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Layers,
  FileText,
  LineChart,
  BrainCircuit,
  Scale,
  Building2,
  Truck,
  BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, translateWasteType, translatePriority } = useLanguage();
  const [summaryData, setSummaryData] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, alertsRes] = await Promise.all([
          api.get('/analytics/summary').catch(() => ({ data: null })),
          api.get('/alerts').catch(() => ({ data: [] }))
        ]);

        if (summaryRes.data) {
          setSummaryData(summaryRes.data);
        }
        if (Array.isArray(alertsRes.data)) {
          setRecentAlerts(alertsRes.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div className="space-y-6">
      {/* 1. CARPE Dashboard Preface Banner */}
      <div className="bg-white border-2 border-slate-300 rounded-sm shadow-xs overflow-hidden">
        <div className="bg-[#003366] text-white px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              {t('dashboard.heroTitle')}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {t('dashboard.heroSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#002244] px-3 py-1.5 rounded border border-blue-900 text-xs">
            <Building2 className="h-4 w-4 text-amber-400" />
            <span className="text-slate-200">{t('dashboard.heroSubtitle')}</span>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="max-w-4xl text-xs text-slate-600">
            <strong>{t('dashboard.platformScopeTitle')}</strong> {t('dashboard.platformScopeText')}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/collections/add"
              className="inline-flex items-center px-3.5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white rounded text-xs font-bold shadow-xs transition-colors"
            >
              {t('dashboard.logCollectionBtn')}
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-bold shadow-xs transition-colors"
            >
              <FileText className="h-3.5 w-3.5 mr-1 text-[#003366]" />
              {t('dashboard.officialReportsBtn')}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Structured Statutory Key Performance Indicators */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="govt-section-header text-sm uppercase tracking-wider">
            {t('dashboard.metricsHeading')}
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">{t('common.sourceNotice')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <dt className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {t('dashboard.totalWasteHauled')}
                </dt>
                <dd className="mt-2 text-2xl font-black text-slate-900">
                  {loading ? '...' : `${formatKG(summaryData?.totalWaste)} KG`}
                </dd>
              </div>
              <span className="p-2 bg-blue-50 text-[#003366] rounded border border-blue-200">
                <Scale className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>{t('dashboard.recyclableFraction')}</span>
              <span className="font-bold text-emerald-700">{summaryData?.recyclablePercentage || 0}%</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <dt className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {t('dashboard.dailyAvgLoad')}
                </dt>
                <dd className="mt-2 text-2xl font-black text-slate-900">
                  {loading ? '...' : `${formatKG(summaryData?.averageDailyWaste)} KG`}
                </dd>
              </div>
              <span className="p-2 bg-blue-50 text-[#003366] rounded border border-blue-200">
                <TrendingUp className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>{t('dashboard.periodGrowth')}</span>
              <span className={`font-bold ${(summaryData?.growthPercentage || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {(summaryData?.growthPercentage || 0) > 0 ? '+' : ''}{summaryData?.growthPercentage || 0}%
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <dt className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {t('dashboard.criticalSectorLoad')}
                </dt>
                <dd className="mt-2 text-xl font-black text-[#003366] truncate">
                  {loading ? '...' : summaryData?.highestWasteLocation?.name || t('dashboard.allSectorsStable')}
                </dd>
              </div>
              <span className="p-2 bg-amber-50 text-amber-700 rounded border border-amber-200">
                <MapPin className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>{t('dashboard.sectorQuantity')}</span>
              <span className="font-bold text-slate-800">{formatKG(summaryData?.highestWasteLocation?.total)} KG</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <dt className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {t('dashboard.dominantStream')}
                </dt>
                <dd className="mt-2 text-xl font-black text-slate-900 truncate">
                  {loading
                    ? '...'
                    : summaryData?.highestWasteCategory?.name
                    ? translateWasteType(summaryData.highestWasteCategory.name)
                    : t('dashboard.mixedStream')}
                </dd>
              </div>
              <span className="p-2 bg-purple-50 text-purple-700 rounded border border-purple-200">
                <Layers className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>{t('dashboard.categoryTotal')}</span>
              <span className="font-bold text-slate-800">{formatKG(summaryData?.highestWasteCategory?.total)} KG</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Departmental Modules Quick Directory */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-5 shadow-xs">
        <h2 className="govt-section-header text-sm uppercase tracking-wider mb-4">
          {t('dashboard.modulesHeading')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/analytics"
            className="p-3 bg-slate-50 border border-slate-300 rounded hover:bg-blue-50 hover:border-[#003366] transition-all text-center group"
          >
            <BarChart3 className="h-5 w-5 text-[#003366] mx-auto group-hover:scale-105 transition-transform" />
            <span className="block mt-1.5 text-xs font-bold text-slate-900">{t('nav.analytics')}</span>
            <span className="text-[10px] text-slate-500 block">{t('nav.analyticsSubtitle')}</span>
          </Link>

          <Link
            to="/map"
            className="p-3 bg-slate-50 border border-slate-300 rounded hover:bg-blue-50 hover:border-[#003366] transition-all text-center group"
          >
            <MapPin className="h-5 w-5 text-[#003366] mx-auto group-hover:scale-105 transition-transform" />
            <span className="block mt-1.5 text-xs font-bold text-slate-900">{t('nav.map')}</span>
            <span className="text-[10px] text-slate-500 block">{t('nav.mapSubtitle')}</span>
          </Link>

          <Link
            to="/vehicles"
            className="p-3 bg-slate-50 border border-slate-300 rounded hover:bg-blue-50 hover:border-[#003366] transition-all text-center group"
          >
            <Truck className="h-5 w-5 text-[#003366] mx-auto group-hover:scale-105 transition-transform" />
            <span className="block mt-1.5 text-xs font-bold text-slate-900">{t('nav.vehicles')}</span>
            <span className="text-[10px] text-slate-500 block">{t('nav.vehiclesSubtitle')}</span>
          </Link>

          <Link
            to="/forecast"
            className="p-3 bg-slate-50 border border-slate-300 rounded hover:bg-blue-50 hover:border-[#003366] transition-all text-center group"
          >
            <LineChart className="h-5 w-5 text-[#003366] mx-auto group-hover:scale-105 transition-transform" />
            <span className="block mt-1.5 text-xs font-bold text-slate-900">{t('nav.forecast')}</span>
            <span className="text-[10px] text-slate-500 block">{t('nav.forecastSubtitle')}</span>
          </Link>

          <Link
            to="/ai-insights"
            className="p-3 bg-slate-50 border border-slate-300 rounded hover:bg-blue-50 hover:border-[#003366] transition-all text-center group"
          >
            <BrainCircuit className="h-5 w-5 text-[#003366] mx-auto group-hover:scale-105 transition-transform" />
            <span className="block mt-1.5 text-xs font-bold text-slate-900">{t('nav.aiInsights')}</span>
            <span className="text-[10px] text-slate-500 block">{t('nav.aiInsightsSubtitle')}</span>
          </Link>

          <Link
            to="/reports"
            className="p-3 bg-slate-50 border border-slate-300 rounded hover:bg-blue-50 hover:border-[#003366] transition-all text-center group"
          >
            <FileText className="h-5 w-5 text-[#003366] mx-auto group-hover:scale-105 transition-transform" />
            <span className="block mt-1.5 text-xs font-bold text-slate-900">{t('nav.reports')}</span>
            <span className="text-[10px] text-slate-500 block">{t('nav.reportsSubtitle')}</span>
          </Link>
        </div>
      </div>

      {/* 4. Active Operational Alerts & Statutory Review Panel */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-5 shadow-xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#003366]" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('dashboard.activeAlertsHeading')}
            </h2>
          </div>
          <Link
            to="/alerts"
            className="text-xs font-bold text-[#003366] hover:text-[#002244] hover:underline flex items-center"
          >
            {t('dashboard.viewAllAlerts', { count: recentAlerts.length })}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">{t('common.loading')}</div>
        ) : recentAlerts.length === 0 ? (
          <div className="p-6 text-center text-slate-600 bg-slate-50 border border-slate-200 rounded">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-1.5" />
            <p className="font-bold text-xs uppercase text-slate-800">{t('common.allSectorsNormal')}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('common.noSurgesDetected')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="govt-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>{t('dashboard.tablePriority')}</th>
                  <th>{t('dashboard.tableAlertTitle')}</th>
                  <th>{t('dashboard.tableObservation')}</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>{t('dashboard.tableAction')}</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => (
                  <tr key={alert._id}>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          alert.priority === 'HIGH'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : alert.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {translatePriority(alert.priority)}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900">{alert.title}</span>
                      <span className="text-slate-500 block text-[11px]">{alert.location}</span>
                    </td>
                    <td className="text-slate-600 text-xs">{alert.message}</td>
                    <td className="text-right">
                      <Link
                        to="/alerts"
                        className="inline-flex items-center text-xs font-bold text-[#003366] hover:underline"
                      >
                        {t('dashboard.reviewLog')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

