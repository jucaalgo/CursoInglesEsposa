# Profesoria: Plan de Mejoras — Ejecución Completa

> Fecha: 2026-05-15
> Basado en: APP-AUDIT-REPORT.md + SEO-AUDIT-REPORT.md
> Deploy: Vercel (prj_JaIZ7JIdifl5xndYdpZ7mNO2mGgd)
> Skills disponibles: 84 (verificados)

---

## Estado de Skills y Agentes

| Categoría | Skills | Estado |
|-----------|--------|--------|
| Orquestación | using-superpowers, brainstorming, dispatching-parallel-agents, writing-plans, executing-plans, verification-before-completion | Instalados |
| Marketing/SEO | seo-audit, content-strategy, social, copywriting, ab-testing, cro, analytics, ai-seo | Instalados |
| Desarrollo | frontend-design, react-best-practices, composition-patterns, webapp-testing, test-driven-development, systematic-debugging | Instalados |
| Deploy | deploy-to-vercel | Instalado |
| Documentos | pdf, pptx, docx, xlsx | Instalados |

**Todos los skills están instalados y disponibles.** Se usarán según cada fase.

---

## Fase 1 — Fixes Críticos (Día 1-2)

### 1.1 Backend Proxy para API Key de Gemini
**Skill:** `claude-api` + `supabase-specialist`

| Paso | Acción | Archivo |
|------|--------|---------|
| 1 | Crear Supabase Edge Function `gemini-proxy` que guarde la API key como secreto | `supabase/functions/gemini-proxy/index.ts` |
| 2 | Mover `VITE_GEMINI_API_KEY` del `.env.local` a Supabase secrets | Config |
| 3 | Modificar `client.ts` para llamar al proxy en vez de Gemini directo | `src/services/ai/client.ts` |
| 4 | Eliminar opción de API key manual en Settings | `src/components/SettingsModal.tsx` |
| 5 | Eliminar `profesoria_api_key` de localStorage en todos los archivos | Multi-archivo |

**Resultado:** API key 100% fuera del bundle del cliente.

### 1.2 RLS Estricto para Leaderboard
**Skill:** `supabase-specialist`

| Paso | Acción |
|------|--------|
| 1 | Crear vista `leaderboard_view` que exponga solo `username, name, xp_total, streak_count, current_level` |
| 2 | Cambiar `getAllProfiles()` para usar la vista en vez de la tabla completa |
| 3 | Actualizar política RLS: SELECT en profiles solo para campos del leaderboard |

**Resultado:** Los usuarios solo ven datos necesarios para ranking, no perfiles completos.

### 1.3 Fix Fuga de Memoria en AudioRecorder
**Skill:** `systematic-debugging`

| Paso | Acción | Archivo |
|------|--------|---------|
| 1 | Remover `isRecording` de dependencias del cleanup useEffect | `AudioRecorder.tsx:18` |
| 2 | Usar `useRef` para trackear estado de grabación en vez de depender del state | `AudioRecorder.tsx` |
| 3 | Añadir cleanup explícito en `onstop` del MediaRecorder | `AudioRecorder.tsx` |

### 1.4 Fix Fuga de Memoria en LiveSession
**Skill:** `systematic-debugging`

| Paso | Acción | Archivo |
|------|--------|---------|
| 1 | Crear hook `useLiveSession` que maneje el ciclo de vida del componente | Nuevo: `src/hooks/useLiveSession.ts` |
| 2 | Llamar `disconnect()` en cleanup del useEffect | Hook nuevo |
| 3 | Añadir timeout de inactividad (5 min sin actividad = auto-disconnect) | `live.ts` |
| 4 | Migrar `ScriptProcessorNode` a `AudioWorkletNode` (deprecated) | `live.ts:64` |

### 1.5 Rate Limiting en Llamadas a Gemini
**Skill:** `claude-api`

| Paso | Acción | Archivo |
|------|--------|---------|
| 1 | Crear utilidad `rateLimiter.ts` con debounce por usuario | Nuevo: `src/utils/rateLimiter.ts` |
| 2 | Añadir debounce de 2s en el input del chat de Practice | `Practice.tsx` |
| 3 | Añadir throttle en generateInteractiveContent (mismo tema = cache hit) | `generators.ts` |
| 4 | Implementar retry con backoff exponencial en errores 429 | `client.ts` |

---

## Fase 2 — UX y Protección (Día 3-4)

### 2.1 Pantalla para Visitantes No Autenticados
**Skill:** `frontend-design`

| Paso | Acción |
|------|--------|
| 1 | Crear componente `AuthGate` que muestre mensaje + CTA login/registro si no hay user |
| 2 | Reemplazar `ProtectedRoute` actual por `AuthGate` con UI completa |
| 3 | Añadir redirect automático al login con mensaje de contexto |

### 2.2 Sistema de Notificaciones/Toasts
**Skill:** `frontend-design`

| Paso | Acción |
|------|--------|
| 1 | Crear `ToastProvider` con tipos: error, warning, success, info |
| 2 | Reemplazar todos los `console.error` visibles al usuario con toasts |
| 3 | Diferenciar errores: sin red → "Sin conexión, usando datos locales", timeout → "La IA tardó demasiado", error servidor → "Error del servidor, intenta de nuevo" |
| 4 | Añadir botón de reintentar en toasts de error |

### 2.3 Onboarding para Nuevos Usuarios
**Skill:** `frontend-design` + `brainstorming`

| Paso | Acción |
|------|--------|
| 1 | Crear página `/welcome` con flujo: bienvenida → test de nivel → intereses → objetivo |
| 2 | Implementar test de placement rápido (10 preguntas adaptativas) |
| 3 | Redirigir de `/signup` a `/welcome` tras registro |
| 4 | Guardar resultados en perfil del usuario |

### 2.4 Validación de Contraseñas
**Skill:** `frontend-design`

| Paso | Acción |
|------|--------|
| 1 | Añadir campo de confirmación de contraseña en SignupPage |
| 2 | Implementar indicador de fortaleza (débil/medio/fuerte) |
| 3 | Mostrar errores específicos (mínimo 8 chars, número, símbolo) |
| 4 | Añadir toggle de visibilidad de contraseña |

### 2.5 Pantalla de Carga Inicial
**Skill:** `frontend-design`

| Paso | Acción |
|------|--------|
| 1 | Añadir spinner/branding dentro de `<div id="root">` en `index.html` |
| 2 | React reemplaza automáticamente al montar |
| 3 | Añadir skeleton screens en Home mientras carga el perfil |

---

## Fase 3 — Rendimiento (Día 5-6)

### 3.1 Lazy Loading de Rutas
**Skill:** `react-best-practices`

| Paso | Acción | Archivo |
|------|--------|---------|
| 1 | Convertir imports eager a `React.lazy()` | `App.tsx` |
| 2 | Añadir `<Suspense>` con fallback de loading | `App.tsx` |
| 3 | Preload rutas probables al hover del nav | `Layout.tsx` |

```tsx
// Antes:
import Practice from './pages/Practice';
// Después:
const Practice = React.lazy(() => import('./pages/Practice'));
```

### 3.2 Cache Mejorado
**Skill:** `systematic-debugging`

| Paso | Acción |
|------|--------|
| 1 | Implementar límite de tamaño total del cache (2MB máx) |
| 2 | Añadir cleanup proactivo al iniciar la app (no solo cuando falla) |
| 3 | Separar cache de lecciones (1MB) de TTS (1MB) |
| 4 | Migrar TTS cache a IndexedDB (mayor capacidad que localStorage) |

### 3.3 Cancelación de TTS
**Skill:** `systematic-debugging`

| Paso | Acción |
|------|--------|
| 1 | Mantener ref al `AudioBufferSourceNode` actual | `audio.ts` |
| 2 | Llamar `.stop()` antes de reproducir nuevo audio | `Practice.tsx` |
| 3 | Cancelar TTS pendiente si el usuario envía nuevo mensaje |

### 3.4 Estilos Dinámicos — Eliminar Hardcodes
**Skill:** `frontend-design`

| Paso | Acción |
|------|--------|
| 1 | Auditar todos los `bg-gray-*`, `text-gray-*`, `border-gray-*` hardcodeados |
| 2 | Reemplazar con CSS variables del tema |
| 3 | Asegurar que todos los 6 temas (midnight, aurora, forest, sunset, ocean, light) funcionen en cada componente |

---

## Fase 4 — SEO y Visibilidad (Día 7-8)

### 4.1 Landing Page Pública
**Skill:** `frontend-design` + `copywriting`

| Sección | Contenido |
|---------|-----------|
| Hero | "Master English with AI" + CTA "Start Free" |
| Features | 6 cards: Smart Practice, Academy, Grammar Lab, Pronunciation, Hands-Free, Streaks |
| How It Works | 3 pasos: Sign up → Take placement test → Start learning |
| Social Proof | Estadísticas simuladas + testimonios |
| Pricing | Plan gratuito + plan pro |
| FAQ | Schema FAQPage para Google |
| Footer | Links: Features, Pricing, About, Privacy, Terms |

### 4.2 Meta Tags Dinámicos
**Skill:** `react-best-practices`

| Paso | Acción |
|------|--------|
| 1 | Instalar `react-helmet-async` |
| 2 | Crear `SEOHead` component con title, description, OG, canonical |
| 3 | Añadir meta tags por ruta: Home, Features, Pricing, About |
| 4 | Corregir description a inglés: "Learn English with AI — Practice conversations, get real-time corrections..." |

### 4.3 Sitemap y Robots.txt
**Skill:** `seo-audit`

| Paso | Acción |
|------|--------|
| 1 | Crear `public/robots.txt` |
| 2 | Generar `sitemap.xml` con rutas públicas |
| 3 | Añadir Schema markup: SoftwareApplication + Organization |
| 4 | Eliminar `user-scalable=no` del viewport |

### 4.4 PWA Manifest Completo
**Skill:** `react-best-practices`

| Paso | Acción |
|------|--------|
| 1 | Añadir iconos PNG 192x192 y 512x512 |
| 2 | Completar manifest: `start_url`, `display`, `background_color` |
| 3 | Crear favicon real (no emoji SVG) |
| 4 | Añadir `apple-touch-icon` |

---

## Fase 5 — Mejoras de Producto (Día 9-12)

### 5.1 Indicador de Estado de Conexión
**Skill:** `frontend-design`

| Estado | UI |
|--------|----|
| Online | Sin indicador |
| Offline | Banner amarillo: "Sin conexión — cambios guardados localmente" |
| Syncing | Ícono de sync girando |
| Error | Toast rojo con botón de reintentar |

### 5.2 Estado Global con Zustand
**Skill:** `react-best-practices`

| Paso | Acción |
|------|--------|
| 1 | Instalar `zustand` |
| 2 | Crear `useProfileStore` — carga perfil una vez, compartido en toda la app |
| 3 | Crear `useUIStore` — toasts, modales, estado de conexión |
| 4 | Migrar `useUserProfile` de llamadas repetidas a store global |

### 5.3 Test de Placement / Onboarding Quiz
**Skill:** `frontend-design` + `claude-api`

| Paso | Acción |
|------|--------|
| 1 | Crear 20 preguntas de placement (5 por nivel A1-C1) |
| 2 | Algoritmo adaptativo: si acierta 3/5 de un nivel, sube al siguiente |
| 3 | UI tipo quiz con barra de progreso |
| 4 | Resultado: asigna `current_level` automáticamente al perfil |

### 5.4 Modo Offline
**Skill:** `systematic-debugging`

| Paso | Acción |
|------|--------|
| 1 | Service Worker ya configurado (vite-plugin-pwa) — verificar que cachea assets |
| 2 | Añadir indicador visual de modo offline |
| 3 | Cache de lecciones ya visitadas para uso sin red |
| 4 | Queue de acciones offline que se sincronizan al reconectar |

### 5.5 Analytics con GA4
**Skill:** `analytics`

| Evento | Parámetros |
|--------|------------|
| `signup` | method, level |
| `lesson_start` | topic, level |
| `lesson_complete` | topic, level, xp_earned, time_spent |
| `practice_message` | level, has_corrections |
| `pronunciation_attempt` | score, level |
| `streak_milestone` | streak_days |

---

## Fase 6 — Marketing y Crecimiento (Día 13-16)

### 6.1 Página de Pricing
**Skill:** `copywriting` + `pricing`

| Plan | Precio | Incluye |
|------|--------|---------|
| Free | $0/mes | 5 lecciones/día, Practice básico, Grammar Lab |
| Pro | $9.99/mes | Ilimitado, modo offline, analytics avanzados, prioridad en IA |

### 6.2 Feature Pages para SEO
**Skill:** `content-strategy` + `ai-seo`

| Página | Keyword Target | Contenido |
|--------|---------------|-----------|
| `/features/smart-practice` | AI English tutor | Conversación con correcciones en tiempo real |
| `/features/pronunciation` | English pronunciation practice | Feedback de pronunciación con heatmap |
| `/features/grammar-lab` | English grammar checker | Análisis gramatical con IA |
| `/features/academy` | English learning course | 50+ temas personalizados CEFR A1-C2 |
| `/vs-duolingo` | Duolingo alternative | Comparativa honesta |
| `/vs-babbel` | Babbel alternative | Comparativa honesta |

### 6.3 Blog para Contenido SEO
**Skill:** `content-strategy` + `copywriting`

| Artículo | Keyword |
|----------|---------|
| "How AI is Changing English Learning" | AI English learning |
| "CEFR Levels Explained" | CEFR levels English |
| "How to Practice English Pronunciation" | English pronunciation tips |
| "Best English Learning Apps 2026" | best English learning app |

### 6.4 Lead Magnet
**Skill:** `lead-magnets`

| Recurso | Formato | Captura |
|---------|---------|---------|
| "50 Essential English Phrases" | PDF descargable | Email |
| "English Level Test" | Quiz interactivo | Email + nivel |
| "Pronunciation Guide" | PDF | Email |

---

## Ejecución — Orden y Paralelización

### Sprint 1 (Día 1-2): Críticos
Usar `dispatching-parallel-agents` para ejecutar en paralelo:
- **Agente A:** Backend proxy Gemini (1.1) + RLS (1.2)
- **Agente B:** Fix fugas de memoria (1.3 + 1.4)
- **Agente C:** Rate limiting (1.5)

### Sprint 2 (Día 3-4): UX
- **Agente A:** AuthGate + Toasts (2.1 + 2.2)
- **Agente B:** Onboarding + Password validation (2.3 + 2.4)
- **Agente C:** Pantalla de carga (2.5)

### Sprint 3 (Día 5-6): Rendimiento
- **Agente A:** Lazy loading (3.1) + Cache mejorado (3.2)
- **Agente B:** TTS cancelación (3.3) + Estilos dinámicos (3.4)

### Sprint 4 (Día 7-8): SEO
- **Agente A:** Landing page (4.1)
- **Agente B:** Meta tags + Sitemap + Schema (4.2 + 4.3 + 4.4)

### Sprint 5 (Día 9-12): Producto
- **Agente A:** Estado conexión + Zustand (5.1 + 5.2)
- **Agente B:** Placement test (5.3)
- **Agente C:** Offline mode (5.4) + Analytics (5.5)

### Sprint 6 (Día 13-16): Marketing
- **Agente A:** Pricing + Feature pages (6.1 + 6.2)
- **Agente B:** Blog + Lead magnets (6.3 + 6.4)

---

## Verificación por Sprint

Después de cada sprint, usar `verification-before-completion` para:
1. Compilar sin errores (`npm run build`)
2. Verificar en local (`npm run dev`)
3. Probar en Vercel preview deployment
4. Verificar RLS en Supabase
5. Testear en mobile (viewport 375px)
6. Lighthouse score > 90 en performance