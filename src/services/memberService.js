import api from './api';

class MemberService {
  // Obtener todos los miembros
  async getMembers(params = {}) {
    try {
      const response = await api.get('/members', params);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo miembros:', error);
      return [];
    }
  }
  
  // Obtener miembro por ID
  async getMemberById(id) {
    try {
      const response = await api.get(`/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo miembro:', error);
      throw error;
    }
  }
  
  // Crear nuevo miembro
  async createMember(memberData) {
    try {
      const response = await api.post('/members', memberData);
      return response.data;
    } catch (error) {
      console.error('Error creando miembro:', error);
      throw error;
    }
  }
  
  // Actualizar miembro
  async updateMember(id, memberData) {
    try {
      const response = await api.put(`/members/${id}`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando miembro:', error);
      throw error;
    }
  }
  
  // Eliminar miembro
  async deleteMember(id) {
    try {
      await api.delete(`/members/${id}`);
      return true;
    } catch (error) {
      console.error('Error eliminando miembro:', error);
      throw error;
    }
  }
  
  // Actualizar plan de ahorro
  async updateSavingsPlan(memberId, savingsPlanData) {
    try {
      const response = await api.put(`/members/${memberId}/savings-plan`, savingsPlanData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando plan de ahorro:', error);
      throw error;
    }
  }

  // Obtener estadísticas de miembros
  async getMemberStatistics() {
    try {
      const response = await api.get('/members/statistics');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de miembros:', error);
      throw error;
    }
  }
}

export default new MemberService();