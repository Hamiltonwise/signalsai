import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Star,
  Mail,
  Upload, 
  Settings, 
  Activity,
  Search,
  Globe,
  MapPin,
  MousePointer,
  ArrowRight,
  Heart
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'Team Tasks', path: '/team-tasks', icon: Users },
    { name: 'Reviews', path: '/reviews', icon: Star },
    { name: 'Newsletter', path: '/newsletter', icon: Mail },
    { name: 'Upload Data', path: '/upload', icon: Upload },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const patientJourneySteps = [
    { name: 'Awareness', icon: Search, color: 'text-purple-500' },
    { name: 'Research', icon: Globe, color: 'text-blue-500' },
    { name: 'Consideration', icon: MapPin, color: 'text-orange-500' },
    { name: 'Decision', icon: MousePointer, color: 'text-green-500' },
    { name: 'Loyalty', icon: Heart, color: 'text-red-500' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Signals</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="px-4 py-6 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Patient Journey
        </h3>
        <div className="space-y-2">
          {patientJourneySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.name} className="flex items-center">
                <Icon className={`w-4 h-4 ${step.color} mr-2`} />
                <span className="text-sm text-gray-600">{step.name}</span>
                {index < patientJourneySteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-300 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};