# Arquitectura del Sistema

```mermaid
graph TD
    A[Frontend Nuxt.js] -->|Peticiones HTTP/REST| B(Backend API Express)
    B -->|Firebase Admin SDK| C[(Cloud Firestore)]
