import axios from "axios";
import env from "../utils/env";

const API_BASE_URL = env.isProduction 
  ? env.apiBaseUrl  
  : 'http://127.0.0.1:8000';  

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// apiClient.interceptors.request.use(async (config) => {
//   // Only cache GET requests
//   if (config.method === 'get') {
//     const cacheKey = `${config.method}-${config.url}`;
//     const cachedData = cacheService.get(cacheKey);
    
//     if (cachedData) {
//       // Return cached data by rejecting the request with cached data
//       return Promise.reject({
//         config,
//         isCached: true,
//         data: cachedData
//       });
//     }
//   }
//   return config;
// });

// apiClient.interceptors.response.use(
//   (response) => {
//     // Cache successful GET responses
//     if (response.config.method === 'get') {
//       const cacheKey = `${response.config.method}-${response.config.url}`;
//       cacheService.set(cacheKey, response.data);
//     }
//     return response;
//   },
//   (error) => {
//     // Return cached data if available
//     if (error.isCached) {
//       return Promise.resolve({
//         data: error.data,
//         config: error.config,
//         isCached: true
//       });
//     }
//     return Promise.reject(error);
//   }
// );