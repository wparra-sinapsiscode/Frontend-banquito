// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    // Si es 401, podría ser que el token expiró
    if (response.status === 401) {
      // Intentar refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success && refreshData.data.accessToken) {
              localStorage.setItem('authToken', refreshData.data.accessToken);
              // No lanzamos error, el usuario puede reintentar la operación
              throw new Error('Token renovado, por favor intenta nuevamente');
            }
          }
        }
        
        // Si no se pudo renovar, limpiar tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        throw new Error('Sesión expirada, por favor inicia sesión nuevamente');
      } catch (refreshError) {
        throw refreshError;
      }
    }

    const error = await response.json().catch(() => ({ message: 'Error en la solicitud' }));
    throw new Error(error.message || error.error?.message || `Error ${response.status}`);
  }
  return response.json();
};

// Helper para obtener headers con autenticación
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Servicio base de API
class ApiService {
  // GET genérico
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  }
  
  // POST genérico
  async post(endpoint, data = {}, includeAuth = true) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  }
  
  // PUT genérico
  async put(endpoint, data = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  }
  
  // DELETE genérico
  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  }
}

export default new ApiService();