import React, { useState, useEffect } from 'react';
import './SavingsPlan.css';

const SavingsPlan = ({ memberName, memberId, memberData, settings, onSavingsUpdate }) => {
  const [selectedPlan, setSelectedPlan] = useState(180);
  const [showDetails, setShowDetails] = useState(false);
  
  // Calcular valor inicial basado en acciones del usuario
  const getInitialAmount = () => {
    if (memberData && memberData.shares && settings && settings.shareValue) {
      const shareValue = memberData.shares * settings.shareValue;
      return Math.max(shareValue, 100); // Mínimo 100
    }
    return 1000; // Valor por defecto si no tiene acciones
  };
  
  const [savingsAmount, setSavingsAmount] = useState(getInitialAmount().toString());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeSavings, setActiveSavings] = useState(null);
  
  const TEA = 0.02; // 2% TEA (Tasa Efectiva Anual)

  // Actualizar el monto inicial cuando cambien los datos del miembro
  useEffect(() => {
    if (!activeSavings && !isConfiguring) {
      setSavingsAmount(getInitialAmount().toString());
    }
  }, [memberData, settings]);

  const plans = [
    { days: 90, months: 3, label: '90 DÍAS' },
    { days: 180, months: 6, label: '180 DÍAS' },
    { days: 365, months: 12, label: '365 DÍAS' }
  ];

  const calculateInterest = (amount, days) => {
    // Convertir TEA a TEM (Tasa Efectiva Mensual)
    const TEM = Math.pow(1 + TEA, 1/12) - 1;
    
    // Calcular el número de meses
    const months = days / 30;
    
    // Calcular el interés compuesto
    const finalAmount = amount * Math.pow(1 + TEM, months);
    const interest = finalAmount - amount;
    
    return interest;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const currentPlan = plans.find(p => p.days === selectedPlan);
  const interest = savingsAmount ? calculateInterest(parseFloat(savingsAmount), selectedPlan) : 0;
  
  const handleStartSaving = () => {
    if (!savingsAmount || parseFloat(savingsAmount) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }
    
    const newSaving = {
      id: Date.now(),
      memberId,
      amount: parseFloat(savingsAmount),
      plan: selectedPlan,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + selectedPlan * 24 * 60 * 60 * 1000).toISOString(),
      interest: interest,
      totalAmount: parseFloat(savingsAmount) + interest,
      status: 'active',
      TEA: TEA
    };
    
    setActiveSavings(newSaving);
    setIsConfiguring(false);
    
    if (onSavingsUpdate) {
      onSavingsUpdate(newSaving);
    }
  };

  return (
    <div className="savings-plan-container">
      <div className="savings-header">
        <h3>Plan de Ahorro Fijo - {memberName}</h3>
        <div className="tea-badge">TEA: 2.00%</div>
      </div>
      
      <div className="savings-info">
        <p className="savings-subtitle">
          ¡Mientras más tiempo lo dejes, <strong>más ganarás</strong>!
        </p>
      </div>
      
      {!activeSavings && (
        <div className="amount-display">
          <div className="amount-label">Monto a depositar (dinero externo - solo simulación)</div>
          <div className="amount-note">
            💡 <em>Puedes modificar el monto para ver diferentes simulaciones</em>
          </div>
          <div className="shares-info">
            {memberData && memberData.shares ? (
              <small>
                💼 Valor de tus acciones: {memberData.shares} × S/ {settings?.shareValue || 500} = S/ {((memberData.shares || 0) * (settings?.shareValue || 500)).toLocaleString()}
              </small>
            ) : (
              <small>💼 No tienes acciones registradas</small>
            )}
          </div>
          {!isConfiguring ? (
            <div className="amount-config">
              <div className="current-amount-display">
                <span className="amount-prefix">Monto actual:</span>
                <span className="amount-value">S/ {parseFloat(savingsAmount).toLocaleString()}</span>
              </div>
              <button 
                className="config-btn"
                onClick={() => setIsConfiguring(true)}
              >
                💰 Configurar monto de ahorro
              </button>
            </div>
          ) : (
            <div className="amount-input-container">
              <input
                type="number"
                className="amount-input"
                placeholder="Ingrese el monto"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                min="100"
                step="100"
              />
              <div className="input-actions">
                <button 
                  className="confirm-btn"
                  onClick={() => savingsAmount && parseFloat(savingsAmount) > 0 ? null : alert('Ingrese un monto válido')}
                >
                  ✓
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setIsConfiguring(false);
                    setSavingsAmount('');
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeSavings && (
        <div className="active-savings-display">
          <h4>💰 Ahorro Activo</h4>
          <div className="savings-status">
            <div className="status-row">
              <span>Monto depositado:</span>
              <span>{formatCurrency(activeSavings.amount)}</span>
            </div>
            <div className="status-row">
              <span>Fecha de inicio:</span>
              <span>{new Date(activeSavings.startDate).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="status-row">
              <span>Fecha de vencimiento:</span>
              <span>{new Date(activeSavings.endDate).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="status-row highlight">
              <span>Total al vencimiento:</span>
              <span>{formatCurrency(activeSavings.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
      
      {!activeSavings && savingsAmount && parseFloat(savingsAmount) > 0 && (
      <div className="plan-selector">
        <p className="selector-label">Escoge el plazo de tu depósito</p>
        <div className="plan-options">
          {plans.map((plan) => (
            <div
              key={plan.days}
              className={`plan-option ${selectedPlan === plan.days ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.days)}
            >
              <div className="plan-days">{plan.label}</div>
              <div className="plan-months">{plan.months} meses</div>
            </div>
          ))}
        </div>
      </div>
      )}
      
      {!activeSavings && savingsAmount && parseFloat(savingsAmount) > 0 && (
      <div className="savings-result">
        <div className="result-card selected">
          <div className="result-details">
            <div className="detail-row">
              <span className="detail-label">DÍAS</span>
              <span className="detail-value">{selectedPlan}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">MONTO</span>
              <span className="detail-value">{formatCurrency(savingsAmount)}</span>
            </div>
            <div className="detail-row highlight">
              <span className="detail-label">GANARÍAS</span>
              <span className="detail-value interest">{formatCurrency(interest.toFixed(2))}</span>
            </div>
            <div className="detail-row total">
              <span className="detail-label">TOTAL AL VENCIMIENTO</span>
              <span className="detail-value">{formatCurrency(parseFloat(savingsAmount) + parseFloat(interest))}</span>
            </div>
          </div>
          </div>
          <button 
            className="start-saving-btn"
            onClick={handleStartSaving}
          >
            🚀 Iniciar Plan de Ahorro
          </button>
        </div>
      )}
      
      {!activeSavings && (
      <button 
        className="view-more-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Ver menos' : 'Ver más'} ▼
      </button>
      )}
      
      {showDetails && !activeSavings && (
        <div className="additional-info">
          <p className="info-text">
            La Tasa de Rendimiento Efectivo Anual (TREA) es igual a la Tasa Efectiva Anual (TEA).
          </p>
          <p className="info-text">
            Este plan de ahorro está diseñado para hacer crecer tu dinero con un interés del 2% TEA.
            <strong> El dinero depositado aquí es totalmente externo y no afecta tus acciones ni el capital del grupo.</strong>
          </p>
          <div className="formula-info">
            <h5>📊 Fórmula de cálculo:</h5>
            <p>TEM = (1 + TEA)^(1/12) - 1</p>
            <p>TEM mensual = {((Math.pow(1 + TEA, 1/12) - 1) * 100).toFixed(4)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsPlan;