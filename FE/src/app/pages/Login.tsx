import { FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutGrid,
  Lock,
  Mail,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { BanBanLogo } from '../components/BanBanLogo';
import { getNativeInputFieldClassName } from '../components/inputLikeControlStyles';
import { getPrimaryModalActionButtonClassName } from '../components/modalActionButtonStyles';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors, useTheme } from '../contexts/ThemeContext';
import { EMAIL_MAX_LENGTH } from '../utils/auth';
import { getWorkspaceSurfaceStyles } from '../utils/workspaceSurfaceStyles';

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFieldDescription(helperId: string, errorId: string, hasError: boolean) {
  return hasError ? `${helperId} ${errorId}` : helperId;
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const currentTheme = getThemeColors(theme, isDarkMode);
  const workspaceSurface = getWorkspaceSurfaceStyles(currentTheme, isDarkMode);
  const fieldSurfaceClassName = isDarkMode ? currentTheme.inputBg : 'bg-white';
  const primaryActionButtonClassName = getPrimaryModalActionButtonClassName(currentTheme);
  const inputClassName = getNativeInputFieldClassName(currentTheme, {
    surfaceClassName: fieldSurfaceClassName,
  });
  const formSurfaceClassName = isDarkMode
    ? 'border-zinc-800/90 bg-zinc-950/88 shadow-[0_28px_80px_-58px_rgba(0,0,0,0.95)]'
    : 'border-slate-200 bg-white/94 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.36)]';
  const heroPanelClassName = isDarkMode
    ? 'border-zinc-800/80 bg-zinc-950/58'
    : 'border-slate-200 bg-white/68';
  const iconTileClassName = `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentTheme.primary} text-white shadow-lg shadow-black/10`;
  const iconButtonClassName = `absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const validateForm = () => {
    const nextErrors: LoginErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = `Email can be up to ${EMAIL_MAX_LENGTH} characters.`;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    return nextErrors;
  };

  const focusFirstInvalidField = (nextErrors: LoginErrors) => {
    window.requestAnimationFrame(() => {
      if (nextErrors.email) {
        emailRef.current?.focus();
        return;
      }

      if (nextErrors.password) {
        passwordRef.current?.focus();
      }
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        navigate('/app');
        return;
      }

      setErrors({ general: result.error || 'Unable to log in right now.' });
    } catch {
      setErrors({ general: 'Unable to log in right now.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = (value: string) => {
    setEmail(value);
    setErrors((previous) => ({ ...previous, email: undefined, general: undefined }));
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    setErrors((previous) => ({ ...previous, password: undefined, general: undefined }));
  };

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${currentTheme.bgSecondary}`}>
      <div className={workspaceSurface.backgroundLayerClassName} aria-hidden="true">
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.03fr)_minmax(28rem,0.97fr)]">
        <section className={`hidden border-r px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-14 ${currentTheme.border}`} style={workspaceSurface.panelSurfaceStyle}>
          <div>
            <Link to="/" className="inline-flex" aria-label="Go to home page">
              <BanBanLogo size="xl" />
            </Link>
          </div>

          <div className="max-w-xl space-y-8">
            <div className="space-y-4">
              <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.16em] ${currentTheme.primaryText}`}>
                Workspace sign in
              </p>
              <h1 className={`font-ui-condensed text-5xl font-semibold leading-[0.95] tracking-[0.01em] ${currentTheme.text}`}>
                Return to your Kanban flow.
              </h1>
              <p className={`max-w-lg text-base leading-7 ${currentTheme.textSecondary}`}>
                Continue planning, staging, voting, and shipping work from the same focused product workspace.
              </p>
            </div>

            <div className={`rounded-3xl border p-5 backdrop-blur-xl ${heroPanelClassName}`}>
              <div className="grid gap-3">
                {[
                  {
                    icon: LayoutGrid,
                    title: 'Boards stay organized',
                    description: 'Move between board, list, staging, and history without losing context.',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Progress stays visible',
                    description: 'XP, levels, and task stats keep team momentum easy to scan.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Themes follow you',
                    description: 'Your selected accent and light or dark mode shape the whole workspace.',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex items-start gap-4 rounded-2xl px-2 py-3">
                      <div className={iconTileClassName}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className={`font-ui-condensed text-lg font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                          {item.title}
                        </h2>
                        <p className={`text-sm leading-6 ${currentTheme.textMuted}`}>{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className={`text-sm ${currentTheme.textMuted}`}>BanBan keeps planning calm, visible, and a little more rewarding.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <Link to="/" aria-label="Go to home page">
                <BanBanLogo size="lg" />
              </Link>
            </div>

            <div className={`overflow-hidden rounded-[2rem] border backdrop-blur-xl ${formSurfaceClassName}`}>
              <div className={`border-b px-6 py-6 ${currentTheme.border} sm:px-8`}>
                <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.14em] ${currentTheme.primaryText}`}>
                  Account access
                </p>
                <h1 className={`mt-2 font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                  Welcome back
                </h1>
                <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                  Log in to continue where your workspace left off.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6 sm:px-8">
                {errors.general ? (
                  <div
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                      isDarkMode ? 'border-red-900/70 bg-red-950/28 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
                    }`}
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <p className="text-sm leading-6">{errors.general}</p>
                  </div>
                ) : null}

                <div>
                  <label htmlFor="login-email" className={`block text-sm font-semibold ${currentTheme.text}`}>
                    Email
                  </label>
                  <div className="relative mt-2">
                    <Mail className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                    <input
                      ref={emailRef}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      maxLength={EMAIL_MAX_LENGTH}
                      onChange={(event) => updateEmail(event.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={getFieldDescription('login-email-helper', 'login-email-error', Boolean(errors.email))}
                      className={`h-12 w-full px-11 ${inputClassName} ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  <p id="login-email-helper" className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                    Use the email connected to your BanBan account.
                  </p>
                  {errors.email ? (
                    <p id="login-email-error" className="mt-1 text-xs text-red-500">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="login-password" className={`block text-sm font-semibold ${currentTheme.text}`}>
                    Password
                  </label>
                  <div className="relative mt-2">
                    <Lock className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                    <input
                      ref={passwordRef}
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => updatePassword(event.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={getFieldDescription('login-password-helper', 'login-password-error', Boolean(errors.password))}
                      className={`h-12 w-full pl-11 pr-14 ${inputClassName} ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className={iconButtonClassName}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="login-password-helper" className={`mt-2 text-xs ${currentTheme.textMuted}`}>
                    Password is case-sensitive.
                  </p>
                  {errors.password ? (
                    <p id="login-password-error" className="mt-1 text-xs text-red-500">
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative h-12 w-full overflow-hidden px-5 font-semibold ${primaryActionButtonClassName}`}
                  aria-live="polite"
                >
                  <span className="pointer-events-none absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[460%]" aria-hidden="true" />
                  <span className="relative inline-flex items-center gap-2">
                    {isLoading ? 'Logging in...' : 'Log in'}
                    {!isLoading ? <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" /> : null}
                  </span>
                </button>
              </form>

              <div className={`border-t px-6 py-5 text-center ${currentTheme.border} sm:px-8`}>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className={`font-semibold ${currentTheme.primaryText} underline-offset-4 hover:underline`}>
                    Create one
                  </Link>
                </p>
                <Link to="/" className={`mt-3 inline-flex text-sm ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary}`}>
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
