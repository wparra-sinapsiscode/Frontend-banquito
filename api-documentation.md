# Documentación de APIs - Sistema Banquito

Este documento describe todos los endpoints necesarios para el funcionamiento completo del sistema de gestión bancaria cooperativa.

## Base URL
```
https://api.banquito.com/v1
```

## Autenticación
Todos los endpoints (excepto login) requieren autenticación mediante JWT Bearer Token.

```
Authorization: Bearer <token>
```

---

## 1. Autenticación y Usuarios

### 1.1 Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "name": "Administrador",
      "memberId": null
    }
  }
}
```

### 1.2 Logout
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

### 1.3 Obtener Usuarios
```http
GET /users
```

**Query Parameters:**
- `role` (opcional): "admin" | "member" | "external"
- `page` (opcional): número de página
- `limit` (opcional): elementos por página

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "name": "Administrador",
      "memberId": null
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5
  }
}
```

### 1.4 Crear Usuario
```http
POST /users
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "member",
  "name": "string",
  "memberId": 123
}
```

### 1.5 Actualizar Usuario
```http
PUT /users/:id
```

**Request Body:**
```json
{
  "name": "string",
  "password": "string" // opcional
}
```

### 1.6 Eliminar Usuario
```http
DELETE /users/:id
```

---

## 2. Miembros/Socios

### 2.1 Obtener Miembros
```http
GET /members
```

**Query Parameters:**
- `search` (opcional): búsqueda por nombre/DNI
- `creditRating` (opcional): "green" | "yellow" | "red"
- `page` (opcional): número de página
- `limit` (opcional): elementos por página

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Arteaga",
      "dni": "12345678",
      "shares": 10,
      "guarantee": 5000,
      "creditRating": "green",
      "creditScore": 90,
      "phone": "987654321",
      "email": "arteaga@email.com",
      "savingsPlan": {
        "enabled": true,
        "planDays": 180,
        "startDate": "2024-01-01",
        "TEA": 0.02
      }
    }
  ]
}
```

### 2.2 Obtener Miembro por ID
```http
GET /members/:id
```

### 2.3 Crear Miembro
```http
POST /members
```

**Request Body:**
```json
{
  "name": "string",
  "dni": "string",
  "shares": 10,
  "phone": "string",
  "email": "string",
  "creditScore": 90
}
```

### 2.4 Actualizar Miembro
```http
PUT /members/:id
```

**Request Body:**
```json
{
  "shares": 15,
  "phone": "string",
  "email": "string",
  "creditScore": 85,
  "creditRating": "green"
}
```

### 2.5 Eliminar Miembro
```http
DELETE /members/:id
```

### 2.6 Actualizar Plan de Ahorro
```http
PUT /members/:id/savings-plan
```

**Request Body:**
```json
{
  "enabled": true,
  "planDays": 180,
  "startDate": "2024-01-01",
  "TEA": 0.02
}
```

---

## 3. Préstamos

### 3.1 Obtener Préstamos
```http
GET /loans
```

**Query Parameters:**
- `memberId` (opcional): filtrar por miembro
- `status` (opcional): "current" | "overdue" | "paid"
- `page` (opcional): número de página
- `limit` (opcional): elementos por página

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "memberId": 1,
      "memberName": "Arteaga",
      "originalAmount": 5000,
      "remainingAmount": 3750,
      "totalWeeks": 20,
      "currentWeek": 5,
      "monthlyInterestRate": 3,
      "weeklyPayment": 325,
      "dueDate": "2025-05-27",
      "status": "current",
      "startDate": "2025-01-01",
      "paymentHistory": [],
      "paymentSchedule": []
    }
  ]
}
```

### 3.2 Obtener Préstamo por ID
```http
GET /loans/:id
```

### 3.3 Crear Préstamo (desde solicitud aprobada)
```http
POST /loans
```

**Request Body:**
```json
{
  "loanRequestId": 123,
  "approvedBy": "admin"
}
```

### 3.4 Registrar Pago
```http
POST /loans/:id/payments
```

**Request Body:**
```json
{
  "amount": 325,
  "date": "2025-01-08",
  "type": "weekly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "date": "2025-01-08",
      "amount": 325,
      "type": "weekly",
      "weeksLate": 0,
      "lateFee": 0,
      "scoreChange": 2
    },
    "loan": {
      "remainingAmount": 3425,
      "currentWeek": 6,
      "status": "current",
      "dueDate": "2025-01-15"
    }
  }
}
```

### 3.5 Modificar Fecha de Vencimiento
```http
PUT /loans/:id/due-date
```

**Request Body:**
```json
{
  "newDueDate": "2025-06-15"
}
```

### 3.6 Obtener Cronograma de Pagos
```http
GET /loans/:id/schedule
```

---

## 4. Solicitudes de Préstamo

### 4.1 Obtener Solicitudes
```http
GET /loan-requests
```

**Query Parameters:**
- `status` (opcional): "pending" | "approved" | "rejected"
- `memberId` (opcional): filtrar por miembro
- `page` (opcional): número de página
- `limit` (opcional): elementos por página

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "memberId": 4,
      "memberName": "Daniel",
      "amount": 2500,
      "totalWeeks": 20,
      "purpose": "Capital de trabajo para negocio",
      "requestDate": "2025-05-14",
      "requiredDate": "2025-05-30",
      "status": "pending",
      "monthlyInterestRate": 5,
      "monthlyIncome": 3500,
      "otherDebts": 800,
      "guaranteeOffered": 7500,
      "comments": "Solicita préstamo para ampliar su negocio",
      "documents": ["dni", "income_proof", "business_license"],
      "weeklyPayment": 143,
      "totalAmount": 2860
    }
  ]
}
```

### 4.2 Crear Solicitud de Préstamo
```http
POST /loan-requests
```

**Request Body:**
```json
{
  "memberId": 1,
  "amount": 5000,
  "totalWeeks": 20,
  "purpose": "Capital de trabajo",
  "requiredDate": "2025-06-01",
  "monthlyIncome": 3500,
  "otherDebts": 800,
  "comments": "Para expandir negocio",
  "documents": ["dni", "income_proof"]
}
```

### 4.3 Aprobar Solicitud
```http
PUT /loan-requests/:id/approve
```

**Request Body:**
```json
{
  "approvedBy": "admin",
  "comments": "Aprobado por buen historial"
}
```

### 4.4 Rechazar Solicitud
```http
PUT /loan-requests/:id/reject
```

**Request Body:**
```json
{
  "rejectedBy": "admin",
  "rejectionReason": "Capacidad de pago insuficiente"
}
```

---

## 5. Configuración del Sistema

### 5.1 Obtener Configuración
```http
GET /settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareValue": 500,
    "loanLimits": {
      "individual": 8000,
      "guaranteePercentage": 80
    },
    "monthlyInterestRates": {
      "high": 3,
      "medium": 5,
      "low": 10
    },
    "operationDay": "wednesday",
    "delinquencyRate": 5.0
  }
}
```

### 5.2 Actualizar Configuración
```http
PUT /settings
```

**Request Body:**
```json
{
  "shareValue": 600,
  "loanLimits": {
    "individual": 10000,
    "guaranteePercentage": 80
  },
  "monthlyInterestRates": {
    "high": 2.5,
    "medium": 4,
    "low": 8
  },
  "delinquencyRate": 5.0
}
```

---

## 6. Reportes y Estadísticas

### 6.1 Obtener Estadísticas Bancarias
```http
GET /statistics/banking
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCapital": 50000,
    "availableCapital": 35000,
    "baseCapital": 45000,
    "totalInterestEarned": 3500,
    "totalCommissions": 1000,
    "totalLateFees": 500,
    "loanedCapital": 15000,
    "capitalUtilization": "30.0",
    "totalShares": 90,
    "shareValue": 500,
    "memberCount": 1,
    "activeLoanCount": 3,
    "totalLoanedAmount": 15000,
    "totalPaidAmount": 5000,
    "averageLoanAmount": 5000,
    "profitMargin": "11.11"
  }
}
```

### 6.2 Reporte de Préstamos
```http
GET /reports/loans
```

**Query Parameters:**
- `startDate`: fecha inicial (YYYY-MM-DD)
- `endDate`: fecha final (YYYY-MM-DD)
- `status` (opcional): filtrar por estado

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLoans": 50,
      "totalAmount": 250000,
      "totalPaid": 150000,
      "totalOverdue": 25000,
      "overdueCount": 5
    },
    "byStatus": {
      "current": 30,
      "overdue": 5,
      "paid": 15
    },
    "byMonth": [
      {
        "month": "2025-01",
        "disbursed": 50000,
        "collected": 25000,
        "count": 10
      }
    ]
  }
}
```

### 6.3 Reporte de Miembros
```http
GET /reports/members
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 40,
    "byCreditRating": {
      "green": 25,
      "yellow": 10,
      "red": 5
    },
    "averageShares": 18.5,
    "totalShares": 740,
    "averageCreditScore": 65.5
  }
}
```

### 6.4 Exportar Reporte
```http
GET /reports/export
```

**Query Parameters:**
- `type`: "loans" | "members" | "payments"
- `format`: "pdf" | "excel"
- `startDate`: fecha inicial
- `endDate`: fecha final

**Response:** Archivo binario (PDF o Excel)

---

## 7. Calendario y Notificaciones

### 7.1 Obtener Eventos del Calendario
```http
GET /calendar/events
```

**Query Parameters:**
- `startDate`: fecha inicial
- `endDate`: fecha final
- `type` (opcional): "payment" | "request" | "meeting"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "payment",
      "title": "Pago - Arteaga",
      "date": "2025-01-08",
      "amount": 325,
      "status": "pending",
      "relatedId": 1,
      "relatedType": "loan"
    }
  ]
}
```

### 7.2 Obtener Notificaciones del Usuario
```http
GET /notifications
```

**Query Parameters:**
- `unreadOnly` (opcional): mostrar solo no leídas

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "loan_approved",
      "title": "Préstamo Aprobado",
      "message": "Tu solicitud de préstamo ha sido aprobada",
      "date": "2025-01-01T10:00:00Z",
      "read": false,
      "relatedId": 123,
      "relatedType": "loan_request"
    }
  ]
}
```

### 7.3 Marcar Notificación como Leída
```http
PUT /notifications/:id/read
```

---

## 8. Dashboard

### 8.1 Obtener Datos del Dashboard
```http
GET /dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalCapital": 50000,
      "availableCapital": 35000,
      "activeLoanCount": 8,
      "overdueCount": 3
    },
    "upcomingPayments": [
      {
        "loanId": 1,
        "memberName": "Arteaga",
        "amount": 325,
        "dueDate": "2025-01-08"
      }
    ],
    "recentActivity": [
      {
        "type": "payment",
        "description": "Pago recibido de Rossi",
        "amount": 219,
        "date": "2025-01-07T15:30:00Z"
      }
    ]
  }
}
```

---

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Error en la solicitud
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: No autorizado
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: usuario duplicado)
- `422 Unprocessable Entity`: Validación fallida
- `500 Internal Server Error`: Error del servidor

## Formato de Errores

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": {
      "field": "amount",
      "message": "El monto debe ser mayor a 0"
    }
  }
}
```

## Consideraciones de Implementación

1. **Autenticación**: Implementar JWT con refresh tokens
2. **Validación**: Validar todos los inputs en el backend
3. **Paginación**: Implementar en todos los endpoints de listado
4. **Rate Limiting**: Implementar límites de solicitudes
5. **Logs**: Registrar todas las operaciones críticas
6. **Transacciones**: Usar transacciones de base de datos para operaciones críticas
7. **Websockets**: Considerar para notificaciones en tiempo real
8. **Cache**: Implementar cache para datos que no cambien frecuentemente

## Permisos por Rol

### Admin
- Acceso total a todos los endpoints

### Member
- Acceso a sus propios datos
- Crear solicitudes de préstamo
- Ver sus préstamos y pagos
- Actualizar su información personal

### External
- Solo acceso a información pública
- Ver tasas de interés y condiciones

---

Esta documentación debe ser actualizada conforme se desarrollen nuevas funcionalidades o se modifiquen las existentes.