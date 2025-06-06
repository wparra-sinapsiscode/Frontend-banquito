# 🏛️ Sistema Banquito - Aplicativo de Préstamos Asociativos

Sistema completo de gestión de préstamos asociativos desarrollado en React para digitalizar las operaciones del "Banquito".

## 📋 Características Principales

### 🎯 Funcionalidades Implementadas

✅ **Sistema de Autenticación Multi-Rol**
- Administrador (acceso completo)
- Asociado/Miembro (vista personal)
- Cliente Externo (vista limitada)

✅ **Dashboard Dinámico**
- Resumen de capital total y disponible
- Métricas de préstamos activos
- Alertas de vencimientos próximos
- Vista personalizada por rol

✅ **Gestión de Préstamos**
- Registro estilo Excel con filtros avanzados
- Estados visuales (Al día/Vencido/Por vencer)
- Historial de pagos
- Progreso visual de cuotas

✅ **Sistema de Solicitudes**
- Formulario con validaciones automáticas
- Cálculo de tasas por monto (3%, 5%, 10%)
- Calculadora de cuotas
- Cronograma de pagos detallado

✅ **Gestión de Miembros**
- Calificación crediticia semáforo (🟢🟡🔴)
- Límites de préstamo automáticos
- Gestión de garantías y acciones
- Información de contacto

✅ **Panel Administrativo**
- Aprobación/rechazo de solicitudes
- Registro de pagos
- Modificación de fechas de vencimiento
- Gestión por prioridad crediticia

✅ **Sistema de Reportes**
- Reporte general de transparencia
- Análisis de cobranza
- Estadísticas de miembros
- Cronograma de pagos futuro
- Exportación a CSV

✅ **Configuración del Sistema**
- Tasas de interés configurables
- Límites de préstamo editables
- Valor de acciones ajustable
- Configuraciones de seguridad

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18 con Hooks
- **Estilos**: CSS3 con diseño responsivo
- **Estado**: useState/useEffect (sin Redux)
- **Datos**: Simulados localmente (sin backend)
- **Compatibilidad**: Node.js v22.14.0

## 📊 Datos Simulados

### Usuarios de Prueba
```
Administrador:
- Usuario: admin
- Contraseña: admin123

Asociado:
- Usuario: arteaga  
- Contraseña: arteaga123

Cliente Externo:
- Usuario: externo1
- Contraseña: ext123
```

### Base de Datos Simulada
- **40 asociados** con datos realistas
- **Préstamos activos** con diferentes estados
- **Calificaciones crediticias** variadas
- **Historial de pagos** simulado

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js v22.14.0 (verificado)
- npm v9.2.0 o superior

### Pasos de Instalación

1. **Navegar al directorio del proyecto**
```bash
cd banquito-system
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
npm start
```

4. **Abrir en navegador**
```
http://localhost:3000
```

## 📱 Diseño Responsivo

El sistema está optimizado para:
- **Desktop**: Experiencia completa con todas las funcionalidades
- **Tablet**: Adaptación de layouts y navegación
- **Mobile**: Interfaz simplificada y touch-friendly

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Primario**: #667eea (Azul Gradiente)
- **Secundario**: #764ba2 (Púrpura)
- **Éxito**: #28a745 (Verde)
- **Advertencia**: #ffc107 (Amarillo)
- **Peligro**: #dc3545 (Rojo)

### Tipografía
- **Fuente**: System fonts (-apple-system, Segoe UI, etc.)
- **Tamaños**: Escalados responsivamente
- **Pesos**: 400, 500, 600, 700

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas
- Límites de préstamo por garantía
- Validación de capital disponible
- Verificación de calificación crediticia
- Restricciones por rol de usuario

### Controles de Acceso
- Navegación condicional por rol
- Ocultamiento de funciones sensibles
- Validación de permisos en cada acción

## 📋 Estructura del Proyecto

```
banquito-system/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Login.js/.css
│   │   ├── Header.js/.css
│   │   ├── Dashboard.js/.css
│   │   ├── LoansTable.js/.css
│   │   ├── LoanRequest.js/.css
│   │   ├── MembersTable.js/.css
│   │   ├── AdminPanel.js/.css
│   │   ├── Reports.js/.css
│   │   └── Settings.js/.css
│   ├── data/
│   │   └── mockData.js
│   ├── App.js
│   ├── App.css
│   └── index.js
└── package.json
```

## 🎯 Casos de Uso Principales

### Para Administradores
1. **Gestión de Solicitudes**: Revisar, aprobar/rechazar préstamos
2. **Control de Pagos**: Registrar pagos y actualizar estados
3. **Gestión de Miembros**: Modificar calificaciones y datos
4. **Reportes**: Generar análisis de cobranza y estadísticas
5. **Configuración**: Ajustar tasas, límites y parámetros

### Para Asociados
1. **Solicitar Préstamos**: Completar formularios con cálculos automáticos
2. **Ver Estado**: Consultar préstamos activos y pagos pendientes
3. **Historial Personal**: Revisar historial de préstamos y pagos
4. **Información de Cuenta**: Ver garantías y límites disponibles

### Para Clientes Externos
1. **Consultar Tasas**: Ver tasas de interés públicas
2. **Información General**: Acceder a información de transparencia

## 🔄 Flujo de Operaciones

### Proceso de Préstamo
1. **Solicitud**: Cliente completa formulario con validaciones
2. **Evaluación**: Sistema verifica límites y calificación
3. **Revisión Admin**: Administrador revisa y decide
4. **Aprobación**: Préstamo se activa con cronograma
5. **Pagos**: Registro de cuotas mensuales
6. **Seguimiento**: Alertas de vencimientos

### Gestión de Cobranza
1. **Alertas Automáticas**: Vencimientos próximos (7 días)
2. **Estados Dinámicos**: Al día/Vencido/Por vencer
3. **Reportes de Mora**: Lista de pagos vencidos
4. **Contacto**: Información de miembros morosos

## 📈 Métricas y KPIs

### Dashboard Principal
- Capital total disponible
- Porcentaje de utilización
- Tasa de recuperación
- Préstamos por estado
- Alertas de cobranza

### Análisis de Miembros
- Utilización de garantía por miembro
- Historial crediticio
- Performance de pagos
- Ranking de calificaciones

## 🔧 Configuraciones Disponibles

### Tasas de Interés
- **>S/5,000**: 3% anual (configurable)
- **S/1,000-5,000**: 5% anual (configurable)
- **<S/1,000**: 10% anual (configurable)

### Límites del Sistema
- **Límite individual**: S/8,000 (configurable)
- **Porcentaje de garantía**: 80% (configurable)
- **Valor por acción**: S/500 (configurable)

### Operaciones
- **Día de operaciones**: Miércoles (configurable)
- **Plazos de préstamo**: 6, 8, 12, 18, 24, 36 meses

## 🔍 Testing y Validación

### Pruebas Realizadas
- ✅ Funcionalidad de login por roles
- ✅ Cálculos de intereses y cuotas
- ✅ Validaciones de límites
- ✅ Navegación responsiva
- ✅ Estados de préstamos
- ✅ Exportación de reportes

### Escenarios Probados
- Solicitudes dentro y fuera de límites
- Cambios de calificación crediticia
- Registro de pagos parciales y completos
- Filtros y búsquedas en tablas
- Configuración de parámetros del sistema

## 📝 Próximas Mejoras (Roadmap)

### Funcionalidades Futuras
- [ ] Integración con backend real
- [ ] Notificaciones por email/SMS
- [ ] App móvil nativa
- [ ] Integración bancaria
- [ ] Firma digital de contratos
- [ ] Reportes avanzados con gráficos
- [ ] API para integraciones externas

### Mejoras Técnicas
- [ ] Tests unitarios automatizados
- [ ] Optimización de performance
- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Backup automático en la nube

## 🚀 Scripts Disponibles

### `npm start`
Ejecuta la aplicación en modo desarrollo.
Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### `npm test`
Lanza el corredor de pruebas en modo interactivo.

### `npm run build`
Construye la aplicación para producción en la carpeta `build`.

### `npm run eject`
**Nota: Esta es una operación irreversible.**
Expone las configuraciones de webpack para personalización avanzada.

## 👥 Soporte y Contacto

Para soporte técnico o consultas sobre el sistema:

- **Documentación**: Este README
- **Demos**: Usar credenciales de prueba
- **Issues**: Reportar problemas en el repositorio

## 📄 Licencia

Sistema desarrollado para digitalizar operaciones de préstamos asociativos.
Código generado con Claude Code.

---

**🏛️ Sistema Banquito v1.0**  
*Transformando la gestión de préstamos asociativos*

**Última actualización**: Mayo 2025  
**Compatible con**: Node.js v22.14.0+