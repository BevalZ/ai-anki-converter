import { Home, Edit, Download, Settings, Brain, Moon, Sun, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/store/useAppStore';

const navigationItems = [
  { path: '/', labelKey: 'home', icon: Home },
  { path: '/editor', labelKey: 'cardEditor', icon: Edit },
  { path: '/export', labelKey: 'export', icon: Download },
  { path: '/settings', labelKey: 'settings', icon: Settings },
] as const;

export default function Navigation() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { bucketCards, isBucketVisible, toggleBucketVisible } = useAppStore();
  
  const bucketCount = bucketCards.length;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('appTitle')}</h1>
        </div>
        
        <div className="flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          
          {/* Bucket Toggle Button - only show when bucket has cards and is hidden */}
          {bucketCount > 0 && !isBucketVisible && (
            <button
              onClick={toggleBucketVisible}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('showExportBucket')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {bucketCount}
              </span>
            </button>
          )}
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}