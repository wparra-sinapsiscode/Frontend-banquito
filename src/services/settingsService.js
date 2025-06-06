import api from './api';

class SettingsService {
  // Obtener todas las configuraciones
  async getSettings() {
    try {
      const response = await api.get('/settings');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      return [];
    }
  }

  // Actualizar configuraciones
  async updateSettings(settings) {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error actualizando configuraciones:', error);
      throw error;
    }
  }

  // Obtener configuración específica por clave
  async getSetting(key) {
    try {
      const response = await api.get(`/settings/${key}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      throw error;
    }
  }

  // Configuraciones por defecto para el frontend
  getDefaultSettings() {
    return {
      'loan.max_amount': 50000,
      'loan.min_amount': 1000,
      'loan.default_interest_rate': 2.5,
      'loan.max_weeks': 52,
      'system.share_value': 100,
      'system.min_guarantee_ratio': 2
    };
  }
}

const settingsService = new SettingsService();
export default settingsService;