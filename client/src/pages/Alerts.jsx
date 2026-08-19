import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Filter,
  RotateCcw,
  Bell,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

export default function Alerts() {
  const { t, translatePriority, translateWasteType, language } = useLanguage();

  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  const [locationList, setLocationList] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations for filter dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get('/locations');
        if (Array.isArray(data)) {
          setLocationList(data.map((l) => (typeof l === 'string' ? l : l.name)).filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to fetch dynamic locations', err);
        setLocationList([]);
      }
    };
    fetchLocations();
  }, []);

  // Fetch alerts with active filters
  const fetchAlerts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const { data } = await api.get(`/alerts${queryString}`);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err?.response?.data?.message || 'Unable to load waste-management alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(activeFilters);
  }, [fetchAlerts, activeFilters]);

  // Handle filter changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    if (filterInputs.startDate && filterInputs.endDate) {
      if (new Date(filterInputs.startDate) > new Date(filterInputs.endDate)) {
        alert('Date From cannot be later than Date To.');
        return;
      }
    }
    setActiveFilters({ ...filterInputs });
  };

  const handleResetFilters = () => {
    const resetValues = { startDate: '', endDate: '', location: '', wasteType: '' };
    setFilterInputs(resetValues);
    setActiveFilters({});
  };

  const resolveAlert = async (id) => {
    try {
      await api.put(`/alerts/${id}/resolve`);
      // Update state locally
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'RESOLVED' } : a))
      );
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  // Summary counts calculated from real alerts
  const summaryCounts = useMemo(() => {
    const total = alerts.length;
    const high = alerts.filter((a) => a.priority === 'HIGH').length;
    const medium = alerts.filter((a) => a.priority === 'MEDIUM').length;
    const low = alerts.filter((a) => a.priority === 'LOW').length;
    return { total, high, medium, low };
  }, [alerts]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
        <h2 className="govt-section-header text-base uppercase tracking-wide">
          {t('alerts.pageTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('alerts.pageSubtitle')}
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-sm shadow-xs border-2 border-slate-300">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.dateFrom')}
            </label>
            <input
              type="date"
              name="startDate"
              value={filterInputs.startDate}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.dateTo')}
            </label>
            <input
              type="date"
              name="endDate"
              value={filterInputs.endDate}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.locationFilter')}
            </label>
            <select
              name="location"
              value={filterInputs.location}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            >
              <option value="">{t('analytics.allLocations')}</option>
              {locationList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.wasteTypeFilter')}
            </label>
            <select
              name="wasteType"
              value={filterInputs.wasteType}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            >
              <option value="">{t('analytics.allTypes')}</option>
              {WASTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {translateWasteType(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-xs text-xs font-bold rounded text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-[#003366] disabled:opacity-50"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {t('analytics.applyFilters')}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className="inline-flex justify-center items-center px-3 py-2 border border-slate-300 shadow-xs text-xs font-bold rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none disabled:opacity-50"
              title={t('analytics.resetFilters')}
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded bg-red-50 p-4 border border-red-200 text-xs">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="font-medium text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => fetchAlerts(activeFilters)}
                className="mt-2 md:mt-0 font-bold text-red-800 hover:underline"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Alert Statistics Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Alerts */}
        <div className="bg-white rounded-sm shadow-xs border-2 border-slate-300 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-slate-100 text-slate-700 rounded">
              <Bell className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{t('alerts.statTotal')}</dt>
              <dd className="mt-1 text-2xl font-black text-slate-900">
                {loading ? <div className="h-8 bg-slate-200 rounded animate-pulse w-12"></div> : summaryCounts.total}
              </dd>
            </div>
          </div>
        </div>

        {/* Card 2: High Priority */}
        <div className="bg-white rounded-sm shadow-xs border-2 border-slate-300 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-red-50 text-red-700 rounded">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <dt className="text-[10px] font-bold text-red-700 uppercase tracking-wider">{t('alerts.statHigh')}</dt>
              <dd className="mt-1 text-2xl font-black text-red-700">
                {loading ? <div className="h-8 bg-slate-200 rounded animate-pulse w-12"></div> : summaryCounts.high}
              </dd>
            </div>
          </div>
        </div>

        {/* Card 3: Medium Priority */}
        <div className="bg-white rounded-sm shadow-xs border-2 border-slate-300 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-amber-50 text-amber-700 rounded">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <dt className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{t('alerts.statMedium')}</dt>
              <dd className="mt-1 text-2xl font-black text-amber-700">
                {loading ? <div className="h-8 bg-slate-200 rounded animate-pulse w-12"></div> : summaryCounts.medium}
              </dd>
            </div>
          </div>
        </div>

        {/* Card 4: Low Priority */}
        <div className="bg-white rounded-sm shadow-xs border-2 border-slate-300 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-emerald-50 text-emerald-700 rounded">
              <Info className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <dt className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t('alerts.statLow')}</dt>
              <dd className="mt-1 text-2xl font-black text-emerald-700">
                {loading ? <div className="h-8 bg-slate-200 rounded animate-pulse w-12"></div> : summaryCounts.low}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alerts Listing */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-sm shadow-xs border border-slate-300 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                <div className="h-12 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-sm shadow-xs border-2 border-slate-300 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{t('alerts.allNormalTitle')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t('alerts.allNormalDesc')}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isHigh = alert.priority === 'HIGH';
            const isMedium = alert.priority === 'MEDIUM';

            return (
              <div
                key={alert._id}
                className={`bg-white rounded-sm shadow-xs border-2 p-5 transition-all ${
                  isHigh
                    ? 'border-red-200'
                    : isMedium
                    ? 'border-amber-200'
                    : 'border-emerald-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  {/* Left: Priority Badge & Title */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                          isHigh
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : isMedium
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {translatePriority(alert.priority)}
                      </span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs font-bold text-slate-700">
                        {alert.location} {alert.wasteType && alert.wasteType !== 'All Types' ? `(${translateWasteType(alert.wasteType)})` : ''}
                      </span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-500">{formatDate(alert.detectedAt)}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>
                  </div>

                  {/* Right: Resolve Button / Status */}
                  <div className="flex items-center gap-2">
                    {alert.status === 'ACTIVE' ? (
                      <button
                        onClick={() => resolveAlert(alert._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded text-white bg-[#003366] hover:bg-[#002244] focus:outline-none"
                      >
                        {t('alerts.resolveAction')}
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        {t('alerts.resolvedStatus')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantitative Data Metrics Banner */}
                {(alert.currentQuantity != null || alert.growthPercentage != null) && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold">{t('alerts.observedCurrent')}:</span>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {alert.currentQuantity?.toLocaleString()} KG
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">{t('alerts.previousPeriod')}:</span>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {alert.previousQuantity != null ? `${alert.previousQuantity.toLocaleString()} KG` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">{t('alerts.observedGrowth')}:</span>
                      <p
                        className={`text-sm font-black mt-0.5 ${
                          (alert.growthPercentage || 0) > 0 ? 'text-red-700' : 'text-slate-900'
                        }`}
                      >
                        {alert.growthPercentage != null
                          ? `${alert.growthPercentage > 0 ? '+' : ''}${alert.growthPercentage}%`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recommendation Banner */}
                {alert.recommendation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 flex items-start space-x-2 text-xs">
                    <Lightbulb className="h-4 w-4 text-[#003366] flex-shrink-0 mt-0.5" />
                    <div className="text-slate-800">
                      <span className="font-bold text-[#003366]">{t('alerts.recommendationHeading')}: </span>
                      <span>{alert.recommendation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

