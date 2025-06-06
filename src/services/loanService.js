import api from './api';

class LoanService {
  // Obtener todos los préstamos
  async getLoans(params = {}) {
    try {
      const response = await api.get('/loans', params);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo préstamos:', error);
      return [];
    }
  }
  
  // Obtener préstamo por ID
  async getLoanById(id) {
    try {
      const response = await api.get(`/loans/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo préstamo:', error);
      throw error;
    }
  }
  
  // Crear préstamo directamente
  async createLoan(loanData) {
    try {
      const response = await api.post('/loans', loanData);
      return response.data;
    } catch (error) {
      console.error('Error creando préstamo:', error);
      throw error;
    }
  }
  
  // Registrar pago
  async registerPayment(loanId, paymentData) {
    try {
      const response = await api.post(`/loans/${loanId}/payments`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }
  
  // Actualizar préstamo
  async updateLoan(loanId, updateData) {
    try {
      const response = await api.put(`/loans/${loanId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando préstamo:', error);
      throw error;
    }
  }
  
  // Obtener cronograma de pagos
  async getPaymentSchedule(loanId, includePayments = false) {
    try {
      const response = await api.get(`/loans/${loanId}/schedule`, { includePayments });
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo cronograma:', error);
      return [];
    }
  }

  // Obtener historial de pagos
  async getPaymentHistory(loanId) {
    try {
      const response = await api.get(`/loans/${loanId}/payments`);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      return [];
    }
  }

  // Obtener estadísticas de préstamos
  async getLoanStatistics() {
    try {
      const response = await api.get('/loans/statistics');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de préstamos:', error);
      throw error;
    }
  }

  // Obtener préstamos vencidos
  async getOverdueLoans() {
    try {
      const response = await api.get('/loans/overdue');
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo préstamos vencidos:', error);
      return [];
    }
  }
}

export default new LoanService();