import React, { useState } from 'react';
import './LoanRequest.css';
// Las funciones de cálculo serán implementadas con datos del backend

const LoanRequest = ({ 
  user, 
  members, 
  loans,
  setLoans,
  settings, 
  getMonthlyInterestRate, 
  calculateAvailableCapital,
  loanRequests,
  setLoanRequests 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    installments: '4',
    purpose: '',
    requiredDate: ''
  });
  const [calculatedData, setCalculatedData] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all', 'first4', 'first8', 'last4'
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const userMember = members.find(member => member.id === user.memberId);
  const availableCapital = calculateAvailableCapital();

  const calculateLoanDetails = () => {
    const amount = parseFloat(formData.amount);
    const totalWeeks = parseInt(formData.installments);
    
    if (!amount || !totalWeeks) return null;

    const monthlyInterestRate = getMonthlyInterestRate(amount);
    // Cálculo será implementado con backend
    const calculation = { weeklyPayment: 0, totalAmount: amount, totalInterest: 0 };

    return {
      requestedAmount: amount,
      monthlyInterestRate,
      weeklyPayment: calculation.weeklyPayment,
      totalAmount: calculation.totalAmount,
      totalInterest: calculation.totalInterest,
      totalWeeks
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'amount' || name === 'installments') {
      const newData = { ...formData, [name]: value };
      if (newData.amount && newData.installments) {
        const amount = parseFloat(newData.amount);
        const installments = parseInt(newData.installments);
        
        if (amount > 0 && installments > 0) {
          const monthlyInterestRate = getMonthlyInterestRate(amount);
          // Cálculo será implementado con backend
          const calculation = { weeklyPayment: 0, totalAmount: amount, totalInterest: 0 };

          setCalculatedData({
            requestedAmount: amount,
            monthlyInterestRate,
            weeklyPayment: calculation.weeklyPayment,
            totalAmount: calculation.totalAmount,
            totalInterest: calculation.totalInterest,
            totalWeeks: installments
          });
        }
      } else {
        setCalculatedData(null);
      }
    }
  };

  const validateRequest = () => {
    const errors = [];
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
    
    if (!userMember) {
      errors.push('No se encontró información del miembro');
      return errors;
    }

    const maxLoanAmount = Math.min(
      settings?.loanLimits?.individual || 8000,
      ((userMember?.shares || 0) * (settings?.shareValue || 500)) * ((settings?.loanLimits?.guaranteePercentage || 80) / 100)
    );

    if (amount > maxLoanAmount) {
      errors.push(`El monto excede tu límite de S/ ${(maxLoanAmount || 0).toLocaleString()}`);
    }

    if (amount > availableCapital) {
      errors.push(`El monto excede el capital disponible de S/ ${(availableCapital || 0).toLocaleString()}`);
    }

    if (userMember.creditRating === 'red') {
      errors.push('No puedes solicitar préstamos con calificación crediticia roja');
    }

    if (!formData.purpose.trim()) {
      errors.push('Debes especificar el propósito del préstamo');
    }

    if (!formData.requiredDate) {
      errors.push('Debes especificar la fecha requerida para el dinero');
    } else {
      const requiredDate = new Date(formData.requiredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (requiredDate < today) {
        errors.push('La fecha requerida no puede ser anterior a hoy');
      }
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateRequest();
    if (errors.length > 0) {
      alert('Errores en la solicitud:\n' + errors.join('\n'));
      return;
    }

    const newRequest = {
      id: Date.now(),
      memberId: user.memberId,
      memberName: userMember.name,
      amount: parseFloat(formData.amount),
      totalWeeks: parseInt(formData.installments),
      purpose: formData.purpose,
      requiredDate: formData.requiredDate,
      monthlyInterestRate: calculatedData.monthlyInterestRate,
      weeklyPayment: calculatedData.weeklyPayment,
      totalAmount: calculatedData.totalAmount,
      requestDate: new Date().toISOString(),
      status: 'pending',
      priority: userMember.creditRating === 'green' ? 1 : userMember.creditRating === 'yellow' ? 2 : 3
    };

    setLoanRequests(prev => [...prev, newRequest]);
    
    // Agregar también a la tabla de préstamos con estado "Por aprobar"
    const newLoanEntry = {
      id: newRequest.id, // Usar el mismo ID que la solicitud
      memberId: user.memberId,
      memberName: userMember.name,
      originalAmount: parseFloat(formData.amount),
      remainingAmount: parseFloat(formData.amount),
      weeklyPayment: calculatedData.weeklyPayment,
      monthlyInterestRate: calculatedData.monthlyInterestRate,
      totalWeeks: parseInt(formData.installments),
      totalAmount: calculatedData.totalAmount,
      startDate: formData.requiredDate,
      dueDate: formData.requiredDate, // Se actualizará cuando se apruebe
      status: 'Por aprobar', // Estados: Por aprobar, Aprobada, Rechazada
      requestDate: new Date().toISOString(),
      purpose: formData.purpose,
      paymentHistory: [],
      requestId: newRequest.id // Referencia a la solicitud original
    };
    
    setLoans(prev => [...prev, newLoanEntry]);
    
    // Guardar la solicitud para mostrar en el modal
    setSubmittedRequest(newRequest);
    setShowSuccessModal(true);
    
    // Limpiar el formulario después de un pequeño delay
    setTimeout(() => {
      setFormData({
        amount: '',
        installments: '4',
        purpose: '',
        requiredDate: ''
      });
      setCalculatedData(null);
      setShowSchedule(false);
    }, 500);
  };

  const generateSchedule = () => {
    if (!calculatedData) return [];
    
    // Use required date if provided, otherwise use today
    const startDate = formData.requiredDate || new Date().toISOString();
    
    // Cronograma será generado por el backend
    return [];
  };

  if (!userMember) {
    return (
      <div className="loan-request-container">
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>No se encontró información del miembro asociado a tu cuenta.</p>
        </div>
      </div>
    );
  }

  // Calcular el total de préstamos activos del usuario
  const userActiveLoansTotal = loans ? loans
    .filter(loan => loan.memberId === user.memberId && loan.status !== 'paid')
    .reduce((total, loan) => total + loan.remainingAmount, 0) : 0;

  // Calcular el límite base según garantía y configuración
  const baseLoanLimit = Math.min(
    settings?.loanLimits?.individual || 8000,
    ((userMember?.shares || 0) * (settings?.shareValue || 500)) * ((settings?.loanLimits?.guaranteePercentage || 80) / 100)
  );

  // El límite real disponible es el límite base menos los préstamos activos
  const maxLoanAmount = Math.max(0, baseLoanLimit - userActiveLoansTotal);

  return (
    <div className="loan-request-container">
      <div className="request-header">
        <h2>📝 Solicitar Préstamo</h2>
        <div className="member-summary">
          <span className={`credit-rating ${userMember.creditRating}`}>
            {userMember.creditRating === 'green' && '🟢 Excelente'}
            {userMember.creditRating === 'yellow' && '🟡 Regular'}
            {userMember.creditRating === 'red' && '🔴 Observado'}
          </span>
          <div className="member-detail">
            <span className="label">Límite disponible:</span>
            <span className="value">S/ {(maxLoanAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="request-content">
        <div className="request-form-section">
          <form onSubmit={handleSubmit} className="loan-form">
            <div className="form-group">
              <label htmlFor="amount">Monto solicitado (S/)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="100"
                max={maxLoanAmount}
                step="50"
                placeholder="Ingresa el monto"
                required
              />
              <div className="field-info">
                Límite máximo: S/ {(maxLoanAmount || 0).toLocaleString()}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="installments">Número de cuotas</label>
              <select
                id="installments"
                name="installments"
                value={formData.installments}
                onChange={handleInputChange}
                required
              >
                <option value="4">4 semanas</option>
                <option value="8">8 semanas</option>
                <option value="12">12 semanas</option>
                <option value="16">16 semanas</option>
                <option value="20">20 semanas</option>
                <option value="24">24 semanas</option>
                <option value="28">28 semanas</option>
                <option value="32">32 semanas</option>
                <option value="36">36 semanas</option>
                <option value="40">40 semanas</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="requiredDate">Fecha requerida para el dinero</label>
              <input
                type="date"
                id="requiredDate"
                name="requiredDate"
                value={formData.requiredDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <div className="field-info">
                Selecciona cuándo necesitas el dinero
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="purpose">Propósito del préstamo</label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe el propósito del préstamo..."
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={!calculatedData || userMember.creditRating === 'red'}
              >
                📤 Enviar Solicitud
              </button>
              
              {calculatedData && (
                <button 
                  type="button" 
                  className="schedule-btn"
                  onClick={() => setShowSchedule(!showSchedule)}
                >
                  📅 {showSchedule ? 'Ocultar' : 'Ver'} Cronograma
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="calculation-section">
          <div className="calculation-card">
            <h3>📊 Cálculo del Préstamo</h3>
            
            {calculatedData ? (
              <div className="calculation-details">
                <div className="calc-row">
                  <span className="calc-label">Monto solicitado:</span>
                  <span className="calc-value">S/ {(calculatedData?.requestedAmount || 0).toLocaleString()}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Tasa de interés:</span>
                  <span className="calc-value">{calculatedData.monthlyInterestRate}% mensual</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Plazo:</span>
                  <span className="calc-value">{calculatedData.totalWeeks} semanas</span>
                </div>
                <div className="calc-row highlight">
                  <span className="calc-label">Pago semanal:</span>
                  <span className="calc-value">S/ {(calculatedData?.weeklyPayment || 0).toLocaleString()}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Total a pagar:</span>
                  <span className="calc-value">S/ {(calculatedData?.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Total intereses:</span>
                  <span className="calc-value">S/ {(calculatedData?.totalInterest || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="no-calculation">
                <div className="no-calc-icon">💡</div>
                <p>Ingresa un monto y selecciona las cuotas para ver el cálculo</p>
              </div>
            )}
          </div>

          <div className="rates-info">
            <h4>📈 Tasas de Interés</h4>
            <div className="rates-list">
              <div className="rate-item">
                <span className="rate-range">Más de S/ 5,000:</span>
                <span className="rate-value">{settings.monthlyInterestRates?.high || 3}% mensual</span>
              </div>
              <div className="rate-item">
                <span className="rate-range">S/ 1,000 - 5,000:</span>
                <span className="rate-value">{settings.monthlyInterestRates?.medium || 5}% mensual</span>
              </div>
              <div className="rate-item">
                <span className="rate-range">Menos de S/ 1,000:</span>
                <span className="rate-value">{settings.monthlyInterestRates?.low || 10}% mensual</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSchedule && calculatedData && (
        <div className="schedule-section">
          <h3>📅 Cronograma de Pagos Semanales</h3>
          <div className="schedule-info">
            <p>ℹ️ Primera cuota: <strong>{generateSchedule()[0]?.dueDate ? new Date(generateSchedule()[0].dueDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No disponible'}</strong></p>
            <p>Los pagos se realizan todos los <strong>miércoles</strong></p>
          </div>
          
          {/* Filtros del cronograma */}
          <div className="schedule-filters">
            <label>Mostrar semanas:</label>
            <div className="filter-buttons">
              <button 
                type="button"
                className={`filter-btn ${scheduleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setScheduleFilter('all')}
              >
                Todas
              </button>
              <button 
                type="button"
                className={`filter-btn ${scheduleFilter === 'first4' ? 'active' : ''}`}
                onClick={() => setScheduleFilter('first4')}
              >
                Primeras 4
              </button>
              <button 
                type="button"
                className={`filter-btn ${scheduleFilter === 'first8' ? 'active' : ''}`}
                onClick={() => setScheduleFilter('first8')}
              >
                Primeras 8
              </button>
              <button 
                type="button"
                className={`filter-btn ${scheduleFilter === 'last4' ? 'active' : ''}`}
                onClick={() => setScheduleFilter('last4')}
              >
                Últimas 4
              </button>
            </div>
          </div>
          
          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Fecha Vencimiento</th>
                  <th>Pago Semanal</th>
                  <th>Capital</th>
                  <th>Interés</th>
                  <th>Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const schedule = generateSchedule();
                  let filteredSchedule = schedule;
                  
                  if (scheduleFilter === 'first4') {
                    filteredSchedule = schedule.slice(0, 4);
                  } else if (scheduleFilter === 'first8') {
                    filteredSchedule = schedule.slice(0, 8);
                  } else if (scheduleFilter === 'last4') {
                    filteredSchedule = schedule.slice(-4);
                  }
                  
                  return filteredSchedule.map(payment => (
                    <tr key={payment.week} className={payment.week <= 4 ? 'highlight-row' : ''}>
                      <td>Semana {payment.week}</td>
                      <td>{new Date(payment.dueDate).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td>S/ {(payment?.weeklyPayment || 0).toLocaleString()}</td>
                      <td>S/ {(payment?.capitalPayment || 0).toLocaleString()}</td>
                      <td>S/ {(payment?.interestPayment || 0).toLocaleString()}</td>
                      <td>S/ {(payment?.remainingBalance || 0).toLocaleString()}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Resumen del cronograma filtrado */}
          <div className="schedule-summary">
            <div className="summary-item">
              <span className="summary-label">Mostrando:</span>
              <span className="summary-value">
                {scheduleFilter === 'all' && `Todas las ${calculatedData.totalWeeks} semanas`}
                {scheduleFilter === 'first4' && 'Primeras 4 semanas'}
                {scheduleFilter === 'first8' && 'Primeras 8 semanas'}
                {scheduleFilter === 'last4' && 'Últimas 4 semanas'}
              </span>
            </div>
            {scheduleFilter !== 'all' && (
              <div className="summary-item">
                <span className="summary-label">Total de semanas:</span>
                <span className="summary-value">{calculatedData.totalWeeks} semanas</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="capital-info">
        <div className="capital-card">
          <h4>💰 Información de Capital</h4>
          <div className="capital-details">
            <div className="capital-item">
              <span className="capital-label">Capital disponible:</span>
              <span className="capital-value">S/ {(availableCapital || 0).toLocaleString()}</span>
            </div>
            <div className="capital-item">
              <span className="capital-label">Tu garantía:</span>
              <span className="capital-value">S/ {((userMember?.shares || 0) * (settings?.shareValue || 500)).toLocaleString()}</span>
            </div>
            <div className="capital-item">
              <span className="capital-label">Tus acciones:</span>
              <span className="capital-value">{userMember?.shares || 0} acciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Simple */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="simple-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Solicitud Enviada</h3>
            <button 
              className="modal-ok-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanRequest;