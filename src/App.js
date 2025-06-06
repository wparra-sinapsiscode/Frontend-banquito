import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import memberService from './services/memberService';
import loanService from './services/loanService';
import loanRequestService from './services/loanRequestService';
import settingsService from './services/settingsService';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loanRequests, setLoanRequests] = useState([]);
  const [settings, setSettings] = useState({
    shareValue: 500,
    loanLimits: {
      individual: 8000,
      guaranteePercentage: 80
    },
    monthlyInterestRates: {
      high: 3, // >5000 - 3% mensual
      medium: 5, // 1000-5000 - 5% mensual
      low: 10 // <1000 - 10% mensual
    },
    operationDay: 'wednesday',
    delinquencyRate: 5.0 // Tasa de recargo por mora única en porcentaje
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  // Cargar datos del backend cuando el usuario se autentica
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentUser) return;
      
      try {
        console.log('🔄 Cargando datos del backend...');
        
        // Cargar datos en paralelo
        const [membersData, loansData, requestsData, settingsData] = await Promise.all([
          memberService.getMembers(),
          loanService.getLoans(),
          loanRequestService.getLoanRequests(),
          settingsService.getSettings().catch(() => null) // No fallar si no existe
        ]);
        
        console.log('✅ Datos cargados:', {
          members: membersData?.length || 0,
          loans: loansData?.length || 0,
          requests: requestsData?.length || 0,
          settings: settingsData ? 'loaded' : 'default'
        });
        
        setMembers(membersData || []);
        
        // Asegurar que los préstamos tengan la estructura esperada
        const processedLoans = (loansData || []).map(loan => ({
          ...loan,
          paymentHistory: loan.payments || loan.paymentHistory || [],
          memberName: loan.member?.name || loan.memberName || 'N/A'
        }));
        setLoans(processedLoans);
        
        setLoanRequests(requestsData || []);
        
        // Actualizar configuraciones si existen
        if (settingsData) {
          setSettings(prev => ({...prev, ...settingsData}));
        }
        
      } catch (error) {
        console.error('❌ Error cargando datos del backend:', error);
        // Mantener datos por defecto en caso de error
      }
    };
    
    loadInitialData();
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const calculateBaseCapital = () => {
    // Capital Base = Suma de todas las acciones × valor por acción
    return members.reduce((total, member) => total + (member.shares * settings.shareValue), 0);
  };

  const calculateTotalCapital = () => {
    // Capital Base
    const baseCapital = calculateBaseCapital();
    
    // Calcular intereses ganados
    const totalInterestEarned = loans.reduce((total, loan) => {
      const paymentHistory = loan.paymentHistory || [];
      const paidInterest = paymentHistory.reduce((sum, payment) => {
        const principalPerPayment = loan.originalAmount / (loan.totalWeeks || loan.installments || 1);
        const interestInPayment = Math.max(0, (payment.amount || 0) - principalPerPayment);
        return sum + interestInPayment;
      }, 0);
      
      const pendingInterest = (() => {
        if (loan.status === 'paid') return 0;
        const totalPaymentAmount = (loan.weeklyPayment || loan.monthlyPayment) * (loan.totalWeeks || loan.installments);
        const totalInterest = totalPaymentAmount - loan.originalAmount;
        const paidInstallments = loan.paymentHistory.length;
        const totalInstallments = loan.totalWeeks || loan.installments;
        const interestPerInstallment = totalInterest / totalInstallments;
        const remainingInstallments = totalInstallments - paidInstallments;
        return interestPerInstallment * remainingInstallments;
      })();
      
      return total + paidInterest + pendingInterest;
    }, 0);
    
    // Calcular comisiones (2% por préstamo)
    const totalCommissions = loans.reduce((total, loan) => {
      return total + (loan.originalAmount * 0.02);
    }, 0);
    
    // Calcular moras cobradas
    const totalLateFees = loans.reduce((total, loan) => {
      return total + (loan.paymentHistory || []).reduce((sum, payment) => {
        return sum + (payment.lateFee || 0);
      }, 0);
    }, 0);
    
    return baseCapital + totalInterestEarned + totalCommissions + totalLateFees;
  };

  const calculateAvailableCapital = () => {
    const totalCapital = calculateTotalCapital();
    const loanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => total + loan.remainingAmount, 0);
    return totalCapital - loanedAmount;
  };

  // Nueva función para obtener estadísticas bancarias adicionales
  const getBankingStatistics = () => {
    const baseCapital = calculateBaseCapital();
    const totalCapital = calculateTotalCapital();
    const availableCapital = calculateAvailableCapital();
    
    // Extraer los componentes del capital total
    const totalInterestEarned = loans.reduce((total, loan) => {
      const paymentHistory = loan.paymentHistory || [];
      const paidInterest = paymentHistory.reduce((sum, payment) => {
        const principalPerPayment = loan.originalAmount / (loan.totalWeeks || loan.installments || 1);
        const interestInPayment = Math.max(0, (payment.amount || 0) - principalPerPayment);
        return sum + interestInPayment;
      }, 0);
      
      const pendingInterest = (() => {
        if (loan.status === 'paid') return 0;
        const totalPaymentAmount = (loan.weeklyPayment || loan.monthlyPayment || 0) * (loan.totalWeeks || loan.installments || 1);
        const totalInterest = totalPaymentAmount - loan.originalAmount;
        const paidInstallments = paymentHistory.length;
        const totalInstallments = loan.totalWeeks || loan.installments || 1;
        const interestPerInstallment = totalInterest / totalInstallments;
        const remainingInstallments = totalInstallments - paidInstallments;
        return interestPerInstallment * remainingInstallments;
      })();
      
      return total + paidInterest + pendingInterest;
    }, 0);
    
    const totalCommissions = loans.reduce((total, loan) => {
      return total + (loan.originalAmount * 0.02);
    }, 0);
    
    const totalLateFees = loans.reduce((total, loan) => {
      return total + (loan.paymentHistory || []).reduce((sum, payment) => {
        return sum + (payment.lateFee || 0);
      }, 0);
    }, 0);
    
    const loanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => total + loan.remainingAmount, 0);
    
    const totalShares = members.reduce((total, member) => total + member.shares, 0);
    const activeLoanCount = loans.filter(loan => loan.status !== 'paid').length;
    const totalLoanedAmount = loans
      .filter(loan => loan.status !== 'paid')
      .reduce((total, loan) => total + loan.originalAmount, 0);
    const totalPaidAmount = loans.reduce((total, loan) => 
      total + (loan.paymentHistory || []).reduce((sum, payment) => sum + (payment.amount || 0), 0), 0
    );
    
    return {
      totalCapital,
      availableCapital,
      baseCapital,
      totalInterestEarned,
      totalCommissions,
      totalLateFees,
      loanedCapital: loanedAmount,
      capitalUtilization: totalCapital > 0 ? ((loanedAmount / totalCapital) * 100).toFixed(1) : '0',
      totalShares,
      shareValue: settings.shareValue,
      memberCount: members.length,
      activeLoanCount,
      totalLoanedAmount,
      totalPaidAmount,
      averageLoanAmount: activeLoanCount > 0 ? Math.round(totalLoanedAmount / activeLoanCount) : 0,
      profitMargin: baseCapital > 0 ? (((totalInterestEarned + totalCommissions + totalLateFees) / baseCapital) * 100).toFixed(2) : '0'
    };
  };

  const getMonthlyInterestRate = (amount) => {
    if (!settings.monthlyInterestRates) {
      // Fallback values if monthlyInterestRates is undefined
      if (amount > 5000) return 3;
      if (amount >= 1000) return 5;
      return 10;
    }
    if (amount > 5000) return settings.monthlyInterestRates.high;
    if (amount >= 1000) return settings.monthlyInterestRates.medium;
    return settings.monthlyInterestRates.low;
  };

  const calculateLateFee = (originalPayment, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (today <= due) return 0; // No hay mora si no está vencido
    
    // Calcular semanas de atraso
    const weeksLate = Math.ceil((today - due) / (7 * 24 * 60 * 60 * 1000));
    
    // 5% de mora por cada semana de atraso
    const lateFeePercentage = weeksLate * (settings.delinquencyRate / 100);
    const lateFee = originalPayment * lateFeePercentage;
    
    return Math.round(lateFee * 100) / 100;
  };

  const getPaymentWithLateFee = (loan) => {
    const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment;
    const lateFee = calculateLateFee(weeklyPayment, loan.dueDate);
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysLate = lateFee > 0 ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;
    const weeksLate = lateFee > 0 ? Math.ceil((today - dueDate) / (7 * 24 * 60 * 60 * 1000)) : 0;
    
    return {
      originalPayment: weeklyPayment,
      lateFee: lateFee,
      totalPayment: weeklyPayment + lateFee,
      daysLate: daysLate,
      weeksLate: weeksLate,
      isOverdue: lateFee > 0
    };
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Header user={currentUser} onLogout={handleLogout} />
      <Dashboard 
        user={currentUser}
        loans={loans}
        setLoans={setLoans}
        members={members}
        setMembers={setMembers}
        loanRequests={loanRequests}
        setLoanRequests={setLoanRequests}
        settings={settings}
        setSettings={setSettings}
        calculateTotalCapital={calculateTotalCapital}
        calculateAvailableCapital={calculateAvailableCapital}
        getBankingStatistics={getBankingStatistics}
        getMonthlyInterestRate={getMonthlyInterestRate}
        calculateLateFee={calculateLateFee}
        getPaymentWithLateFee={getPaymentWithLateFee}
        users={users}
        setUsers={setUsers}
      />
    </div>
  );
}

export default App;