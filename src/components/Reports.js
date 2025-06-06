import React, { useState } from 'react';
import './Reports.css';
import * as XLSX from 'xlsx';

const Reports = ({ loans, members }) => {
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Estados para los filtros del cronograma
  const [filterMember, setFilterMember] = useState('');
  const [filterWeeks, setFilterWeeks] = useState('all');
  const [showOnlyWithPayments, setShowOnlyWithPayments] = useState(false);

  const calculateOverviewStats = () => {
    const totalLoans = loans.length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.originalAmount, 0);
    const totalPendingAmount = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const totalPaidAmount = totalLoanAmount - totalPendingAmount;
    
    const overdueLo = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      return dueDate < today && loan.status !== 'paid';
    });

    const paidLoans = loans.filter(loan => loan.status === 'paid');
    const currentLoans = loans.filter(loan => loan.status === 'current');

    return {
      totalLoans,
      totalLoanAmount,
      totalPendingAmount,
      totalPaidAmount,
      overdueLoans: overdueLo.length,
      paidLoans: paidLoans.length,
      currentLoans: currentLoans.length,
      collectionRate: totalLoanAmount > 0 ? (totalPaidAmount / totalLoanAmount) * 100 : 0,
      delinquencyRate: totalLoans > 0 ? (overdueLo.length / totalLoans) * 100 : 0
    };
  };

  const generateCollectionReport = () => {
    const today = new Date();
    const overdueLoans = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate < today && loan.status !== 'paid';
    });

    const upcomingPayments = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= nextWeek && loan.status !== 'paid';
    });

    return {
      overdueLoans: overdueLoans.map(loan => ({
        ...loan,
        daysPastDue: Math.floor((today - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))
      })),
      upcomingPayments,
      totalOverdueAmount: overdueLoans.reduce((sum, loan) => sum + (loan.weeklyPayment || loan.monthlyPayment || 0), 0),
      totalUpcomingAmount: upcomingPayments.reduce((sum, loan) => sum + (loan.weeklyPayment || loan.monthlyPayment || 0), 0)
    };
  };

  const generateMemberAnalysis = () => {
    const memberStats = members.map(member => {
      const memberLoans = loans.filter(loan => loan.memberId === member.id);
      const totalBorrowed = memberLoans.reduce((sum, loan) => sum + loan.originalAmount, 0);
      const totalPending = memberLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
      const hasOverdue = memberLoans.some(loan => {
        const dueDate = new Date(loan.dueDate);
        return dueDate < new Date() && loan.status !== 'paid';
      });

      return {
        ...member,
        totalLoans: memberLoans.length,
        totalBorrowed,
        totalPending,
        hasOverdue,
        utilizationRate: (totalBorrowed / (((member.shares || 0) * 500) * 0.8)) * 100
      };
    });

    return memberStats.sort((a, b) => b.totalBorrowed - a.totalBorrowed);
  };

  const generatePaymentSchedule = () => {
    const schedule = [];
    const today = new Date();
    
    // Obtener el lunes de la semana actual
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + 1);
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(currentMonday.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekLoans = loans.filter(loan => {
        const dueDate = new Date(loan.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd && loan.status !== 'paid';
      });

      // Usar weeklyPayment si existe, sino monthlyPayment
      const weeklyCollection = weekLoans.reduce((sum, loan) => {
        const payment = loan.weeklyPayment || loan.monthlyPayment || 0;
        return sum + payment;
      }, 0);
      
      const weekNumber = i + 1;
      const monthName = weekStart.toLocaleDateString('es-ES', { month: 'long' });
      
      schedule.push({
        week: `Semana ${weekNumber} - ${monthName}`,
        weekRange: `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
        paymentsCount: weekLoans.length,
        expectedAmount: weeklyCollection,
        loans: weekLoans.map(loan => ({
          ...loan,
          paymentAmount: loan.weeklyPayment || loan.monthlyPayment || 0
        })),
        weekStart: weekStart,
        weekEnd: weekEnd
      });
    }

    return schedule; // Mostrar todas las semanas, incluidas las que no tienen pagos
  };

  const exportToExcel = (data, filename) => {
    if (activeReport === 'collection') {
      exportCollectionToExcel(data, filename);
    } else if (activeReport === 'members') {
      exportMembersToExcel(data, filename);
    }
  };

  const exportCollectionToExcel = (data, filename) => {
    try {
      console.log('🔍 Exportando datos de cobranza:', data);
      console.log('📊 Préstamos vencidos:', data?.overdueLoans?.length || 0);
      console.log('📅 Próximos vencimientos:', data?.upcomingPayments?.length || 0);
      
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Resumen Ejecutivo
      const summaryData = [
        ['REPORTE DE COBRANZA - BANQUITO SYSTEM'],
        [`Fecha de Generación: ${new Date().toLocaleString('es-ES')}`],
        [''],
        ['RESUMEN EJECUTIVO'],
        ['Métrica', 'Valor'],
        ['Préstamos Vencidos', (data?.overdueLoans?.length || 0)],
        ['Monto Total Vencido', `S/ ${((data?.totalOverdueAmount || 0)).toLocaleString()}`],
        ['Próximos Vencimientos (7 días)', (data?.upcomingPayments?.length || 0)],
        ['Monto Próximos Vencimientos', `S/ ${((data?.totalUpcomingAmount || 0)).toLocaleString()}`]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Aplicar estilos al resumen
      summaryWs['A1'] = { v: 'REPORTE DE COBRANZA - BANQUITO SYSTEM', t: 's', s: { 
        font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "2E86AB" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { 
          top: { style: "medium", color: { rgb: "1A5276" } }, 
          bottom: { style: "medium", color: { rgb: "1A5276" } },
          left: { style: "medium", color: { rgb: "1A5276" } },
          right: { style: "medium", color: { rgb: "1A5276" } }
        }
      }};
      summaryWs['A4'] = { v: 'RESUMEN EJECUTIVO', t: 's', s: { 
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "28B463" } },
        alignment: { horizontal: "center" },
        border: { 
          top: { style: "thin", color: { rgb: "1E8449" } }, 
          bottom: { style: "thin", color: { rgb: "1E8449" } },
          left: { style: "thin", color: { rgb: "1E8449" } },
          right: { style: "thin", color: { rgb: "1E8449" } }
        }
      }};
      
      // Aplicar colores alternados a las filas de datos
      for (let row = 5; row <= 8; row++) {
        const bgColor = row % 2 === 0 ? "F8F9FA" : "E8F4FD";
        for (let col = 0; col < 2; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!summaryWs[cellRef]) summaryWs[cellRef] = {};
          summaryWs[cellRef].s = { 
            fill: { fgColor: { rgb: bgColor } },
            border: { 
              top: { style: "thin", color: { rgb: "BDC3C7" } }, 
              bottom: { style: "thin", color: { rgb: "BDC3C7" } },
              left: { style: "thin", color: { rgb: "BDC3C7" } },
              right: { style: "thin", color: { rgb: "BDC3C7" } }
            },
            font: { sz: 11 }
          };
        }
      }
      
      // Establecer anchos de columna
      summaryWs['!cols'] = [{ wch: 35 }, { wch: 30 }];
      
      // Merge cells para el título principal
      summaryWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
      
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
      
      // Hoja 2: TABLA EXACTA COMO EN LA WEB - Préstamos Vencidos (Cobranza)
      const overdueHeaders = ['Nombre', 'Monto Cuota', 'Días Vencido', 'Fecha Vencimiento', 'Teléfono'];
      let overdueRows = [];
      
      if (data?.overdueLoans && data.overdueLoans.length > 0) {
        overdueRows = data.overdueLoans.map(loan => {
          const member = members.find(m => m.id === loan.memberId);
          const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
          return [
            loan.memberName || 'N/A',
            `S/ ${weeklyPayment.toLocaleString()}`,
            `${loan.daysPastDue || 0} días`,
            new Date(loan.dueDate).toLocaleDateString('es-ES'),
            member?.phone || 'N/A'
          ];
        });
      } else {
        overdueRows = [['Sin préstamos vencidos', '', '', '', '']];
      }
      
      const overdueData = [
        ['PRÉSTAMOS VENCIDOS - TABLA DE COBRANZA'],
        ['Esta tabla corresponde a la sección "Cobranza" del sistema web'],
        [''],
        overdueHeaders,
        ...overdueRows
      ];
      
      const overdueWs = XLSX.utils.aoa_to_sheet(overdueData);
      
      // Aplicar formato a encabezados
      overdueWs['A1'] = { v: 'PRÉSTAMOS VENCIDOS - TABLA DE COBRANZA', t: 's', s: { 
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "C0392B" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { 
          top: { style: "medium", color: { rgb: "922B21" } }, 
          bottom: { style: "medium", color: { rgb: "922B21" } },
          left: { style: "medium", color: { rgb: "922B21" } },
          right: { style: "medium", color: { rgb: "922B21" } }
        }
      }};
      
      // Formato para encabezados de tabla
      overdueHeaders.forEach((header, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: 3, c: index });
        if (!overdueWs[cellRef]) overdueWs[cellRef] = {};
        overdueWs[cellRef].s = { 
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, 
          fill: { fgColor: { rgb: "EC7063" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: { 
            top: { style: "medium", color: { rgb: "A93226" } }, 
            bottom: { style: "medium", color: { rgb: "A93226" } },
            left: { style: "thin", color: { rgb: "A93226" } },
            right: { style: "thin", color: { rgb: "A93226" } }
          }
        };
      });
      
      // Aplicar formato a filas de datos con colores alternados
      for (let row = 4; row < 4 + overdueRows.length; row++) {
        const bgColor = row % 2 === 0 ? "FADBD8" : "F5B7B1";
        for (let col = 0; col < overdueHeaders.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!overdueWs[cellRef]) overdueWs[cellRef] = {};
          overdueWs[cellRef].s = { 
            fill: { fgColor: { rgb: bgColor } },
            border: { 
              top: { style: "thin", color: { rgb: "BDC3C7" } }, 
              bottom: { style: "thin", color: { rgb: "BDC3C7" } },
              left: { style: "thin", color: { rgb: "BDC3C7" } },
              right: { style: "thin", color: { rgb: "BDC3C7" } }
            },
            font: { sz: 10 },
            alignment: { horizontal: col === 0 ? "left" : "center" }
          };
        }
      }
      
      // Establecer anchos de columna
      overdueWs['!cols'] = [
        { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }
      ];
      
      // Merge cells para el título
      overdueWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
      
      XLSX.utils.book_append_sheet(wb, overdueWs, 'Cobranza');
      
      // Hoja 3: TABLA EXACTA COMO EN LA WEB - Próximos Vencimientos
      const upcomingHeaders = ['Nombre', 'Monto Cuota', 'Fecha Vencimiento', 'Teléfono'];
      let upcomingRows = [];
      
      if (data?.upcomingPayments && data.upcomingPayments.length > 0) {
        upcomingRows = data.upcomingPayments.map(loan => {
          const member = members.find(m => m.id === loan.memberId);
          const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
          return [
            loan.memberName || 'N/A',
            `S/ ${weeklyPayment.toLocaleString()}`,
            new Date(loan.dueDate).toLocaleDateString('es-ES'),
            member?.phone || 'N/A'
          ];
        });
      } else {
        upcomingRows = [['Sin próximos vencimientos', '', '', '']];
      }
      
      const upcomingData = [
        ['PRÓXIMOS VENCIMIENTOS (7 DÍAS)'],
        ['Esta tabla corresponde a la sección "Próximos Vencimientos" del sistema web'],
        [''],
        upcomingHeaders,
        ...upcomingRows
      ];
      
      const upcomingWs = XLSX.utils.aoa_to_sheet(upcomingData);
      
      // Aplicar formato
      upcomingWs['A1'] = { v: 'PRÓXIMOS VENCIMIENTOS (7 DÍAS)', t: 's', s: { 
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "D68910" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { 
          top: { style: "medium", color: { rgb: "B7950B" } }, 
          bottom: { style: "medium", color: { rgb: "B7950B" } },
          left: { style: "medium", color: { rgb: "B7950B" } },
          right: { style: "medium", color: { rgb: "B7950B" } }
        }
      }};
      
      // Formato para encabezados de tabla
      upcomingHeaders.forEach((header, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: 3, c: index });
        if (!upcomingWs[cellRef]) upcomingWs[cellRef] = {};
        upcomingWs[cellRef].s = { 
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, 
          fill: { fgColor: { rgb: "F4D03F" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: { 
            top: { style: "medium", color: { rgb: "D4AC0D" } }, 
            bottom: { style: "medium", color: { rgb: "D4AC0D" } },
            left: { style: "thin", color: { rgb: "D4AC0D" } },
            right: { style: "thin", color: { rgb: "D4AC0D" } }
          }
        };
      });
      
      // Aplicar formato a filas de datos con colores alternados
      for (let row = 4; row < 4 + upcomingRows.length; row++) {
        const bgColor = row % 2 === 0 ? "FCF3CF" : "F9E79F";
        for (let col = 0; col < upcomingHeaders.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!upcomingWs[cellRef]) upcomingWs[cellRef] = {};
          upcomingWs[cellRef].s = { 
            fill: { fgColor: { rgb: bgColor } },
            border: { 
              top: { style: "thin", color: { rgb: "BDC3C7" } }, 
              bottom: { style: "thin", color: { rgb: "BDC3C7" } },
              left: { style: "thin", color: { rgb: "BDC3C7" } },
              right: { style: "thin", color: { rgb: "BDC3C7" } }
            },
            font: { sz: 10 },
            alignment: { horizontal: col === 0 ? "left" : "center" }
          };
        }
      }
      
      upcomingWs['!cols'] = [
        { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 18 }
      ];
      
      // Merge cells para el título
      upcomingWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
      
      XLSX.utils.book_append_sheet(wb, upcomingWs, 'Próximos Vencimientos');
      
      console.log('✅ Generando archivo Excel:', filename);
      console.log('📑 Hojas creadas:', wb.SheetNames);
      XLSX.writeFile(wb, filename);
      
      // Mostrar mensaje de éxito
      alert('✅ Archivo Excel generado exitosamente!\n\nHojas incluidas:\n• Resumen\n• Cobranza (Préstamos Vencidos)\n• Próximos Vencimientos');
      
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      alert('❌ Error al generar el archivo Excel: ' + error.message);
    }
  };

  const exportMembersToExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();
    
    // Calcular estadísticas
    const greenMembers = data.filter(m => m.creditRating === 'green').length;
    const yellowMembers = data.filter(m => m.creditRating === 'yellow').length;
    const redMembers = data.filter(m => m.creditRating === 'red').length;
    const totalGuarantee = data.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0);
    const totalBorrowed = data.reduce((sum, m) => sum + (m.totalBorrowed || 0), 0);
    const totalPending = data.reduce((sum, m) => sum + (m.totalPending || 0), 0);
    const totalLoans = data.reduce((sum, m) => sum + m.totalLoans, 0);
    const membersWithOverdue = data.filter(m => m.hasOverdue).length;
    
    // Hoja 1: Resumen Ejecutivo
    const summaryData = [
      ['ANÁLISIS DE MIEMBROS - BANQUITO SYSTEM'],
      [`Fecha de Generación: ${new Date().toLocaleString('es-ES')}`],
      [`Total de Miembros Analizados: ${data.length}`],
      [''],
      ['DISTRIBUCIÓN POR CALIFICACIÓN CREDITICIA'],
      ['Calificación', 'Cantidad de Miembros'],
      ['Verde (Excelente)', greenMembers],
      ['Amarilla (Regular)', yellowMembers],
      ['Roja (Riesgo)', redMembers],
      [''],
      ['ESTADÍSTICAS GENERALES'],
      ['Métrica', 'Valor'],
      ['Total de Garantías', `S/ ${totalGuarantee.toLocaleString()}`],
      ['Total Prestado Histórico', `S/ ${totalBorrowed.toLocaleString()}`],
      ['Total Pendiente de Cobro', `S/ ${totalPending.toLocaleString()}`],
      ['Total de Préstamos Activos', totalLoans],
      ['Miembros con Mora', membersWithOverdue],
      ['Tasa de Morosidad', `${((membersWithOverdue / data.length) * 100).toFixed(1)}%`],
      ['Capital Disponible', `S/ ${Math.max(0, (totalGuarantee * 0.8) - totalPending).toLocaleString()}`]
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Aplicar estilos
    summaryWs['A1'] = { v: 'ANÁLISIS DE MIEMBROS - BANQUITO SYSTEM', t: 's', s: { 
      font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } }, 
      fill: { fgColor: { rgb: "7D3C98" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { 
        top: { style: "medium", color: { rgb: "5B2C6F" } }, 
        bottom: { style: "medium", color: { rgb: "5B2C6F" } },
        left: { style: "medium", color: { rgb: "5B2C6F" } },
        right: { style: "medium", color: { rgb: "5B2C6F" } }
      }
    }};
    summaryWs['A5'] = { v: 'DISTRIBUCIÓN POR CALIFICACIÓN CREDITICIA', t: 's', s: { 
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, 
      fill: { fgColor: { rgb: "AF7AC5" } },
      alignment: { horizontal: "center" },
      border: { 
        top: { style: "thin", color: { rgb: "8E44AD" } }, 
        bottom: { style: "thin", color: { rgb: "8E44AD" } },
        left: { style: "thin", color: { rgb: "8E44AD" } },
        right: { style: "thin", color: { rgb: "8E44AD" } }
      }
    }};
    summaryWs['A11'] = { v: 'ESTADÍSTICAS GENERALES', t: 's', s: { 
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, 
      fill: { fgColor: { rgb: "5DADE2" } },
      alignment: { horizontal: "center" },
      border: { 
        top: { style: "thin", color: { rgb: "3498DB" } }, 
        bottom: { style: "thin", color: { rgb: "3498DB" } },
        left: { style: "thin", color: { rgb: "3498DB" } },
        right: { style: "thin", color: { rgb: "3498DB" } }
      }
    }};
    
    // Aplicar colores alternados a las filas de distribución
    for (let row = 6; row <= 8; row++) {
      const bgColor = row % 2 === 0 ? "F4F6F7" : "EBF5FB";
      for (let col = 0; col < 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!summaryWs[cellRef]) summaryWs[cellRef] = {};
        summaryWs[cellRef].s = { 
          fill: { fgColor: { rgb: bgColor } },
          border: { 
            top: { style: "thin", color: { rgb: "BDC3C7" } }, 
            bottom: { style: "thin", color: { rgb: "BDC3C7" } },
            left: { style: "thin", color: { rgb: "BDC3C7" } },
            right: { style: "thin", color: { rgb: "BDC3C7" } }
          },
          font: { sz: 11 }
        };
      }
    }
    
    // Aplicar colores alternados a las estadísticas generales
    for (let row = 12; row <= 18; row++) {
      const bgColor = row % 2 === 0 ? "E8F8F5" : "D5F4E6";
      for (let col = 0; col < 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!summaryWs[cellRef]) summaryWs[cellRef] = {};
        summaryWs[cellRef].s = { 
          fill: { fgColor: { rgb: bgColor } },
          border: { 
            top: { style: "thin", color: { rgb: "BDC3C7" } }, 
            bottom: { style: "thin", color: { rgb: "BDC3C7" } },
            left: { style: "thin", color: { rgb: "BDC3C7" } },
            right: { style: "thin", color: { rgb: "BDC3C7" } }
          },
          font: { sz: 11 }
        };
      }
    }
    
    summaryWs['!cols'] = [{ wch: 40 }, { wch: 30 }];
    
    // Merge cells para los títulos
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } }
    ];
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
    
    // Hoja 2: TABLA EXACTA COMO EN LA WEB - Análisis Detallado de Miembros
    const membersHeaders = ['Miembro', 'Calificación', 'Garantía', 'Préstamos', 'Total Prestado', 'Pendiente', 'Utilización', 'Estado'];
    const membersRows = data.map(member => {
      // Replicar exactamente la lógica de la tabla web
      let creditRatingText = '🔴';
      if (member.creditRating === 'green') creditRatingText = '🟢';
      else if (member.creditRating === 'yellow') creditRatingText = '🟡';
      
      let statusText = '⚪ Sin préstamos';
      if (member.hasOverdue) statusText = '🔴 Mora';
      else if (member.totalLoans > 0) statusText = '🟢 Activo';
      
      return [
        `${member.name}\nDNI: ${member.dni}`, // Combinado como en la web
        creditRatingText,
        `S/ ${((member.shares || 0) * 500).toLocaleString()}`,
        member.totalLoans,
        `S/ ${(member.totalBorrowed || 0).toLocaleString()}`,
        `S/ ${(member.totalPending || 0).toLocaleString()}`,
        `${member.utilizationRate.toFixed(1)}%`,
        statusText
      ];
    });
    
    const membersData = [
      ['ANÁLISIS DETALLADO DE MIEMBROS'],
      [''],
      membersHeaders,
      ...membersRows
    ];
    
    const membersWs = XLSX.utils.aoa_to_sheet(membersData);
    
    // Aplicar formato
    membersWs['A1'] = { v: 'ANÁLISIS DETALLADO DE MIEMBROS', t: 's', s: { 
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } }, 
      fill: { fgColor: { rgb: "8E44AD" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { 
        top: { style: "medium", color: { rgb: "6C3483" } }, 
        bottom: { style: "medium", color: { rgb: "6C3483" } },
        left: { style: "medium", color: { rgb: "6C3483" } },
        right: { style: "medium", color: { rgb: "6C3483" } }
      }
    }};
    
    // Formato para encabezados de tabla
    membersHeaders.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: index });
      if (!membersWs[cellRef]) membersWs[cellRef] = {};
      membersWs[cellRef].s = { 
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, 
        fill: { fgColor: { rgb: "BB8FCE" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { 
          top: { style: "medium", color: { rgb: "8E44AD" } }, 
          bottom: { style: "medium", color: { rgb: "8E44AD" } },
          left: { style: "thin", color: { rgb: "8E44AD" } },
          right: { style: "thin", color: { rgb: "8E44AD" } }
        }
      };
    });
    
    // Aplicar formato a filas de datos con colores alternados
    for (let row = 3; row < 3 + membersRows.length; row++) {
      const bgColor = row % 2 === 0 ? "FADBD8" : "F8D7DA";
      for (let col = 0; col < membersHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!membersWs[cellRef]) membersWs[cellRef] = {};
        
        // Obtener el miembro correspondiente para aplicar color por rating
        const memberIndex = row - 3;
        const member = data[memberIndex];
        let ratingColor = bgColor;
        
        if (member) {
          if (member.creditRating === 'green') {
            ratingColor = row % 2 === 0 ? "D5F4E6" : "A9DFBF";
          } else if (member.creditRating === 'yellow') {
            ratingColor = row % 2 === 0 ? "FCF3CF" : "F9E79F";
          } else if (member.creditRating === 'red') {
            ratingColor = row % 2 === 0 ? "FADBD8" : "F5B7B1";
          }
        }
        
        membersWs[cellRef].s = { 
          fill: { fgColor: { rgb: ratingColor } },
          border: { 
            top: { style: "thin", color: { rgb: "BDC3C7" } }, 
            bottom: { style: "thin", color: { rgb: "BDC3C7" } },
            left: { style: "thin", color: { rgb: "BDC3C7" } },
            right: { style: "thin", color: { rgb: "BDC3C7" } }
          },
          font: { sz: 10 },
          alignment: { horizontal: col === 0 ? "left" : "center", vertical: "center" }
        };
      }
    }
    
    membersWs['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 20 }
    ];
    
    // Merge cells para el título
    membersWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    
    XLSX.utils.book_append_sheet(wb, membersWs, 'Análisis Detallado');
    
    XLSX.writeFile(wb, filename);
  };

  const exportScheduleToExcel = (scheduleData) => {
    const wb = XLSX.utils.book_new();
    
    // Calcular estadísticas
    const weeksWithPayments = scheduleData.filter(week => week.paymentsCount > 0);
    const totalExpected = scheduleData.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
    const totalPayments = scheduleData.reduce((sum, week) => sum + week.paymentsCount, 0);
    
    // Hoja 1: Resumen Ejecutivo
    const summaryData = [
      ['CRONOGRAMA SEMANAL DE COBROS - BANQUITO SYSTEM'],
      [`Fecha de Generación: ${new Date().toLocaleString('es-ES')}`],
      ['Período: Próximas 12 semanas'],
      [''],
      ['RESUMEN EJECUTIVO'],
      ['Métrica', 'Valor'],
      ['Semanas con Cobros', weeksWithPayments.length],
      ['Semanas Libres', scheduleData.length - weeksWithPayments.length],
      ['Total de Pagos Programados', totalPayments],
      ['Monto Total Esperado', `S/ ${totalExpected.toLocaleString()}`],
      ['Promedio Semanal', weeksWithPayments.length > 0 ? `S/ ${Math.round(totalExpected / weeksWithPayments.length).toLocaleString()}` : 'S/ 0']
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Aplicar estilos
    summaryWs['A1'] = { v: 'CRONOGRAMA SEMANAL DE COBROS - BANQUITO SYSTEM', t: 's', s: { font: { bold: true, sz: 16 }, fill: { fgColor: { rgb: "4472C4" } }, font: { color: { rgb: "FFFFFF" } } } };
    summaryWs['A5'] = { v: 'RESUMEN EJECUTIVO', t: 's', s: { font: { bold: true, sz: 12 }, fill: { fgColor: { rgb: "70AD47" } } } };
    
    summaryWs['!cols'] = [{ wch: 35 }, { wch: 25 }];
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
    
    // Hoja 2: Cronograma Semanal
    const scheduleHeaders = ['Semana', 'Período', 'Cantidad Pagos', 'Monto Total Esperado', 'Estado'];
    const scheduleRows = scheduleData.map(week => [
      week.week,
      week.weekRange,
      week.paymentsCount,
      week.expectedAmount || 0,
      week.paymentsCount > 0 ? 'Con Pagos' : 'Libre'
    ]);
    
    const scheduleTableData = [
      ['CRONOGRAMA SEMANAL RESUMIDO'],
      [''],
      scheduleHeaders,
      ...scheduleRows
    ];
    
    const scheduleWs = XLSX.utils.aoa_to_sheet(scheduleTableData);
    
    // Aplicar formato
    scheduleWs['A1'] = { v: 'CRONOGRAMA SEMANAL RESUMIDO', t: 's', s: { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "27AE60" } }, font: { color: { rgb: "FFFFFF" } } } };
    
    scheduleHeaders.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: index });
      if (!scheduleWs[cellRef]) scheduleWs[cellRef] = {};
      scheduleWs[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: "F8F9FA" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    });
    
    scheduleWs['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(wb, scheduleWs, 'Cronograma');
    
    // Hoja 3: Detalle de Pagos
    const detailHeaders = ['Semana', 'Fecha del Pago', 'Nombre del Deudor', 'DNI', 'Teléfono', 'Monto de Cuota', 'Email', 'Estado del Préstamo'];
    const detailRows = [];
    
    scheduleData.forEach(week => {
      week.loans.forEach(loan => {
        const member = members.find(m => m.id === loan.memberId);
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        detailRows.push([
          week.week,
          new Date(loan.dueDate).toLocaleDateString('es-ES'),
          loan.memberName,
          member?.dni || 'N/A',
          member?.phone || 'N/A',
          weeklyPayment,
          member?.email || 'N/A',
          loan.status
        ]);
      });
    });
    
    const detailData = [
      ['DETALLE COMPLETO DE PAGOS PROGRAMADOS'],
      [''],
      detailHeaders,
      ...detailRows
    ];
    
    const detailWs = XLSX.utils.aoa_to_sheet(detailData);
    
    // Aplicar formato
    detailWs['A1'] = { v: 'DETALLE COMPLETO DE PAGOS PROGRAMADOS', t: 's', s: { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "8E44AD" } }, font: { color: { rgb: "FFFFFF" } } } };
    
    detailHeaders.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: index });
      if (!detailWs[cellRef]) detailWs[cellRef] = {};
      detailWs[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: "F8F9FA" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    });
    
    detailWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(wb, detailWs, 'Detalle de Pagos');
    
    // Hoja 4: Análisis por Miembro
    const memberPayments = {};
    scheduleData.forEach(week => {
      week.loans.forEach(loan => {
        if (!memberPayments[loan.memberId]) {
          memberPayments[loan.memberId] = {
            name: loan.memberName,
            member: members.find(m => m.id === loan.memberId),
            payments: [],
            totalAmount: 0,
            paymentCount: 0
          };
        }
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        memberPayments[loan.memberId].payments.push(new Date(loan.dueDate).toLocaleDateString('es-ES'));
        memberPayments[loan.memberId].totalAmount += weeklyPayment;
        memberPayments[loan.memberId].paymentCount++;
      });
    });
    
    const memberHeaders = ['Nombre', 'DNI', 'Teléfono', 'Total de Pagos', 'Monto Total a Cobrar', 'Email'];
    const memberRows = Object.values(memberPayments).map(memberData => [
      memberData.name,
      memberData.member?.dni || 'N/A',
      memberData.member?.phone || 'N/A',
      memberData.paymentCount,
      memberData.totalAmount,
      memberData.member?.email || 'N/A'
    ]);
    
    const memberData = [
      ['ANÁLISIS CONSOLIDADO POR MIEMBRO'],
      [''],
      memberHeaders,
      ...memberRows
    ];
    
    const memberWs = XLSX.utils.aoa_to_sheet(memberData);
    
    // Aplicar formato
    memberWs['A1'] = { v: 'ANÁLISIS CONSOLIDADO POR MIEMBRO', t: 's', s: { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "E67E22" } }, font: { color: { rgb: "FFFFFF" } } } };
    
    memberHeaders.forEach((header, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: index });
      if (!memberWs[cellRef]) memberWs[cellRef] = {};
      memberWs[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: "F8F9FA" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    });
    
    memberWs['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
    
    XLSX.utils.book_append_sheet(wb, memberWs, 'Análisis por Miembro');
    
    XLSX.writeFile(wb, `Cronograma_Cobros_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportScheduleToCSV = (scheduleData) => {
    let csv = '\uFEFF'; // BOM para UTF-8
    csv += '"CRONOGRAMA SEMANAL DE COBROS - BANQUITO SYSTEM"\n';
    csv += `"Fecha de Generación: ${new Date().toLocaleString('es-ES')}"\n`;
    csv += '"Período: Próximas 12 semanas"\n\n';
    
    // Resumen ejecutivo del cronograma
    const weeksWithPayments = scheduleData.filter(week => week.paymentsCount > 0);
    const totalExpected = scheduleData.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
    const totalPayments = scheduleData.reduce((sum, week) => sum + week.paymentsCount, 0);
    
    csv += '"RESUMEN EJECUTIVO"\n';
    csv += `"Semanas con Cobros: ${weeksWithPayments.length}"\n`;
    csv += `"Semanas Libres: ${scheduleData.length - weeksWithPayments.length}"\n`;
    csv += `"Total de Pagos Programados: ${totalPayments}"\n`;
    csv += `"Monto Total Esperado: S/ ${totalExpected.toLocaleString()}"\n`;
    if (weeksWithPayments.length > 0) {
      csv += `"Promedio Semanal: S/ ${Math.round(totalExpected / weeksWithPayments.length).toLocaleString()}"\n`;
    }
    csv += '\n';
    
    // Tabla resumen por semana
    csv += '"CRONOGRAMA SEMANAL RESUMIDO"\n';
    csv += '"Semana","Período","Cantidad Pagos","Monto Total Esperado","Estado"\n';
    scheduleData.forEach(week => {
      const status = week.paymentsCount > 0 ? 'Con Pagos' : 'Libre';
      csv += `"${week.week}","${week.weekRange}","${week.paymentsCount}","S/ ${(week.expectedAmount || 0).toLocaleString()}","${status}"\n`;
    });
    csv += '\n';
    
    // Detalle completo de todos los pagos
    csv += '"DETALLE COMPLETO DE PAGOS PROGRAMADOS"\n';
    csv += '"Semana","Fecha del Pago","Nombre del Deudor","DNI","Teléfono","Monto de Cuota","Email","Estado del Préstamo","Semana del Préstamo","Total Préstamo"\n';
    
    scheduleData.forEach(week => {
      week.loans.forEach(loan => {
        const member = members.find(m => m.id === loan.memberId);
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        csv += `"${week.week}","${new Date(loan.dueDate).toLocaleDateString('es-ES')}","${loan.memberName}","${member?.dni || 'N/A'}","${member?.phone || 'N/A'}","S/ ${weeklyPayment.toLocaleString()}","${member?.email || 'N/A'}","${loan.status}","${loan.currentWeek || loan.currentInstallment || 1}","S/ ${(loan.originalAmount || 0).toLocaleString()}"\n`;
      });
    });
    
    // Análisis por miembro (consolidado)
    csv += '\n"ANÁLISIS CONSOLIDADO POR MIEMBRO"\n';
    csv += '"Nombre","DNI","Teléfono","Total de Pagos en Período","Monto Total a Cobrar","Fechas de Pago","Email"\n';
    
    const memberPayments = {};
    scheduleData.forEach(week => {
      week.loans.forEach(loan => {
        if (!memberPayments[loan.memberId]) {
          memberPayments[loan.memberId] = {
            name: loan.memberName,
            member: members.find(m => m.id === loan.memberId),
            payments: [],
            totalAmount: 0,
            paymentCount: 0
          };
        }
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        memberPayments[loan.memberId].payments.push(new Date(loan.dueDate).toLocaleDateString('es-ES'));
        memberPayments[loan.memberId].totalAmount += weeklyPayment;
        memberPayments[loan.memberId].paymentCount++;
      });
    });
    
    Object.values(memberPayments).forEach(memberData => {
      const paymentDates = memberData.payments.join('; ');
      csv += `"${memberData.name}","${memberData.member?.dni || 'N/A'}","${memberData.member?.phone || 'N/A'}","${memberData.paymentCount}","S/ ${memberData.totalAmount.toLocaleString()}","${paymentDates}","${memberData.member?.email || 'N/A'}"\n`;
    });
    
    // Crear y descargar el archivo
    const blob = new Blob([csv], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Cronograma_Cobros_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const printReport = () => {
    window.print();
  };

  // Debug: Verificar datos de entrada
  console.log('🔍 DEBUG - Datos de entrada al componente Reports:');
  console.log('💰 Préstamos totales:', loans?.length || 0);
  console.log('👥 Miembros totales:', members?.length || 0);
  
  const overviewStats = calculateOverviewStats();
  const collectionData = generateCollectionReport();
  const memberAnalysis = generateMemberAnalysis();
  const paymentSchedule = generatePaymentSchedule();
  
  // Debug: Verificar datos procesados
  console.log('📊 CollectionData generado:', collectionData);

  const renderOverviewReport = () => (
    <div className="overview-report print-overview">
      {/* Header específico para impresión */}
      <div className="print-header">
        <div className="print-title">
          <h1>📊 REPORTE GENERAL BANQUITO SYSTEM</h1>
          <div className="print-date">Generado el: {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        <div className="print-logo">
          <div className="logo-placeholder">🏦 BANQUITO</div>
        </div>
      </div>

      {/* Estadísticas principales - Se muestran en pantalla y en impresión */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Prestado</h3>
            <div className="stat-value">S/ {(overviewStats.totalLoanAmount || 0).toLocaleString()}</div>
            <div className="stat-subtitle">{overviewStats.totalLoans} préstamos activos</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Total Cobrado</h3>
            <div className="stat-value">S/ {(overviewStats.totalPaidAmount || 0).toLocaleString()}</div>
            <div className="stat-subtitle">{overviewStats.collectionRate.toFixed(1)}% de recuperación</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pendiente de Cobro</h3>
            <div className="stat-value">S/ {(overviewStats.totalPendingAmount || 0).toLocaleString()}</div>
            <div className="stat-subtitle">{overviewStats.currentLoans} préstamos activos</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Préstamos Vencidos</h3>
            <div className="stat-value">{overviewStats.overdueLoans}</div>
            <div className="stat-subtitle">Requieren atención inmediata</div>
          </div>
        </div>

        <div className={`stat-card ${overviewStats.delinquencyRate > 5 ? 'danger' : overviewStats.delinquencyRate > 3 ? 'warning' : 'success'}`}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Tasa de Morosidad</h3>
            <div className="stat-value">{overviewStats.delinquencyRate.toFixed(1)}%</div>
            <div className="stat-subtitle">
              {overviewStats.delinquencyRate > 5 && 'Crítica - Requiere acción'}
              {overviewStats.delinquencyRate > 3 && overviewStats.delinquencyRate <= 5 && 'Moderada - Monitorear'}
              {overviewStats.delinquencyRate <= 3 && 'Excelente - Bajo riesgo'}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de distribución por estado */}
      <div className="print-section">
        <h2 className="section-title">📊 DISTRIBUCIÓN POR ESTADO</h2>
        <div className="distribution-table">
          <table className="print-table">
            <thead>
              <tr>
                <th>Estado del Préstamo</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr className="status-current">
                <td>🟢 Al día</td>
                <td>{overviewStats.currentLoans}</td>
                <td>{overviewStats.totalLoans > 0 ? ((overviewStats.currentLoans / overviewStats.totalLoans) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="status-paid">
                <td>✅ Pagados</td>
                <td>{overviewStats.paidLoans}</td>
                <td>{overviewStats.totalLoans > 0 ? ((overviewStats.paidLoans / overviewStats.totalLoans) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="status-overdue">
                <td>🔴 Vencidos</td>
                <td>{overviewStats.overdueLoans}</td>
                <td>{overviewStats.totalLoans > 0 ? ((overviewStats.overdueLoans / overviewStats.totalLoans) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td><strong>{overviewStats.totalLoans}</strong></td>
                <td><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de resumen financiero */}
      <div className="print-section">
        <h2 className="section-title">💰 RESUMEN FINANCIERO</h2>
        <div className="financial-table">
          <table className="print-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Garantías totales</td>
                <td>S/ {members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0).toLocaleString()}</td>
                <td>Base de capital del banquito</td>
              </tr>
              <tr>
                <td>Capital disponible para préstamos</td>
                <td>S/ {(members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8 - overviewStats.totalPendingAmount).toLocaleString()}</td>
                <td>80% de garantías menos pendientes</td>
              </tr>
              <tr>
                <td>Capital utilizado</td>
                <td>S/ {overviewStats.totalPendingAmount.toLocaleString()}</td>
                <td>Préstamos pendientes de cobro</td>
              </tr>
              <tr className="highlight-row">
                <td><strong>Utilización del capital</strong></td>
                <td><strong>{((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100).toFixed(1)}%</strong></td>
                <td><strong>Nivel de utilización actual</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de análisis */}
      <div className="print-section">
        <h2 className="section-title">📋 ANÁLISIS Y RECOMENDACIONES</h2>
        <div className="analysis-content">
          <div className="analysis-item">
            <h4>Estado de la Morosidad:</h4>
            <p>
              {overviewStats.delinquencyRate <= 3 && 'La tasa de morosidad está en niveles excelentes (≤3%). El banquito mantiene una gestión de riesgo efectiva.'}
              {overviewStats.delinquencyRate > 3 && overviewStats.delinquencyRate <= 5 && 'La tasa de morosidad está en niveles moderados (3-5%). Se recomienda monitorear de cerca.'}
              {overviewStats.delinquencyRate > 5 && 'La tasa de morosidad está en niveles críticos (>5%). Se requiere acción inmediata para la recuperación.'}
            </p>
          </div>
          <div className="analysis-item">
            <h4>Capacidad de Préstamo:</h4>
            <p>
              {((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) < 70 && 'El banquito tiene buena capacidad para nuevos préstamos.'}
              {((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) >= 70 && ((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) < 90 && 'La utilización del capital está alta. Evaluar nuevos préstamos cuidadosamente.'}
              {((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) >= 90 && 'La utilización del capital está cerca del límite. Priorizar cobros antes de nuevos préstamos.'}
            </p>
          </div>
        </div>
      </div>

      {/* Mantener las secciones originales para pantalla */}
      <div className="charts-section screen-only">
        <div className="chart-card">
          <h3>📊 Distribución por Estado</h3>
          <div className="pie-chart-container">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color current"></span>
                <span>Al día ({overviewStats.currentLoans})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color paid"></span>
                <span>Pagados ({overviewStats.paidLoans})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color overdue"></span>
                <span>Vencidos ({overviewStats.overdueLoans})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>📈 Resumen Financiero</h3>
          <div className="financial-summary">
            <div className="summary-row">
              <span className="label">Capital disponible para préstamos:</span>
              <span className="value">S/ {(members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8 - overviewStats.totalPendingAmount).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="label">Garantías totales:</span>
              <span className="value">S/ {members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="label">Utilización del capital:</span>
              <span className="value">{((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollectionReport = () => (
    <div className="collection-report">
      <div className="report-header">
        <h3>💳 Reporte de Cobranza</h3>
        <button 
          className="export-btn"
          onClick={() => exportToExcel(collectionData, `Reporte_Cobranza_${new Date().toISOString().split('T')[0]}.xlsx`)}
        >
          📊 Exportar a Excel
        </button>
      </div>

      <div className="collection-summary">
        <div className="summary-card overdue">
          <h4>🔴 Préstamos Vencidos</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="number">{collectionData.overdueLoans.length}</span>
              <span className="label">préstamos</span>
            </div>
            <div className="stat">
              <span className="number">S/ {(collectionData.totalOverdueAmount || 0).toLocaleString()}</span>
              <span className="label">monto vencido</span>
            </div>
          </div>
        </div>

        <div className="summary-card upcoming">
          <h4>🟡 Próximos Vencimientos (7 días)</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="number">{collectionData.upcomingPayments.length}</span>
              <span className="label">pagos</span>
            </div>
            <div className="stat">
              <span className="number">S/ {(collectionData.totalUpcomingAmount || 0).toLocaleString()}</span>
              <span className="label">monto esperado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tables-section">
        <div className="table-container">
          <h4>📋 Préstamos Vencidos</h4>
          <table className="collection-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto Cuota</th>
                <th>Días Vencido</th>
                <th>Fecha Vencimiento</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {collectionData.overdueLoans.map(loan => {
                const member = members.find(m => m.id === loan.memberId);
                return (
                  <tr key={loan.id} className="overdue-row">
                    <td className="member-name">{loan.memberName}</td>
                    <td className="amount">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</td>
                    <td className="days-overdue">{loan.daysPastDue} días</td>
                    <td className="due-date">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                    <td className="phone">{member?.phone || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <h4>📅 Próximos Vencimientos</h4>
          <table className="collection-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto Cuota</th>
                <th>Fecha Vencimiento</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {collectionData.upcomingPayments.map(loan => {
                const member = members.find(m => m.id === loan.memberId);
                return (
                  <tr key={loan.id} className="upcoming-row">
                    <td className="member-name">{loan.memberName}</td>
                    <td className="amount">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</td>
                    <td className="due-date">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                    <td className="phone">{member?.phone || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMembersReport = () => (
    <div className="members-report">
      <div className="report-header">
        <h3>👥 Análisis de Miembros</h3>
        <button 
          className="export-btn"
          onClick={() => exportToExcel(memberAnalysis, `Analisis_Miembros_${new Date().toISOString().split('T')[0]}.xlsx`)}
        >
          📊 Exportar a Excel
        </button>
      </div>

      <div className="members-table-container">
        <table className="members-analysis-table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Calificación</th>
              <th>Garantía</th>
              <th>Préstamos</th>
              <th>Total Prestado</th>
              <th>Pendiente</th>
              <th>Utilización</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {memberAnalysis.map(member => (
              <tr key={member.id} className={`member-row ${member.creditRating}`}>
                <td className="member-info">
                  <div className="name">{member.name}</div>
                  <div className="dni">DNI: {member.dni}</div>
                </td>
                <td className="rating">
                  <span className={`rating-badge ${member.creditRating}`}>
                    {member.creditRating === 'green' && '🟢'}
                    {member.creditRating === 'yellow' && '🟡'}
                    {member.creditRating === 'red' && '🔴'}
                  </span>
                </td>
                <td className="guarantee">S/ {((member.shares || 0) * 500).toLocaleString()}</td>
                <td className="loans-count">{member.totalLoans}</td>
                <td className="borrowed">S/ {(member.totalBorrowed || 0).toLocaleString()}</td>
                <td className="pending">S/ {(member.totalPending || 0).toLocaleString()}</td>
                <td className="utilization">
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill"
                      style={{ width: `${Math.min(member.utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                  <span className="utilization-text">{member.utilizationRate.toFixed(1)}%</span>
                </td>
                <td className="status">
                  {member.hasOverdue ? (
                    <span className="status-badge overdue">🔴 Mora</span>
                  ) : member.totalLoans > 0 ? (
                    <span className="status-badge active">🟢 Activo</span>
                  ) : (
                    <span className="status-badge inactive">⚪ Sin préstamos</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderScheduleReport = () => {
    // Filtrar el cronograma según los criterios
    const filteredSchedule = paymentSchedule.filter(week => {
      // Filtrar por semanas con/sin pagos
      if (showOnlyWithPayments && week.paymentsCount === 0) return false;
      
      // Filtrar por rango de semanas
      if (filterWeeks !== 'all') {
        const weekNumber = parseInt(week.week.match(/\d+/)[0]);
        if (filterWeeks === '4' && weekNumber > 4) return false;
        if (filterWeeks === '8' && weekNumber > 8) return false;
        if (filterWeeks === '12' && weekNumber > 12) return false;
      }
      
      // Filtrar por miembro
      if (filterMember) {
        const hasMatchingLoan = week.loans.some(loan => 
          loan.memberName.toLowerCase().includes(filterMember.toLowerCase())
        );
        if (!hasMatchingLoan) return false;
      }
      
      return true;
    });

    return (
      <div className="schedule-report">
        <div className="report-header">
          <h3>📅 Cronograma Semanal de Cobros</h3>
          <div className="schedule-actions">
            <button 
              className="export-btn"
              onClick={() => exportScheduleToExcel(paymentSchedule)}
            >
              📊 Exportar Cronograma a Excel
            </button>
          </div>
        </div>

        {/* Filtros del cronograma */}
        <div className="schedule-filters">
          <div className="filter-group">
            <label>Buscar miembro:</label>
            <input
              type="text"
              placeholder="Nombre del miembro..."
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Período:</label>
            <select
              value={filterWeeks}
              onChange={(e) => setFilterWeeks(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas las semanas</option>
              <option value="4">Próximas 4 semanas</option>
              <option value="8">Próximas 8 semanas</option>
              <option value="12">Próximas 12 semanas</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOnlyWithPayments}
                onChange={(e) => setShowOnlyWithPayments(e.target.checked)}
              />
              Solo semanas con pagos
            </label>
          </div>
        </div>

        <div className="schedule-grid">
        {filteredSchedule.map((week, index) => (
          <div key={index} className={`schedule-card ${week.paymentsCount === 0 ? 'no-payments' : ''}`}>
            <div className="week-header">
              <div className="week-title">
                <h4>{week.week}</h4>
                <div className="week-range">{week.weekRange}</div>
              </div>
              <div className="week-stats">
                <span className="payments-count">
                  {week.paymentsCount === 0 ? 'Sin pagos' : `${week.paymentsCount} pagos`}
                </span>
                <span className="expected-amount">S/ {(week.expectedAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            
            {week.paymentsCount > 0 ? (
              <div className="week-details">
                {week.loans.slice(0, 5).map(loan => (
                  <div key={loan.id} className="payment-item">
                    <div className="payment-info">
                      <span className="member-name">{loan.memberName}</span>
                      <span className="payment-date">
                        {new Date(loan.dueDate).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <span className="payment-amount">S/ {(loan.paymentAmount || loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</span>
                  </div>
                ))}
                {week.loans.length > 5 && (
                  <div className="more-payments">
                    +{week.loans.length - 5} pagos más
                  </div>
                )}
              </div>
            ) : (
              <div className="week-details no-payments-message">
                <div className="empty-week">
                  <span className="empty-icon">📅</span>
                  <span className="empty-text">Semana libre de cobros</span>
                </div>
              </div>
            )}

            {/* Mostrar total de la semana */}
            <div className="week-summary">
              <div className="summary-item">
                <span className="summary-label">Total Semana:</span>
                <span className="summary-value">S/ {(week.expectedAmount || 0).toLocaleString()}</span>
              </div>
              {week.expectedAmount > 0 && (
                <div className="summary-item">
                  <span className="summary-label">Promedio diario:</span>
                  <span className="summary-value">S/ {Math.round((week.expectedAmount || 0) / 7).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSchedule.length === 0 && (
        <div className="no-schedule">
          <div className="no-schedule-icon">📅</div>
          <h3>No hay pagos programados</h3>
          <p>No se encontraron pagos que coincidan con los filtros seleccionados</p>
        </div>
      )}

      {/* Resumen total del cronograma filtrado */}
      {filteredSchedule.length > 0 && (
        <div className="schedule-summary">
          <h4>📊 Resumen del Cronograma Filtrado</h4>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">Total de Semanas con Pagos:</span>
              <span className="stat-value">{filteredSchedule.filter(week => week.paymentsCount > 0).length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Semanas Libres:</span>
              <span className="stat-value">{filteredSchedule.filter(week => week.paymentsCount === 0).length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total de Pagos Programados:</span>
              <span className="stat-value">{filteredSchedule.reduce((sum, week) => sum + week.paymentsCount, 0)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Monto Total Esperado:</span>
              <span className="stat-value">S/ {filteredSchedule.reduce((sum, week) => sum + (week.expectedAmount || 0), 0).toLocaleString()}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Promedio Semanal (con pagos):</span>
              <span className="stat-value">
                S/ {(() => {
                  const weeksWithPayments = filteredSchedule.filter(week => week.paymentsCount > 0);
                  const totalAmount = filteredSchedule.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
                  return weeksWithPayments.length > 0 ? Math.round(totalAmount / weeksWithPayments.length).toLocaleString() : '0';
                })()}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Semana de Mayor Cobranza:</span>
              <span className="stat-value">
                S/ {(() => {
                  const maxWeek = filteredSchedule.reduce((max, week) => 
                    week.expectedAmount > max.expectedAmount ? week : max, 
                    { expectedAmount: 0 }
                  );
                  return (maxWeek.expectedAmount || 0).toLocaleString();
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>📈 Reportes y Análisis</h2>
        <div className="report-actions">
          <button className="print-btn" onClick={printReport}>
            🖨️ Imprimir
          </button>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`report-tab ${activeReport === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveReport('overview')}
        >
          📊 Resumen General
        </button>
        <button 
          className={`report-tab ${activeReport === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveReport('collection')}
        >
          💳 Cobranza
        </button>
        <button 
          className={`report-tab ${activeReport === 'members' ? 'active' : ''}`}
          onClick={() => setActiveReport('members')}
        >
          👥 Análisis Miembros
        </button>
        <button 
          className={`report-tab ${activeReport === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveReport('schedule')}
        >
          📅 Cronograma
        </button>
      </div>

      <div className="report-content">
        {activeReport === 'overview' && renderOverviewReport()}
        {activeReport === 'collection' && renderCollectionReport()}
        {activeReport === 'members' && renderMembersReport()}
        {activeReport === 'schedule' && renderScheduleReport()}
      </div>

      <div className="report-footer">
        <div className="generation-info">
          <span>📅 Generado el: {new Date().toLocaleString('es-ES')}</span>
          <span>👨‍💼 Sistema Banquito - Reporte Administrativo</span>
        </div>
      </div>
    </div>
  );
};

export default Reports;