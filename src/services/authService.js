import api from './api';

class AuthService {
  // Login
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password }, false);
      
      if (response.success && response.data.accessToken) {
        // Guardar tokens en localStorage
        localStorage.setItem('authToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        
        return response.data.user;
      }
      
      throw new Error('Credenciales inválidas');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }
  
  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
    }
  }
  
  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
  
  // Obtener token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh-token', { refreshToken }, false);
      
      if (response.success && response.data.accessToken) {
        localStorage.setItem('authToken', response.data.accessToken);
        return response.data.accessToken;
      }
      
      throw new Error('Failed to refresh token');
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.logout(); // Forzar logout si no se puede renovar
      throw error;
    }
  }

  // Obtener perfil del usuario actual
  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      if (response.success) {
        localStorage.setItem('currentUser', JSON.stringify(response.data));
        return response.data;
      }
      throw new Error('Failed to get profile');
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  // Cambiar contraseña
  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

export default new AuthService();