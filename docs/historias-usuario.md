# Historias de Usuario y criterios de aceptacion

### Historia1: Iniciar Sesión
**Como** administrador u operador, **quiero** iniciar sesión en el sistema **para** acceder a mis funciones correspondientes.
*   **Criterios de Aceptación:**
    *   El sistema debe validar credenciales correctas.
    *   Debe existir control de acceso basado en el rol
    *   Las contraseñas no deben viajar en texto plano.

### Historia2: Administrar Servicios
**Como** administrador, **quiero** configurar los servicios que ofrece el establecimiento **para** que los visitantes puedan elegir qué trámite realizar
*   **Criterios de Aceptación:**
    *   El administrador puede crear, editar y eliminar   servicios.
    *   Cada servicio debe tener un nombre y prefijo 

### Historia3: Administrar Módulos
**Como** administrador, **quiero** configurar los módulos  **para** asignar operadores a cada uno
*   **Criterios de Aceptación:**
    *   Se puede registrar un módulo con su nombre/número.
    *   Se puede vincular un módulo a uno o varios servicios específicos.

### Historia4: Sacar Turno
**Como** usuario visitante, **quiero** obtener un ticket para un servicio **para** asegurar mi lugar en la fila
*   **Criterios de Aceptación:**
    *   El sistema emite un número de turno único por jornada y servicio
    *   El sistema entrega un código consultable al usuari

### Historia5: Consultar Turno y Ver Tablero
**Como** usuario visitante, **quiero** ver el tablero en tiempo casi real **para** saber cuándo es mi turno y a qué módulo dirigirme
*   **Criterios de Aceptación:**
    *   El tablero se actualiza automáticamente cuando un operador llama un nuevo turno
    *   Debe existir una vista móvil para consultar el estado específico de un ticket
