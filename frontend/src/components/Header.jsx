import React from 'react';
import { Calendar, GitBranch, Star, Users } from 'lucide-react';

const Header = ({ user, overviewData }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = overviewData?.stats || {};

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* User Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || user?.login}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your GitHub analytics overview
            {overviewData?.user?.created_at && (
              <span className="ml-2 text-sm">
                • Member since {formatDate(overviewData.user.created_at)}
              </span>
            )}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <GitBranch className="w-4 h-4" />
              <span>Repositories</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.totalRepositories || 0}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="w-4 h-4" />
              <span>Stars</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.totalStars || 0}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Followers</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {user?.followers || 0}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Commits</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.totalCommits || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="lg:hidden mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GitBranch className="w-4 h-4" />
            <span>Repositories</span>
          </div>
          <div className="text-xl font-semibold text-gray-900 mt-1">
            {stats.totalRepositories || 0}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Star className="w-4 h-4" />
            <span>Total Stars</span>
          </div>
          <div className="text-xl font-semibold text-gray-900 mt-1">
            {stats.totalStars || 0}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
