import React, { useState } from 'react';
import './LoanModal.css';

const LoanModal = ({ loan, onClose, onSave, calculateLateFee, getPaymentWithLateFee, initialTab }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === 'payment') return 'payment';
    if (initialTab === 'history') return 'history';
    return 'details';
  });
  const [editMode, setEditMode] = useState(initialTab === 'edit');
  const [editedLoan, setEditedLoan] = useState({ ...loan });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');

  const statusInfo = getStatusInfo(loan);
  const paymentInfo = getPaymentWithLateFee ? getPaymentWithLateFee(loan) : null;

  function getStatusInfo(loan) {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

    if (loan.status === 'paid') {
      return { label: 'Pagado', class: 'paid', icon: '✅' };
    } else if (daysDiff < 0) {
      return { label: `Vencido (${Math.abs(daysDiff)} días)`, class: 'overdue', icon: '🔴' };
    } else if (daysDiff <= 3) {
      return { label: `Vence en ${daysDiff} días`, class: 'due-soon', icon: '🟡' };
    } else {
      return { label: 'Al día', class: 'current', icon: '🟢' };
    }
  }

  const handleInputChange = (field, value) => {
    setEditedLoan(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    onSave(editedLoan);
    setEditMode(false);
  };

  const handleRegisterPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    const payment = {
      loanId: loan.id,
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      note: paymentNote,
      type: 'payment'
    };

    onSave({
      ...loan,
      paymentHistory: [...(loan.paymentHistory || []), payment],
      remainingAmount: Math.max(0, loan.remainingAmount - parseFloat(paymentAmount)),
      currentWeek: (loan.currentWeek || loan.currentInstallment) + 1,
      status: loan.remainingAmount - parseFloat(paymentAmount) <= 0 ? 'paid' : loan.status
    });

    // Reset form
    setPaymentAmount('');
    setPaymentNote('');
    alert('Pago registrado exitosamente');
  };

  const calculateProgress = (loan) => {
    return ((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="loan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <span className="member-name">{loan.memberName}</span>
            <span className={`status-badge ${statusInfo.class}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Detalles
          </button>
          <button 
            className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            💳 Registrar Pago
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Historial
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="loan-summary">
                <div className="summary-card">
                  <h3>Resumen del Préstamo</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="label">Monto Original:</span>
                      <span className="value">S/ {loan.originalAmount.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Monto Pendiente:</span>
                      <span className="value highlight">S/ {loan.remainingAmount.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Progreso:</span>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${calculateProgress(loan)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{calculateProgress(loan).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="summary-item">
                      <span className="label">Semana/Cuota:</span>
                      <span className="value">
                        {loan.currentWeek || loan.currentInstallment} de {loan.totalWeeks || loan.installments}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="payment-info-card">
                  <h3>Información de Pago</h3>
                  <div className="payment-grid">
                    <div className="payment-item">
                      <span className="label">Pago Base:</span>
                      <span className="value">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</span>
                    </div>
                    {paymentInfo && paymentInfo.lateFee > 0 && (
                      <>
                        <div className="payment-item">
                          <span className="label">Mora:</span>
                          <span className="value fee">S/ {paymentInfo.lateFee.toLocaleString()}</span>
                        </div>
                        <div className="payment-item total">
                          <span className="label">Total a Pagar:</span>
                          <span className="value">S/ {Math.ceil(paymentInfo.totalPayment).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    <div className="payment-item">
                      <span className="label">Próximo Vencimiento:</span>
                      <span className="value">
                        {new Date(loan.dueDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {editMode ? (
                <div className="edit-form">
                  <h3>Editar Préstamo</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Monto Pendiente:</label>
                      <input
                        type="number"
                        value={editedLoan.remainingAmount}
                        onChange={(e) => handleInputChange('remainingAmount', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Pago Semanal:</label>
                      <input
                        type="number"
                        value={editedLoan.weeklyPayment || editedLoan.monthlyPayment}
                        onChange={(e) => handleInputChange(loan.weeklyPayment ? 'weeklyPayment' : 'monthlyPayment', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha de Vencimiento:</label>
                      <input
                        type="date"
                        value={editedLoan.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Estado:</label>
                      <select
                        value={editedLoan.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="current">Al día</option>
                        <option value="overdue">Vencido</option>
                        <option value="paid">Pagado</option>
                      </select>
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSaveChanges}>
                      💾 Guardar Cambios
                    </button>
                    <button className="cancel-btn" onClick={() => {
                      setEditedLoan({ ...loan });
                      setEditMode(false);
                    }}>
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="loan-details">
                  <h3>Detalles del Préstamo</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">ID del Préstamo:</span>
                      <span className="value">{loan.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">ID del Miembro:</span>
                      <span className="value">{loan.memberId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Fecha de Aprobación:</span>
                      <span className="value">
                        {loan.approvedDate ? new Date(loan.approvedDate).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Tasa de Interés:</span>
                      <span className="value">{loan.interestRate}%</span>
                    </div>
                  </div>
                  <button className="edit-btn" onClick={() => setEditMode(true)}>
                    ✏️ Editar Préstamo
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="payment-tab">
              <h3>Registrar Nuevo Pago</h3>
              <div className="payment-form">
                <div className="form-group">
                  <label>Monto a Pagar:</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="amount-input"
                  />
                  <div className="payment-suggestions">
                    <button 
                      className="suggestion-btn"
                      onClick={() => setPaymentAmount((loan.weeklyPayment || loan.monthlyPayment).toString())}
                    >
                      Pago Base: S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}
                    </button>
                    {paymentInfo && paymentInfo.lateFee > 0 && (
                      <button 
                        className="suggestion-btn"
                        onClick={() => setPaymentAmount(Math.ceil(paymentInfo.totalPayment).toString())}
                      >
                        Total con Mora: S/ {Math.ceil(paymentInfo.totalPayment).toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Fecha de Pago:</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Nota (opcional):</label>
                  <textarea
                    placeholder="Agregar una nota sobre este pago..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    rows="3"
                  />
                </div>

                <button 
                  className="register-payment-btn"
                  onClick={handleRegisterPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  💵 Registrar Pago
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab">
              <h3>Historial de Pagos</h3>
              {loan.paymentHistory && loan.paymentHistory.length > 0 ? (
                <div className="history-list">
                  {loan.paymentHistory.map((payment, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">
                        {new Date(payment.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="history-amount">
                        S/ {payment.amount.toLocaleString()}
                      </div>
                      <div className="history-type">
                        {payment.type === 'payment' ? '💳 Pago' : '📝 Ajuste'}
                      </div>
                      {payment.note && (
                        <div className="history-note">{payment.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">
                  <p>No hay pagos registrados aún</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanModal;