import React from 'react';
import { Plus, Calendar, User, Clock, CheckCircle, AlertCircle, Circle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export const TeamTasks: React.FC = () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Update Google Business Profile',
      description: 'Add holiday hours and new services',
      assignee: 'Sarah Johnson',
      dueDate: '2024-01-15',
      status: 'todo',
      priority: 'high',
      category: 'Marketing'
    },
    {
      id: '2',
      title: 'Respond to Recent Reviews',
      description: 'Reply to 5 new Google reviews from this week',
      assignee: 'Mike Chen',
      dueDate: '2024-01-12',
      status: 'in-progress',
      priority: 'medium',
      category: 'Customer Service'
    },
    {
      id: '3',
      title: 'Schedule Social Media Posts',
      description: 'Create content calendar for next month',
      assignee: 'Lisa Wang',
      dueDate: '2024-01-18',
      status: 'completed',
      priority: 'medium',
      category: 'Marketing'
    },
    {
      id: '4',
      title: 'Analyze Website Performance',
      description: 'Review GA4 data and create improvement recommendations',
      assignee: 'David Rodriguez',
      dueDate: '2024-01-20',
      status: 'todo',
      priority: 'low',
      category: 'Analytics'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed')
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Tasks</h1>
          <p className="text-gray-600">Manage your practice's digital marketing tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Circle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">To Do</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus.todo.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus['in-progress'].length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus.completed.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div key={status} className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4 capitalize">
              {status === 'in-progress' ? 'In Progress' : status}
            </h3>
            <div className="space-y-3">
              {statusTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    {getStatusIcon(task.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span>{task.assignee}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {task.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};