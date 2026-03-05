import { useState, useRef, useCallback, useEffect } from 'react';
import axios, { AxiosResponse, type CancelTokenSource } from 'axios';
import type { GenerationResult, GenerationState, GenerationStatus, StreamEvent } from '../types/api';
import { apiClient } from '../config/api';
import { createEventSource } from '../config/ess';

export const useCancellableGeneration = (id?:string) => {
    const [state, setState] = useState<GenerationState>({
        loading: Boolean(id),
        error: '',
        progress: 0,
        taskId: id || null,
        cancelled: false,
        status: '',
        message: undefined,
        prompt_str: id ? '':undefined,
        result: undefined
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const cancelTokenSource = useRef<CancelTokenSource | null>(null);
    
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    useEffect(()=> {
        id && getProgress() 
        id && getStream()
    }, [id])

    const generate = useCallback(async (prompt: string, model:string): Promise<string | null> => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        if (cancelTokenSource.current) {
            cancelTokenSource.current.cancel('New generation started');
        }

        cancelTokenSource.current = axios.CancelToken.source();

        try {
            const response = await apiClient.post(
                `/generate`,
                { prompt, model },
                {
                    cancelToken: cancelTokenSource.current.token
                }
            );

            const taskId = response.data.task_id;    
            setState(prev => ({ 
                ...prev, 
                taskId,
                status: 'pending'
            }));

            return taskId;

        } catch (error: any) {
            if (axios.isCancel(error)) {
                setState(prev => ({ 
                    ...prev, 
                    loading: false, 
                    cancelled: true,
                    status: 'cancelled'
                }));
            } else {
                setState(prev => ({ 
                    ...prev, 
                    loading: false, 
                    error: error.message || 'Generation failed',
                    status: 'error'
                }));
            }
            return null;
        }
    }, []);

    const generateWithSSE = useCallback(async (prompt: string, model:string): Promise<GenerationResult | null> => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        const task_id = await generate(prompt, model);

        if (!task_id) {
            setState(prev => ({ ...prev, loading: false, error: 'Failed to start generation' }));
            return null;
        }

        if (task_id) {
            
            return new Promise(() => {      
                eventSourceRef.current = createEventSource(`/generate-stream/${task_id}`);
    
                eventSourceRef.current.onmessage = (event) => {
                    try {
                        const data: StreamEvent = JSON.parse(event.data);
                        if (data.event === "connected") {
                            setState(prev => ({
                                ...prev,
                                loading:true,
                                message:data.message
                            }))

                        }
                        
                        if (data && data.progress) {
                            setState(prev => {
                                if (prev.progress === data.progress) {
                                    return prev;
                                }
                                const event = {
                                    ...prev,
                                    progress: data.progress,
                                    status: data.status,
                                    cancelled: data.status === 'cancelled',
                                    error: data.error || prev.error,
                                    message: data.message
                                }
                                return event;
                            })
                        }
    
                        if (data.status === 'completed' && data.result) {
                            if (eventSourceRef.current) {
                                eventSourceRef.current.close();
                            }
                            setState(prev => ({ 
                                ...prev, 
                                status: data.status,
                                result: data.result, 
                                loading: false 
                            }));
                        }   
                    } catch (error) {
                        console.error('Error parsing SSE data:', error);
                    }
                };

                eventSourceRef.current.onerror = () => {
                    if (eventSourceRef.current) {
                        eventSourceRef.current.close();
                    }
                    setState(prev => ({ 
                        ...prev,  
                        status: 'error',   
                        loading: false, 
                        error: 'Connection failed'
                    }));
                };
            });
        } else {
            return null;
        }
    }, []);

    const cancel = useCallback(async () => {
        if (!state.taskId) {
            setState(prev => ({ 
                ...prev, 
                cancelled: true, 
                loading: false,
                status: 'cancelled'
            }));
            return;
        }

        try {
            const response = await apiClient.post(`/cancel-generation/${state.taskId}`);
            if (response.status === 200 && response.data.status === 'success') {
                setState(prev => ({ 
                    ...prev, 
                    cancelled: true, 
                    loading: false,
                    status: 'cancelled'
                }));
            } else {
                setState(prev => ({ 
                    ...prev, 
                    error: response.data.error || 'Cancellation failed' 
                }));
            }
        } catch (error: any) {
            setState(prev => ({ 
                ...prev, 
                error: error.response?.data?.error || 'Cancellation failed' 
            }));
        }
    }, [state.taskId]);

    const reset = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (cancelTokenSource.current) {
            cancelTokenSource.current.cancel('Reset');
        }

        setState({
            loading: false,
            error: '',
            progress: 0,
            taskId: null,
            cancelled: false,
            status: 'pending',
        });
    }, []);

    const getProgress = useCallback(async () => {
        try {
            const response:AxiosResponse<GenerationStatus> = await apiClient.get(`/status/${id}`);

            if (response.status === 200) {
                setState(prev => ({ 
                    ...prev,
                    loading: Boolean(id),
                    progress: response.data.progress || state.progress,
                    cancelled: Boolean(response.data.cancelled_at),
                    status: response.data.status,
                    prompt_str: response.data.prompt
                }));
            } else {
                setState(prev => ({ 
                    ...prev, 
                    error: response.data.error || 'Generation failed' 
                }));
            }
        } catch (error: any) {
            setState(prev => ({ 
                ...prev, 
                error: error.response?.data?.error || 'Unfortunately, generation failed..' 
            }));
        }
    },[id])

    const getStream = useCallback(async()=> {
         if (id) {
            return new Promise<GenerationResult | null>((resolve) => {      
                eventSourceRef.current = createEventSource(`/generate-stream/${id}`);
    
                eventSourceRef.current.onmessage = (event) => {
                    try {
                        const data: StreamEvent = JSON.parse(event.data);

                        if (data) {
                            setState(prev => {
                                if (prev.progress === data.progress) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    taskId: data.task_id,
                                    progress: data.progress,
                                    status: data.status,
                                    cancelled: data.status === 'cancelled',
                                    error: data.error || prev.error
                                }});
                        }
    
                        if (data.status === 'completed' && data.result) {
                            if (eventSourceRef.current) {
                                eventSourceRef.current.close();
                            }
                            setState(prev => ({ ...prev, loading: false }));
                            resolve(data.result);
                        }
    
                    } catch (error) {
                        console.error('Error parsing SSE data:', error);
                    }
                };
    
                eventSourceRef.current.onerror = (error) => {
                    console.error('SSE connection error:', error);
                    if (eventSourceRef.current) {
                        eventSourceRef.current.close();
                    }
                    setState(prev => ({ 
                        ...prev, 
                        loading: false, 
                        error: 'Connection failed 2' 
                    }));
                    resolve(null);
                };
            });
        } else {
            return null;
        }
    }, [id])

    return {
        getStream,
        generate: generateWithSSE, 
        cancel,
        reset,
        ...state,
    };
};
