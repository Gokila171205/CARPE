import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  BrainCircuit,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  MapPin,
  Layers,
  Info,
  Scale
} from 'lucide-react';

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

export default function AIInsights() {
  const { t, translatePriority, translateWasteType } = useLanguage();

  const [filterInputs, setFilterInputs] = useState({
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });

  const [locationList, setLocationList] = useState([]);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
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

  // Generate AI Insights on command
  const generateInsights = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await api.post(`/ai/insights${queryString}`, filters);
      setInsightsData(res.data);
      setInitialLoaded(true);
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
      setError(err?.response?.data?.message || 'AI insights could not be generated at this time.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate on initial load
  useEffect(() => {
    generateInsights({});
  }, [generateInsights]);

  // Handle filter changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateClick = (e) => {
    e.preventDefault();
    if (filterInputs.startDate && filterInputs.endDate) {
      if (new Date(filterInputs.startDate) > new Date(filterInputs.endDate)) {
        alert('Date From cannot be later than Date To.');
        return;
      }
    }
    generateInsights(filterInputs);
  };

  const handleReset = () => {
    const resetValues = { startDate: '', endDate: '', location: '', wasteType: '' };
    setFilterInputs(resetValues);
    generateInsights({});
  };

  const evidence = insightsData?.evidence;
  const insightsList = insightsData?.insights || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="govt-section-header text-base uppercase tracking-wide">
              {t('aiInsights.pageTitle')}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#003366] border border-blue-200 uppercase">
              <Sparkles className="h-3 w-3 mr-1 text-[#003366]" />
              {t('aiInsights.supportBadge')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('aiInsights.pageSubtitle')}
          </p>
        </div>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-sm shadow-xs border-2 border-slate-300">
        <form onSubmit={handleGenerateClick} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
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
              <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
              {t('aiInsights.generateButton')}
            </button>
            <button
              type="button"
              onClick={handleReset}
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
                onClick={() => generateInsights(filterInputs)}
                className="mt-2 md:mt-0 font-bold text-red-800 hover:underline"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Structured Evidence Panel */}
      {evidence && (
        <div className="bg-white rounded-sm shadow-xs border-2 border-slate-300 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t('aiInsights.evidenceTitle')}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {evidence.summary?.totalRecordCount || 0} Records Processed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{t('aiInsights.evidenceMonitored')}</span>
              <p className="text-base font-black text-slate-900 mt-0.5">
                {(evidence.summary?.totalWasteKG || 0).toLocaleString()} KG
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{t('aiInsights.evidenceGrowth')}</span>
              <p
                className={`text-base font-black mt-0.5 ${
                  (evidence.growth?.growthPercentage || 0) > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {(evidence.growth?.growthPercentage || 0) > 0 ? '+' : ''}
                {evidence.growth?.growthPercentage || 0}%
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{t('aiInsights.evidencePeakZone')}</span>
              <p className="text-base font-black text-slate-900 mt-0.5 truncate">
                {evidence.summary?.highestWasteLocation || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{t('aiInsights.evidenceDominantStream')}</span>
              <p className="text-base font-black text-slate-900 mt-0.5 truncate">
                {translateWasteType(evidence.summary?.highestWasteCategory || 'N/A')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Generated Decision Intelligence Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-sm shadow-xs border-2 border-slate-300 space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto"></div>
            <h4 className="text-sm font-bold text-slate-900">{t('common.loading')}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Evaluating period variance, material distribution, and location density for decision support.
            </p>
          </div>
        ) : !initialLoaded ? (
          <div className="bg-white p-12 text-center rounded-sm shadow-xs border-2 border-slate-300 space-y-2">
            <BrainCircuit className="h-10 w-10 text-slate-300 mx-auto stroke-1" />
            <h4 className="text-sm font-bold text-slate-700">Ready to Generate Insights</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select date ranges and municipal filters, then click Generate Insights to produce AI decision analysis.
            </p>
          </div>
        ) : insightsList.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-sm shadow-xs border-2 border-slate-300 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">No Significant Action Items</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No anomalous volume concentrations or operational bottlenecks were detected for the selected period.
            </p>
          </div>
        ) : (
          insightsList.map((insight, idx) => {
            const isHigh = insight.priority === 'HIGH';
            const isMedium = insight.priority === 'MEDIUM';

            return (
              <div
                key={idx}
                className={`bg-white rounded-sm shadow-xs border-2 p-5 space-y-3 transition-all ${
                  isHigh
                    ? 'border-red-200'
                    : isMedium
                    ? 'border-amber-200'
                    : 'border-emerald-200'
                }`}
              >
                {/* Header: Priority & Engine Tag */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isHigh
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : isMedium
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {translatePriority(insight.priority)}
                    </span>
                    {insight.affectedLocation && (
                      <span className="text-xs font-bold text-slate-700 flex items-center">
                        <MapPin className="h-3 w-3 mr-0.5 text-slate-400" />
                        {insight.affectedLocation}
                      </span>
                    )}
                    {insight.affectedWasteType && (
                      <span className="text-xs font-bold text-slate-700 flex items-center">
                        <Layers className="h-3 w-3 mr-0.5 text-slate-400" />
                        {translateWasteType(insight.affectedWasteType)}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase">
                    {insight.engine || 'Decision Support Engine'}
                  </span>
                </div>

                {/* Title & Observation */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{insight.title}</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{insight.observation}</p>
                </div>

                {/* Evidence Metrics Box */}
                {insight.evidence && (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs flex flex-wrap gap-4">
                    {insight.evidence.currentWaste && (
                      <div>
                        <span className="text-slate-500 font-medium">{t('alerts.observedCurrent')}: </span>
                        <strong className="text-slate-900">{insight.evidence.currentWaste}</strong>
                      </div>
                    )}
                    {insight.evidence.previousWaste && (
                      <div>
                        <span className="text-slate-500 font-medium">{t('alerts.previousPeriod')}: </span>
                        <strong className="text-slate-900">{insight.evidence.previousWaste}</strong>
                      </div>
                    )}
                    {insight.evidence.growth && (
                      <div>
                        <span className="text-slate-500 font-medium">{t('alerts.observedGrowth')}: </span>
                        <strong className="text-red-700">{insight.evidence.growth}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis / Reasoning */}
                {insight.analysis && (
                  <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="font-bold text-slate-800">{t('aiInsights.reasoningHeading')}: </span>
                    {insight.analysis}
                  </div>
                )}

                {/* Recommendation Box */}
                {insight.recommendation && (
                  <div className="p-3.5 bg-blue-50 rounded border border-blue-200 flex items-start space-x-2.5">
                    <Lightbulb className="h-4 w-4 text-[#003366] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-bold text-[#003366] uppercase tracking-wider">
                        {t('aiInsights.actionHeading')}
                      </h4>
                      <p className="text-xs font-medium text-slate-900 mt-0.5">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Professional AI Disclaimer */}
      <div className="p-3.5 bg-slate-50 rounded border border-slate-200 flex items-center space-x-2.5 text-xs text-slate-500">
        <Info className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <p>
          AI-generated insights are decision-support recommendations based on available waste-management data. Final operational decisions should be reviewed by authorized personnel.
        </p>
      </div>
    </div>
  );
}

