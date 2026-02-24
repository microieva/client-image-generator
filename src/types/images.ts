export interface ImageItem {
  task_id: string;
  prompt: string;
  image_url: string;
  model_used: string;
  created_at?:string
}

export interface ImagesResponse {
  length: number;
  slice: ImageItem[];
}

export interface ImagesPagination {
  page: number;
  limit: number;
}