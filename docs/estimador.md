# Documentación Técnica: Estimador de Tiempos de Espera (FilaCero)

**Autor:** Integrante 5 · Luis Rey  
**Rama:** `feature/waiting`  
**Entrega:** Revisión 2 (R2)  
**Módulo:** `src/modules/queue/queue.estimator.js`  

---

## 1. La Regla y Fórmula de Estimación

El tiempo estimado de espera para un turno individual o para la fila general de un trámite se calcula de acuerdo con la siguiente fórmula:

$$\text{Tiempo de Espera (minutos)} = \frac{\text{Promedio de duración de los últimos 10 tickets terminados del servicio} \times \text{Personas delante}}{\text{Módulos activos que atienden ese servicio}}$$

### Variables de la Fórmula:
1. **Promedio de duración de los últimos 10 tickets terminados:**
   - Se consultan los tickets con estado `DONE` pertenecientes al servicio (`serviceId`).
   - Se toma una muestra de hasta un máximo de **10 tickets finalizados recientes**, ordenados por su marca temporal de finalización descendente (`finishedAt desc`).
   - Si existen turnos con duraciones válidas, se promedia su duración en minutos.
2. **Personas delante (`ahead`):**
   - Número de turnos con estado `WAITING` pertenecientes al mismo servicio y día (`dayKey`), cuyo número de turno es estrictamente menor al del ticket consultado.
   - Para la consulta general de la cola (`GET /queue`), `ahead` equivale a la cantidad total de personas esperando (`waiting.length`).
3. **Módulos activos (`activeCounters`):**
   - Cantidad de ventanillas o módulos configurados con `active === true` que tienen asignado el identificador del servicio en su arreglo `serviceIds`.
   - Se acota con un piso de $\max(1, activeCounters)$ para garantizar estabilidad matemática y prevenir división por cero.

---

## 2. Caso por Defecto (Cold Start / Sin Historial)

Al inicio de la jornada operativa o en sucursales/servicios nuevos donde todavía no se registran tickets finalizados:
- Se utiliza un valor heurístico de referencia de **5 minutos por persona**.
- La API reporta explícitamente esta condición en su respuesta:
  - `isDefault: true`
  - `ticketsSampled: 0`
- Cuando ya se dispone de historial terminado:
  - `isDefault: false`
  - `ticketsSampled: N` (donde $1 \le N \le 10$)

---

## 3. Supuestos del Modelo

1. **Régimen de atención FIFO equilibrado:** Se asume que los turnos son llamados en orden correlativo por los módulos que atienden el servicio y que la carga se distribuye equitativamente entre los operadores disponibles.
2. **Relevancia temporal reciente:** Al limitar la muestra a los últimos 10 tickets terminados, el estimador reacciona con rapidez a variaciones operativas del día (ritmo del operador, fluidez del sistema o trámites rápidos/lentos) sin verse sesgado por promedios históricos lejanos.
3. **Atención inmediata:** Si un ticket no tiene personas delante (`ahead === 0`), el tiempo estimado es determinísticamente de **0 minutos**.
4. **Independencia de cálculo:** La función `estimateWaitTime` es una **función pura**, desacoplada de la base de datos y de la red, facilitando pruebas unitarias confiables y deterministas.
5. **Compatibilidad con tickets antiguos:** Funciona de forma transparente tanto con tickets nuevos como con tickets heredados de la R1 que no cuenten con campos `orgId` o `serviceName`.

---

## 4. ¿Por qué el resultado es solo una aproximación?

El resultado obtenido es estrictamente una **estimación de referencia** y no una garantía de tiempo exacto debido a factores no deterministas propios de la atención ciudadana presencial:

1. **Variabilidad intrínseca del trámite:** Dos ciudadanos solicitando el mismo servicio pueden requerir tiempos radicalmente distintos según la complejidad de su caso, la documentación presentada o incidencias técnicas.
2. **Turnos prioritarios o transferidos:** La inserción de turnos preferenciales o reasignados desde otros módulos puede alterar el orden estricto de llamada.
3. **Pausas y descansos operativos:** Un operador puede entrar en pausa o cambio de turno mientras un ciudadano espera, reduciendo temporalmente la capacidad de atención.
4. **Ausentismo (No-shows):** Ciudadanos que abandonan la sucursal antes de ser llamados son descartados rápidamente, reduciendo el tiempo de espera real por debajo de lo proyectado.

Por estas razones, la interfaz web del visitante presenta siempre el resultado con la simbología **«≈»** y la indicación textual **«(aproximado)»**, fomentando expectativas realistas en el usuario.

---

## 5. Endpoints y Estructura de Respuesta

### `GET /api/v1/queue/tickets/:id`
```json
{
  "success": true,
  "data": {
    "id": "abc123xyz",
    "code": "A-005",
    "serviceName": "Caja",
    "status": "WAITING",
    "ahead": 2,
    "counterId": null,
    "counterName": null,
    "estimatedMinutes": 10,
    "isDefault": false,
    "ticketsSampled": 10
  }
}
```

### `GET /api/v1/queue?serviceId=...`
```json
{
  "success": true,
  "data": {
    "serviceId": "srv-caja",
    "dayKey": "2026-11-25",
    "current": {
      "id": "t-003",
      "code": "A-003",
      "counterId": "cnt-1",
      "counterName": "Módulo 1"
    },
    "waiting": [
      { "id": "t-004", "code": "A-004", "number": 4 },
      { "id": "t-005", "code": "A-005", "number": 5 }
    ],
    "estimatedMinutes": 10,
    "isDefault": false,
    "ticketsSampled": 10
  }
}
```
