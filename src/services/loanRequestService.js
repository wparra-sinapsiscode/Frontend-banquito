import api from './api';

class LoanRequestService {
  // Obtener todas las solicitudes
  async getLoanRequests(params = {}) {
    try {
      const response = await api.get('/loan-requests', params);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return [];
    }
  }
  
  // Crear nueva solicitud
  async createLoanRequest(requestData) {
    try {
      const response = await api.post('/loan-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Error creando solicitud:', error);
      throw error;
    }
  }
  
  // Aprobar solicitud
  async approveLoanRequest(requestId, approvalData) {
    try {
      const response = await api.put(`/loan-requests/${requestId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      throw error;
    }
  }
  
  // Rechazar solicitud
  async rejectLoanRequest(requestId, rejectionData) {
    try {
      const response = await api.put(`/loan-requests/${requestId}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      throw error;
    }
  }

  // Obtener solicitud por ID
  async getLoanRequestById(requestId) {
    try {
      const response = await api.get(`/loan-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo solicitud:', error);
      throw error;
    }
  }

  // Obtener estadísticas de solicitudes
  async getLoanRequestStatistics() {
    try {
      const response = await api.get('/loan-requests/statistics');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de solicitudes:', error);
      throw error;
    }
  }

  // Obtener solicitudes pendientes
  async getPendingRequests() {
    try {
      const response = await api.get('/loan-requests/pending');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo solicitudes pendientes:', error);
      return [];
    }
  }
}

const loanRequestService = new LoanRequestService();
export default loanRequestService;