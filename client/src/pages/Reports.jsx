import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  Filter,
  RotateCcw,
  AlertCircle,
  Calendar,
  Layers,
  MapPin,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  Printer,
  Table
} from 'lucide-react';

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

const REPORT_TYPES = [
  { id: 'summary', name: 'Summary Report', description: 'Consolidated overview with material and zonal breakdowns' },
  { id: 'collection', name: 'Collection Activity Report', description: 'Granular logs of collection records and vehicles' },
  { id: 'category', name: 'Material Category Report', description: 'Material stream distribution and recycling share' },
  { id: 'location', name: 'Location Analysis Report', description: 'Municipal zone volumes and priority risk levels' },
  { id: 'alert', name: 'Alerts & Anomalies Report', description: 'Active operational risks and recommended actions' },
  { id: 'forecast', name: 'Predictive Forecast Report', description: 'Projected horizon volumes and planning metrics' }
];

export default function Reports() {
  const [filterInputs, setFilterInputs] = useState({
    reportType: 'summary',
    startDate: '',
    endDate: '',
    location: '',
    wasteType: ''
  });
  const [activeFilters, setActiveFilters] = useState({ reportType: 'summary' });

  const [locationList, setLocationList] = useState([]);
  const [reportData, setReportData] = useState(null);
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

  // Fetch Report Data from backend
  const fetchReport = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (filters.reportType) queryParams.append('reportType', filters.reportType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.wasteType) queryParams.append('wasteType', filters.wasteType);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await api.get(`/analytics/reports${queryString}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err?.response?.data?.message || 'Unable to generate waste management report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeFilters);
  }, [fetchReport, activeFilters]);

  // Filter input handlers
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
      reportType: 'summary',
      startDate: '',
      endDate: '',
      location: '',
      wasteType: ''
    };
    setFilterInputs(resetValues);
    setActiveFilters({ reportType: 'summary' });
  };

  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  // ---------------------------------------------------------------------------
  // CSV Export Handler
  // ---------------------------------------------------------------------------
  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    const reportType = activeFilters.reportType || 'summary';
    const timestamp = new Date().toISOString().split('T')[0];

    // CSV Header metadata
    csvContent += `CARPE Waste Management Platform - Official Report\r\n`;
    csvContent += `Report Type,${reportData.title || reportType}\r\n`;
    csvContent += `Generated Date,${new Date().toISOString()}\r\n`;
    csvContent += `Location Filter,${reportData.filters?.location || 'All'}\r\n`;
    csvContent += `Waste Type Filter,${reportData.filters?.wasteType || 'All'}\r\n\r\n`;

    if (reportType === 'summary') {
      csvContent += `--- Summary Metrics ---\r\n`;
      csvContent += `Total Waste (KG),${reportData.summary?.totalWaste || 0}\r\n`;
      csvContent += `Daily Average (KG),${reportData.summary?.averageDailyWaste || 0}\r\n`;
      csvContent += `Growth (%),${reportData.summary?.growthPercentage || 0}%\r\n`;
      csvContent += `Recyclable Share (%),${reportData.summary?.recyclablePercentage || 0}%\r\n\r\n`;

      csvContent += `--- Material Category Breakdown ---\r\n`;
      csvContent += `Category,Total Waste (KG),Percentage (%)\r\n`;
      (reportData.categories || []).forEach((c) => {
        csvContent += `"${c.name}",${c.total},${c.percentage}%\r\n`;
      });

      csvContent += `\r\n--- Location Breakdown ---\r\n`;
      csvContent += `Location,Total Waste (KG),Collections Count,Status\r\n`;
      (reportData.locations || []).forEach((l) => {
        csvContent += `"${l.name}",${l.total},${l.count},"${l.status}"\r\n`;
      });
    } else if (reportType === 'collection') {
      csvContent += `Date,Location,Waste Type,Quantity (KG),Vehicle,Collector\r\n`;
      (reportData.records || []).forEach((r) => {
        csvContent += `"${r.date}","${r.location}","${r.wasteType}",${r.quantity},"${r.vehicle}","${r.collector}"\r\n`;
      });
    } else if (reportType === 'category') {
      csvContent += `Waste Type,Total Quantity (KG),Share Percentage (%)\r\n`;
      (reportData.categories || []).forEach((c) => {
        csvContent += `"${c.name}",${c.total},${c.percentage}%\r\n`;
      });
    } else if (reportType === 'location') {
      csvContent += `Location,Total Quantity (KG),Collections Count,Average Per Entry (KG),Status\r\n`;
      (reportData.locations || []).forEach((l) => {
        csvContent += `"${l.name}",${l.total},${l.count},${l.averagePerRecord},"${l.status}"\r\n`;
      });
    } else if (reportType === 'alert') {
      csvContent += `Priority,Alert Title,Location,Waste Type,Observed (KG),Recommendation,Date\r\n`;
      (reportData.alerts || []).forEach((a) => {
        csvContent += `"${a.priority}","${a.title}","${a.location}","${a.wasteType || 'All'}",${a.currentQuantity || 0},"${a.recommendation || ''}","${a.detectedAt || ''}"\r\n`;
      });
    } else if (reportType === 'forecast') {
      const f = reportData.forecast?.data;
      csvContent += `Method,${f?.method || 'N/A'}\r\n`;
      csvContent += `Historical Daily Avg (KG),${f?.summary?.averageHistoricalWaste || 0}\r\n`;
      csvContent += `Projected Daily Avg (KG),${f?.summary?.averageForecastWaste || 0}\r\n`;
      csvContent += `Projected Growth (%),${f?.summary?.expectedGrowthPercentage || 0}%\r\n\r\n`;
      csvContent += `Projected Date,Predicted Quantity (KG)\r\n`;
      (f?.forecast || []).forEach((item) => {
        csvContent += `"${item.date}",${item.predictedQuantity}\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CARPE_${reportType.toUpperCase()}_REPORT_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------------------------------------------------------------------------
  // PDF Export Handler
  // ---------------------------------------------------------------------------
  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const reportType = activeFilters.reportType || 'summary';
    const timestamp = new Date().toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // 1. Header Banner
    doc.setFillColor(16, 185, 129); // Emerald color
    doc.rect(0, 0, 595.28, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CARPE WASTE MANAGEMENT PLATFORM', 40, 36);

    // 2. Report Title & Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title || 'Official Waste Management Report', 40, 90);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${timestamp}`, 40, 108);
    doc.text(
      `Period: ${reportData.filters?.startDate} to ${reportData.filters?.endDate} | Location: ${reportData.filters?.location} | Material: ${reportData.filters?.wasteType}`,
      40,
      122
    );

    let startY = 145;

    // 3. Tables & Body Content based on Report Type
    if (reportType === 'summary') {
      const summary = reportData.summary || {};

      autoTable(doc, {
        startY,
        head: [['Summary Metric', 'Value']],
        body: [
          ['Total Waste Collected', `${formatKG(summary.totalWaste)} KG`],
          ['Average Daily Waste', `${formatKG(summary.averageDailyWaste)} KG / day`],
          ['Period Waste Growth', `${summary.growthPercentage || 0}%`],
          ['Recyclable Waste Share', `${summary.recyclablePercentage || 0}% (${formatKG(summary.recyclable)} KG)`],
          ['Top Municipal Zone', summary.highestWasteLocation?.name || 'N/A'],
          ['Dominant Material Category', summary.highestWasteCategory?.name || 'N/A']
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
      });

      startY = doc.lastAutoTable.finalY + 20;

      // Category Sub-table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Material Category Composition', 40, startY);
      startY += 8;

      autoTable(doc, {
        startY,
        head: [['Material Stream', 'Total Quantity (KG)', 'Composition Share']],
        body: (reportData.categories || []).map((c) => [c.name, `${formatKG(c.total)} KG`, `${c.percentage}%`]),
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8.5 }
      });

      startY = doc.lastAutoTable.finalY + 20;

      // Location Sub-table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Top Municipal Zones', 40, startY);
      startY += 8;

      autoTable(doc, {
        startY,
        head: [['Location', 'Total Waste (KG)', 'Collections', 'Risk Status']],
        body: (reportData.locations || []).map((l) => [
          l.name,
          `${formatKG(l.total)} KG`,
          `${l.count} entries`,
          l.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8.5 }
      });
    } else if (reportType === 'collection') {
      autoTable(doc, {
        startY,
        head: [['Date', 'Location', 'Waste Type', 'Quantity', 'Vehicle', 'Collector']],
        body: (reportData.records || []).map((r) => [
          r.date,
          r.location,
          r.wasteType,
          `${formatKG(r.quantity)} KG`,
          r.vehicle,
          r.collector
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 }
      });
    } else if (reportType === 'category') {
      autoTable(doc, {
        startY,
        head: [['Material Category', 'Total Waste (KG)', 'Percentage Share']],
        body: (reportData.categories || []).map((c) => [c.name, `${formatKG(c.total)} KG`, `${c.percentage}%`]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
      });
    } else if (reportType === 'location') {
      autoTable(doc, {
        startY,
        head: [['Location', 'Total Waste (KG)', 'Collections', 'Avg / Entry', 'Status']],
        body: (reportData.locations || []).map((l) => [
          l.name,
          `${formatKG(l.total)} KG`,
          `${l.count}`,
          `${formatKG(l.averagePerRecord)} KG`,
          l.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
      });
    } else if (reportType === 'alert') {
      autoTable(doc, {
        startY,
        head: [['Priority', 'Alert Title', 'Location', 'Observed', 'Recommended Action']],
        body: (reportData.alerts || []).map((a) => [
          a.priority,
          a.title,
          a.location,
          a.currentQuantity ? `${formatKG(a.currentQuantity)} KG` : 'N/A',
          a.recommendation || ''
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8 }
      });
    } else if (reportType === 'forecast') {
      const f = reportData.forecast?.data;
      autoTable(doc, {
        startY,
        head: [['Planning Parameter', 'Value']],
        body: [
          ['Forecast Method', f?.method || 'N/A'],
          ['Historical Baseline Daily Avg', `${formatKG(f?.summary?.averageHistoricalWaste)} KG/day`],
          ['Projected Horizon Daily Avg', `${formatKG(f?.summary?.averageForecastWaste)} KG/day`],
          ['Expected Growth Variance', `${f?.summary?.expectedGrowthPercentage}%`],
          ['Total Projected Horizon Load', `${formatKG(f?.summary?.totalForecastWaste)} KG`],
          ['Statistical Reliability', f?.reliability || 'N/A']
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 }
      });
    }

    // 4. Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated by CARPE Waste Management Platform • Official Administrative Report • Page ${i} of ${pageCount}`,
        40,
        820
      );
    }

    doc.save(`CARPE_${reportType.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Waste Management Reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            Official administrative reports, regulatory summaries, and structured data exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || !reportData}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-1.5 text-gray-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={loading || !reportData}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Report Type
            </label>
            <select
              name="reportType"
              value={filterInputs.reportType}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white font-medium text-gray-900"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date From
            </label>
            <input
              type="date"
              name="startDate"
              value={filterInputs.startDate}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Date To
            </label>
            <input
              type="date"
              name="endDate"
              value={filterInputs.endDate}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Location
            </label>
            <select
              name="location"
              value={filterInputs.location}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            >
              <option value="">All Locations</option>
              {locationList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Waste Type
            </label>
            <select
              name="wasteType"
              value={filterInputs.wasteType}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white"
            >
              <option value="">All Types</option>
              {WASTE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Generate
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              title="Reset Filters"
            >
              <RotateCcw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button
                type="button"
                onClick={() => fetchReport(activeFilters)}
                className="mt-2 md:mt-0 text-sm font-semibold text-red-800 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Government Report Document Preview */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <h4 className="text-base font-semibold text-gray-900">Generating Report...</h4>
          <p className="text-xs text-gray-500">Compiling official records and aggregating municipal data...</p>
        </div>
      ) : !reportData ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center space-y-3">
          <FileText className="h-12 w-12 text-gray-300 mx-auto stroke-1" />
          <h4 className="text-base font-semibold text-gray-700">No Data Available</h4>
          <p className="text-xs text-gray-500">No data available for the selected reporting period.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Institutional Document Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  CARPE Waste Management &amp; Decision Intelligence
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  {reportData.title}
                </h1>
              </div>
              <div className="text-xs text-slate-300 sm:text-right">
                <p className="font-semibold text-white">Official Administrative Record</p>
                <p className="mt-0.5">Generated: {formatDate(reportData.generatedAt)}</p>
              </div>
            </div>

            {/* Scope / Metadata Banner */}
            <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Reporting Window:</span>
                <p className="text-white font-semibold mt-0.5">
                  {reportData.filters?.startDate} to {reportData.filters?.endDate}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Location Scope:</span>
                <p className="text-white font-semibold mt-0.5">{reportData.filters?.location}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Material Stream:</span>
                <p className="text-white font-semibold mt-0.5">{reportData.filters?.wasteType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Security Classification:</span>
                <p className="text-emerald-400 font-bold mt-0.5">INTERNAL / MUNICIPAL</p>
              </div>
            </div>
          </div>

          {/* Document Body */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* TYPE 1: SUMMARY REPORT */}
            {reportData.reportType === 'summary' && (
              <div className="space-y-8">
                {/* 4 Summary Cards */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Executive Key Metrics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-medium">Total Waste</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {formatKG(reportData.summary?.totalWaste)} KG
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-medium">Daily Average</span>
                      <p className="text-xl font-bold text-gray-900 mt-1">
                        {formatKG(reportData.summary?.averageDailyWaste)} KG / day
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-medium">Period Growth</span>
                      <p
                        className={`text-xl font-bold mt-1 ${
                          (reportData.summary?.growthPercentage || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {(reportData.summary?.growthPercentage || 0) > 0 ? '+' : ''}
                        {reportData.summary?.growthPercentage || 0}%
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-medium">Recyclable Share</span>
                      <p className="text-xl font-bold text-emerald-700 mt-1">
                        {reportData.summary?.recyclablePercentage || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Material Category Composition */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Material Stream Composition
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Material Category</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Total Collected</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Composition Share</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(reportData.categories || []).map((c) => (
                          <tr key={c.name} className="hover:bg-gray-50">
                            <td className="px-6 py-3.5 font-medium text-gray-900">{c.name}</td>
                            <td className="px-6 py-3.5 text-gray-700 font-semibold">{formatKG(c.total)} KG</td>
                            <td className="px-6 py-3.5 text-right font-bold text-emerald-700">{c.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Location Rankings */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Municipal Zone Distribution
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Municipal Zone</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Total Waste</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Collection Entries</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(reportData.locations || []).map((l) => (
                          <tr key={l.name} className="hover:bg-gray-50">
                            <td className="px-6 py-3.5 font-medium text-gray-900">{l.name}</td>
                            <td className="px-6 py-3.5 text-gray-700 font-semibold">{formatKG(l.total)} KG</td>
                            <td className="px-6 py-3.5 text-gray-500">{l.count} records</td>
                            <td className="px-6 py-3.5 text-right font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  l.status === 'High'
                                    ? 'bg-red-100 text-red-800'
                                    : l.status === 'Medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 2: COLLECTION REPORT */}
            {reportData.reportType === 'collection' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Displaying {reportData.records?.length || 0} collections</span>
                  <span>Total Records: {reportData.pagination?.totalCount || 0}</span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Collection Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Location</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Waste Type</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Vehicle</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Collector</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(reportData.records || []).map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                          <td className="px-6 py-3.5 font-medium text-gray-900">{r.date}</td>
                          <td className="px-6 py-3.5 text-gray-700">{r.location}</td>
                          <td className="px-6 py-3.5 text-gray-700">{r.wasteType}</td>
                          <td className="px-6 py-3.5 font-bold text-gray-900">{formatKG(r.quantity)} KG</td>
                          <td className="px-6 py-3.5 text-gray-500">{r.vehicle}</td>
                          <td className="px-6 py-3.5 text-gray-500">{r.collector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TYPE 3: CATEGORY REPORT */}
            {reportData.reportType === 'category' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Waste Stream</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Total Collected</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(reportData.categories || []).map((c) => (
                        <tr key={c.name} className="hover:bg-gray-50">
                          <td className="px-6 py-3.5 font-medium text-gray-900">{c.name}</td>
                          <td className="px-6 py-3.5 font-semibold text-gray-900">{formatKG(c.total)} KG</td>
                          <td className="px-6 py-3.5 text-right font-bold text-emerald-700">{c.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TYPE 4: LOCATION REPORT */}
            {reportData.reportType === 'location' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Municipal Zone</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Total Collected</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Collections</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Average Per Entry</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(reportData.locations || []).map((l) => (
                        <tr key={l.name} className="hover:bg-gray-50">
                          <td className="px-6 py-3.5 font-medium text-gray-900">{l.name}</td>
                          <td className="px-6 py-3.5 font-semibold text-gray-900">{formatKG(l.total)} KG</td>
                          <td className="px-6 py-3.5 text-gray-500">{l.count} records</td>
                          <td className="px-6 py-3.5 text-gray-700">{formatKG(l.averagePerRecord)} KG</td>
                          <td className="px-6 py-3.5 text-right font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                l.status === 'High'
                                  ? 'bg-red-100 text-red-800'
                                  : l.status === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TYPE 5: ALERT REPORT */}
            {reportData.reportType === 'alert' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Priority</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Alert Title</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Location</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Observed</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(reportData.alerts || []).map((a) => (
                        <tr key={a._id} className="hover:bg-gray-50">
                          <td className="px-6 py-3.5 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                a.priority === 'HIGH'
                                  ? 'bg-red-100 text-red-800'
                                  : a.priority === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {a.priority}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-gray-900">{a.title}</td>
                          <td className="px-6 py-3.5 text-gray-700">{a.location}</td>
                          <td className="px-6 py-3.5 font-medium text-gray-900">
                            {a.currentQuantity ? `${formatKG(a.currentQuantity)} KG` : 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-600">{a.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TYPE 6: FORECAST REPORT */}
            {reportData.reportType === 'forecast' && (
              <div className="space-y-4">
                {reportData.forecast?.sufficient === false ? (
                  <div className="p-8 text-center bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                    <p className="font-bold">Insufficient historical data to generate a reliable forecast.</p>
                    <p>{reportData.forecast?.reason}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                        <span className="text-gray-500 font-medium">Historical Daily Avg</span>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                          {formatKG(reportData.forecast?.data?.summary?.averageHistoricalWaste)} KG/day
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                        <span className="text-gray-500 font-medium">Projected Daily Avg</span>
                        <p className="text-lg font-bold text-blue-700 mt-0.5">
                          {formatKG(reportData.forecast?.data?.summary?.averageForecastWaste)} KG/day
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                        <span className="text-gray-500 font-medium">Projected Growth</span>
                        <p className="text-lg font-bold text-emerald-700 mt-0.5">
                          {reportData.forecast?.data?.summary?.expectedGrowthPercentage}%
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                        <span className="text-gray-500 font-medium">Forecast Method</span>
                        <p className="text-xs font-semibold text-gray-800 mt-1">
                          {reportData.forecast?.data?.method}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Forecast Date</th>
                            <th className="px-6 py-3 text-right font-semibold text-gray-600 uppercase">Predicted Volume</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(reportData.forecast?.data?.forecast || []).map((f) => (
                            <tr key={f.date} className="hover:bg-gray-50">
                              <td className="px-6 py-3.5 font-medium text-gray-900">{f.date}</td>
                              <td className="px-6 py-3.5 text-right font-bold text-blue-700">
                                {formatKG(f.predictedQuantity)} KG
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Institutional Document Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-2">
            <span>Generated by CARPE Waste Management Platform • Official Administrative Document</span>
            <span className="font-mono">VERIFIED ARCHIVE RECORD</span>
          </div>
        </div>
      )}
    </div>
  );
}
