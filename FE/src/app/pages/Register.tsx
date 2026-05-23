import { FormEvent, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { BanBanLogo } from '../components/BanBanLogo';
import { getNativeInputFieldClassName } from '../components/inputLikeControlStyles';
import { getPrimaryModalActionButtonClassName } from '../components/modalActionButtonStyles';
import { useAuth } from '../contexts/AuthContext';
import { getThemeColors, useTheme } from '../contexts/ThemeContext';
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../utils/auth';
import { getWorkspaceSurfaceStyles } from '../utils/workspaceSurfaceStyles';

type RegisterErrors = {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function getFieldDescription(helperId: string, errorId: string, hasError: boolean) {
  return hasError ? `${helperId} ${errorId}` : helperId;
}

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
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
  const iconButtonClassName = `absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-offset-0 ${currentTheme.focus}`;

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  const validateForm = () => {
    const nextErrors: RegisterErrors = {};
    const trimmedUsername = username.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      nextErrors.username = 'Username is required.';
    } else if (trimmedUsername.length < USERNAME_MIN_LENGTH) {
      nextErrors.username = `Username must be at least ${USERNAME_MIN_LENGTH} characters.`;
    } else if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
      nextErrors.username = `Username can be up to ${USERNAME_MAX_LENGTH} characters.`;
    }

    if (!trimmedFirstName) {
      nextErrors.firstName = 'First name is required.';
    } else if (trimmedFirstName.length > NAME_MAX_LENGTH) {
      nextErrors.firstName = `First name can be up to ${NAME_MAX_LENGTH} characters.`;
    }

    if (!trimmedLastName) {
      nextErrors.lastName = 'Last name is required.';
    } else if (trimmedLastName.length > NAME_MAX_LENGTH) {
      nextErrors.lastName = `Last name can be up to ${NAME_MAX_LENGTH} characters.`;
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = `Email can be up to ${EMAIL_MAX_LENGTH} characters.`;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  };

  const focusFirstInvalidField = (nextErrors: RegisterErrors) => {
    window.requestAnimationFrame(() => {
      if (nextErrors.username) {
        usernameRef.current?.focus();
        return;
      }

      if (nextErrors.firstName) {
        firstNameRef.current?.focus();
        return;
      }

      if (nextErrors.lastName) {
        lastNameRef.current?.focus();
        return;
      }

      if (nextErrors.email) {
        emailRef.current?.focus();
        return;
      }

      if (nextErrors.password) {
        passwordRef.current?.focus();
        return;
      }

      if (nextErrors.confirmPassword) {
        confirmPasswordRef.current?.focus();
      }
    });
  };

  const clearFieldError = (field: keyof RegisterErrors) => {
    setErrors((previous) => ({ ...previous, [field]: undefined, general: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (
      nextErrors.username ||
      nextErrors.firstName ||
      nextErrors.lastName ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.confirmPassword
    ) {
      setErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
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
        return;
      }

      setErrors({ general: result.error || 'Unable to create your account right now.' });
    } catch {
      setErrors({ general: 'Unable to create your account right now.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderHelperText = (
    helperId: string,
    errorId: string,
    error: string | undefined,
    helper: string,
  ) => (
    <>
      <p id={helperId} className={`mt-2 text-xs ${currentTheme.textMuted}`}>
        {helper}
      </p>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </>
  );

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${currentTheme.bgSecondary}`}>
      <div className={workspaceSurface.backgroundLayerClassName} aria-hidden="true">
        {workspaceSurface.backgroundBlobs.map((blob, index) => (
          <div key={index} className={blob.className} style={blob.style} />
        ))}
      </div>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <Link to="/" className="inline-flex" aria-label="Go to home page">
              <BanBanLogo size="lg" />
            </Link>
            <p className={`mt-4 max-w-lg text-sm leading-6 ${currentTheme.textSecondary}`}>
              Create your workspace identity once. You can update profile details later from settings.
            </p>
          </div>

          <div className={`overflow-hidden rounded-[2rem] border backdrop-blur-xl ${formSurfaceClassName}`}>
            <div className={`border-b px-6 py-6 ${currentTheme.border} sm:px-8`}>
              <p className={`font-ui-condensed text-sm font-semibold uppercase tracking-[0.14em] ${currentTheme.primaryText}`}>
                New account
              </p>
              <h1 className={`mt-2 font-ui-condensed text-3xl font-semibold tracking-[0.01em] ${currentTheme.text}`}>
                Start with BanBan
              </h1>
              <p className={`mt-2 text-sm leading-6 ${currentTheme.textSecondary}`}>
                Add your name, handle, and login details to enter the product workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6 px-6 py-6 sm:px-8">
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="register-username" className={`block text-sm font-semibold ${currentTheme.text}`}>
                    Username
                  </label>
                  <div className="relative mt-2">
                    <AtSign className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                    <input
                      ref={usernameRef}
                      id="register-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      maxLength={USERNAME_MAX_LENGTH}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        clearFieldError('username');
                      }}
                      aria-invalid={Boolean(errors.username)}
                      aria-describedby={getFieldDescription('register-username-helper', 'register-username-error', Boolean(errors.username))}
                      className={`h-12 w-full px-11 ${inputClassName} ${errors.username ? 'border-red-500' : ''}`}
                      placeholder="your-handle"
                    />
                  </div>
                  {renderHelperText(
                    'register-username-helper',
                    'register-username-error',
                    errors.username,
                    `${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters. This is how teammates can find you.`,
                  )}
                </div>

                <div>
                  <label htmlFor="register-first-name" className={`block text-sm font-semibold ${currentTheme.text}`}>
                    First name
                  </label>
                  <div className="relative mt-2">
                    <User className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                    <input
                      ref={firstNameRef}
                      id="register-first-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      maxLength={NAME_MAX_LENGTH}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                        clearFieldError('firstName');
                      }}
                      aria-invalid={Boolean(errors.firstName)}
                      aria-describedby={getFieldDescription('register-first-name-helper', 'register-first-name-error', Boolean(errors.firstName))}
                      className={`h-12 w-full px-11 ${inputClassName} ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="Anna"
                    />
                  </div>
                  {renderHelperText(
                    'register-first-name-helper',
                    'register-first-name-error',
                    errors.firstName,
                    `Up to ${NAME_MAX_LENGTH} characters.`,
                  )}
                </div>

                <div>
                  <label htmlFor="register-last-name" className={`block text-sm font-semibold ${currentTheme.text}`}>
                    Last name
                  </label>
                  <div className="relative mt-2">
                    <User className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                    <input
                      ref={lastNameRef}
                      id="register-last-name"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      maxLength={NAME_MAX_LENGTH}
                      onChange={(event) => {
                        setLastName(event.target.value);
                        clearFieldError('lastName');
                      }}
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={getFieldDescription('register-last-name-helper', 'register-last-name-error', Boolean(errors.lastName))}
                      className={`h-12 w-full px-11 ${inputClassName} ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Smith"
                    />
                  </div>
                  {renderHelperText(
                    'register-last-name-helper',
                    'register-last-name-error',
                    errors.lastName,
                    `Up to ${NAME_MAX_LENGTH} characters.`,
                  )}
                </div>
              </div>

              <div className={`h-px ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

              <div className="space-y-5">
                <div>
                  <label htmlFor="register-email" className={`block text-sm font-semibold ${currentTheme.text}`}>
                    Email
                  </label>
                  <div className="relative mt-2">
                    <Mail className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                    <input
                      ref={emailRef}
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      maxLength={EMAIL_MAX_LENGTH}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError('email');
                      }}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={getFieldDescription('register-email-helper', 'register-email-error', Boolean(errors.email))}
                      className={`h-12 w-full px-11 ${inputClassName} ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {renderHelperText(
                    'register-email-helper',
                    'register-email-error',
                    errors.email,
                    `Use a reachable email. Up to ${EMAIL_MAX_LENGTH} characters.`,
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-password" className={`block text-sm font-semibold ${currentTheme.text}`}>
                      Password
                    </label>
                    <div className="relative mt-2">
                      <Lock className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                      <input
                        ref={passwordRef}
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          clearFieldError('password');
                          clearFieldError('confirmPassword');
                        }}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={getFieldDescription('register-password-helper', 'register-password-error', Boolean(errors.password))}
                        className={`h-12 w-full pl-11 pr-14 ${inputClassName} ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Create a password"
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
                    {renderHelperText(
                      'register-password-helper',
                      'register-password-error',
                      errors.password,
                      `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-confirm-password" className={`block text-sm font-semibold ${currentTheme.text}`}>
                      Confirm password
                    </label>
                    <div className="relative mt-2">
                      <Lock className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${currentTheme.textMuted}`} aria-hidden="true" />
                      <input
                        ref={confirmPasswordRef}
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          clearFieldError('confirmPassword');
                        }}
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={getFieldDescription(
                          'register-confirm-password-helper',
                          'register-confirm-password-error',
                          Boolean(errors.confirmPassword),
                        )}
                        className={`h-12 w-full pl-11 pr-14 ${inputClassName} ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        placeholder="Repeat password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className={iconButtonClassName}
                        aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                      </button>
                    </div>
                    {renderHelperText(
                      'register-confirm-password-helper',
                      'register-confirm-password-error',
                      errors.confirmPassword,
                      'Repeat the same password exactly.',
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`group relative h-12 w-full overflow-hidden px-5 font-semibold ${primaryActionButtonClassName}`}
                aria-live="polite"
              >
                <span className="pointer-events-none absolute inset-y-0 left-[-35%] w-1/3 rotate-12 bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[460%]" aria-hidden="true" />
                <span className="relative inline-flex items-center gap-2">
                  {isLoading ? 'Creating account...' : 'Create account'}
                  {!isLoading ? <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" /> : null}
                </span>
              </button>
            </form>

            <div className={`border-t px-6 py-5 text-center ${currentTheme.border} sm:px-8`}>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Already have an account?{' '}
                <Link to="/login" className={`font-semibold ${currentTheme.primaryText} underline-offset-4 hover:underline`}>
                  Log in
                </Link>
              </p>
              <Link to="/" className={`mt-3 inline-flex text-sm ${currentTheme.textMuted} transition-colors hover:${currentTheme.textSecondary}`}>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
