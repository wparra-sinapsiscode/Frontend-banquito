import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = ({ loans, members, loanRequests, onUpdateLoan, onUpdateLoanRequest, currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('payments');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Forzar actualización cuando cambian las solicitudes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [loanRequests]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];

    if (activeView === 'payments') {
      // Eventos de pagos y vencimientos
      loans.forEach(loan => {
        // Vencimientos - Mostrar un día antes para recordatorio
        const dueDate = new Date(loan.dueDate);
        dueDate.setDate(dueDate.getDate() - 1);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        // Debug para préstamos con fechas
        if (loan.memberName === 'Arteaga' || loan.memberName === 'edward' || loan.memberName === 'Julia') {
          console.log('🔍 Calendar Debug - Préstamo:', {
            memberName: loan.memberName,
            originalDueDate: loan.dueDate,
            dueDateStr: dueDateStr,
            currentDateStr: dateStr,
            matches: dueDateStr === dateStr,
            status: loan.status,
            dayOfWeek: new Date(loan.dueDate).getDay(),
            expectedWednesday: loan.dueDate // Debería ser miércoles (día 3)
          });
        }
        
        if (dueDateStr === dateStr && loan.status !== 'paid' && 
            loan.status !== 'Por aprobar' && loan.status !== 'Rechazada') {
          const paymentAmount = loan.weeklyPayment || loan.monthlyPayment || 0;
          const currentWeek = loan.currentWeek || loan.currentInstallment || 1;
          const member = members.find(m => m.id === loan.memberId);
          
          // Debug adicional para edward
          if (loan.memberName === 'edward') {
            console.log('🎯 Calendar - Edward aparece en fecha:', {
              dateStr: dateStr,
              date: new Date(dateStr),
              dayOfWeek: new Date(dateStr).getDay(),
              dayName: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(dateStr).getDay()]
            });
          }
          
          events.push({
            type: 'payment',
            title: `${loan.memberName}`,
            amount: paymentAmount,
            amountStr: `S/ ${paymentAmount.toLocaleString()}`,
            detail: `Vencimiento semana #${currentWeek}`,
            memberId: loan.memberId,
            loanId: loan.id,
            creditRating: member?.creditRating || 'unrated'
          });
        }

        // Pagos realizados
        loan.paymentHistory.forEach(payment => {
          if (payment.date === dateStr) {
            const member = members.find(m => m.id === loan.memberId);
            events.push({
              type: 'payment_made',
              title: `${loan.memberName}`,
              amount: payment.amount,
              amountStr: `S/ ${payment.amount.toLocaleString()}`,
              detail: 'Pago realizado',
              memberId: loan.memberId,
              loanId: loan.id,
              creditRating: member?.creditRating || 'unrated'
            });
          }
        });
      });
    } else {
      // Eventos de solicitudes y desembolsos - SOLO PENDIENTES
      loanRequests.forEach(request => {
        // Usar requiredDate en lugar de requestDate para mostrar el evento cuando se necesita el dinero
        const eventDate = request.requiredDate ? new Date(request.requiredDate) : new Date(request.requestDate);
        if (eventDate.toISOString().split('T')[0] === dateStr) {
          // SOLO mostrar solicitudes pendientes para poder aprobar/rechazar
          if (request.status === 'pending') {
            events.push({
              type: 'request',
              title: `${request.memberName}`,
              amount: request.amount,
              amountStr: `S/ ${request.amount.toLocaleString()}`,
              detail: `Solicitud pendiente`,
              memberId: request.memberId,
              requestId: request.id,
              requiredDate: request.requiredDate,
              requestDate: request.requestDate
            });
          }
          // NO mostrar solicitudes aprobadas, rechazadas o procesadas
        }
      });
    }

    return events;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getMonthlyStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    console.log('📅 Calendar Debug - Calculando estadísticas para:', {
      year,
      month: month + 1,
      firstDay: firstDay.toLocaleDateString(),
      lastDay: lastDay.toLocaleDateString(),
      activeView,
      totalLoans: loans.length,
      totalRequests: loanRequests.length
    });

    if (activeView === 'payments') {
      let vencimientosDelMes = 0;
      let totalPorCobrar = 0; // Total programado para cobrar en el mes
      let totalPagosRecibidos = 0; // Total efectivamente recibido en el mes
      let cantidadPagosRecibidos = 0;

      // Calcular todos los vencimientos programados para este mes
      loans.forEach(loan => {
        // Buscar todos los pagos que vencen en este mes (usando lógica de cronograma semanal)
        const loanStartDate = new Date(loan.approvedDate || loan.requestDate);
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        const totalWeeks = loan.totalWeeks || loan.installments || 12;

        // Calcular todas las fechas de vencimiento del préstamo
        for (let week = 1; week <= totalWeeks; week++) {
          const paymentDate = new Date(loanStartDate);
          paymentDate.setDate(paymentDate.getDate() + (week * 7)); // Cada 7 días (semanal)
          
          // Si esta fecha de pago está en el mes actual
          if (paymentDate >= firstDay && paymentDate <= lastDay) {
            vencimientosDelMes++;
            totalPorCobrar += weeklyPayment;
            
            console.log('💰 Vencimiento programado:', {
              member: loan.memberName,
              semana: week,
              fechaVencimiento: paymentDate.toLocaleDateString(),
              monto: weeklyPayment
            });
          }
        }

        // Calcular pagos efectivamente recibidos en este mes
        if (loan.paymentHistory && loan.paymentHistory.length > 0) {
          loan.paymentHistory.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate >= firstDay && paymentDate <= lastDay && payment.amount) {
              totalPagosRecibidos += payment.amount;
              cantidadPagosRecibidos++;
              console.log('✅ Pago recibido:', {
                member: loan.memberName,
                fecha: payment.date,
                monto: payment.amount
              });
            }
          });
        }
      });

      console.log('📊 Estadísticas del mes calculadas:', {
        vencimientosDelMes,
        totalPorCobrar,
        totalPagosRecibidos,
        cantidadPagosRecibidos,
        pendientePorCobrar: totalPorCobrar - totalPagosRecibidos
      });

      return {
        label1: 'Vencimientos del Mes',
        value1: vencimientosDelMes,
        label2: 'Por Cobrar',
        value2: `S/ ${(totalPorCobrar || 0).toLocaleString()}`,
        label3: 'Pagos Recibidos',
        value3: `S/ ${(totalPagosRecibidos || 0).toLocaleString()}`,
        label4: 'Pendiente por Cobrar',
        value4: `S/ ${Math.max(0, (totalPorCobrar || 0) - (totalPagosRecibidos || 0)).toLocaleString()}`
      };
    } else {
      // Estadísticas para la sección de Solicitudes - SOLO PENDIENTES
      const solicitudesPendientes = loanRequests.filter(r => r.status === 'pending');
      const montoTotalPendiente = solicitudesPendientes.reduce((sum, req) => sum + (req.amount || 0), 0);
      
      // Solicitudes pendientes del mes actual
      const solicitudesPendientesDelMes = solicitudesPendientes.filter(request => {
        const requestDate = new Date(request.requestDate);
        return requestDate >= firstDay && requestDate <= lastDay;
      }).length;

      console.log('📊 Estadísticas de Solicitudes Pendientes:', {
        totalPendientes: solicitudesPendientes.length,
        solicitudesPendientesDelMes,
        montoTotalPendiente
      });

      return {
        label1: 'Solicitudes Pendientes',
        value1: solicitudesPendientes.length,
        label2: 'Monto Total Pendiente',
        value2: `S/ ${(montoTotalPendiente || 0).toLocaleString()}`,
        label3: 'Del Mes Actual',
        value3: solicitudesPendientesDelMes,
        label4: 'Promedio por Solicitud',
        value4: solicitudesPendientes.length > 0 ? 
          `S/ ${Math.round(montoTotalPendiente / solicitudesPendientes.length).toLocaleString()}` : 
          'S/ 0'
      };
    }
  };

  const handleDayClick = (date) => {
    const events = getEventsForDate(date);
    if (events.length > 0) {
      setSelectedDate(date);
      setShowDayDetail(true);
    }
  };

  const closeDayDetail = () => {
    setShowDayDetail(false);
    setSelectedDate(null);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const closeEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  // Función para calcular la fecha del próximo miércoles
  const getNextWednesday = (date) => {
    const nextDate = new Date(date);
    const dayOfWeek = nextDate.getDay(); // 0 = domingo, 3 = miércoles
    
    // Si es miércoles, ir al próximo miércoles (7 días después)
    // Si no es miércoles, ir al próximo miércoles más cercano
    let daysToAdd;
    if (dayOfWeek === 3) {
      // Si es miércoles, ir al próximo miércoles (7 días después)
      daysToAdd = 7;
    } else if (dayOfWeek < 3) {
      // Si es domingo (0), lunes (1) o martes (2), ir al miércoles de la misma semana
      daysToAdd = 3 - dayOfWeek;
    } else {
      // Si es jueves (4), viernes (5) o sábado (6), ir al miércoles de la próxima semana
      daysToAdd = 7 - dayOfWeek + 3;
    }
    
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  };

  // Función para calcular semanas de atraso
  const calculateWeeksLate = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    // Evitar problemas de zona horaria
    const dueDateStr = dueDate.includes('T') ? 
      new Date(dueDate).toISOString().split('T')[0] : 
      dueDate;
    const due = new Date(dueDateStr + 'T00:00:00');
    
    const diffTime = today - due;
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(0, diffWeeks);
  };

  const handleEventAction = async (action, eventData) => {
    try {
      if (action === 'pay') {
        // Registrar pago
        const loan = loans.find(l => l.id === eventData.loanId);
        if (loan && onUpdateLoan) {
          // Calcular si el pago es puntual o tardío
          const weeksLate = calculateWeeksLate(loan.dueDate);
          let scoreChange = 0;
          let reason = '';

          if (weeksLate === 0) {
            // Pago puntual: +2 puntos
            scoreChange = 2;
            reason = 'Pago puntual';
          } else if (weeksLate === 1) {
            // 1 semana de atraso: -5 puntos
            scoreChange = -5;
            reason = `Pago con 1 semana de atraso`;
          } else if (weeksLate >= 2) {
            // 2+ semanas de atraso: -10 puntos
            scoreChange = -10;
            reason = `Pago con ${weeksLate} semanas de atraso`;
          }

          const newPaymentHistory = [...loan.paymentHistory, {
            date: new Date().toISOString().split('T')[0],
            amount: eventData.amount,
            type: 'payment',
            weeksLate: weeksLate,
            scoreChange: scoreChange
          }];

          const newRemainingAmount = Math.max(0, loan.remainingAmount - eventData.amount);
          const newCurrentInstallment = eventData.amount >= (loan.weeklyPayment || loan.monthlyPayment) ?
            loan.currentInstallment + 1 : loan.currentInstallment;

          let newStatus = 'current';
          if (newRemainingAmount === 0) {
            newStatus = 'paid';
          } else {
            const dueDate = new Date(loan.dueDate);
            const today = new Date();
            if (dueDate < today) {
              newStatus = 'overdue';
            }
          }

          // Calcular la próxima fecha de vencimiento desde el cronograma
          let nextDueDate = loan.dueDate;
          if (newCurrentInstallment <= (loan.totalWeeks || loan.installments) && loan.paymentSchedule) {
            // Usar la fecha del cronograma si existe
            const nextPayment = loan.paymentSchedule[newCurrentInstallment - 1];
            if (nextPayment) {
              nextDueDate = nextPayment.dueDate;
            }
          } else if (newCurrentInstallment <= (loan.totalWeeks || loan.installments)) {
            // Fallback: calcular próximo miércoles solo si no hay cronograma
            const currentDueDate = new Date(loan.dueDate);
            currentDueDate.setDate(currentDueDate.getDate() + 7);
            const nextWednesday = getNextWednesday(currentDueDate);
            nextDueDate = nextWednesday.toISOString().split('T')[0];
          }

          const updatedLoans = loans.map(l => l.id === loan.id ? {
            ...l,
            remainingAmount: newRemainingAmount,
            currentInstallment: newCurrentInstallment,
            paymentHistory: newPaymentHistory,
            status: newStatus,
            dueDate: nextDueDate
          } : l);

          onUpdateLoan(updatedLoans);
          
          // Nota: En Calendar no podemos actualizar directamente el score de miembros
          // porque no tenemos acceso a setMembers. Esto debe manejarse en el componente padre.
          console.log(`📊 Cambio de puntaje sugerido para ${loan.memberName}: ${scoreChange} (${reason})`);
        }
      } else if (action === 'approve_request') {
        // Aprobar solicitud y crear préstamo con cronograma específico
        const request = loanRequests.find(r => r.id === eventData.requestId);
        if (request && onUpdateLoanRequest && onUpdateLoan) {
          // Generar cronograma de pagos usando el próximo miércoles desde la fecha requerida
          // La generación de cronogramas será implementada con datos del backend
          const requiredDate = new Date(request.requiredDate || request.requestDate);
          
          // Calcular el próximo miércoles desde la fecha requerida
          const nextWednesday = getNextWednesday(requiredDate);
          const startDate = nextWednesday.toISOString().split('T')[0];
          
          console.log('🔍 Debug Calendar - Aprobando solicitud:', {
            memberName: request.memberName,
            amount: request.amount,
            requiredDate: request.requiredDate,
            requestDate: request.requestDate,
            nextWednesday: nextWednesday.toLocaleDateString(),
            startDate: startDate
          });
          
          // Cronograma será generado por el backend
          const paymentSchedule = [];

          console.log('📅 Debug Calendar - Cronograma será implementado desde backend');

          // La primera fecha de pago viene del cronograma
          const firstPaymentDate = startDate;
          
          console.log('✅ Debug Calendar - Primera fecha de pago:', firstPaymentDate);

          // Crear nuevo préstamo con cronograma
          const newLoan = {
            id: Date.now(),
            memberId: request.memberId,
            memberName: request.memberName,
            originalAmount: request.amount,
            remainingAmount: request.amount,
            installments: request.totalWeeks || request.installments,
            totalWeeks: request.totalWeeks || request.installments,
            currentInstallment: 1,
            currentWeek: 1,
            interestRate: request.monthlyInterestRate,
            monthlyPayment: request.weeklyPayment || request.monthlyPayment || 0,
            weeklyPayment: request.weeklyPayment || request.monthlyPayment || 0,
            dueDate: firstPaymentDate,
            status: 'current',
            paymentHistory: [],
            paymentSchedule: paymentSchedule, // Agregar cronograma completo
            approvedDate: new Date().toISOString(),
            approvedBy: 'admin',
            purpose: request.purpose,
            requestDate: request.requestDate
          };

          // Actualizar préstamos
          const updatedLoans = [...loans, newLoan];
          onUpdateLoan(updatedLoans);

          // Marcar la solicitud como aprobada
          const updatedRequests = loanRequests.map(r => r.id === request.id ? {
            ...r,
            status: 'approved',
            approvedDate: new Date().toISOString().split('T')[0],
            approvedBy: 'admin'
          } : r);
          onUpdateLoanRequest(updatedRequests);
        }
      } else if (action === 'reject_request') {
        // Rechazar solicitud
        const request = loanRequests.find(r => r.id === eventData.requestId);
        if (request && onUpdateLoanRequest) {
          const updatedRequests = loanRequests.map(r => r.id === request.id ? {
            ...r,
            status: 'rejected',
            rejectedDate: new Date().toISOString().split('T')[0],
            rejectionReason: eventData.reason || 'Sin motivo especificado'
          } : r);
          onUpdateLoanRequest(updatedRequests);
        }
      }
      
      // Cerrar modales y forzar actualización
      closeEventDetail();
      if (showDayDetail) {
        setShowDayDetail(false);
        setSelectedDate(null);
      }
      
      // Pequeño delay para asegurar que se procese el cambio de estado
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
      
    } catch (error) {
      console.error('Error al procesar la acción:', error);
    }
  };

  const getDayDetailData = () => {
    if (!selectedDate) return { events: [], totalAmount: 0 };
    
    const events = getEventsForDate(selectedDate);
    const totalAmount = events.reduce((sum, event) => sum + event.amount, 0);
    
    return { events, totalAmount };
  };

  const renderCalendarDay = (date) => {
    const events = getEventsForDate(date);
    
    let dayClasses = 'calendar-day';
    if (!isCurrentMonth(date)) dayClasses += ' other-month';
    if (isToday(date)) dayClasses += ' today';
    if (events.length > 0) dayClasses += ' has-events';

    return (
      <div 
        key={`${date.toISOString()}-${refreshKey}`} 
        className={dayClasses}
        onClick={() => handleDayClick(date)}
      >
        <div className="day-number">{date.getDate()}</div>
        
        <div className="day-events">
          {events.length > 0 ? (
            events.slice(0, 2).map((event, index) => (
              <div 
                key={index} 
                className={`event-item event-${event.type} ${event.creditRating ? `credit-${event.creditRating}` : ''}`}
                title={`${event.title} - ${event.amountStr} - ${event.detail}`}
              >
                {event.title}
              </div>
            ))
          ) : (
            <div className="no-events">Sin eventos</div>
          )}
          
          {events.length > 2 && (
            <div className="event-count-badge">+{events.length - 2}</div>
          )}
        </div>
      </div>
    );
  };

  const days = getDaysInMonth();
  const stats = getMonthlyStats();
  const dayDetailData = getDayDetailData();

  return (
    <div className="calendar-container">
      <div className="calendar-wrapper">
        <div className="calendar-header">
          <div className="calendar-navigation">
            <button className="nav-button" onClick={() => navigateMonth(-1)}>
              ←
            </button>
            <button className="nav-button" onClick={() => navigateMonth(1)}>
              →
            </button>
          </div>

          <h2 className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <div className="view-tabs">
            <button 
              className={`view-tab ${activeView === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveView('payments')}
            >
              Pagos
            </button>
            <button 
              className={`view-tab ${activeView === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveView('requests')}
            >
              Solicitudes
            </button>
          </div>
        </div>

        <div className="calendar-stats">
          <div className="stat-item">
            <div className="stat-label">{stats.label1}</div>
            <div className="stat-value">{stats.value1}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{stats.label2}</div>
            <div className="stat-value">{stats.value2}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{stats.label3}</div>
            <div className="stat-value">{stats.value3}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{stats.label4}</div>
            <div className="stat-value">{stats.value4}</div>
          </div>
        </div>

        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          
          {days.map(day => renderCalendarDay(day))}
        </div>
      </div>

      {showDayDetail && selectedDate && (
        <div className="modal-overlay" onClick={closeDayDetail}>
          <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Detalle del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </h3>
              <button className="close-btn" onClick={closeDayDetail}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="day-summary">
                <div className="summary-item">
                  <span className="summary-label">Total de eventos:</span>
                  <span className="summary-value">{dayDetailData.events.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total del día:</span>
                  <span className="summary-value total-amount">
                    S/ {dayDetailData.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="events-list">
                <h4>
                  {activeView === 'payments' ? 'Pagos y Vencimientos' : 'Solicitudes y Desembolsos'}
                </h4>
                
                {dayDetailData.events.map((event, index) => {
                  const member = members.find(m => m.id === event.memberId);
                  return (
                    <div 
                      key={index} 
                      className={`event-detail-item event-${event.type} clickable`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="event-member-info">
                        <div className="member-name">{event.title}</div>
                        <div className="member-details">
                          {member && (
                            <>
                              <span className={`credit-rating ${member.creditRating}`}>
                                ● {member.creditRating?.toUpperCase()}
                              </span>
                              <span className="credit-score">
                                {member.creditScore || 0}/90
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="event-details">
                        <div className="event-amount">{event.amountStr}</div>
                        <div className="event-description">{event.detail}</div>
                      </div>
                      
                      <div className={`event-type-badge ${event.type}`}>
                        {event.type === 'payment' && '💰 Pago Programado'}
                        {event.type === 'payment_made' && '✅ Pago Realizado'}
                        {event.type === 'request' && '📝 Aprobar/Rechazar'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEventDetail && selectedEvent && (
        <div className="modal-overlay" onClick={closeEventDetail}>
          <div className="event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Detalle del Evento - {selectedEvent.title}
              </h3>
              <button className="close-btn" onClick={closeEventDetail}>×</button>
            </div>
            
            <div className="modal-content">
              <EventDetailContent 
                event={selectedEvent}
                member={members.find(m => m.id === selectedEvent.memberId)}
                onAction={handleEventAction}
                onClose={closeEventDetail}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventDetailContent = ({ event, member, onAction, onClose }) => {
  const [paymentAmount, setPaymentAmount] = useState(event.amount);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionType) => {
    setLoading(true);
    try {
      if (actionType === 'pay') {
        await onAction('pay', { 
          ...event, 
          amount: paymentAmount 
        });
      } else if (actionType === 'approve') {
        await onAction('approve_request', event);
      } else if (actionType === 'reject') {
        await onAction('reject_request', { 
          ...event, 
          reason: rejectionReason 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-detail-content">
      {/* Información del miembro */}
      <div className="member-section">
        <h4>👤 Información del Asociado</h4>
        <div className="member-info-grid">
          <div className="info-item">
            <span className="label">Nombre:</span>
            <span className="value">{member?.name || 'No encontrado'}</span>
          </div>
          <div className="info-item">
            <span className="label">Teléfono:</span>
            <span className="value">{member?.phone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Garantía:</span>
            <span className="value">{member?.guarantee || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Calificación:</span>
            <div className="rating-info">
              <span className={`credit-rating ${member?.creditRating}`}>
                ● {member?.creditRating?.toUpperCase()}
              </span>
              <span className="credit-score">
                {member?.creditScore || 0}/90
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del evento */}
      <div className="event-section">
        <h4>📋 Detalles del Evento</h4>
        <div className="event-info-grid">
          <div className="info-item">
            <span className="label">Tipo:</span>
            <span className={`event-type-label ${event.type}`}>
              {event.type === 'payment' && '💰 Pago Programado (Registrar)'}
              {event.type === 'payment_made' && '✅ Pago Realizado'}
              {event.type === 'request' && '📝 Solicitud Pendiente (Aprobar/Rechazar)'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Monto:</span>
            <span className="value amount">{event.amountStr}</span>
          </div>
          <div className="info-item">
            <span className="label">Descripción:</span>
            <span className="value">{event.detail}</span>
          </div>
          {event.requiredDate && (
            <div className="info-item">
              <span className="label">Fecha Requerida:</span>
              <span className="value date-required">{event.requiredDate}</span>
            </div>
          )}
          {event.requestDate && (
            <div className="info-item">
              <span className="label">Fecha de Solicitud:</span>
              <span className="value date-original">{event.requestDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Acciones según el tipo de evento */}
      <div className="actions-section">
        <h4>⚡ Acciones Disponibles</h4>
        
        {event.type === 'payment' && (
          <div className="action-form">
            <div className="form-group">
              <label>Monto a pagar:</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                className="amount-input"
              />
            </div>
            <div className="action-buttons">
              <button 
                className="action-btn pay-btn"
                onClick={() => handleAction('pay')}
                disabled={loading || paymentAmount <= 0}
              >
                {loading ? 'Procesando...' : '💰 Registrar Pago'}
              </button>
            </div>
          </div>
        )}

        {event.type === 'request' && (
          <div className="action-form">
            <div className="action-buttons">
              <button 
                className="action-btn approve-btn"
                onClick={() => handleAction('approve')}
                disabled={loading}
              >
                {loading ? 'Procesando...' : '✅ Aprobar Solicitud'}
              </button>
              
              <div className="reject-section">
                <textarea
                  placeholder="Motivo del rechazo (opcional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="rejection-textarea"
                  rows="3"
                />
                <button 
                  className="action-btn reject-btn"
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : '❌ Rechazar Solicitud'}
                </button>
              </div>
            </div>
          </div>
        )}

        {event.type === 'payment_made' && (
          <div className="info-message">
            <p>ℹ️ Este pago ya ha sido registrado. No hay acciones disponibles.</p>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="close-modal-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default Calendar;