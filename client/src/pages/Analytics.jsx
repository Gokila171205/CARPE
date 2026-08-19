import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  MapPin,
  Activity,
  Layers,
  Calendar,
  Filter,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6b7280'  // gray-500
];

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

export default function Analytics() {
  const { t, translateWasteType, language } = useLanguage();

  // Filter states
  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  // Locations dropdown list
  const [locationList, setLocationList] = useState([]);

  // Data states
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [growth, setGrowth] = useState(null);

  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available locations for the filter dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data } = await api.get('/locations');
        if (Array.isArray(data)) {
          setLocationList(data.map((l) => (typeof l === 'string' ? l : l.name)));
        }
      } catch (err) {
        console.error('Failed to fetch dynamic locations', err);
        setLocationList([]);
      }
    };
    fetchLocations();
  }, []);

  // Fetch all analytics data based on active filters
  const fetchAnalyticsData = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const [summaryRes, trendsRes, categoriesRes, locationsRes, growthRes] = await Promise.all([
        api.get(`/analytics/summary${queryString}`),
        api.get(`/analytics/trends${queryString}`),
        api.get(`/analytics/categories${queryString}`),
        api.get(`/analytics/locations${queryString}`),
        api.get(`/analytics/growth${queryString}`)
      ]);

      setSummary(summaryRes.data);
      setTrends(Array.isArray(trendsRes.data) ? trendsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      setGrowth(growthRes.data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err?.response?.data?.message || 'Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData(activeFilters);
  }, [fetchAnalyticsData, activeFilters]);

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

  // Helper formatting functions
  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN', { maximumFractionDigits: 2 });
  };

  const formatDateRange = (isoString) => {
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
          {t('analytics.pageTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('analytics.pageSubtitle')}
        </p>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-sm shadow-xs border-2 border-slate-300">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.dateFrom')}
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={filterInputs.startDate}
                onChange={handleInputChange}
                className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('analytics.dateTo')}
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={filterInputs.endDate}
                onChange={handleInputChange}
                className="block w-full border border-slate-300 rounded py-1.5 px-3 text-xs leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>
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

      {/* Error Alert */}
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
                onClick={() => fetchAnalyticsData(activeFilters)}
                className="mt-2 md:mt-0 font-bold text-red-800 hover:underline"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Six KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1: Total Waste */}
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-blue-50 text-[#003366] rounded">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {t('dashboard.totalWasteHauled')}
              </dt>
              <dd className="mt-1">
                {loading ? (
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
                ) : (
                  <span className="text-lg font-black text-slate-900">{formatKG(summary?.totalWaste)} KG</span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* KPI 2: Average Daily Waste */}
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-blue-50 text-[#003366] rounded">
              <Clock className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {t('dashboard.dailyAvgLoad')}
              </dt>
              <dd className="mt-1">
                {loading ? (
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
                ) : (
                  <span className="text-lg font-black text-slate-900">
                    {formatKG(summary?.averageDailyWaste)} KG
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* KPI 3: Waste Growth */}
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center">
            <div
              className={`flex-shrink-0 p-2 rounded ${
                (summary?.growthPercentage || 0) >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {(summary?.growthPercentage || 0) >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {t('dashboard.periodGrowth')}
              </dt>
              <dd className="mt-1">
                {loading ? (
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
                ) : (
                  <span
                    className={`text-lg font-black ${
                      (summary?.growthPercentage || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {(summary?.growthPercentage || 0) >= 0 ? '+' : ''}
                    {summary?.growthPercentage || 0}%
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* KPI 4: Recyclable Waste */}
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-purple-50 text-purple-700 rounded">
              <Activity className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {t('dashboard.recyclableFraction')}
              </dt>
              <dd className="mt-1">
                {loading ? (
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
                ) : (
                  <span className="text-lg font-black text-slate-900">
                    {summary?.recyclablePercentage || 0}%
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* KPI 5: Top Waste Location */}
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-amber-50 text-amber-700 rounded">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {t('analytics.topLocation')}
              </dt>
              <dd className="mt-1">
                {loading ? (
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
                ) : (
                  <span className="text-sm font-black text-slate-900 truncate block">
                    {summary?.highestWasteLocation?.name || 'N/A'}
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* KPI 6: Top Waste Category */}
        <div className="bg-white p-4 border-2 border-slate-300 rounded-sm shadow-xs">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-teal-50 text-teal-700 rounded">
              <Layers className="h-5 w-5" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {t('analytics.topCategory')}
              </dt>
              <dd className="mt-1">
                {loading ? (
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
                ) : (
                  <span className="text-sm font-black text-slate-900 truncate block">
                    {summary?.highestWasteCategory?.name
                      ? translateWasteType(summary.highestWasteCategory.name)
                      : 'N/A'}
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Trends & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Waste Trend Section */}
        <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {t('analytics.trendTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('analytics.trendSubtitle')}</p>
            </div>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {t('common.loading')}
              </div>
            ) : trends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Calendar className="h-8 w-8 mb-2 stroke-1 text-slate-300" />
                <p>{t('analytics.noTrendRecords')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#475569', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#475569', fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${formatKG(val)} KG`, 'Collected']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="waste"
                    name="Waste (KG)"
                    stroke="#003366"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#003366' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Waste Category Breakdown Section */}
        <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {t('analytics.categoryDistribution')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('analytics.categorySubtitle')}</p>
            </div>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {t('common.loading')}
              </div>
            ) : categories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Layers className="h-8 w-8 mb-2 stroke-1 text-slate-300" />
                <p>{t('analytics.noCategoryRecords')}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col sm:flex-row items-center justify-between">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categories.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name || index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px'
                        }}
                        formatter={(val, name, item) => [
                          `${formatKG(val)} KG (${item.payload.percentage || 0}%)`,
                          translateWasteType(item.payload.name || name)
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend Listing */}
                <div className="w-full sm:w-1/2 pl-0 sm:pl-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.name || idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center min-w-0 pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        ></span>
                        <span className="font-medium text-slate-700 truncate">
                          {translateWasteType(cat.name)}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-slate-900">{formatKG(cat.value || cat.total)} KG</span>
                        <span className="text-slate-500 ml-1.5 font-normal">({cat.percentage || 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Location Analysis & 6. Growth Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Location Analysis Table (2 Cols on Large screens) */}
        <div className="lg:col-span-2 bg-white shadow-xs overflow-hidden rounded-sm border-2 border-slate-300">
          <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {t('analytics.locationTableTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('analytics.locationTableSubtitle')}</p>
            </div>
            <span className="text-xs text-slate-500 font-bold">{locations.length} Zones</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('analytics.thLocation')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('analytics.thTotalCollected')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('analytics.thShare')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('analytics.thAvgEntry')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('analytics.thPriority')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 text-xs">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500 text-xs">
                      {t('common.noRecordsFound')}
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => {
                    const totalWasteAll = summary?.totalWaste || 1;
                    const sharePct = summary?.totalWaste
                      ? Math.round((loc.total / totalWasteAll) * 100)
                      : 0;

                    return (
                      <tr key={loc.name} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">{loc.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">{formatKG(loc.total)} KG</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          <div className="flex items-center">
                            <div className="w-20 bg-slate-200 rounded-full h-1.5 mr-2">
                              <div
                                className="bg-[#003366] h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, sharePct))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-700">{sharePct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">{formatKG(loc.averagePerRecord)} KG</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              loc.status === 'High'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : loc.status === 'Medium'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {loc.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Growth Comparison Card (1 Col on Large screens) */}
        <div className="bg-white p-6 rounded-sm shadow-xs border-2 border-slate-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {t('analytics.growthTitle')}
              </h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                  growth?.trend === 'increasing'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : growth?.trend === 'decreasing'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {growth?.trend ? growth.trend.toUpperCase() : 'STABLE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">{t('analytics.growthSubtitle')}</p>

            {loading ? (
              <div className="space-y-3 py-4">
                <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Current Period */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-slate-700">
                      {t('analytics.currentPeriod')}
                    </span>
                    <span>
                      {formatDateRange(growth?.currentPeriod?.startDate)} –{' '}
                      {formatDateRange(growth?.currentPeriod?.endDate)}
                    </span>
                  </div>
                  <div className="mt-1 text-base font-black text-slate-900">
                    {formatKG(growth?.currentPeriod?.totalWaste)} KG
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({growth?.currentPeriod?.recordCount || 0} entries)
                    </span>
                  </div>
                </div>

                {/* Previous Period */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-slate-700">
                      {t('analytics.previousPeriod')}
                    </span>
                    <span>
                      {formatDateRange(growth?.previousPeriod?.startDate)} –{' '}
                      {formatDateRange(growth?.previousPeriod?.endDate)}
                    </span>
                  </div>
                  <div className="mt-1 text-base font-black text-slate-900">
                    {formatKG(growth?.previousPeriod?.totalWaste)} KG
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({growth?.previousPeriod?.recordCount || 0} entries)
                    </span>
                  </div>
                </div>

                {/* Growth Metric Box */}
                <div className="p-3.5 bg-blue-50 rounded border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                        {t('analytics.netGrowth')}
                      </span>
                      <div className="text-xl font-black text-[#003366] mt-0.5">
                        {(growth?.growthPercentage || 0) >= 0 ? '+' : ''}
                        {growth?.growthPercentage || 0}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-600">{t('analytics.absoluteChange')}</span>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {(growth?.absoluteChange || 0) >= 0 ? '+' : ''}
                        {formatKG(growth?.absoluteChange)} KG
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 flex items-center text-xs text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1.5 flex-shrink-0" />
            <span>{t('analytics.verifiedRecords')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
