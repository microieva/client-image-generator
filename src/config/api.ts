import axios from "axios";
import env from "../utils/env";

const API_BASE_URL = env.isProduction 
  ? env.apiBaseUrl  
  : 'http://127.0.0.1:8000';  

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
