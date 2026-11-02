# Arquitectura de Pruebas en 5 Niveles (5-Tier Test Suite) — IdeaVault

Este documento especifica la estrategia de verificación **Opaque-Box y Unitaria** implementada en IdeaVault siguiendo el estándar `fullstack-pwa-blueprint`.

---

## Resumen de los 5 Niveles (Tiers)

| Nivel | Archivo | Enfoque Principal |
| :--- | :--- | :--- |
| **Unit Base** | [`src/test/domain.unit.test.ts`](src/test/domain.unit.test.ts) | Pruebas puras de `appReducer`, cálculo de ICE Score, validación de fechas, auto-recuperación de `localStorage` y sanitización de Firestore. |
| **Tier 1 (Feature Coverage)** | [`tests/e2e/tier1-features.test.tsx`](tests/e2e/tier1-features.test.tsx) | $\ge 5$ pruebas de casos de éxito (*happy paths*): renderizado de KPIs Bento, captura rápida de chispas, modal con plantillas, cajón de detalles, navegación de vistas y modo oscuro. |
| **Tier 2 (Boundaries & Corner Cases)** | [`tests/e2e/tier2-boundaries.test.tsx`](tests/e2e/tier2-boundaries.test.tsx) | $\ge 5$ pruebas de límites: textos vacíos, truncamiento de longitudes máximas, años bisiestos (`2028-02-29` vs `2027-02-29`), referencias circulares, `QuotaExceededError`, JSON corrupto y bloqueo de *Prototype Pollution*. |
| **Tier 3 (Cross-Feature Pairwise)** | [`tests/e2e/tier3-pairwise.test.tsx`](tests/e2e/tier3-pairwise.test.tsx) | Interacción simultánea de múltiples subsistemas: filtro de categoría + búsqueda + fijadas + completado de experimentos en el cajón + promoción de etapa + recálculo de KPIs en vivo. |
| **Tier 4 (Real-World Scenarios)** | [`tests/e2e/tier4-scenarios.test.tsx`](tests/e2e/tier4-scenarios.test.tsx) | Flujos completos de extremo a extremo: ciclo de vida completo de una idea (`spark` $\to$ `launched`) y recuperación ante desastres mediante exportación/importación `.json`. |
| **Tier 5 (Adversarial & Stress)** | [`src/test/tier5-stress.test.ts`](src/test/tier5-stress.test.ts) | Pruebas de alto volumen ($750$ a $1,000$ ideas simultáneas) verificando tiempos de respuesta $< 10\text{ms}$ por operación en el motor de métricas, filtrado y reducer inmutable. |

---

## Comando de Ejecución

```bash
npm test
```
