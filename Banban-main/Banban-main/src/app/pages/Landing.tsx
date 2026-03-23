import { Link } from 'react-router';
import { LayoutGrid, Zap, Filter, Palette, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { BanBanLogo } from '../components/BanBanLogo';

export function Landing() {
  const { theme, isDarkMode } = useTheme();
  const t = getThemeColors(theme, isDarkMode);

  return (
    <div className={`min-h-screen ${t.bg}`}>
      {/* Header */}
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

      {/* Hero Section */}
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

      {/* Features Section */}
      <section className={`py-20 px-6 ${t.bgSecondary}`}>
        <div className="max-w-6xl mx-auto">
          <h3 className={`text-3xl font-bold text-center ${t.text} mb-12`}>
            Everything you need to stay organized
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>Multiple views</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Switch between Board, List, and Backlog views to match your workflow.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>XP & Levels</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Earn XP for completing tasks. Level up and unlock unique rank titles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <Filter className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>Smart filters</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Search, filter by labels, assignee, or due date to find tasks instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`${t.cardBg} rounded-2xl p-6 border-2 ${t.border} shadow-sm hover:shadow-lg transition-shadow`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${t.primary} rounded-xl flex items-center justify-center mb-4`}>
                <Palette className="w-6 h-6 text-white" />
              </div>
              <h4 className={`text-lg font-bold ${t.text} mb-2`}>Beautiful themes</h4>
              <p className={`${t.textSecondary} text-sm`}>
                Choose from 6 stunning themes to personalize your workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className={`text-3xl font-bold text-center ${t.text} mb-12`}>
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                1
              </div>
              <h4 className={`text-xl font-bold ${t.text} mb-3`}>Create tasks</h4>
              <p className={t.textSecondary}>
                Add tasks with descriptions, labels, story points, and assign them to team members.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${t.primary} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                2
              </div>
              <h4 className={`text-xl font-bold ${t.text} mb-3`}>Organize & track</h4>
              <p className={t.textSecondary}>
                Drag and drop tasks between columns. Use filters to focus on what matters.
              </p>
            </div>

            {/* Step 3 */}
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

      {/* CTA Section */}
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

      {/* Footer */}
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
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Features</a></li>
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Pricing</a></li>
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>FAQ</a></li>
              </ul>
            </div>
            <div>
              <h5 className={`font-bold ${t.text} mb-3`}>Company</h5>
              <ul className="space-y-2">
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>About</a></li>
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Blog</a></li>
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Careers</a></li>
              </ul>
            </div>
            <div>
              <h5 className={`font-bold ${t.text} mb-3`}>Legal</h5>
              <ul className="space-y-2">
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Privacy</a></li>
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Terms</a></li>
                <li><a href="#" className={`${t.textSecondary} hover:${t.text} text-sm transition-colors`}>Security</a></li>
              </ul>
            </div>
          </div>
          <div className={`border-t-2 ${t.border} pt-8 text-center ${t.textSecondary} text-sm`}>
            © 2026 BanBan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}