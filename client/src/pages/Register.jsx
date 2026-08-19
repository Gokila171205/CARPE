import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';
import tnGovtEmblem from '../assets/tn-government-emblem.png';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(name, email, password, role);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9] text-slate-900 font-sans">
      {/* Official Top Utility Strip */}
      <div className="bg-[#002244] text-slate-200 text-xs py-1.5 px-4 flex flex-wrap justify-between items-center border-b border-[#001833]">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-amber-400">தமிழ்நாடு அரசு | Government of Tamil Nadu</span>
          <span className="hidden sm:inline-block text-slate-400">
            • {t('header.deptName')}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400">Language:</span>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="font-bold text-amber-300 hover:text-white px-2 py-0.5 rounded bg-[#003366] border border-amber-400/40"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>
      </div>

      {/* Main Form Center */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border-2 border-slate-300 rounded-sm shadow-md overflow-hidden">
          {/* Header Heraldry */}
          <div className="bg-[#003366] text-white p-6 text-center border-b-2 border-amber-500">
            <div className="h-16 w-16 mx-auto mb-2 flex items-center justify-center">
              <img
                src={tnGovtEmblem}
                alt="Government of Tamil Nadu Official Emblem"
                className="h-16 w-16 object-contain filter drop-shadow"
              />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
              {t('header.stateGovt')}
            </span>
            <h2 className="text-lg font-black mt-1 tracking-tight">
              {t('auth.registerTitle')}
            </h2>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded font-medium">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {t('auth.nameLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.namePlaceholder')}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {t('auth.emailLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {t('auth.passwordLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  {t('vehicles.colType')} / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 bg-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                >
                  <option value="admin">{t('header.officerRole')}</option>
                  <option value="collector">Ward Collection Supervisor</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-xs font-bold rounded text-white bg-[#003366] hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-[#003366] shadow-xs disabled:opacity-60 transition-colors uppercase tracking-wider"
              >
                {isLoading ? t('auth.signingUpBtn') : t('auth.signUpBtn')}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="font-bold text-[#003366] hover:underline">
                {t('auth.loginLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Official Bottom Footer */}
      <footer className="bg-white border-t border-slate-300 text-center py-3 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {t('header.stateGovt')} • {t('header.deptName')}</p>
      </footer>
    </div>
  );
}

