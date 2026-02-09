import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimation } from '../contexts/AnimationContext';
import { Task, TaskProgress, TasksState, TaskData } from '../types/api';
import { apiClient } from '../config/api';
import { createEventSource } from '../config/ess';

export const useTasks = () => {
  const [state, setState] = useState<TasksState>({
    tasks: [],
    loading: true,
    error: null,
    deletionError: null,
    cancellingIds: [],
    isDeleting: false
  });

  const progressStreamsRef = useRef<Map<string, EventSource>>(new Map());
  const navigate = useNavigate();
  const { setAnimationType } = useAnimation();

  const updateState = useCallback((updates: Partial<TasksState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startProgressStream = useCallback((taskId: string) => {
    const existingStream = progressStreamsRef.current.get(taskId);
    if (existingStream) {
      existingStream.close();
    }

    const eventSource = createEventSource(`/generate-stream/${taskId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const progressData: TaskProgress = JSON.parse(event.data);
        
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task => 
            task.taskId === taskId 
              ? { ...task, progress: progressData.progress, status: progressData.status }
              : task
          )
        }));
        
        if (progressData.status === 'completed' || progressData.status === 'failed' || progressData.status === 'cancelled') {
          eventSource.close();
          progressStreamsRef.current.delete(taskId);
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`EventSource failed for task ${taskId}:`, error);
      eventSource.close();
      progressStreamsRef.current.delete(taskId);
    };

    progressStreamsRef.current.set(taskId, eventSource);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      updateState({ error: null, deletionError: null });
      const response = await apiClient.get(`/tasks`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      
      const data: Record<string, TaskData> = response.data.tasks;
      const newTasks: Task[] = Object.entries(data).map(([id, taskData]) => {
        return {
          ...taskData,
          taskId: taskData.task_id,
        };
      }).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; 
      });
      
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          tasks: newTasks,
          loading: false
        }));
        
        newTasks.forEach(task => {
          if (task.status === 'processing' || task.status === 'pending') {
            startProgressStream(task.taskId);
          }
        });
      }, 1000);
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'An unknown error occurred',
        loading: false
      });
    } 
  }, [startProgressStream, updateState]);

  const handleCancel = useCallback(async (taskId: string) => {
    try {
      updateState({ cancellingIds: [...state.cancellingIds, taskId] });
      
      const response = await apiClient.post(`/cancel-generation`, { 
        task_id: taskId
      });
      
      if (response.status === 200 && response.data.status === 'success') {
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task => 
            task.taskId === taskId 
              ? { ...task, status: 'cancelled' }
              : task
          )
        }));
        
        const stream = progressStreamsRef.current.get(taskId);
        if (stream) {
          stream.close();
          progressStreamsRef.current.delete(taskId);
        }
      } else {
        updateState({ error: response.data.error || 'Cancellation failed' });
      }
    } catch (error: any) {   
      updateState({ error: error.response?.data?.error || 'Cancellation failed' });
    } finally {
      setState(prev => ({
        ...prev,
        cancellingIds: prev.cancellingIds.filter(id => id !== taskId)
      }));
    }
  }, [state.cancellingIds, updateState]);

  const refreshTaskProgress = useCallback((taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    startProgressStream(taskId);
  }, [startProgressStream]);

  const deleteTasks = useCallback(async () => {
    updateState({ isDeleting: true, deletionError: null });
    
    try {
      const response = await apiClient.delete(`/delete-tasks`);
      if (response.status !== 200) {
        throw new Error(`Failed to delete tasks: ${response.status} ${response.statusText}`);
      } 
      fetchTasks();
    } catch (err) {
      updateState({
        deletionError: err instanceof Error ? err.message : 'An unknown error occurred',
        isDeleting: false
      });
    } finally {
      updateState({ isDeleting: false });
    }
  }, [fetchTasks, updateState]);

  const handleNavigate = useCallback((path: string) => {
      setAnimationType('fadeIn');
      navigate(path);
  }, [navigate, setAnimationType]);

  useEffect(() => {
    return () => {
      progressStreamsRef.current.forEach((stream) => {
        stream.close();
      });
      progressStreamsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    fetchTasks,
    handleCancel,
    refreshTaskProgress,
    deleteTasks,
    handleNavigate,
    ...state
  };
};