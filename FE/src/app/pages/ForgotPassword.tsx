import { Link } from 'react-router';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { BanBanLogo } from '../components/BanBanLogo';
import { ShieldAlert } from 'lucide-react';

export function ForgotPassword() {
  const { theme, isDarkMode } = useTheme();
  const t = getThemeColors(theme, isDarkMode);

  return (
    <div className={`min-h-screen ${t.bgSecondary} flex items-center justify-center px-6 py-12`}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-2">
            <BanBanLogo size="lg" />
          </Link>
          <p className={`${t.textSecondary} text-center`}>Password reset</p>
        </div>

        <div className={`${t.cardBg} rounded-2xl border-2 ${t.border} shadow-lg p-8`}>
          <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${t.text} mb-4 text-center`}>Not available yet</h2>
          <p className={`${t.textSecondary} text-sm mb-3 text-center`}>
            Password reset is outside this authentication phase, so this flow is intentionally disabled for now.
          </p>
          <p className={`${t.textMuted} text-sm mb-6 text-center`}>
            You can head back to the login screen and sign in with an existing account.
          </p>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className={`inline-block w-full py-3 bg-gradient-to-r ${t.primary} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
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
