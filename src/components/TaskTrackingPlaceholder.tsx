import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Users, Calendar, ArrowRight, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { useClientTasks } from '../hooks/useClientTasks';
import { useClient } from '../contexts/ClientContext';

// Check if Monday.com is connected for this client
const isMondayConnected = (clientId: string): boolean => {
  if (!clientId) return false;
  
  // Check localStorage for connection state
  const storedConnection = localStorage.getItem(`monday_connected_${clientId}`);
  const storedTasks = localStorage.getItem(`monday_tasks_${clientId}`);
  
  return storedConnection === 'true' || (storedTasks && JSON.parse(storedTasks).length > 0);
};

const TaskTrackingPlaceholder: React.FC = () => {
  const { clientId } = useClient();
  const { tasks, summary, recentCompleted, isLoading, error, triggerSync } = useClientTasks(clientId);
  const [mondayConnected, setMondayConnected] = useState(false);

  // Check Monday.com connection status
  useEffect(() => {
    if (clientId) {
      setMondayConnected(isMondayConnected(clientId));
    }
  }, [clientId, tasks.length]); // Re-check when tasks change

  // Filter tasks for current month only (for dashboard display)
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const currentMonthTasks = tasks.filter(task => 
    task.date_created.startsWith(currentMonth) || 
    (task.date_completed && task.date_completed.startsWith(currentMonth))
  );

  // Show only recent tasks (last 5) for dashboard preview
  const recentTasks = currentMonthTasks.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSyncTasks = async () => {
    try {
      await triggerSync();
      // Update connection status after successful sync
      if (clientId) {
        localStorage.setItem(`monday_connected_${clientId}`, 'true');
        setMondayConnected(true);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Team Tasks This Month</h2>
            <p className="text-gray-600">Live progress from Monday.com workspace</p>
            {summary.total > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {summary.completed} of {summary.total} total tasks completed • {recentCompleted} completed recently
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncTasks}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>
          <div className="bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-green-800">Live Data</span>
          </div>
          <a 
            href="/team-tasks"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Tasks
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team tasks...</p>
        </div>
      )}

      {/* Current Month Tasks Preview */}
      {!isLoading && recentTasks.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentTasks.map((task) => (
              <div key={task.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  {getStatusIcon(task.status)}
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">{task.task_name}</h3>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>{task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {new Date(task.date_created).toLocaleDateString()}</span>
                  </div>
                  {task.date_completed && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed: {new Date(task.date_completed).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show more tasks indicator */}
          {currentMonthTasks.length > 5 && (
            <div className="text-center">
              <a
                href="/team-tasks"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View All {currentMonthTasks.length} Tasks This Month
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* No Tasks State */}
      {!isLoading && recentTasks.length === 0 && !error && mondayConnected && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No tasks found for this month</p>
          <p className="text-sm text-gray-400">Tasks will appear here as our team works on your projects</p>
          <div className="mt-4 space-y-3">
            <button
              onClick={handleSyncTasks}
              disabled={isLoading}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Sync Tasks'}
            </button>
          </div>
        </div>
      )}

      {/* Not Connected State */}
      {!isLoading && !mondayConnected && !error && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Monday.com not connected</p>
          <p className="text-sm text-gray-400">Connect your practice to view team tasks</p>
          <div className="mt-4">
            <a
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Connect in Settings
            </a>
          </div>
        </div>
      )}

      {/* Enhanced Feature Description */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 mt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ArrowRight className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-900 mb-2">Live Task Integration</h4>
            <div className="text-sm text-purple-800 space-y-2">
              <p>
                <strong>Real-Time Updates:</strong> {recentTasks.length > 0 ? 'Now active!' : 'Ready to sync!'} 
                Direct integration with Monday.com to show you real-time progress.
              </p>
              <p>
                <strong>Team Transparency:</strong> {summary.total > 0 ? `Currently tracking ${summary.total} tasks` : 'Track all team activities'} 
                with detailed progress and completion notifications.
              </p>
              <p>
                <strong>Monthly Focus:</strong> Dashboard shows current month tasks, with full history available in Team Tasks page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h5 className="font-medium text-blue-900 mb-1">Real-Time Updates</h5>
          <p className="text-xs text-blue-700">See progress as it happens</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h5 className="font-medium text-green-900 mb-1">Team Transparency</h5>
          <p className="text-xs text-green-700">Know who's working on what</p>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h5 className="font-medium text-purple-900 mb-1">Monthly Focus</h5>
          <p className="text-xs text-purple-700">Current month highlights</p>
        </div>
      </div>
    </div>
  );
};

export default TaskTrackingPlaceholder;