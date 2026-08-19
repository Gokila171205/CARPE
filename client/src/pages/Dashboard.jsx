import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Layers,
  FileText,
  LineChart,
  BrainCircuit,
  Scale
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
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
          setRecentAlerts(alertsRes.data.slice(0, 4));
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{user?.name || 'Administrator'}</span>. Municipal intelligence telemetry is active.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/analytics"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Analytics Dashboard
          </Link>
        </div>
      </div>

      {/* 1. Key Metrics Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-emerald-50 rounded-md">
              <Scale className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Total Waste Volume
              </dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-20"></div>
                ) : (
                  `${formatKG(summaryData?.totalWaste)} KG`
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-blue-50 rounded-md">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Daily Average Intake
              </dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">
                {loading ? (
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-20"></div>
                ) : (
                  `${formatKG(summaryData?.averageDailyWaste)} KG`
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-amber-50 rounded-md">
              <MapPin className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Peak Load Sector
              </dt>
              <dd className="mt-1 text-xl font-bold text-gray-900 truncate">
                {loading ? (
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-24"></div>
                ) : (
                  summaryData?.highestWasteLocation?.name || 'N/A'
                )}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2.5 bg-purple-50 rounded-md">
              <Layers className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                Dominant Material
              </dt>
              <dd className="mt-1 text-xl font-bold text-gray-900 truncate">
                {loading ? (
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-20"></div>
                ) : (
                  summaryData?.highestWasteCategory?.name || 'N/A'
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Operational Modules Quick Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/analytics"
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow transition-all text-center group"
        >
          <TrendingUp className="h-5 w-5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
          <span className="block mt-2 text-xs font-semibold text-gray-800">Analytics</span>
        </Link>
        <Link
          to="/map"
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow transition-all text-center group"
        >
          <MapPin className="h-5 w-5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
          <span className="block mt-2 text-xs font-semibold text-gray-800">Monitoring Map</span>
        </Link>
        <Link
          to="/alerts"
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow transition-all text-center group"
        >
          <ShieldAlert className="h-5 w-5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
          <span className="block mt-2 text-xs font-semibold text-gray-800">Intelligent Alerts</span>
        </Link>
        <Link
          to="/ai-insights"
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow transition-all text-center group"
        >
          <BrainCircuit className="h-5 w-5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
          <span className="block mt-2 text-xs font-semibold text-gray-800">AI Insights</span>
        </Link>
        <Link
          to="/forecast"
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow transition-all text-center group"
        >
          <LineChart className="h-5 w-5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
          <span className="block mt-2 text-xs font-semibold text-gray-800">Forecast</span>
        </Link>
        <Link
          to="/reports"
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow transition-all text-center group"
        >
          <FileText className="h-5 w-5 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
          <span className="block mt-2 text-xs font-semibold text-gray-800">Reports</span>
        </Link>
      </div>

      {/* 3. Live Operational Alerts Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">Active Operational Alerts</h2>
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View All Alerts
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center space-y-1">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-1" />
            <span className="font-semibold text-gray-700">All Operations Normal</span>
            <span className="text-xs text-gray-400">No critical anomalies or action items flagged.</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAlerts.map((alert) => (
              <div key={alert._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 transition-colors px-2 rounded-md">
                <div className="flex items-start sm:items-center space-x-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                      alert.priority === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : alert.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {alert.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.message}</p>
                  </div>
                </div>
                <Link
                  to="/alerts"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 self-end sm:self-center flex-shrink-0"
                >
                  Review Alert &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
