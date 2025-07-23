// src/components/SyncStatus.jsx
import React from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const SyncStatus = ({ status, message, progress }) => {
  if (status === 'idle') return null;

  const statusConfig = {
    syncing: {
      icon: RefreshCw,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      iconClass: 'animate-spin'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconClass: ''
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      iconClass: ''
    }
  };

  const config = statusConfig[status] || statusConfig.syncing;
  const Icon = config.icon;

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg max-w-sm animate-slide-up`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${config.textColor} ${config.iconClass}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {status === 'syncing' && 'Syncing GitHub Data...'}
            {status === 'success' && 'Sync Complete!'}
            {status === 'error' && 'Sync Failed'}
          </p>
          {message && (
            <p className="text-xs text-gray-600 mt-1">{message}</p>
          )}
          {progress && status === 'syncing' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;
