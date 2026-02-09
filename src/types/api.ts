export interface GenerationState {
    loading: boolean
    error: string
    progress: number
    taskId: string | null
    cancelled: boolean
    status: string
    prompt_str?: string | undefined
    message?: string 
    result?: GenerationResult
}

export interface GenerationStatus {
    task_id: string
    status: string // 'pending', 'processing', 'completed', 'cancelled', 'error'
    progress?: number
    created_at: string
    started_at?: string
    completed_at?: string
    cancelled_at?: string
    result?: GenerationResult
    error?: string
    prompt?:string
}
export interface GenerationResult {
    task_id: string 
    total_inference_time: string
    image: string 
    prompt: string 
}
export interface StreamEvent { 
    event?:string
    task_id: string
    status: string
    progress: number
    message?: string
    result?: GenerationResult 
    error?: string
}

export interface Task {
  taskId: string;
  task_id?: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
}

export interface TaskData {
  task_id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
}

export interface TaskProgress {
  taskId: string;
  progress: number;
  status: Task['status'];
}