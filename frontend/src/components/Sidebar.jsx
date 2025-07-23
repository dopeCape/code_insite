import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Brain,
  Code2,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Github
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: BarChart3,
      description: 'Dashboard summary'
    },
    {
      name: 'Languages',
      href: '/dashboard/languages',
      icon: Code2,
      description: 'Language proficiency'
    },
    {
      name: 'Patterns',
      href: '/dashboard/patterns',
      icon: TrendingUp,
      description: 'Development patterns'
    },
    {
      name: 'Career Insights',
      href: '/dashboard/career',
      icon: Brain,
      description: 'AI career analysis'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <div className="p-2 bg-primary-600 rounded-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">CodeInsight AI</h1>
          <p className="text-xs text-gray-500">Analytics Platform</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar_url}
            alt={user?.name}
            className="w-10 h-10 rounded-full border-2 border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || user?.login}
            </p>
            <p className="text-xs text-gray-500 truncate">
              @{user?.login}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={clsx(
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={clsx(
                'w-5 h-5 transition-colors duration-200',
                isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className={clsx(
                  'text-xs',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}>{item.description}</div>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200 w-full">
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </button>

        <a
          href={`https://github.com/${user?.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200 w-full"
        >
          <Github className="w-5 h-5 text-gray-400" />
          View GitHub
        </a>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-800 rounded-lg transition-colors duration-200 w-full"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
