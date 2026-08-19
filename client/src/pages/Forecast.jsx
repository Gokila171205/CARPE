import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  TrendingUp,
  Filter,
  RotateCcw,
  AlertCircle,
  Scale,
  Sparkles,
  Lightbulb,
  ShieldCheck,
  Info,
  Clock
} from 'lucide-react';

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];
const FORECAST_PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 }
];

export default function Forecast() {
  const { t, translateWasteType, language } = useLanguage();

  const [filterInputs, setFilterInputs] = useState({
    location: '',
    wasteType: '',
    forecastDays: 7,
    startDate: '',
    endDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({ forecastDays: 7 });

  const [locationList, setLocationList] = useState([]);
  const [forecastResponse, setForecastResponse] = useState(null);
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

  // Fetch forecast data from backend API
  const fetchForecast = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);
    if (filters.forecastDays) queryParams.append('forecastDays', filters.forecastDays);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await api.get(`/analytics/forecast${queryString}`);
      setForecastResponse(res.data);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
      setError(err?.response?.data?.message || 'Unable to load predictive waste forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast(activeFilters);
  }, [fetchForecast, activeFilters]);

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
    const resetValues = {
      location: '',
      wasteType: '',
      forecastDays: 7,
      startDate: '',
      endDate: ''
    };
    setFilterInputs(resetValues);
    setActiveFilters({ forecastDays: 7 });
  };

  const isSufficient = forecastResponse?.sufficient === true;
  const forecastData = forecastResponse?.data;
  const summary = forecastData?.summary;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatKG = (val) => {
    if (val === undefined || val === null) return 'N/A';
    return Number(val).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN', { maximumFractionDigits: 1 });
  };

  const getReliabilityBadge = (reliability) => {
    switch (reliability) {
      case 'HIGH':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs">
        <h2 className="govt-section-header text-base uppercase tracking-wide">
          {t('forecast.pageTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('forecast.pageSubtitle')}
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-sm shadow-xs border-2 border-slate-300">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('forecast.horizonOption')}
            </label>
            <select
              name="forecastDays"
              value={filterInputs.forecastDays}
              onChange={handleInputChange}
              className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
            >
              {FORECAST_PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

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
                onClick={() => fetchForecast(activeFilters)}
                className="mt-2 md:mt-0 font-bold text-red-800 hover:underline"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="bg-white p-5 rounded-sm shadow-xs border border-slate-300 animate-pulse space-y-2">
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                <div className="h-7 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300 h-[380px] flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2 text-xs text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
              <p className="font-bold">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      ) : !isSufficient ? (
        /* Data Insufficiency Empty State */
        <div className="bg-white rounded-sm shadow-xs border-2 border-slate-300 p-12 text-center space-y-3">
          <Info className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            {t('forecast.insufficientTitle')}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {t('forecast.insufficientDesc')}
          </p>
        </div>
      ) : (
        /* 2. Forecast KPI Cards */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* KPI 1: Historical Daily Average */}
            <div className="bg-white p-4 rounded-sm shadow-xs border-2 border-slate-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-slate-100 text-slate-700 rounded">
                  <Scale className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                    {t('forecast.statHistoricalAvg')}
                  </dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">
                    {formatKG(summary?.averageHistoricalWaste)} KG
                  </dd>
                </div>
              </div>
            </div>

            {/* KPI 2: Expected Forecast Daily Average */}
            <div className="bg-white p-4 rounded-sm shadow-xs border-2 border-slate-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-blue-50 text-[#003366] rounded">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dt className="text-[10px] font-bold text-[#003366] uppercase tracking-wider truncate">
                    {t('forecast.statExpectedAvg')}
                  </dt>
                  <dd className="mt-1 text-lg font-black text-[#003366]">
                    {formatKG(summary?.averageForecastWaste)} KG
                  </dd>
                </div>
              </div>
            </div>

            {/* KPI 3: Expected Growth % */}
            <div className="bg-white p-4 rounded-sm shadow-xs border-2 border-slate-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-emerald-50 text-emerald-800 rounded">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dt className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider truncate">
                    {t('forecast.statExpectedGrowth')}
                  </dt>
                  <dd
                    className={`mt-1 text-lg font-black ${
                      (summary?.expectedGrowthPercentage || 0) > 0
                        ? 'text-red-600'
                        : (summary?.expectedGrowthPercentage || 0) < 0
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {(summary?.expectedGrowthPercentage || 0) > 0 ? '+' : ''}
                    {summary?.expectedGrowthPercentage ?? 'N/A'}%
                  </dd>
                </div>
              </div>
            </div>

            {/* KPI 4: Forecast Horizon */}
            <div className="bg-white p-4 rounded-sm shadow-xs border-2 border-slate-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-slate-100 text-slate-700 rounded">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                    {t('forecast.statHorizon')}
                  </dt>
                  <dd className="mt-1 text-lg font-black text-slate-900">
                    {forecastData?.forecastDays} {t('forecast.daysCount')}
                  </dd>
                </div>
              </div>
            </div>

            {/* KPI 5: Forecast Reliability */}
            <div className="bg-white p-4 rounded-sm shadow-xs border-2 border-slate-300">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-2 bg-slate-100 text-slate-700 rounded">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                    {t('forecast.statReliability')}
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getReliabilityBadge(
                        forecastData?.reliability
                      )}`}
                    >
                      {forecastData?.reliability}
                    </span>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Predictive Forecast Chart */}
          <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {t('forecast.chartTitle')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('forecast.chartSubtitle')}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                  <span className="font-bold text-slate-700">{t('forecast.legendHistorical')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                  <span className="font-bold text-slate-700">{t('forecast.legendForecast')}</span>
                </div>
              </div>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={forecastData?.combinedChartData || []}
                  margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${v} KG`}
                  />
                  <Tooltip
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value, name) => [
                      value !== null ? `${Number(value).toLocaleString()} KG` : 'N/A',
                      name === 'historical' ? 'Historical Actual' : 'Predicted Forecast'
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="historical"
                    fill="#10b981"
                    fillOpacity={0.12}
                    stroke="#10b981"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    name="historical"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#003366"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#003366' }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    name="forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Forecast Summary & Planning Insight Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Details */}
            <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {t('forecast.metaHeading')}
                </h3>
                <span className="text-xs text-slate-500 font-bold">{forecastData?.method}</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Historical Baseline Period:</span>
                  <span className="font-bold text-slate-900">
                    {forecastData?.historicalPeriod?.startDate} to {forecastData?.historicalPeriod?.endDate} (
                    {forecastData?.historicalPeriod?.dataPointsCount} dates)
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Forecast Projected Period:</span>
                  <span className="font-bold text-slate-900">
                    {forecastData?.forecastPeriod?.startDate} to {forecastData?.forecastPeriod?.endDate} (
                    {forecastData?.forecastPeriod?.forecastDays} days)
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Historical Daily Average:</span>
                  <span className="font-bold text-slate-900">
                    {formatKG(summary?.averageHistoricalWaste)} KG / day
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Projected Daily Average:</span>
                  <span className="font-bold text-[#003366]">
                    {formatKG(summary?.averageForecastWaste)} KG / day
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Total Projected Horizon Load:</span>
                  <span className="font-bold text-slate-900">
                    {formatKG(summary?.totalForecastWaste)} KG
                  </span>
                </div>

                <div className="flex justify-between py-1 items-center">
                  <span className="text-slate-500 font-medium">Statistical Assessment:</span>
                  <span className="text-slate-600">{forecastData?.reliabilityReason}</span>
                </div>
              </div>
            </div>

            {/* Planning Recommendation */}
            <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {t('forecast.planningInsightHeading')}
                  </h3>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800">
                    <span className="font-bold text-slate-900">Observation: </span>
                    <span>{forecastData?.planningInsight?.insight}</span>
                  </div>

                  <div className="p-3.5 bg-blue-50 rounded border border-blue-200 text-xs text-blue-950">
                    <h4 className="font-bold text-[#003366] uppercase tracking-wider mb-1">
                      Recommended Administrative Action:
                    </h4>
                    <p className="font-medium">{forecastData?.planningInsight?.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 pt-2 border-t border-slate-200">
                <Info className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>
                  Forecast projections represent statistical baseline extrapolations.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

