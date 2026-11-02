# IdeaVault — Organizador y Laboratorio de Ideas (PWA)

Aplicación web progresiva (PWA) de incubación, priorización mediante **Matriz ICE** (*Impact, Confidence, Ease*) y validación científica de hipótesis, construida bajo el estándar arquitectónico **`fullstack-pwa-blueprint`** y el sistema de diseño **`ui-ux-pro-max`**.

---

## 1. Stack Tecnológico

- **Core:** React 18.3 + TypeScript Estricto (`tsc --noEmit` sin errores) + Vite 5.
- **UI & Diseño (`ui-ux-pro-max`):**
  - Tailwind CSS (`clsx`, `tailwind-merge`), tipografía `Plus Jakarta Sans`.
  - Paleta `Slate` + Acento Primario `Teal (#0D9488)` y Acción `Orange/Amber (#F97316)`.
  - Soporte nativo **Light/Dark Mode** con contraste WCAG AAA (>7:1).
  - Iconografía 100% vectorial mediante `lucide-react` (0 emojis como iconos de UI).
- **Persistencia Dual (Offline-First + Cloud Real-Time):**
  - **Capa Local:** `localStorage` versionado (`ideavault_state_v1`), auto-recuperación ante corrupción (`ideavault_state_v1_corrupt_backup`), defensa activa contra *Prototype Pollution*, sincronización instantánea multi-pestaña (`storage` event) y portabilidad `.json` / `.md`.
  - **Capa Cloud:** Google Firebase (`firebase/auth` con login de Google en 1 clic y `firebase/firestore` con suscripción reactiva `onSnapshot`, sanitización recursiva de `undefined` a `null` y degradación elegante a Modo Local).
- **Audio & Notificaciones PWA:**
  - Síntesis de sonido sin archivos externos vía **Web Audio API** (`soundService.ts`) y notificaciones nativas mediante `sw.js`.
- **Testing:** Vitest + `@testing-library/react` + `@testing-library/user-event` + `jsdom` organizados en **5 Tiers**.

---

## 2. Estructura del Proyecto

```text
.
├── public/
│   ├── manifest.json            # Configuración PWA instalable (standalone)
│   ├── sw.js                    # Service Worker para soporte offline y notificaciones
│   └── icon.svg                 # Ícono vectorial de IdeaVault
├── src/
│   ├── types/
│   │   └── domain.ts            # Contratos TypeScript de entidades, estado global, KPIs y acciones
│   ├── constants/
│   │   ├── initialData.ts       # Datos semilla (6 ideas realistas en distintas etapas)
│   │   └── theme.ts             # Tokens de etapas, categorías, niveles de energía y plantillas
│   ├── context/
│   │   ├── AppContext.tsx       # Separación en StateContext y DispatchContext + persistencia dual
│   │   ├── appReducer.ts        # Reducer puro e inmutable para las acciones del dominio
│   │   ├── AuthContext.tsx      # Autenticación con Google (Firebase) y estado de sesión
│   │   └── ThemeContext.tsx     # Proveedor de tema Claro/Oscuro con persistencia local
│   ├── services/
│   │   ├── aiAgentService.ts    # Agente IA de razonamiento profundo y generador de Roadmap
│   │   ├── storageService.ts    # CRUD localStorage, Export/Import JSON y auto-recuperación
│   │   ├── migrationService.ts  # Validación de esquema (CURRENT_SCHEMA_VERSION) y anti-pollution
│   │   ├── firebase.ts          # Inicialización segura, Firestore tiempo real y sanitización
│   │   └── soundService.ts      # Web Audio API sintetizada y alertas del Service Worker
│   ├── utils/
│   │   ├── cn.ts                # Utilidad clsx + tailwind-merge
│   │   ├── metrics.ts           # Motor puro de cálculo de KPIs, ICE Score, cuadrantes y Markdown
│   │   ├── wordExport.ts        # Generador nativo de documentos Word (.doc) con Roadmap por fases
│   │   └── dateUtils.ts         # Utilidades de fechas seguras sin desfase UTC y validación bisiesta
│   ├── components/
│   │   ├── common/              # EmptyState reutilizable
│   │   ├── layout/              # Header (con indicador Nube/Local), BentoMetrics, FilterBar
│   │   ├── ideas/               # IdeaCard, IdeaBoardView, IceMatrixView, AnalyticsView,
│   │   │                        # IdeaDetailDrawer (Lean Canvas & Checklist) y NewIdeaModal
│   │   └── settings/            # DataSettingsModal (Exportar/Importar JSON y Reset a Seed)
│   └── test/                    # Pruebas unitarias base y Tier 5 (estrés de alto volumen)
├── tests/
│   └── e2e/                     # Suite Opaque-Box en 4 Tiers (Features, Boundaries, Pairwise, Scenarios)
├── .env.example                 # Plantilla documentada de variables VITE_FIREBASE_*
├── netlify.toml                 # Configuración lista para despliegue SPA en producción
├── PROJECT.md                   # Arquitectura, inventario de features y contratos
├── STATUS.md                    # Estado actual del proyecto, hitos completados y guía de despliegue
└── TEST_INFRA.md                # Especificación de la arquitectura de pruebas de 5 niveles
```
