import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://zacaplace.vercel.app';

interface RequestOptions extends RequestInit {
  token?: string; // Optional token to override the one from AsyncStorage
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Função auxiliar para fazer a requisição fetch
async function fetchApi<T>(
  endpoint: string,
  method: string,
  body?: any,
  options?: Omit<RequestOptions, 'token'> // options pode conter um token
): Promise<ApiResponse<T>> {
  // O token é obtido aqui, então não precisa ser passado explicitamente em cada chamada apiClient.get/post
  const token = await AsyncStorage.getItem('userToken');

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    method,
    headers,
    // Não sobrescrever o body aqui se já foi definido
    ...(options || {}), 
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let mobileEndpoint = endpoint;
  if (endpoint.startsWith('/api/')) {
    mobileEndpoint = '/api/mobile' + endpoint.substring(4);
  }

  const response = await fetch(`${API_BASE_URL}${mobileEndpoint}`, config);

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorStatus = response.status;
    const errorMessage = responseData.message || responseData.error || response.statusText || 'Something went wrong';
    console.error(`[API Error] ${method} ${mobileEndpoint} - Status ${errorStatus}:`, responseData);
    throw new ApiError(errorMessage, errorStatus, responseData);
  }

  return {
    data: responseData as T,
    status: response.status,
    message: responseData.message,
  };
}

// apiClient com métodos HTTP específicos
export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'token'>) =>
    fetchApi<T>(endpoint, 'GET', undefined, options),

  post: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'token'>) =>
    fetchApi<T>(endpoint, 'POST', body, options),

  put: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'token'>) =>
    fetchApi<T>(endpoint, 'PUT', body, options),

  patch: <T>(endpoint: string, body: any, options?: Omit<RequestOptions, 'token'>) =>
    fetchApi<T>(endpoint, 'PATCH', body, options),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'token'>) =>
    fetchApi<T>(endpoint, 'DELETE', undefined, options),
};