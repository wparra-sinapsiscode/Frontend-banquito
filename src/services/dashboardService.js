import api from './api';
import memberService from './memberService';
import loanService from './loanService';
import loanRequestService from './loanRequestService';

class DashboardService {
  // Obtener todas las estadísticas del dashboard
  async getDashboardData() {
    try {
      const [
        memberStats,
        loanStats,
        requestStats,
        overdueLoans,
        pendingRequests
      ] = await Promise.all([
        memberService.getMemberStatistics(),
        loanService.getLoanStatistics(),
        loanRequestService.getLoanRequestStatistics(),
        loanService.getOverdueLoans(),
        loanRequestService.getPendingRequests()
      ]);

      return {
        memberStats,
        loanStats,
        requestStats,
        overdueLoans,
        pendingRequests,
        summary: {
          totalMembers: memberStats.totalMembers,
          activeLoans: loanStats.loansByStatus?.current?.count || 0,
          pendingRequests: requestStats.pendingRequests,
          overdueCount: overdueLoans.length,
          totalLoanAmount: loanStats.activeLoansAmount || 0,
          totalAssets: memberStats.totalShares * 100 + memberStats.totalGuarantee
        }
      };
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      throw error;
    }
  }

  // Obtener resumen financiero
  async getFinancialSummary() {
    try {
      const [memberStats, loanStats] = await Promise.all([
        memberService.getMemberStatistics(),
        loanService.getLoanStatistics()
      ]);

      const shareValue = 100; // Valor por acción
      const totalShares = memberStats.totalShares;
      const totalGuarantee = memberStats.totalGuarantee;
      const totalAssets = totalShares * shareValue + totalGuarantee;
      const activeLoansAmount = loanStats.activeLoansAmount || 0;
      const availableCapital = totalAssets - activeLoansAmount;

      return {
        totalAssets,
        totalShares,
        shareValue,
        totalGuarantee,
        activeLoansAmount,
        availableCapital,
        utilizationRate: totalAssets > 0 ? (activeLoansAmount / totalAssets) * 100 : 0,
        loansByStatus: loanStats.loansByStatus
      };
    } catch (error) {
      console.error('Error obteniendo resumen financiero:', error);
      throw error;
    }
  }

  // Obtener alertas del sistema
  async getSystemAlerts() {
    try {
      const [overdueLoans, pendingRequests] = await Promise.all([
        loanService.getOverdueLoans(),
        loanRequestService.getPendingRequests()
      ]);

      const alerts = [];

      // Alertas de préstamos vencidos
      if (overdueLoans.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Préstamos Vencidos',
          message: `${overdueLoans.length} préstamo(s) vencido(s) requieren atención`,
          count: overdueLoans.length,
          action: 'view_overdue_loans'
        });
      }

      // Alertas de solicitudes pendientes
      if (pendingRequests.length > 0) {
        alerts.push({
          type: 'info',
          title: 'Solicitudes Pendientes',
          message: `${pendingRequests.length} solicitud(es) esperando revisión`,
          count: pendingRequests.length,
          action: 'view_pending_requests'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error obteniendo alertas del sistema:', error);
      return [];
    }
  }
}

export default new DashboardService();