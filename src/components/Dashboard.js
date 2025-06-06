import React, { useState } from 'react';
import './Dashboard.css';
import LoansTable from './LoansTable';
import LoanRequest from './LoanRequest';
import MembersTable from './MembersTable';
import AdminPanel from './AdminPanel';
import Reports from './Reports';
import Settings from './Settings';
import Calendar from './Calendar';
import SavingsPlan from './SavingsPlan';
import TestComponent from './TestComponent';

const MemberLoansSection = ({ userLoans, getStatusInfo }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all'); // all, recent, overdue
  const itemsPerPage = 5;

  const getFilteredLoans = () => {
    let filtered = [...userLoans];
    
    if (dateFilter === 'recent') {
      // Préstamos de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(loan => new Date(loan.startDate || loan.requestDate) >= thirtyDaysAgo);
    } else if (dateFilter === 'overdue') {
      // Solo préstamos vencidos
      filtered = filtered.filter(loan => {
        const statusInfo = getStatusInfo(loan);
        return statusInfo.class === 'overdue';
      });
    } else if (dateFilter === 'current') {
      // Solo préstamos al día
      filtered = filtered.filter(loan => {
        const statusInfo = getStatusInfo(loan);
        return statusInfo.class === 'current' || statusInfo.class === 'due-soon';
      });
    }
    
    return filtered;
  };

  const filteredLoans = getFilteredLoans();
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);

  const getNextWednesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const nextDate = new Date(today);
    let daysToAdd;
    
    if (dayOfWeek === 3) {
      daysToAdd = 7;
    } else if (dayOfWeek < 3) {
      daysToAdd = 3 - dayOfWeek;
    } else {
      daysToAdd = 7 - dayOfWeek + 3;
    }
    
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  };

  return (
    <>
      <div className="loans-header" style={{background:"#ffffff"}}>
        <h3>Filtrar Préstamos</h3>
        <div className="loans-filters">
          <select 
            value={dateFilter} 
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="date-filter"
          >
            <option value="all">📋 Todos los préstamos</option>
            <option value="recent">📅 Recientes (30 días)</option>
            <option value="overdue">⚠️ Vencidos</option>
            <option value="current">✅ Al día</option>
          </select>
        </div>
      </div>

      {currentLoans.length > 0 ? (
        <>
          <div className="loans-summary">
            {currentLoans.map(loan => {
              const progress = ((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100;
              const statusInfo = getStatusInfo(loan);
              const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
              
              return (
                <div key={loan.id} className="loan-summary-item">
                  <div className="loan-header">
                    <div className="loan-amount">
                      <span className="label">Monto original:</span>
                      <span className="value">S/ {(loan?.originalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className={`status-indicator ${statusInfo.class}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </div>
                  </div>
                  
                  <div className="loan-details">
                    <div className="detail-row">
                      <span className="label">Saldo pendiente:</span>
                      <span className="value">S/ {(loan?.remainingAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Pago semanal:</span>
                      <span className="value">S/ {Math.ceil(weeklyPayment)}</span>
                    </div>
                    {statusInfo.class === 'overdue' && (
                      <div className="detail-row overdue">
                        <span className="label">Total con mora:</span>
                        <span className="value">S/ {Math.ceil(weeklyPayment * 1.05)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="loan-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      <span className="progress-text">{progress.toFixed(1)}% pagado</span>
                      <span className="weeks-text">
                        Semana {loan.currentWeek || loan.currentInstallment} de {loan.totalWeeks || loan.installments}
                      </span>
                    </div>
                  </div>
                  
                  <div className="next-payment-info">
                    <div className="payment-date">
                      <span className="label">Próximo pago: </span>
                      <span className="value">
                        {getNextWednesday().toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="loans-pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages} ({filteredLoans.length} préstamos)
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-data">
          {dateFilter === 'overdue' ? 'No tienes préstamos vencidos' : 
           dateFilter === 'recent' ? 'No tienes préstamos recientes' : 
           dateFilter === 'current' ? 'No tienes préstamos al día' :
           'No tienes préstamos activos'}
        </div>
      )}
    </>
  );
};

const MemberNotificationsSection = ({ userNotifications }) => {
  const [notificationFilter, setNotificationFilter] = useState('all');
  
  const getFilteredNotifications = () => {
    let filtered = [...userNotifications];
    
    if (notificationFilter === 'approved') {
      filtered = filtered.filter(notification => notification.type === 'approved');
    } else if (notificationFilter === 'rejected') {
      filtered = filtered.filter(notification => notification.type === 'rejected');
    }
    
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      <div className="notifications-header">
        <h3>🔔 Notificaciones</h3>
        <div className="notifications-filters">
          <select 
            value={notificationFilter} 
            onChange={(e) => setNotificationFilter(e.target.value)}
            className="notification-filter"
          >
            <option value="all">📋 Todas</option>
            <option value="approved">✅ Aprobadas</option>
            <option value="rejected">❌ Rechazadas</option>
          </select>
        </div>
      </div>

      {filteredNotifications.length > 0 ? (
        <div className="notifications-list">
          {filteredNotifications.map(notification => (
            <div key={notification.id} className={`notification-item ${notification.type}`}>
              <div className="notification-header">
                <div className="notification-status">
                  {notification.type === 'approved' && (
                    <span className="status-badge approved">✅ Solicitud Aprobada</span>
                  )}
                  {notification.type === 'rejected' && (
                    <span className="status-badge rejected">❌ Solicitud Rechazada</span>
                  )}
                </div>
                <div className="notification-date">
                  {new Date(notification.date).toLocaleDateString('es-ES')}
                </div>
              </div>
              
              <div className="notification-content">
                <div className="notification-message">{notification.message}</div>
                
                {notification.type === 'approved' && (
                  <div className="approval-details">
                    <div className="details-grid">
                      <div className="detail-card">
                        <div className="detail-icon">💰</div>
                        <div className="detail-info">
                          <span className="detail-label">Monto</span>
                          <span className="detail-value">S/ {(notification.amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="detail-card">
                        <div className="detail-icon">📅</div>
                        <div className="detail-info">
                          <span className="detail-label">Plazo</span>
                          <span className="detail-value">{notification.totalWeeks || notification.installments} semanas</span>
                        </div>
                      </div>
                      
                      <div className="detail-card">
                        <div className="detail-icon">💳</div>
                        <div className="detail-info">
                          <span className="detail-label">Pago Semanal</span>
                          <span className="detail-value">S/ {(notification.weeklyPayment || notification.monthlyPayment || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="success-alert">
                      <div className="alert-icon">🎉</div>
                      <div className="alert-content">
                        <strong>¡Felicidades!</strong> Tu préstamo será procesado el próximo miércoles (día de operaciones).
                      </div>
                    </div>
                  </div>
                )}
                
                {notification.type === 'rejected' && notification.reason && (
                  <div className="rejection-details">
                    <div className="rejection-reason">
                      <div className="reason-icon">📝</div>
                      <div className="reason-content">
                        <span className="reason-label">Motivo del rechazo:</span>
                        <span className="reason-text">{notification.reason}</span>
                      </div>
                    </div>
                    
                    <div className="info-alert">
                      <div className="alert-icon">💡</div>
                      <div className="alert-content">
                        Puedes realizar una nueva solicitud después de mejorar tu situación crediticia.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">
          {notificationFilter === 'approved' ? 'No tienes solicitudes aprobadas' : 
           notificationFilter === 'rejected' ? 'No tienes solicitudes rechazadas' : 
           'No tienes notificaciones nuevas'}
        </div>
      )}
    </>
  );
};

const Dashboard = ({ 
  user, 
  loans, 
  setLoans, 
  members, 
  setMembers, 
  loanRequests, 
  setLoanRequests, 
  settings, 
  setSettings,
  calculateTotalCapital,
  calculateAvailableCapital,
  getBankingStatistics,
  getMonthlyInterestRate,
  calculateLateFee,
  getPaymentWithLateFee,
  users,
  setUsers 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getOverdueLoans = () => {
    const today = new Date();
    return loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate < today && loan.status !== 'paid';
    });
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate >= today && dueDate <= nextWeek && loan.status !== 'paid';
    });
  };

  const getUserMember = () => {
    if (user.role === 'member' && user.memberId) {
      return members.find(member => member.id === user.memberId);
    }
    return null;
  };

  const getUserLoans = () => {
    if (user.role === 'member' && user.memberId) {
      // Solo préstamos realmente activos (excluir solicitudes pendientes y rechazadas)
      return loans.filter(loan => 
        loan.memberId === user.memberId && 
        loan.status !== 'Por aprobar' && 
        loan.status !== 'Rechazada'
      );
    }
    return [];
  };

  const getAllUserLoans = () => {
    if (user.role === 'member' && user.memberId) {
      // Todos los préstamos del usuario (incluyendo solicitudes pendientes)
      return loans.filter(loan => loan.memberId === user.memberId);
    }
    return [];
  };

  const getUserNotifications = () => {
    if (user.role !== 'member' || !user.memberId) return [];
    
    return loanRequests
      .filter(request => request.memberId === user.memberId)
      .filter(request => request.status === 'approved' || request.status === 'rejected')
      .map(request => ({
        id: request.id,
        type: request.status,
        title: request.status === 'approved' ? '✅ Solicitud Aprobada' : '❌ Solicitud Rechazada',
        message: request.status === 'approved' 
          ? `Tu solicitud de préstamo por S/ ${(request?.amount || 0).toLocaleString()} ha sido aprobada.`
          : `Tu solicitud de préstamo por S/ ${(request?.amount || 0).toLocaleString()} ha sido rechazada.`,
        amount: request.amount,
        date: request.status === 'approved' ? request.approvedDate : request.rejectedDate,
        reason: request.rejectionReason || null,
        installments: request.installments,
        monthlyPayment: request.monthlyPayment,
        weeklyPayment: request.weeklyPayment,
        totalWeeks: request.totalWeeks
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Función para calcular el próximo miércoles
  const getNextWednesday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 3 = miércoles
    const daysToAdd = dayOfWeek <= 3 ? 3 - dayOfWeek : 7 - dayOfWeek + 3;
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysToAdd);
    return nextWednesday;
  };

  const getStatusInfo = (loan) => {
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
  };

  const renderDashboardContent = () => {
    const bankingStats = getBankingStatistics ? getBankingStatistics() : {
      totalCapital: calculateTotalCapital(),
      availableCapital: calculateAvailableCapital(),
      capitalUtilization: 0,
      totalShares: 0,
      memberCount: members.length
    };
    const totalCapital = bankingStats.totalCapital;
    const availableCapital = bankingStats.availableCapital;
    const overdueLoans = getOverdueLoans();
    const upcomingPayments = getUpcomingPayments();
    const userMember = getUserMember();
    const userLoans = getUserLoans();
    const userNotifications = getUserNotifications();

    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>
            {user.role === 'admin' && '📊 Dashboard Administrativo'}
            {user.role === 'member' && '👤 Mi Dashboard'}
            {user.role === 'external' && '🌐 Portal Cliente Externo'}
          </h2>
          <div className="current-date">
            📅 {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="stats-grid">
          {user.role === 'admin' && (
            <>
              <div className="stat-card total">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Capital Total</h3>
                  <div className="stat-value">S/ {totalCapital.toLocaleString()}</div>
                  <div className="stat-subtitle">
                    Base: S/ {bankingStats.baseCapital?.toLocaleString() || '0'}
                  </div>
                  <div className="stat-detail">
                    <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#27ae60' }}>
                      📈 Rentabilidad: {bankingStats.profitMargin || '0'}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card available">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3>Capital Disponible</h3>
                  <div className="stat-value">S/ {availableCapital.toLocaleString()}</div>
                  <div className="stat-subtitle">
                    {bankingStats.capitalUtilization}% en préstamos
                  </div>
                  <div className="stat-detail">
                    Prestado: S/ {bankingStats.loanedCapital?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              <div className="stat-card loans">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Préstamos Activos</h3>
                  <div className="stat-value">{loans.length}</div>
                  <div className="stat-subtitle">
                    S/ {loans.reduce((sum, loan) => sum + loan.remainingAmount, 0).toLocaleString()} pendiente
                  </div>
                </div>
              </div>

              <div className="stat-card alerts">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <h3>Alertas</h3>
                  <div className="stat-value">{overdueLoans.length}</div>
                  <div className="stat-subtitle">préstamos vencidos</div>
                </div>
              </div>
            </>
          )}

          {user.role === 'member' && userMember && (
            <>
              <div className="stat-card member-info">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <h3>Mi Información</h3>
                  <div className="stat-value">{userMember.name}</div>
                  <div className="stat-subtitle">
                    Calificación: <span className={`credit-rating ${userMember.creditRating}`}>
                      {userMember.creditRating === 'green' && '🟢'}
                      {userMember.creditRating === 'yellow' && '🟡'}
                      {userMember.creditRating === 'red' && '🔴'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card guarantee">
                <div className="stat-icon">🏛️</div>
                <div className="stat-content">
                  <h3>Mi Garantía</h3>
                  <div className="stat-value">S/ {((userMember?.shares || 0) * (settings?.shareValue || 500)).toLocaleString()}</div>
                  <div className="stat-subtitle">{userMember?.shares || 0} acciones</div>
                </div>
              </div>

              <div className="stat-card my-loans">
                <div className="stat-icon">💳</div>
                <div className="stat-content">
                  <h3>Mis Préstamos</h3>
                  <div className="stat-value">{userLoans.filter(loan => loan.status !== 'paid').length}</div>
                  <div className="stat-subtitle">
                    S/ {userLoans.filter(loan => loan.status !== 'paid').reduce((sum, loan) => sum + loan.remainingAmount, 0).toLocaleString()} pendiente
                  </div>
                </div>
              </div>

              <div className="stat-card limit">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Límite Disponible</h3>
                  <div className="stat-value">
                    S/ {Math.max(0, 
                      Math.min(
                        settings?.loanLimits?.individual || 8000, 
                        ((userMember?.shares || 0) * (settings?.shareValue || 500)) * 0.8
                      ) - userLoans.filter(loan => loan.status !== 'paid').reduce((sum, loan) => sum + loan.remainingAmount, 0)
                    ).toLocaleString()}
                  </div>
                  <div className="stat-subtitle">límite de préstamo</div>
                </div>
              </div>
            </>
          )}

          {user.role === 'external' && (
            <>
              <div className="stat-card external-info">
                <div className="stat-icon">🌐</div>
                <div className="stat-content">
                  <h3>Acceso Externo</h3>
                  <div className="stat-value">Información Pública</div>
                  <div className="stat-subtitle">Tasas y condiciones</div>
                </div>
              </div>

              <div className="stat-card rates">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Tasas de Interés</h3>
                  <div className="stat-value">{settings.monthlyInterestRates?.medium || 5}%</div>
                  <div className="stat-subtitle">tasa promedio</div>
                </div>
              </div>
            </>
          )}
        </div>

        {user.role === 'admin' && (
          <div className="dashboard-sections">
            <div className="section upcoming-payments">
              <h3>🗓️ Próximos Vencimientos (7 días)</h3>
              {upcomingPayments.length > 0 ? (
                <div className="payments-list">
                  {upcomingPayments.map(loan => (
                    <div key={loan.id} className="payment-item">
                      <div className="payment-member">{loan.memberName}</div>
                      <div className="payment-amount">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</div>
                      <div className="payment-date">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No hay pagos próximos en los siguientes 7 días</div>
              )}
            </div>

            <div className="section overdue-loans">
              <h3>⚠️ Préstamos Vencidos</h3>
              {overdueLoans.length > 0 ? (
                <div className="overdue-list">
                  {overdueLoans.map(loan => (
                    <div key={loan.id} className="overdue-item">
                      <div className="overdue-member">{loan.memberName}</div>
                      <div className="overdue-amount">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</div>
                      <div className="overdue-days">
                        {Math.floor((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))} días
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">✅ No hay préstamos vencidos</div>
              )}
            </div>
          </div>
        )}

        {user.role === 'member' && (
          <div className="dashboard-sections-member">
            <div className="loans-column">
              <div className="section my-loans-detail">
                <h3>💳 Mis Préstamos Activos</h3>
                <MemberLoansSection 
                  userLoans={userLoans} 
                  getStatusInfo={getStatusInfo}
                />
              </div>
            </div>

            <div className="notifications-column">
              {/* Sección de Notificaciones para Miembros */}
              <div className="section member-notifications">
                <MemberNotificationsSection 
                  userNotifications={userNotifications}
                />
              </div>

              {/* Sección de Plan de Ahorro para Miembros */}
              <div className="section member-savings-plan">
                <h3>💰 Mi Plan de Ahorro a Plazo Fijo</h3>
                <div className="savings-plan-info">
                  <p className="savings-intro">
                    Haz crecer tu garantía con nuestro plan de ahorro a plazo fijo con una TEA del 2%
                  </p>
                  <button 
                    className="view-savings-plan-btn"
                    onClick={() => setActiveTab('savings')}
                  >
                    Ver Plan de Ahorro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    const userMember = getUserMember();
    
    switch(activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'loans':
        return <LoansTable 
          loans={user.role === 'member' ? getAllUserLoans() : loans}
          setLoans={setLoans}
          members={members}
          userRole={user.role}
          calculateLateFee={calculateLateFee}
          getPaymentWithLateFee={getPaymentWithLateFee}
        />;
      case 'request':
        return <LoanRequest 
          user={user}
          members={members}
          loans={loans}
          setLoans={setLoans}
          settings={settings}
          getMonthlyInterestRate={getMonthlyInterestRate}
          calculateAvailableCapital={calculateAvailableCapital}
          loanRequests={loanRequests}
          setLoanRequests={setLoanRequests}
        />;
      case 'members':
        return <MembersTable 
          members={members} 
          setMembers={setMembers} 
          settings={settings}
          users={users}
          setUsers={setUsers}
        />;
      case 'admin':
        return <AdminPanel 
          loanRequests={loanRequests}
          setLoanRequests={setLoanRequests}
          loans={loans}
          setLoans={setLoans}
          members={members}
          setMembers={setMembers}
          settings={settings}
          getPaymentWithLateFee={getPaymentWithLateFee}
        />;
      case 'reports':
        return <Reports loans={loans} members={members} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} loans={loans} />;
      case 'calendar':
        return <Calendar 
          loans={loans} 
          members={members} 
          loanRequests={loanRequests}
          onUpdateLoan={setLoans}
          onUpdateLoanRequest={setLoanRequests}
          currentUser={user}
        />;
      case 'savings':
        if (user.role === 'member' && userMember) {
          return <SavingsPlan 
            memberName={userMember.name}
            memberId={user.memberId}
            memberData={userMember}
            settings={settings}
            onSavingsUpdate={(savingsData) => {
              console.log('Nuevo plan de ahorro:', savingsData);
              // Aquí se podría guardar en el estado si es necesario
            }}
          />;
        }
        return renderDashboardContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        
        {(user.role === 'admin' || user.role === 'member') && (
          <button 
            className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            💰 Préstamos
          </button>
        )}
        
        {user.role === 'member' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              📝 Solicitar
            </button>
            <button 
              className={`tab-btn ${activeTab === 'savings' ? 'active' : ''}`}
              onClick={() => setActiveTab('savings')}
            >
              💰 Plan de Ahorro
            </button>
          </>
        )}
        
        {(user.role === 'admin' || user.role === 'member') && (
          <button 
            className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Calendario
          </button>
        )}
        
        {user.role === 'admin' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              👥 Miembros
            </button>
            <button 
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              ⚙️ Gestión
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📈 Reportes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              🔧 Configuración
            </button>
          </>
        )}
      </div>

      <div className="dashboard-main">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;