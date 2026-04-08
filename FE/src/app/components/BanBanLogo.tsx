import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';
import banbanLogo from '../../assets/0c5c2ae679a157574fde9f7ad1b973b49f938ec0.png';

interface BanBanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  to?: string;
}

export function BanBanLogo({ size = 'md', className = '', to }: BanBanLogoProps) {
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const t = getThemeColors(theme, isDarkMode);
  const destination = to ?? (user ? '/app' : '/');

  // Size mapping - increased 1.5-2x from original
  const sizeClasses = {
    sm: 'h-10',   // was h-6, now 40px
    md: 'h-12',   // was h-8, now 48px
    lg: 'h-14',   // was h-10, now 56px
    xl: 'h-16'    // was h-12, now 64px
  };

  return (
    <Link
      to={destination}
      aria-label="Go to main page"
      className={`relative inline-flex transition-opacity hover:opacity-90 ${className}`.trim()}
    >
      {/* Gradient overlay using CSS mask to apply gradient to logo shape */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r ${t.primary}`}
        style={{
          WebkitMaskImage: `url(${banbanLogo})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url(${banbanLogo})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />
      {/* Invisible image to maintain proper sizing and aspect ratio */}
      <img 
        src={banbanLogo} 
        alt="BanBan" 
        className={`${sizeClasses[size]} object-contain opacity-0`}
        style={{ pointerEvents: 'none' }}
      />
    </Link>
  );
}
