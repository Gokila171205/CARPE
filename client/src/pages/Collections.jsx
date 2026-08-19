import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Search, Trash, FileText, Calendar } from 'lucide-react';

export default function Collections() {
  const { t, translateWasteType, language } = useLanguage();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data } = await api.get('/waste');
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch collections', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('collections.deleteConfirm'))) {
      try {
        await api.delete(`/waste/${id}`);
        fetchCollections();
      } catch (error) {
        console.error('Failed to delete record', error);
      }
    }
  };

  const filtered = collections.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.location?.toLowerCase().includes(term) ||
      c.wasteType?.toLowerCase().includes(term) ||
      c.vehicle?.toLowerCase().includes(term) ||
      c.collector?.toLowerCase().includes(term)
    );
  });

  const formatKG = (val) => {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Official Header Controls */}
      <div className="bg-white border-2 border-slate-300 rounded-sm p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="govt-section-header text-base uppercase tracking-wide">
            {t('collections.pageTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('collections.pageSubtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              placeholder={t('collections.searchPlaceholder')}
            />
          </div>

          <Link
            to="/collections/add"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-xs text-xs font-bold rounded text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-[#003366]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('collections.logNewBtn')}
          </Link>
        </div>
      </div>

      {/* Official Departmental Collection Table */}
      <div className="bg-white border-2 border-slate-300 rounded-sm shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wide">
            {t('collections.ledgerTitle', { count: filtered.length, total: collections.length })}
          </span>
          <span className="text-slate-500">{t('collections.ledgerSubtitle')}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="govt-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>{t('collections.colDate')}</th>
                <th>{t('collections.colLocation')}</th>
                <th>{t('collections.colStream')}</th>
                <th>{t('collections.colQuantity')}</th>
                <th>{t('collections.colVehicle')}</th>
                <th>{t('collections.colCollector')}</th>
                <th style={{ width: '80px', textAlign: 'right' }}>{t('collections.colAction')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 text-xs">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    {t('common.noCollectionsFound')}
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record._id}>
                    <td className="font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(record.collectedAt)}
                      </div>
                    </td>
                    <td className="font-bold text-slate-900">{record.location}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                        {translateWasteType(record.wasteType)}
                      </span>
                    </td>
                    <td className="font-bold text-slate-900">{formatKG(record.quantity)} KG</td>
                    <td className="font-mono text-xs text-slate-700">{record.vehicle}</td>
                    <td className="text-slate-600">{record.collector || 'N/A'}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(record._id)}
                        className="text-red-700 hover:text-red-900 p-1"
                        title={t('common.delete')}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

