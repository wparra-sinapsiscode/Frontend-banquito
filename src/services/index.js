// Exportar todos los servicios desde un único punto
export { default as authService } from './authService';
export { default as memberService } from './memberService';
export { default as loanService } from './loanService';
export { default as loanRequestService } from './loanRequestService';
export { default as dashboardService } from './dashboardService';
export { default as settingsService } from './settingsService';
export { default as api } from './api';

// Ejemplo de uso en componentes:
/*
import { authService, memberService, loanService } from '../services';

// Login
const user = await authService.login(username, password);

// Obtener miembros
const members = await memberService.getMembers();

// Registrar pago
const payment = await loanService.registerPayment(loanId, {
  amount: 325,
  date: '2025-01-08',
  type: 'weekly'
});
*/