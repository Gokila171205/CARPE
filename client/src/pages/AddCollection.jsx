import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Building2, Save, ShieldCheck } from 'lucide-react';

export default function AddCollection() {
  const navigate = useNavigate();
  const { t, translateWasteType } = useLanguage();
  const [formData, setFormData] = useState({
    location: '',
    wasteType: 'Plastic',
    quantity: '',
    vehicle: '',
    collector: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/waste', {
        ...formData,
        quantity: Number(formData.quantity)
      });
      navigate('/collections');
    } catch (error) {
      console.error('Failed to add record', error);
      alert('Failed to log collection record: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Official Form Header */}
      <div className="bg-white border-2 border-slate-300 rounded-sm shadow-xs overflow-hidden">
        <div className="bg-[#003366] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
              {t('addCollection.formCode')}
            </span>
            <h2 className="text-lg font-black mt-0.5 tracking-tight">
              {t('addCollection.formTitle')}
            </h2>
          </div>
          <div className="p-2 bg-[#002244] rounded border border-blue-900">
            <Building2 className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>
            {t('addCollection.guidance')}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {t('addCollection.labelLocation')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder={t('addCollection.placeholderLocation')}
                className="block w-full border border-slate-300 rounded py-2 px-3 text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
              <p className="text-[10px] text-slate-500 mt-1">{t('addCollection.hintLocation')}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {t('addCollection.labelWasteType')} <span className="text-red-600">*</span>
              </label>
              <select
                name="wasteType"
                required
                value={formData.wasteType}
                onChange={handleChange}
                className="block w-full bg-white border border-slate-300 rounded py-2 px-3 text-xs leading-5 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              >
                <option value="Plastic">{translateWasteType('Plastic')}</option>
                <option value="Organic">{translateWasteType('Organic')}</option>
                <option value="Paper">{translateWasteType('Paper')}</option>
                <option value="Metal">{translateWasteType('Metal')}</option>
                <option value="Glass">{translateWasteType('Glass')}</option>
                <option value="E-waste">{translateWasteType('E-waste')}</option>
                <option value="Other">{translateWasteType('Other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {t('addCollection.labelQuantity')} <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="0.1"
                step="any"
                value={formData.quantity}
                onChange={handleChange}
                placeholder={t('addCollection.placeholderQuantity')}
                className="block w-full border border-slate-300 rounded py-2 px-3 text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {t('addCollection.labelVehicle')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="vehicle"
                required
                value={formData.vehicle}
                onChange={handleChange}
                placeholder={t('addCollection.placeholderVehicle')}
                className="block w-full border border-slate-300 rounded py-2 px-3 text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {t('addCollection.labelCollector')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="collector"
                required
                value={formData.collector}
                onChange={handleChange}
                placeholder={t('addCollection.placeholderCollector')}
                className="block w-full border border-slate-300 rounded py-2 px-3 text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                {t('addCollection.labelNotes')}
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('addCollection.placeholderNotes')}
                className="block w-full border border-slate-300 rounded py-2 px-3 text-xs leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/collections')}
              className="px-4 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              {t('addCollection.cancelBtn')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-5 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded text-xs font-bold shadow-xs focus:outline-none disabled:opacity-60"
            >
              <Save className="mr-1.5 h-4 w-4" />
              {loading ? t('addCollection.submittingBtn') : t('addCollection.submitBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

