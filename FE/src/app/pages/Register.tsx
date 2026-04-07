import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { BanBanLogo } from '../components/BanBanLogo';
import { Mail, Lock, User, AtSign, BadgeAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const t = getThemeColors(theme, isDarkMode);

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: {
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await register({
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      if (result.success) {
        navigate('/app');
      } else {
        setErrors({ general: result.error || 'Registration failed' });
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${t.bgSecondary} flex items-center justify-center px-6 py-12`}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <BanBanLogo size="lg" />
          </Link>
        </div>
        <p className={`${t.textSecondary} text-center mb-8`}>Create your account and start leveling up.</p>

        <div className={`${t.cardBg} rounded-2xl border-2 ${t.border} shadow-lg p-8`}>
          {errors.general && (
            <div className={`mb-6 p-4 ${t.isDark ? 'bg-red-950/30' : 'bg-red-50'} border-2 ${t.isDark ? 'border-red-800' : 'border-red-200'} rounded-xl flex items-start gap-3`}>
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${t.isDark ? 'text-red-400' : 'text-red-800'}`}>{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className={`block text-sm font-semibold ${t.text} mb-2`}>
                Username
              </label>
              <div className="relative">
                <AtSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${t.textMuted}`} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 ${
                    errors.username ? 'border-red-300' : t.border
                  } ${t.inputBg} ${t.text} rounded-xl focus:outline-none focus:ring-2 ${t.ring} focus:border-transparent transition-all`}
                  placeholder="your-handle"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={`block text-sm font-semibold ${t.text} mb-2`}>
                  First Name
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${t.textMuted}`} />
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${
                      errors.firstName ? 'border-red-300' : t.border
                    } ${t.inputBg} ${t.text} rounded-xl focus:outline-none focus:ring-2 ${t.ring} focus:border-transparent transition-all`}
                    placeholder="Anna"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className={`block text-sm font-semibold ${t.text} mb-2`}>
                  Last Name
                </label>
                <div className="relative">
                  <BadgeAlert className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${t.textMuted}`} />
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border-2 ${
                      errors.lastName ? 'border-red-300' : t.border
                    } ${t.inputBg} ${t.text} rounded-xl focus:outline-none focus:ring-2 ${t.ring} focus:border-transparent transition-all`}
                    placeholder="Smith"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

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
                  placeholder="Create a password"
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
              <p className={`mt-1 text-xs ${t.textMuted}`}>Use at least 8 characters.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-semibold ${t.text} mb-2`}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${t.textMuted}`} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-11 pr-12 py-3 border-2 ${
                    errors.confirmPassword ? 'border-red-300' : t.border
                  } ${t.inputBg} ${t.text} rounded-xl focus:outline-none focus:ring-2 ${t.ring} focus:border-transparent transition-all`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} cursor-pointer`}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-gradient-to-r ${t.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`${t.textSecondary} text-sm`}>
              Already have an account?{' '}
              <Link
                to="/login"
                className={`font-semibold ${t.primaryText} hover:underline`}
              >
                Log in
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
  );
}
