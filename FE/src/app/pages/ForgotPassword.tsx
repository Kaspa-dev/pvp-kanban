import { useState } from 'react';
import { Link } from 'react-router';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { BanBanLogo } from '../components/BanBanLogo';
import { Mail, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const { theme, isDarkMode } = useTheme();
  const t = getThemeColors(theme, isDarkMode);

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className={`min-h-screen ${t.bgSecondary} flex items-center justify-center px-6 py-12`}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link to="/">
              <BanBanLogo size="lg" />
            </Link>
          </div>

          <div className={`${t.cardBg} rounded-2xl border-2 ${t.border} shadow-lg p-8 text-center`}>
            <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className={`text-2xl font-bold ${t.text} mb-4`}>Check your email</h2>
            <p className={`${t.textSecondary} mb-6`}>
              If an account exists for <strong>{email}</strong>, we've sent password reset instructions.
            </p>
            <p className={`text-sm ${t.textMuted} mb-6`}>
              Didn't receive an email? Check your spam folder or try again with a different email address.
            </p>
            <Link
              to="/login"
              className={`inline-block w-full py-3 bg-gradient-to-r ${t.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.bgSecondary} flex items-center justify-center px-6 py-12`}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-2">
            <BanBanLogo size="lg" />
          </Link>
          <p className={`${t.textSecondary} text-center`}>Reset your password</p>
        </div>

        <div className={`${t.cardBg} rounded-2xl border-2 ${t.border} shadow-lg p-8`}>
          <p className={`${t.textSecondary} text-sm mb-6`}>
            Enter your email address and we'll send you instructions to reset your password.
          </p>

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

            <button
              type="submit"
              className={`w-full py-3 bg-gradient-to-r ${t.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              Send reset instructions
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className={`text-sm font-medium ${t.primaryText} hover:underline`}
            >
              Back to login
            </Link>
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
