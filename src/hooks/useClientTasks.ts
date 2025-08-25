import { useState, useEffect } from 'react';
import { useAuthReady } from './useAuthReady';
import { useClient } from '../contexts/ClientContext';
import { authFetch } from '../lib/authFetch';

interface ClientTask {
  id: string;
  task_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'done' | 'cancelled';
  date_created: string;
  date_completed?: string;
  assignee: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

interface TaskSummary {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  cancelled: number;
}

interface UseClientTasksReturn {
  tasks: ClientTask[];
  summary: TaskSummary;
  recentCompleted: number;
  lastSyncTime: string | null;
  isLoading: boolean;
  error: string | null;
  fetchTasks: (filters?: { status?: string; limit?: number }) => Promise<void>;
  triggerSync: () => Promise<void>;
}

export const useClientTasks = (clientId: string): UseClientTasksReturn => {
  const { ready, session } = useAuthReady();
  const { clientId: contextClientId } = useClient();
  const effectiveClientId = clientId || contextClientId;
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [summary, setSummary] = useState<TaskSummary>({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    cancelled: 0
  });
  const [recentCompleted, setRecentCompleted] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Load persisted data on mount
  useEffect(() => {
    if (effectiveClientId) {
      const storedTasks = localStorage.getItem(`monday_tasks_${effectiveClientId}`);
      const storedSummary = localStorage.getItem(`monday_summary_${effectiveClientId}`);
      const storedLastSync = localStorage.getItem(`monday_last_sync_${effectiveClientId}`);
      
      if (storedTasks) {
        try {
          const parsedTasks = JSON.parse(storedTasks);
          setTasks(parsedTasks);
          console.log('Loaded persisted tasks:', parsedTasks.length);
        } catch (err) {
          console.error('Error parsing stored tasks:', err);
        }
      }
      
      if (storedSummary) {
        try {
          const parsedSummary = JSON.parse(storedSummary);
          setSummary(parsedSummary);
        } catch (err) {
          console.error('Error parsing stored summary:', err);
        }
      }
      
      if (storedLastSync) {
        setLastSyncTime(storedLastSync);
      }
    }
  }, [effectiveClientId]);

  // Persist data whenever it changes
  useEffect(() => {
    if (effectiveClientId && tasks.length > 0) {
      localStorage.setItem(`monday_tasks_${effectiveClientId}`, JSON.stringify(tasks));
      console.log('Persisted tasks to localStorage:', tasks.length);
    }
  }, [effectiveClientId, tasks]);

  useEffect(() => {
    if (effectiveClientId && summary.total > 0) {
      localStorage.setItem(`monday_summary_${effectiveClientId}`, JSON.stringify(summary));
    }
  }, [effectiveClientId, summary]);

  useEffect(() => {
    if (effectiveClientId && lastSyncTime) {
      localStorage.setItem(`monday_last_sync_${effectiveClientId}`, lastSyncTime);
    }
  }, [effectiveClientId, lastSyncTime]);

  const fetchTasks = async (filters?: { status?: string; limit?: number }) => {
    // Gate all fetches behind auth readiness
    if (!ready || !session || !effectiveClientId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validate environment variables
      if (!SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL environment variable is not set');
      }
      
      if (!SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set');
      }

      let url = `get-client-tasks?clientId=${encodeURIComponent(effectiveClientId)}`;
      
      if (filters?.status) {
        url += `&status=${encodeURIComponent(filters.status)}`;
      }
      
      if (filters?.limit) {
        url += `&limit=${filters.limit}`;
      }

      const response = await authFetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setTasks(data.data.tasks);
        setSummary(data.data.summary);
        setRecentCompleted(data.data.recentCompleted);
        setLastSyncTime(data.data.lastSyncTime);
        
        // Calculate recent completed from the data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = data.data.tasks.filter(task => 
          (task.status === 'completed' || task.status === 'done') && 
          task.date_completed && 
          new Date(task.date_completed) >= thirtyDaysAgo
        ).length;
        setRecentCompleted(recentCount);
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

    } catch (err) {
      console.error('Error fetching client tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Triggering Monday.com sync...');

      const response = await authFetch('monday-fetch-tasks', {
        method: 'POST',
        body: JSON.stringify({ clientId: effectiveClientId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('Sync result:', result);

      // Refresh tasks after sync
      await fetchTasks();
      
      // Update last sync time
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);

      return result;
    } catch (err) {
      console.error('Error triggering sync:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch tasks when clientId changes
  useEffect(() => {
    if (effectiveClientId && ready && session) {
      fetchTasks();
    }
  }, [effectiveClientId, ready, session]);

  return {
    tasks,
    summary,
    recentCompleted,
    lastSyncTime,
    isLoading,
    error,
    fetchTasks,
    triggerSync
  };
};