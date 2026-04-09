import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { BanBanLogo } from '../components/BanBanLogo';
import { LayoutGrid, TrendingUp, Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const t = getThemeColors(theme, isDarkMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate('/app');
      } else {
        setErrors({ general: result.error || 'Login failed' });
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${t.bg} flex`}>
      <div className={`hidden lg:flex lg:w-1/2 ${t.bgSecondary} flex-col justify-center px-12 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${t.primarySoftStrong} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr ${t.primarySoft} rounded-full blur-3xl`} />

        <div className="relative z-10">
          <Link to="/" className="inline-block mb-4">
            <BanBanLogo size="xl" />
          </Link>

          <h2 className={`text-3xl font-bold ${t.text} mb-4`}>
            Gamified task management
            <br />
            for Agile teams
          </h2>

          <p className={`text-lg ${t.textSecondary} mb-8 max-w-md`}>
            Learn project organization through an engaging Kanban workflow with XP rewards and team-friendly task flow.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <LayoutGrid className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className={`font-semibold ${t.text}`}>Flow-first planning</p>
                <p className={`text-sm ${t.textMuted}`}>Pull work from backlog into a clear delivery flow</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.primary} flex items-center justify-center flex-shrink-0`}>
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className={`font-semibold ${t.text}`}>XP & leveling system</p>
                <p className={`text-sm ${t.textMuted}`}>Earn XP and unlock achievement ranks</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className={`font-semibold ${t.text}`}>Simple Kanban board</p>
                <p className={`text-sm ${t.textMuted}`}>Drag-and-drop task management</p>
              </div>
            </div>
          </div>

          <div className={`${t.cardBg} rounded-xl border-2 ${t.border} p-4 shadow-lg`}>
            <div className="grid grid-cols-3 gap-2">
              <div className={`${t.bgTertiary} rounded-lg p-3 space-y-2`}>
                <div className={`h-2 ${t.border} rounded`} />
                <div className="bg-emerald-400/50 rounded p-2 h-12" />
                <div className="bg-blue-400/50 rounded p-2 h-12" />
              </div>
              <div className={`${t.bgTertiary} rounded-lg p-3 space-y-2`}>
                <div className={`h-2 ${t.border} rounded`} />
                <div className="bg-amber-400/50 rounded p-2 h-12" />
              </div>
              <div className={`${t.bgTertiary} rounded-lg p-3 space-y-2`}>
                <div className={`h-2 ${t.border} rounded`} />
                <div className={`${t.primaryBg} rounded p-2 h-12 opacity-70`} />
                <div className={`${t.primaryBg} rounded p-2 h-12 opacity-45`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`w-full lg:w-1/2 flex items-center justify-center px-6 py-12 ${t.bg}`}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/">
              <BanBanLogo size="lg" />
            </Link>
          </div>

          <div className="mb-6">
            <h2 className={`text-2xl font-bold ${t.text} mb-2`}>Welcome back</h2>
            <p className={`${t.textSecondary}`}>Log in to your account to continue.</p>
          </div>

          <div className={`${t.cardBg} rounded-2xl border ${t.border} shadow-lg p-8`}>
            {errors.general && (
              <div className={`mb-6 p-4 ${t.isDark ? 'bg-red-950/30' : 'bg-red-50'} border-2 ${t.isDark ? 'border-red-800' : 'border-red-200'} rounded-xl flex items-start gap-3`}>
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${t.isDark ? 'text-red-400' : 'text-red-800'}`}>{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className={`block text-sm font-semibold ${t.text} mb-2`}>
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${t.textMuted}`} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${
                      errors.email ? 'border-red-300' : t.border
                    } ${t.inputBg} ${t.text} rounded-xl focus:outline-none focus:ring-2 ${t.ring} focus:border-transparent transition-all`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-semibold ${t.text} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${t.textMuted}`} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-3 border-2 ${
                      errors.password ? 'border-red-300' : t.border
                    } ${t.inputBg} ${t.text} rounded-xl focus:outline-none focus:ring-2 ${t.ring} focus:border-transparent transition-all`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} cursor-pointer`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 bg-gradient-to-r ${t.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className={`${t.textSecondary} text-sm`}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className={`font-semibold ${t.primaryText} hover:underline`}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className={`text-sm ${t.textSecondary} hover:${t.text} transition-colors`}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
