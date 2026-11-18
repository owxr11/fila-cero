# FilaCero->Administración de filas virtuales y turnos

## Problema
En los centros de atención, los usuarios enfrentan incertidumbre y pérdida de tiempo al no conocer el estado de su turno o el tiempo de espera. Esto genera aglomeraciones y una mala experiencia de usuario.

## Objetivo
Implementar una solución para reducir la incertidumbre mediante la emisión y seguimiento de turnos digitales. 

## Alcance del MVP
El sistema permitirá a los usuarios obtener un ticket y observar el avance de la fila virtual. Los operadores podrán atender solicitudes desde distintos módulos, evitando números duplicados, y el sistema calculará tiempos de espera aproximados basados en atenciones anteriores

## Roles
*   **Visitante:** Usuario que solicita un turno y consulta el tablero
*   **Operador:** Personal que llama, inicia y finaliza los turnos desde un módulo
*   **Administrador:** Encargado de configurar el establecimiento, los servicios y los módulos de atención

## Equipo y Roles
*   Alfredo-> Autentticacion y roles
*   Guillermo -> Catalogo de servicios
*   Omar-> Emision de tickets
*   Nicolas -> Consulta de turnos
*   Luis R-> Documentacion y entrega de R1


## Tecnologías
*   **Frontend:** Nuxt.js (Vue)
*   **Backend:** Node.js con Express (API REST)
*   **Base de Datos:** Firebase Cloud Firestore

## Cuentas de Prueba (Inventadas)
*   **Admin:** admin@filacero.test / password123
*   **Operador Módulo 1:** op1@filacero.test / password123

## Enlaces de Diseño
*   Las capturas de las 4 pantallas se encuentran en la carpeta `/evidencias`
