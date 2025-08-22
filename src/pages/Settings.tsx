import React from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Bell, 
  User, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'error' | 'disconnected';
  icon: string;
  lastSync?: string;
}

export const Settings: React.FC = () => {
  const integrations: Integration[] = [
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      description: 'Website traffic and user behavior analytics',
      status: 'connected',
      icon: '📊',
      lastSync: '2 minutes ago'
    },
    {
      id: 'gbp',
      name: 'Google Business Profile',
      description: 'Local search presence and reviews',
      status: 'connected',
      icon: '🗺️',
      lastSync: '5 minutes ago'
    },
    {
      id: 'gsc',
      name: 'Google Search Console',
      description: 'Search performance and keyword rankings',
      status: 'error',
      icon: '🔍',
      lastSync: '2 hours ago'
    },
    {
      id: 'clarity',
      name: 'Microsoft Clarity',
      description: 'User session recordings and heatmaps',
      status: 'connected',
      icon: '📹',
      lastSync: '10 minutes ago'
    },
    {
      id: 'monday',
      name: 'Monday.com',
      description: 'Task management and team collaboration',
      status: 'disconnected',
      icon: '📋'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your integrations and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Integrations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">API Integrations</h2>
              </div>
              <p className="text-gray-600 mt-1">Connect your tools for comprehensive insights</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {integrations.map((integration) => (
                <div key={integration.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(integration.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                    </div>
                  </div>
                  
                  {integration.lastSync && (
                    <p className="text-xs text-gray-500 mb-3">Last synced: {integration.lastSync}</p>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {integration.status === 'connected' ? (
                      <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Configure
                      </button>
                    ) : (
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Connect
                      </button>
                    )}
                    
                    {integration.status !== 'disconnected' && (
                      <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Profile Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
                <input
                  type="text"
                  defaultValue="Smile Dental Care"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="dr.smith@smiledental.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            
            <div className="space-y-3">
              {[
                'Weekly performance reports',
                'New review alerts',
                'Task reminders',
                'System updates'
              ].map((notification) => (
                <label key={notification} className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">{notification}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Security</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Change Password
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Two-Factor Authentication
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                API Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};