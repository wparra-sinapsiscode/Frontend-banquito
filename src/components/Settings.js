import React, { useState } from 'react';
import './Settings.css';

const Settings = ({ settings, setSettings, loans = [] }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [tempSettings, setTempSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section, key, value) => {
    const newSettings = {
      ...tempSettings,
      [section]: {
        ...tempSettings[section],
        [key]: value
      }
    };
    setTempSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const handleDirectChange = (key, value) => {
    const newSettings = {
      ...tempSettings,
      [key]: value
    };
    setTempSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    setHasChanges(false);
    alert('Configuración guardada exitosamente');
  };

  const resetSettings = () => {
    setTempSettings(settings);
    setHasChanges(false);
  };

  const restoreDefaults = () => {
    const defaultSettings = {
      shareValue: 500,
      loanLimits: {
        individual: 8000,
        guaranteePercentage: 80
      },
      monthlyInterestRates: {
        high: 3,
        medium: 5,
        low: 10
      },
      operationDay: 'wednesday',
      delinquencyRate: 5.0
    };
    setTempSettings(defaultSettings);
    setHasChanges(true);
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>⚙️ Configuración General</h3>
      
      <div className="setting-group">
        <h4>💰 Valor de Acciones</h4>
        <div className="setting-item">
          <label htmlFor="shareValue">Valor por acción (S/):</label>
          <input
            type="number"
            id="shareValue"
            value={tempSettings.shareValue}
            onChange={(e) => handleDirectChange('shareValue', parseInt(e.target.value) || 0)}
            min="100"
            max="2000"
            step="50"
          />
          <small>Valor en soles de cada acción de garantía</small>
        </div>
      </div>

      <div className="setting-group">
        <h4>📅 Día de Operaciones</h4>
        <div className="setting-item">
          <label htmlFor="operationDay">Día de la semana:</label>
          <select
            id="operationDay"
            value={tempSettings.operationDay}
            onChange={(e) => handleDirectChange('operationDay', e.target.value)}
          >
            <option value="monday">Lunes</option>
            <option value="tuesday">Martes</option>
            <option value="wednesday">Miércoles</option>
            <option value="thursday">Jueves</option>
            <option value="friday">Viernes</option>
            <option value="saturday">Sábado</option>
          </select>
          <small>Día designado para pagos y desembolsos</small>
        </div>
      </div>

      <div className="setting-group">
        <h4>🏛️ Límites de Préstamo</h4>
        <div className="setting-item">
          <label htmlFor="individualLimit">Límite individual máximo (S/):</label>
          <input
            type="number"
            id="individualLimit"
            value={tempSettings.loanLimits.individual}
            onChange={(e) => handleSettingChange('loanLimits', 'individual', parseInt(e.target.value) || 0)}
            min="1000"
            max="20000"
            step="500"
          />
          <small>Límite máximo de préstamo por persona</small>
        </div>
        
        <div className="setting-item">
          <label htmlFor="guaranteePercentage">Porcentaje de garantía (%):</label>
          <input
            type="number"
            id="guaranteePercentage"
            value={tempSettings.loanLimits.guaranteePercentage}
            onChange={(e) => handleSettingChange('loanLimits', 'guaranteePercentage', parseInt(e.target.value) || 0)}
            min="50"
            max="100"
            step="5"
          />
          <small>Porcentaje máximo de la garantía que se puede prestar</small>
        </div>
      </div>
    </div>
  );

  const renderInterestSettings = () => (
    <div className="settings-section">
      <h3>📈 Configuración de Tasas de Interés</h3>
      
      <div className="rates-info">
        <div className="info-card">
          <h4>ℹ️ Información sobre Tasas</h4>
          <p>Las tasas de interés se aplican según el monto del préstamo solicitado. 
             Las tasas son anuales y se calculan automáticamente en las cuotas mensuales.</p>
        </div>
      </div>

      <div className="setting-group">
        <h4>💸 Tasas por Monto de Préstamo</h4>
        
        <div className="rate-setting-item high">
          <div className="rate-header">
            <span className="rate-label">🟢 Préstamos Grandes (más de S/ 5,000)</span>
            <span className="rate-description">Tasa preferencial para montos altos</span>
          </div>
          <div className="rate-input">
            <input
              type="number"
              value={tempSettings.monthlyInterestRates.high}
              onChange={(e) => handleSettingChange('monthlyInterestRates', 'high', parseFloat(e.target.value) || 0)}
              min="1"
              max="15"
              step="0.5"
            />
            <span className="rate-unit">% mensual</span>
          </div>
        </div>

        <div className="rate-setting-item medium">
          <div className="rate-header">
            <span className="rate-label">🟡 Préstamos Medianos (S/ 1,000 - 5,000)</span>
            <span className="rate-description">Tasa estándar para montos intermedios</span>
          </div>
          <div className="rate-input">
            <input
              type="number"
              value={tempSettings.monthlyInterestRates.medium}
              onChange={(e) => handleSettingChange('monthlyInterestRates', 'medium', parseFloat(e.target.value) || 0)}
              min="2"
              max="20"
              step="0.5"
            />
            <span className="rate-unit">% mensual</span>
          </div>
        </div>

        <div className="rate-setting-item low">
          <div className="rate-header">
            <span className="rate-label">🔴 Préstamos Pequeños (menos de S/ 1,000)</span>
            <span className="rate-description">Tasa más alta para montos pequeños</span>
          </div>
          <div className="rate-input">
            <input
              type="number"
              value={tempSettings.monthlyInterestRates.low}
              onChange={(e) => handleSettingChange('monthlyInterestRates', 'low', parseFloat(e.target.value) || 0)}
              min="5"
              max="30"
              step="0.5"
            />
            <span className="rate-unit">% mensual</span>
          </div>
        </div>
      </div>

      <div className="setting-group">
        <h4>⚠️ Recargo por Mora</h4>
        <div className="delinquency-info">
          <div className="info-card warning">
            <h5>ℹ️ ¿Qué es el Recargo por Mora?</h5>
            <p>El recargo por mora es un porcentaje adicional que se aplica automáticamente al pago mensual 
               cuando un préstamo se vence. Se calcula por cada día de retraso hasta que se realice el pago.</p>
          </div>
        </div>
        
        <div className="rate-setting-item delinquency">
          <div className="rate-header">
            <span className="rate-label">💸 Tasa de Recargo por Mora</span>
            <span className="rate-description">Porcentaje aplicado diariamente sobre el pago vencido</span>
          </div>
          <div className="rate-input">
            <input
              type="number"
              value={tempSettings.delinquencyRate}
              onChange={(e) => handleDirectChange('delinquencyRate', parseFloat(e.target.value) || 0)}
              min="0"
              max="50"
              step="0.5"
            />
            <span className="rate-unit">% diario</span>
          </div>
        </div>

        <div className="delinquency-status">
          <div className="status-indicator">
            <span className="status-label">Ejemplo de Cálculo:</span>
            <span className="status-value normal">
              📋 Ver simulación abajo
            </span>
          </div>
          <div className="mora-example">
            <h6>💡 Ejemplo de Recargo por Mora</h6>
            <div className="example-calc">
              <div className="calc-row">
                <span>Cuota original:</span>
                <span>S/ 250.00</span>
              </div>
              <div className="calc-row">
                <span>Tasa de recargo configurada:</span>
                <span>{tempSettings.delinquencyRate}%</span>
              </div>
              <div className="calc-row">
                <span>Días de retraso:</span>
                <span>5 días</span>
              </div>
              <div className="calc-row highlight">
                <span>Recargo por mora ({tempSettings.delinquencyRate}% × 5 días):</span>
                <span>S/ {Math.ceil(250 * (tempSettings.delinquencyRate / 100) * 5)}</span>
              </div>
              <div className="calc-row total">
                <span><strong>Total a pagar:</strong></span>
                <span><strong>S/ {Math.ceil(250 + (250 * (tempSettings.delinquencyRate / 100) * 5))}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rates-simulation">
        <h4>🧮 Simulador de Tasas</h4>
        <div className="simulation-grid">
          <div className="simulation-card">
            <h5>Más de S/ 5,000</h5>
            <div className="simulation-input">
              <label>Monto del préstamo:</label>
              <input
                type="number"
                value={tempSettings.simulatorAmounts?.high || 7000}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 5001;
                  setTempSettings({
                    ...tempSettings,
                    simulatorAmounts: {
                      ...tempSettings.simulatorAmounts,
                      high: value
                    }
                  });
                  setHasChanges(true);
                }}
                min="5001"
                max="50000"
                step="100"
              />
            </div>
            <p>Tasa aplicable: <strong>{tempSettings.monthlyInterestRates.high}% semanal</strong></p>
            <p>Cuota semanal (12 semanal): <strong>S/ {Math.ceil(calculateMonthlyPayment(tempSettings.simulatorAmounts?.high || 7000, 12, tempSettings.monthlyInterestRates.high))}</strong></p>
          </div>
          <div className="simulation-card">
            <h5>S/ 1,000 - 5,000</h5>
            <div className="simulation-input">
              <label>Monto del préstamo:</label>
              <input
                type="number"
                value={tempSettings.simulatorAmounts?.medium || 3000}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1001;
                  setTempSettings({
                    ...tempSettings,
                    simulatorAmounts: {
                      ...tempSettings.simulatorAmounts,
                      medium: Math.min(4999, Math.max(1001, value))
                    }
                  });
                  setHasChanges(true);
                }}
                min="1001"
                max="4999"
                step="100"
              />
            </div>
            <p>Tasa aplicable: <strong>{tempSettings.monthlyInterestRates.medium}% semanal</strong></p>
            <p>Cuota semanal (12 semanal): <strong>S/ {Math.ceil(calculateMonthlyPayment(tempSettings.simulatorAmounts?.medium || 3000, 12, tempSettings.monthlyInterestRates.medium))}</strong></p>
          </div>
          <div className="simulation-card">
            <h5>Menos o igual de S/ 1,000</h5>
            <div className="simulation-input">
              <label>Monto del préstamo:</label>
              <input
                type="number"
                value={tempSettings.simulatorAmounts?.low || 800}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 100;
                  setTempSettings({
                    ...tempSettings,
                    simulatorAmounts: {
                      ...tempSettings.simulatorAmounts,
                      low: Math.min(1000, Math.max(100, value))
                    }
                  });
                  setHasChanges(true);
                }}
                min="100"
                max="1000"
                step="50"
              />
            </div>
            <p>Tasa aplicable: <strong>{tempSettings.monthlyInterestRates.low}% semanal</strong></p>
            <p>Cuota semanal (6 semanal): <strong>S/ {Math.ceil(calculateMonthlyPayment(tempSettings.simulatorAmounts?.low || 800, 6, tempSettings.monthlyInterestRates.low))}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>🔒 Configuración de Seguridad</h3>
      
      <div className="setting-group">
        <h4>👥 Gestión de Usuarios</h4>
        <div className="security-info">
          <div className="info-item">
            <span className="info-label">Usuarios activos:</span>
            <span className="info-value">3 (1 Admin, 2 Miembros)</span>
          </div>
          <div className="info-item">
            <span className="info-label">Último acceso admin:</span>
            <span className="info-value">Hoy, {new Date().toLocaleTimeString('es-ES')}</span>
          </div>
        </div>
        
        <div className="security-actions">
          <button className="security-btn">
            👤 Gestionar usuarios
          </button>
          <button className="security-btn">
            🔑 Cambiar contraseñas
          </button>
        </div>
      </div>

      <div className="setting-group">
        <h4>📊 Auditoría y Logs</h4>
        <div className="audit-info">
          <p>Sistema de auditoría para rastrear cambios importantes:</p>
          <ul>
            <li>✅ Cambios en configuración</li>
            <li>✅ Aprobación/rechazo de préstamos</li>
            <li>✅ Modificaciones de calificación crediticia</li>
            <li>✅ Registro de pagos</li>
          </ul>
        </div>
        
        <div className="audit-actions">
          <button className="audit-btn">
            📋 Ver logs de auditoría
          </button>
          <button className="audit-btn">
            💾 Exportar logs
          </button>
        </div>
      </div>

      <div className="setting-group">
        <h4>🔐 Respaldo y Recuperación</h4>
        <div className="backup-info">
          <div className="info-item">
            <span className="info-label">Último respaldo:</span>
            <span className="info-value">Ayer, 23:00</span>
          </div>
          <div className="info-item">
            <span className="info-label">Respaldos automáticos:</span>
            <span className="info-value">Activados (diarios)</span>
          </div>
        </div>
        
        <div className="backup-actions">
          <button className="backup-btn primary">
            💾 Crear respaldo manual
          </button>
          <button className="backup-btn">
            📥 Restaurar respaldo
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="settings-section">
      <h3>🔧 Configuración Avanzada</h3>
      
      <div className="setting-group">
        <h4>📧 Notificaciones</h4>
        <div className="checkbox-group">
          <label className="checkbox-item">
            <input type="checkbox" defaultChecked />
            <span className="checkbox-label">Notificar vencimientos próximos</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" defaultChecked />
            <span className="checkbox-label">Alertas de pagos vencidos</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" defaultChecked />
            <span className="checkbox-label">Notificar nuevas solicitudes</span>
          </label>
          <label className="checkbox-item">
            <input type="checkbox" />
            <span className="checkbox-label">Enviar reportes semanales por email</span>
          </label>
        </div>
      </div>

      <div className="setting-group">
        <h4>🎨 Personalización</h4>
        <div className="theme-selector">
          <label htmlFor="theme">Tema de la aplicación:</label>
          <select id="theme">
            <option value="default">🎨 Tema por defecto</option>
            <option value="dark">🌙 Tema oscuro</option>
            <option value="high-contrast">🔆 Alto contraste</option>
          </select>
        </div>
      </div>

      <div className="setting-group">
        <h4>⚡ Rendimiento</h4>
        <div className="performance-settings">
          <div className="setting-item">
            <label htmlFor="cacheSize">Tamaño de caché (MB):</label>
            <input
              type="number"
              id="cacheSize"
              defaultValue="50"
              min="10"
              max="200"
              step="10"
            />
            <small>Memoria utilizada para mejorar velocidad</small>
          </div>
          
          <div className="setting-item">
            <label htmlFor="autoSave">Guardado automático:</label>
            <select id="autoSave">
              <option value="30">Cada 30 segundos</option>
              <option value="60">Cada minuto</option>
              <option value="300">Cada 5 minutos</option>
              <option value="0">Desactivado</option>
            </select>
            <small>Frecuencia de guardado automático</small>
          </div>
        </div>
      </div>

      <div className="danger-zone">
        <h4>⚠️ Zona de Peligro</h4>
        <div className="danger-actions">
          <button className="danger-btn" onClick={() => {
            if (window.confirm('¿Estás seguro de que quieres resetear todas las configuraciones? Esta acción no se puede deshacer.')) {
              restoreDefaults();
            }
          }}>
            🔄 Resetear toda la configuración
          </button>
          <button className="danger-btn" onClick={() => {
            if (window.confirm('¿Estás seguro de que quieres limpiar todos los datos? Esta acción eliminará TODA la información y no se puede deshacer.')) {
              alert('Funcionalidad de limpieza de datos no implementada en la demo');
            }
          }}>
            🗑️ Limpiar todos los datos
          </button>
        </div>
      </div>
    </div>
  );

  const getCurrentDelinquencyRate = () => {
    if (!loans || loans.length === 0) return 0;
    
    const today = new Date();
    const overdueLoans = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate < today && loan.status !== 'paid';
    });
    
    return (overdueLoans.length / loans.length) * 100;
  };

  function calculateMonthlyPayment(principal, months, annualRate) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(monthlyPayment * 100) / 100;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>🔧 Configuración del Sistema</h2>
        {hasChanges && (
          <div className="changes-indicator">
            <span className="changes-text">✏️ Cambios sin guardar</span>
            <div className="changes-actions">
              <button className="save-btn" onClick={saveSettings}>
                💾 Guardar
              </button>
              <button className="reset-btn" onClick={resetSettings}>
                ↺ Descartar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeSection === 'general' ? 'active' : ''}`}
          onClick={() => setActiveSection('general')}
        >
          ⚙️ General
        </button>
        <button 
          className={`settings-tab ${activeSection === 'interest' ? 'active' : ''}`}
          onClick={() => setActiveSection('interest')}
        >
          📈 Tasas de Interés
        </button>
        <button 
          className={`settings-tab ${activeSection === 'security' ? 'active' : ''}`}
          onClick={() => setActiveSection('security')}
        >
          🔒 Seguridad
        </button>
        <button 
          className={`settings-tab ${activeSection === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveSection('advanced')}
        >
          🔧 Avanzado
        </button>
      </div>

      <div className="settings-content">
        {activeSection === 'general' && renderGeneralSettings()}
        {activeSection === 'interest' && renderInterestSettings()}
        {activeSection === 'security' && renderSecuritySettings()}
        {activeSection === 'advanced' && renderAdvancedSettings()}
      </div>

      <div className="settings-footer">
        <div className="footer-info">
          <span>🏛️ Sistema Banquito v1.0</span>
          <span>Última actualización: {new Date().toLocaleDateString('es-ES')}</span>
        </div>
        <div className="footer-actions">
          <button className="footer-btn" onClick={restoreDefaults}>
            🔄 Valores por defecto
          </button>
          <button className="footer-btn primary" onClick={saveSettings} disabled={!hasChanges}>
            💾 Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;