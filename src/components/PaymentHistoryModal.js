import React, { useState } from 'react';
import './PaymentHistoryModal.css';

const PaymentHistoryModal = ({ loan, member, onClose }) => {
  const [filterMonth, setFilterMonth] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' para más reciente primero
  // Calcular estadísticas del préstamo
  const getStatistics = () => {
    const payments = loan.paymentHistory || [];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingPayments = loan.totalWeeks - loan.currentWeek;
    const progressPercentage = ((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100;

    return {
      totalPaid,
      totalPayments: payments.length,
      remainingPayments,
      progressPercentage,
      nextPaymentDate: loan.dueDate,
      weeklyPayment: loan.weeklyPayment || loan.monthlyPayment
    };
  };

  const stats = getStatistics();
  const payments = loan.paymentHistory || [];

  // Filtrar y ordenar pagos
  const getFilteredPayments = () => {
    let filtered = [...payments];
    
    // Filtrar por mes si se seleccionó
    if (filterMonth) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.date);
        const paymentMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        return paymentMonth === filterMonth;
      });
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Historial de Pagos - {member?.name || loan.memberName}</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="modal-content">
          {/* Información del préstamo */}
          <div className="loan-info-section">
            <h3>Información del Préstamo</h3>
            <div className="loan-info-grid">
              <div className="info-item">
                <span className="label">Monto Original:</span>
                <span className="value">S/ {loan.originalAmount.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Saldo Pendiente:</span>
                <span className="value">S/ {loan.remainingAmount.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Pago Semanal:</span>
                <span className="value">S/ {stats.weeklyPayment.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Semanas Totales:</span>
                <span className="value">{loan.totalWeeks || loan.installments}</span>
              </div>
              <div className="info-item">
                <span className="label">Semana Actual:</span>
                <span className="value">{loan.currentWeek || loan.currentInstallment}</span>
              </div>
              <div className="info-item">
                <span className="label">Próximo Pago:</span>
                <span className="value">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="progress-section">
            <h3>Progreso del Préstamo</h3>
            <div className="progress-container">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill-large"
                  style={{ width: `${stats.progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {stats.progressPercentage.toFixed(1)}% Completado
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="statistics-section">
            <div className="stat-card">
              <div className="stat-value">S/ {stats.totalPaid.toLocaleString()}</div>
              <div className="stat-label">Total Pagado</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalPayments}</div>
              <div className="stat-label">Pagos Realizados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.remainingPayments}</div>
              <div className="stat-label">Pagos Restantes</div>
            </div>
          </div>

          {/* Historial de pagos */}
          <div className="payments-history-section">
            <div className="history-header">
              <h3>Historial de Pagos Detallado</h3>
              <div className="history-filters">
                <div className="filter-item">
                  <label>Mes:</label>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="month-filter"
                  />
                </div>
                <div className="filter-item">
                  <label>Orden:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="sort-filter"
                  >
                    <option value="desc">Más reciente primero</option>
                    <option value="asc">Más antiguo primero</option>
                  </select>
                </div>
                {filterMonth && (
                  <button
                    className="clear-filter"
                    onClick={() => setFilterMonth('')}
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Semana</th>
                    <th>Monto Pagado</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment, index) => {
                      // Calcular número de semana correctamente
                      const startDate = new Date(loan.startDate);
                      const paymentDate = new Date(payment.date);
                      const weekNumber = Math.ceil((paymentDate - startDate) / (7 * 24 * 60 * 60 * 1000));
                      
                      return (
                        <tr key={index}>
                          <td>{new Date(payment.date).toLocaleDateString('es-ES')}</td>
                          <td>Semana {weekNumber > 0 ? weekNumber : 1}</td>
                          <td className="amount-paid">S/ {payment.amount.toLocaleString()}</td>
                          <td>
                            <span className="payment-type">
                              {payment.type === 'weekly' ? 'Semanal' : 'Pago'}
                            </span>
                          </td>
                          <td>
                            <span className="status-badge completed">
                              ✅ Completado
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No hay pagos registrados aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información adicional del miembro */}
          {member && (
            <div className="member-info-section">
              <h3>Información del Deudor</h3>
              <div className="member-info-grid">
                <div className="info-item">
                  <span className="label">Calificación:</span>
                  <span className={`credit-rating ${member.creditRating}`}>
                    {member.creditRating === 'green' && '🟢 Excelente'}
                    {member.creditRating === 'yellow' && '🟡 Regular'}
                    {member.creditRating === 'red' && '🔴 Riesgo'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Puntaje:</span>
                  <span className="value">{member.creditScore}/90</span>
                </div>
                <div className="info-item">
                  <span className="label">Garantía:</span>
                  <span className="value">S/ {member.guarantee.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryModal;