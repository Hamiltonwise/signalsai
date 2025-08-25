import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Plus, Send, FileText, Calendar, User, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { useClientTasks } from '../hooks/useClientTasks';
import { useServiceRequests } from '../hooks/useServiceRequests';
import { useClient } from '../contexts/ClientContext';

export default function TeamTasks() {
  const { clientId } = useClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    type: 'website_change' as const
  });

  // Use the new service requests hook
  const {
    serviceRequests,
    isLoading: isLoadingRequests,
    error: requestError,
    createServiceRequest,
    syncServiceRequests
  } = useServiceRequests(clientId);

  const {
    tasks,
    summary,
    recentCompleted,
    lastSyncTime,
    isLoading,
    error: tasksError,
    fetchTasks,
    triggerSync
  } = useClientTasks(clientId);

  // Generate month options from available tasks and requests
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    
    // Add months from tasks
    tasks.forEach(task => {
      const month = task.date_created.substring(0, 7); // YYYY-MM
      months.add(month);
      if (task.date_completed) {
        const completedMonth = task.date_completed.substring(0, 7);
        months.add(completedMonth);
      }
    });
    
    // Add months from service requests
    serviceRequests.forEach(request => {
      const month = request.created_at.substring(0, 7);
      months.add(month);
    });
    
    return Array.from(months).sort().reverse(); // Most recent first
  }, [tasks]);

  // Filter tasks based on selected month and status
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(task => 
        task.date_created.startsWith(selectedMonth) || 
        (task.date_completed && task.date_completed.startsWith(selectedMonth))
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    return filtered.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());
  }, [tasks, selectedMonth, selectedStatus]);

  // Filter service requests based on selected month and status
  const filteredServiceRequests = React.useMemo(() => {
    let filtered = serviceRequests;

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(request => 
        request.created_at.startsWith(selectedMonth)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [serviceRequests, selectedMonth, selectedStatus]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    setInfo(null);

    try {
      await createServiceRequest(newRequest);

      setInfo(`Service request "${newRequest.title}" created successfully on Monday.com!`);
      setNewRequest({ title: '', description: '', type: 'website_change' });
      setShowRequestForm(false);

      // Clear success message after 5 seconds
      setTimeout(() => setInfo(null), 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setInfo(`Error: ${error instanceof Error ? error.message : 'Failed to submit request'}`);
      setTimeout(() => setInfo(null), 5000);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleSyncTasks = async () => {
    try {
      await triggerSync();
      await syncServiceRequests(); // Also sync service requests
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
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

  const formatMonthLabel = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Team Tasks
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          Track team progress from Monday.com and submit service requests
        </p>
      </div>

      {/* Service Request Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Service Requests</h2>
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {showRequestForm && (
          <form onSubmit={handleSubmitRequest} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Title
                </label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of your request"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="website_change">Website Change</option>
                  <option value="promotion">Promotion/Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Provide detailed information about your request"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Error Display */}
        {requestError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{requestError}</p>
            </div>
          </div>
        )}

        {/* Service Requests List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Requests</h3>
          
          {isLoadingRequests && serviceRequests.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-blue-600 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Loading service requests...</p>
            </div>
          ) : filteredServiceRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {serviceRequests.length === 0 ? 'No service requests yet' : 'No requests match the selected filters'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredServiceRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {request.request_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                      <p className="text-xs text-gray-500">
                        Submitted {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusIcon(request.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Tasks from Monday.com */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Team Tasks from Monday.com</h2>
            <p className="text-sm text-gray-600">
              Tasks synchronized from our Monday.com workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastSyncTime && (
              <span className="text-xs text-gray-500">
                Last sync: {new Date(lastSyncTime).toLocaleString()}
              </span>
            )}
            <button
              onClick={handleSyncTasks}
              disabled={isLoadingRequests}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
             {isLoading ? 'Syncing...' : 'Sync All'}
            </button>
          </div>
        </div>

        {/* Filters */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        )}

        {/* Task Summary */}
        {summary.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-xs text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.in_progress}</div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{recentCompleted}</div>
              <div className="text-xs text-gray-600">Recent (30d)</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {tasksError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{tasksError}</p>
            </div>
          </div>
        )}

        {/* Info Display */}
        {info && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-600">{info}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && tasks.length === 0 && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
            <p className="text-gray-600">Loading tasks from Monday.com...</p>
          </div>
        )}
        
        {/* Tasks Grid */}
        {!isLoading && filteredTasks.length > 0 && (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{task.task_name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.airtable_data?.priority && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {task.airtable_data.priority} priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span><strong>Assignee:</strong> {task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span><strong>Created:</strong> {new Date(task.date_created).toLocaleDateString()}</span>
                  </div>
                  {task.date_completed && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span><strong>Completed:</strong> {new Date(task.date_completed).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Additional task details from Monday.com */}
                {task.airtable_data && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                      {task.airtable_data.board_name && (
                        <div>
                          <strong>Board:</strong> {task.airtable_data.board_name}
                        </div>
                      )}
                      {task.airtable_data.due_date && (
                        <div>
                          <strong>Due Date:</strong> {task.airtable_data.due_date}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTasks.length === 0 && !tasksError && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">
              {selectedMonth !== 'all' || selectedStatus !== 'all' 
                ? 'No tasks found for the selected filters'
                : 'No tasks found'
              }
            </p>
            <p className="text-sm text-gray-400">
              {tasks.length === 0 
                ? 'Tasks will appear here once they are synchronized from Monday.com'
                : 'Try adjusting your filters or sync for the latest updates'
              }
            </p>
            <div className="mt-4 space-y-2">
              <button
                onClick={handleSyncTasks}
                disabled={isLoading}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Syncing...' : 'Sync Tasks'}
              </button>
              {tasks.length === 0 && (
                <p className="text-xs text-gray-500">
                  Make sure your practice is connected in Settings → API Connections
                </p>
              )}
            </div>
          </div>
        )}

        {/* Connection Status */}
        {tasks.length === 0 && !isLoading && !tasksError && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Monday.com Integration</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Connect your practice in Settings to start seeing team tasks here.
                </p>
                <a
                  href="/settings"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                  Go to Settings
                  <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}