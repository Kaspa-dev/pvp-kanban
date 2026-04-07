import { Link } from 'react-router';
import { LayoutGrid, Zap, Filter, Palette, ArrowRight } from 'lucide-react';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { BanBanLogo } from '../components/BanBanLogo';

export function Landing() {
  const { theme, isDarkMode } = useTheme();
  const t = getThemeColors(theme, isDarkMode);

  return (
    <div className={`min-h-screen ${t.bg}`}>
      <header className={`border-b-2 ${t.border}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BanBanLogo size="lg" />
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className={`px-4 py-2 ${t.textSecondary} font-medium hover:${t.text} transition-colors`}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className={`px-5 py-2 bg-gradient-to-r ${t.primary} text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className={`text-5xl md:text-6xl font-bold ${t.text} mb-6`}>
            Level up your productivity
            <br />
            <span className={`bg-gradient-to-r ${t.primary} bg-clip-text text-transparent`}>
              with playful gamification
            </span>
          </h2>
          <p className={`text-xl ${t.textSecondary} mb-10 max-w-3xl mx-auto`}>
            BanBan combines powerful kanban boards with XP leveling and story points.
            Organize tasks, earn rewards, and make productivity fun.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className={`px-8 py-4 bg-gradient-to-r ${t.primary} text-white font-bold text-lg rounded-xl hover:scale-105 transition-all shadow-xl flex items-center gap-2`}
            >
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className={`px-8 py-4 border-2 ${t.border} ${t.text} font-bold text-lg rounded-xl hover:${t.bgSecondary} transition-all`}
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className={`py-20 px-6 ${t.bgSecondary}`}>
        <div className="max-w-6xl mx-auto">
          <h3 className={`text-3xl font-bold text-center ${t.text} mb-12`}>
            Everything you need to stay organized
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>Multiple views</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Switch between Board, List, and Backlog views to match your workflow.
              </p>
            </div>

            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>XP & Levels</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Earn XP for completing tasks. Level up and unlock unique rank titles.
              </p>
            </div>

            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <Filter className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>Smart filters</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Search, filter by labels, assignee, or due date to find tasks instantly.
              </p>
            </div>

            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>Beautiful themes</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Choose from 5 themes to personalize your workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className={`text-3xl font-bold text-center ${t.text} mb-12`}>
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                1
              </div>
              <h4 className={`text-xl font-bold ${t.text} mb-3`}>Create tasks</h4>
              <p className={t.textSecondary}>
                Add tasks with descriptions, labels, story points, and assign them to team members.
              </p>
            </div>

            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                2
              </div>
              <h4 className={`text-xl font-bold ${t.text} mb-3`}>Organize & track</h4>
              <p className={t.textSecondary}>
                Drag and drop tasks between columns. Use filters to focus on what matters.
              </p>
            </div>

            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                3
              </div>
              <h4 className={`text-xl font-bold ${t.text} mb-3`}>Level up</h4>
              <p className={t.textSecondary}>
                Complete tasks to earn XP, level up, and unlock achievement ranks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-20 px-6 bg-gradient-to-r ${t.primary}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to boost your productivity?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Join BanBan today and start leveling up your task management.
          </p>
          <Link
            to="/register"
            className={`inline-block px-8 py-4 ${t.isDark ? 'bg-gray-900' : 'bg-white'} ${t.text} font-bold text-lg rounded-xl hover:scale-105 transition-all shadow-xl`}
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className={`border-t-2 ${t.border} py-12 px-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className={`text-xl font-bold bg-gradient-to-r ${t.primary} bg-clip-text text-transparent mb-4`}>
                BanBan
              </h4>
              <p className={`${t.textSecondary} text-sm`}>
                Productivity meets playful gamification.
              </p>
            </div>
            <div>
              <h5 className={`font-bold ${t.text} mb-3`}>Product</h5>
              <ul className="space-y-2">
                <li><span className={`${t.textSecondary} text-sm`}>Features</span></li>
                <li><span className={`${t.textSecondary} text-sm`}>Pricing</span></li>
                <li><span className={`${t.textSecondary} text-sm`}>FAQ</span></li>
              </ul>
            </div>
            <div>
              <h5 className={`font-bold ${t.text} mb-3`}>Company</h5>
              <ul className="space-y-2">
                <li><span className={`${t.textSecondary} text-sm`}>About</span></li>
                <li><span className={`${t.textSecondary} text-sm`}>Blog</span></li>
                <li><span className={`${t.textSecondary} text-sm`}>Careers</span></li>
              </ul>
            </div>
            <div>
              <h5 className={`font-bold ${t.text} mb-3`}>Legal</h5>
              <ul className="space-y-2">
                <li><span className={`${t.textSecondary} text-sm`}>Privacy</span></li>
                <li><span className={`${t.textSecondary} text-sm`}>Terms</span></li>
                <li><span className={`${t.textSecondary} text-sm`}>Security</span></li>
              </ul>
            </div>
          </div>
          <div className={`border-t-2 ${t.border} pt-8 text-center ${t.textSecondary} text-sm`}>
            Copyright 2026 BanBan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
