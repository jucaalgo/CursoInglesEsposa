# Profesoria: English Mastery — Auditoría de Aplicación

> Fecha: 2026-05-15
> Stack: React 19 + Vite 6 + Tailwind 4 + Supabase + Google Gemini AI
> Archivos revisados: 25+ archivos fuente

---

## Resumen Ejecutivo

La app tiene una base sólida — gamificación (XP, rachas, badges), práctica conversacional con IA, ejercicios interactivos variados, TTS, y modo manos-libres. Pero tiene **bugs funcionales, problemas de seguridad graves, fugas de memoria, y fallos de UX** que afectan directamente la experiencia del usuario.

**Puntuación: 6/10** — Funcional pero con problemas que deben corregirse antes de lanzar.

---

## BUGS CRÍTICOS

### 1. API Key de Gemini expuesta en el cliente — SEGURIDAD CRÍTICA

**Archivo:** `src/services/ai/client.ts`

```typescript
const customKey = localStorage.getItem('profesoria_api_key');
const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY
    || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
const apiKey = customKey || envKey;
```

**Problema:** La API key de Gemini está expuesta en el bundle del cliente. Cualquiera puede abrirla con DevTools y usarla sin límite. Además, permite que el usuario ingrese su propia key manualmente (localStorage), lo cual es confuso e inseguro.

**Impacto:** CRÍTICO — Cualquier usuario puede extraer la key y hacer llamadas directas a la API de Google con tu cuota.

**Fix:** Crear un backend proxy (Supabase Edge Functions o API route) que guarde la key y haga las llamadas a Gemini. Nunca exponerla al cliente.

---

### 2. Fuga de memoria en AudioRecorder — BUG ALTO

**Archivo:** `src/components/AudioRecorder.tsx:18-25`

```typescript
useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };
}, [isRecording]); // ← PROBLEMA: se ejecuta CADA VEZ que isRecording cambia
```

**Problema:** El `useEffect` con `[isRecording]` como dependencia se limpia y recrea cada vez que cambia el estado de grabación. Esto puede causar:
- Limpieza prematura de tracks mientras se graba
- El `stream.getTracks().forEach(track.stop())` se ejecuta durante la grabación activa al cambiar `isRecording`

**Fix:** Remover `isRecording` de las dependencias del cleanup, o usar `useRef` para trackear el estado.

---

### 3. Fuga de memoria en LiveSession (Sesión de voz) — BUG ALTO

**Archivo:** `src/services/ai/live.ts`

```typescript
export class LiveSession {
    // NUNCA se desconecta automáticamente
    // No hay timeout de inactividad
    // Si el componente se desmonta, la sesión queda abierta
```

**Problemas:**
- La clase `LiveSession` abre 2 `AudioContext`, 1 `MediaStream`, y 1 conexión WebSocket a Gemini
- Si el componente se desmonta sin llamar `disconnect()`, todo queda abierto
- No hay timeout de inactividad — la sesión puede quedar abierta indefinidamente
- `ScriptProcessorNode` (línea 64) está **deprecated** — debería usarse `AudioWorkletNode`

**Fix:** Implementar cleanup automático con timeout, migrar a `AudioWorkletNode`, y usar `useEffect` cleanup en el componente que use `LiveSession`.

---

### 4. Cache en localStorage sin límite real — BUG MEDIO

**Archivo:** `src/services/cache.ts`

```typescript
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24h
const TTS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días
```

**Problema:** El cache de TTS guarda **audio base64** en localStorage. Un solo audio de 10 segundos puede ser ~500KB en base64. Con 7 días de TTL y múltiples lecciones, esto puede llenar fácilmente los 5-10MB de localStorage.

La función `evictOldestEntries()` solo se ejecuta cuando falla `setItem`, y solo elimina el 20% más viejo del cache, no del resto de localStorage (perfiles, sesiones, etc.).

**Fix:** Implementar un límite de tamaño total del cache (ej: 2MB) y limpiar proactivamente al cargar la app, no solo cuando falla.

---

### 5. Perfiles con RLS inseguro — SEGURIDAD ALTA

**Archivo:** `src/services/repository.ts:43-64`

```typescript
export const getAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profesoria_profiles')
        .select('*')
        .order('name', { ascending: true });
```

**Problema:** `getAllProfiles()` lee TODOS los perfiles de la base de datos sin filtro. Esto significa que cualquier usuario autenticado puede ver los nombres, niveles, XP y datos de TODOS los demás usuarios. El Leaderboard muestra esta información públicamente.

**Fix:** Implementar Row Level Security (RLS) en Supabase para que cada usuario solo pueda leer datos limitados de otros (nombre, XP, nivel) y no datos sensibles.

---

### 6. Race condition en useUserProfile — BUG MEDIO

**Archivo:** `src/hooks/useUserProfile.ts:36-38`

```typescript
useEffect(() => {
    loadProfile();
}, [user]);
```

**Problema:** Si `user` cambia rápidamente (ej: login → redirect), `loadProfile` se ejecuta múltiples veces sin cancelación. La segunda llamada puede sobrescribir datos de la primera.

**Fix:** Usar `AbortController` o flag de cancelación en el effect cleanup.

---

## PROBLEMAS DE UX

### 7. No hay manejo de errores visible al usuario — UX ALTO

**Archivos:** Prácticamente todos los servicios

```typescript
} catch (e) {
    console.error("Pronunciation eval error", e);
    return { phrase: targetPhrase, score: 0, feedback: "Analysis error or timeout. Check connection.", words: [] };
}
```

**Problema:** Los errores se loguean en consola pero el usuario ve mensajes genéricos como "Analysis error or timeout" sin saber qué hacer. No hay:
- Indicador de estado de conexión
- Botón de reintento
- Mensaje diferenciado entre "sin internet" vs "error del servidor" vs "timeout"

**Fix:** Crear un sistema de notificaciones/toasts con errores categorizados y acciones sugeridas.

---

### 8. Sin pantalla de carga inicial / splash — UX MEDIO

**Problema:** Cuando la app carga, el usuario ve una pantalla en blanco hasta que React hidrata. No hay skeleton, spinner, ni splash screen mientras se carga el JS bundle.

**Fix:** Añadir un loading state en `index.html` dentro de `<div id="root">` que se reemplaza cuando React monta.

---

### 9. Contraseñas sin validación — UX MEDIO

**Archivo:** `src/pages/Auth/SignupPage.tsx:109`

```html
<input type="password" required minLength={6} />
```

**Problema:** Solo valida `minLength={6}`. No hay:
- Indicador de fortaleza de contraseña
- Validación de que las contraseñas coincidan (no hay campo de confirmación)
- Feedback visual de errores específicos

**Fix:** Añadir campo de confirmación de contraseña e indicador de fortaleza.

---

### 10. Sin protección de rutas para visitantes — UX ALTO

**Problema:** Un usuario no autenticado que navega a `/academy` ve un spinner infinito — `useUserProfile` retorna `null` y el componente retorna `null`. No hay mensaje de "inicia sesión" ni redirect automático.

El `ProtectedRoute` solo verifica si hay `user`, pero no muestra nada útil si no lo hay.

**Fix:** Mostrar un mensaje claro con botón de login/registro cuando el usuario no está autenticado, en vez de pantalla vacía.

---

### 11. Sin manejo de API key faltante en Practice — UX MEDIO

**Archivo:** `src/pages/Practice.tsx:112-125`

```tsx
if (apiKeyMissing) {
    return (
        <div>
            <AlertCircle />
            <h2>API Key Missing</h2>
            <p>To use the AI Tutor, you need to configure your Google Gemini API Key.</p>
            <div>Click the ⚙️ settings icon in the top right corner.</div>
        </div>
    );
}
```

**Problema:** Se le pide al usuario que ingrese manualmente una API key de Gemini. Esto es:
1. Confuso para usuarios no-técnicos
2. Inseguro (la key queda en localStorage)
3. Innecesario si hay un backend proxy

**Fix:** Eliminar la opción de API key manual y manejar todo desde el backend.

---

### 12. Sin onboarding para nuevos usuarios — UX ALTO

**Problema:** Un usuario nuevo que se registra es redirigido a `/academy` directamente. No hay:
- Tutorial o walkthrough
- Selección de nivel inicial
- Test de placement
- Explicación de cómo funciona la app

El perfil se crea con `current_level: 'A1'` y `target_level: 'B2'` por defecto, sin preguntar.

**Fix:** Crear un flujo de onboarding: bienvenida → test de nivel → selección de intereses → tutorial rápido.

---

## PROBLEMAS DE RENDIMIENTO

### 13. Bundle size sin lazy loading — RENDIMIENTO ALTO

**Archivo:** `src/App.tsx`

```tsx
// Todas las rutas se importan eager:
import Practice from './pages/Practice';
import Academy from './pages/Academy';
import Lesson from './pages/Lesson';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
```

**Problema:** Todas las páginas se cargan en el bundle inicial. `Lesson.tsx` importa `canvas-confetti`, `react-markdown`, y todos los exercise components. `Practice.tsx` importa el `AudioRecorder` y todos los servicios de IA.

**Fix:** Usar `React.lazy()` + `Suspense` para code-splitting por ruta:
```tsx
const Practice = React.lazy(() => import('./pages/Practice'));
const Academy = React.lazy(() => import('./pages/Academy'));
```

---

### 14. TTS sin cancelación — RENDIMIENTO MEDIO

**Archivo:** `src/pages/Practice.tsx:80-85`

```typescript
if (aiMsg.text) {
    try {
        const audioData = await generateSpeech(aiMsg.text);
        await playRawAudio(audioData);
    } catch (ttsError) {
        console.warn("TTS failed", ttsError);
    }
}
```

**Problema:** Cada respuesta del AI genera una llamada TTS que se reproduce completa. Si el usuario envía otro mensaje mientras suena el audio anterior, ambos se superponen. No hay forma de cancelar el audio en reproducción.

**Fix:** Mantener referencia al `AudioBufferSourceNode` actual y llamar `.stop()` antes de reproducir el nuevo audio.

---

### 15. Estilos CSS duplicados — RENDIMIENTO BAJO

**Archivo:** `src/pages/Practice.tsx` y otros

**Problema:** Muchos componentes usan estilos inline con `style={{}}` en vez de clases Tailwind. Esto:
- Aumenta el tamaño del bundle
- Impide caching de CSS
- Hace imposible override con temas dinámicos

El sistema de temas usa CSS custom properties (`var(--accent-primary)`) que es correcto, pero hay muchas propiedades hardcodeadas (ej: `bg-gray-950`, `text-gray-400`, `border-gray-800`).

**Fix:** Migrar los estilos inline y colores hardcodeados a las CSS variables del tema.

---

## PROBLEMAS DE ARQUITECTURA

### 16. Sin manejo de estado global — ARQUITECTURA MEDIO

**Problema:** No hay state management global (Redux, Zustand, Jotai, etc.). El perfil se carga en cada componente independientemente con `useUserProfile()`, haciendo llamadas a Supabase repetidas.

Cada montaje de componente que usa `useUserProfile` hace un `getProfile()` nuevo a Supabase.

**Fix:** Usar Zustand o Jotai para un store global del perfil, cargado una vez y compartido.

---

### 17. Sin manejo de errores de Supabase — ARQUITECTURA MEDIO

**Archivo:** `src/services/repository.ts`

```typescript
// Casi todas las funciones usan este patrón:
} catch (error) {
    console.warn('Supabase failed, using localStorage:', error);
    return getProfileFromLocalStorage(username);
}
```

**Problema:** Los errores de Supabase se silencian con `console.warn` y se fallback a localStorage. Esto significa que si Supabase está caído, la app funciona pero con datos potencialmente desactualizados, y el usuario nunca se entera.

**Fix:** Implementar un indicador de estado de conexión (online/offline/syncing) y notificar al usuario cuando se usa cache local.

---

### 18. Sin tipado estricto en Leaderboard — ARQUITECTURA BAJO

**Archivo:** `src/pages/Leaderboard.tsx:12`

```typescript
const [students, setStudents] = React.useState<any[]>([]);
```

**Problema:** Usa `any[]` en vez del tipo `Profile[]`. Pierde toda la seguridad de TypeScript.

**Fix:** Cambiar a `Profile[]` y usar el tipo correcto.

---

### 19. Fecha de daily_xp hardcoded sin zona horaria — BUG BAJO

**Archivo:** `src/services/repository.ts:109`

```typescript
const today = new Date().toDateString();
const lastPractice = profile.last_practice_at ? new Date(profile.last_practice_at).toDateString() : null;
```

**Problema:** `toDateString()` usa la zona horaria local del navegador. Un usuario que practica a las 11:30 PM en EST (3:30 AM UTC) tendría la fecha incorrecta para el cálculo de racha.

**Fix:** Usar `toISOString().split('T')[0]` para fechas consistentes en UTC, o mejor aún, usar `date-fns` o similar.

---

### 20. Sin rate limiting en llamadas a Gemini — SEGURIDAD MEDIO

**Problema:** No hay debounce ni throttle en las llamadas a la API de Gemini. Un usuario puede hacer spam de mensajes en Practice y generar cientos de llamadas API.

**Fix:** Implementar debounce en el input del chat (mínimo 2 segundos entre mensajes) y rate limiting por usuario.

---

## RESUMEN DE PRIORIDADES

### Crítico (arreglar YA)
| # | Problema | Tipo |
|---|----------|------|
| 1 | API key de Gemini expuesta en el cliente | Seguridad |
| 5 | getAllProfiles sin RLS — datos de todos los usuarios visibles | Seguridad |
| 2 | Fuga de memoria en AudioRecorder | Bug |
| 3 | Fuga de memoria en LiveSession (AudioContext + stream) | Bug |
| 20 | Sin rate limiting en llamadas a Gemini | Seguridad |

### Alto (arreglar esta semana)
| # | Problema | Tipo |
|---|----------|------|
| 7 | Sin manejo de errores visible al usuario | UX |
| 10 | Sin protección de rutas para visitantes | UX |
| 12 | Sin onboarding para nuevos usuarios | UX |
| 11 | Pedir API key manual al usuario | UX |
| 13 | Bundle size sin lazy loading | Rendimiento |
| 6 | Race condition en useUserProfile | Bug |

### Medio (arreglar pronto)
| # | Problema | Tipo |
|---|----------|------|
| 4 | Cache localStorage sin límite real | Bug |
| 8 | Sin pantalla de carga inicial | UX |
| 9 | Contraseñas sin validación | UX |
| 14 | TTS sin cancelación | Rendimiento |
| 16 | Sin manejo de estado global | Arquitectura |
| 17 | Sin indicador de estado offline/online | Arquitectura |

### Bajo (mejoras graduales)
| # | Problema | Tipo |
|---|----------|------|
| 15 | Estilos CSS duplicados/hardcodeados | Rendimiento |
| 18 | Tipado `any` en Leaderboard | Arquitectura |
| 19 | Zona horaria en cálculo de rachas | Bug |