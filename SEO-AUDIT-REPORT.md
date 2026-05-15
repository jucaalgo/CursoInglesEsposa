# Profesoria: English Mastery — Auditoría SEO Completa

> Fecha: 2026-05-15
> Sitio: Profesoria (SPA React + Vite + Supabase + Gemini AI)
> Stack: React 19, Vite 6, Tailwind 4, Framer Motion, Supabase, Google Gemini

---

## Resumen Ejecutivo

**Puntuación general: 18/100** — Crítico. El sitio es una SPA 100% client-side rendering sin ninguna infraestructura SEO. Google ve una página vacía con un título genérico. Sin SSR, sin contenido público, sin meta tags Open Graph, sin schema, sin sitemap. El sitio es prácticamente invisible para buscadores.

### Top 5 Problemas Críticos
1. **Sin SSR** — Google ve HTML vacío, no puede indexar nada
2. **Sin contenido público** — Todo requiere autenticación, no hay nada que indexar
3. **Sin meta tags OG/Twitter** — Compartir en redes muestra un enlace vacío
4. **Sin schema markup** — Cero structured data para rich results
5. **Sin sitemap ni robots.txt** — Google no puede descubrir páginas

---

## Hallazgos Técnicos

### 1. Renderizado Client-Side (SPA) — CRÍTICO

| Aspecto | Estado | Impacto |
|---------|--------|----------|
| Server-side rendering | Ausente | Crítico |
| Pre-rendering estático | Ausente | Crítico |
| Hidratación progresiva | Ausente | Alto |
| Rutas lazy-loaded | Ausente | Medio |

**Problema:** Toda la app renderiza en el cliente. El `index.html` solo tiene:
```html
<div id="root"></div>
```
Googlebot ve una página en blanco. No puede indexar nada.

**Fix:** Migrar a Next.js o añadir pre-rendering con `vite-plugin-ssr` / `react-snapshot`.

---

### 2. Meta Tags y Head — CRÍTICO

| Tag | Estado | Valor Actual |
|-----|--------|---------------|
| `<title>` | Presente | "Profesoria - English Tutor AI" |
| `<meta description>` | Presente | "Tu tutor de inglés con IA - Aprende conversando" |
| `<meta canonical>` | Ausente | — |
| `<meta og:title>` | Ausente | — |
| `<meta og:description>` | Ausente | — |
| `<meta og:image>` | Ausente | — |
| `<meta og:url>` | Ausente | — |
| `<meta twitter:card>` | Ausente | — |
| `<meta robots>` | Ausente | — |
| `<link rel="alternate">` | Ausente | — |

**Problemas:**
- La description está en español pero el contenido del sitio es en inglés — señales mezcladas
- Sin OG tags, compartir en WhatsApp/Twitter/LinkedIn muestra un enlace sin título ni imagen
- Sin canonical, Google puede indexar versiones duplicadas

**Fix:** Añadir `react-helmet-async` para gestionar meta tags dinámicos por ruta.

---

### 3. Arquitectura de URLs — ALTO

| Ruta | Tipo | Problema |
|------|------|----------|
| `/` | Pública | Sin contenido SEO relevante |
| `/login` | Pública | Sin valor SEO |
| `/signup` | Pública | Sin valor SEO |
| `/practice` | Protegida | No indexable |
| `/academy` | Protegida | No indexable |
| `/academy/lesson/:topic` | Protegida | No indexable |
| `/profile` | Protegida | No indexable |
| `/leaderboard` | Protegida | No indexable |

**Problema:** No hay páginas públicas con contenido indexable. No hay landing pages, no hay features pages, no hay pricing.

**Fix:** Crear páginas públicas de marketing: `/features`, `/pricing`, `/how-it-works`, `/blog`.

---

### 4. Sitemap y Robots.txt — ALTO

| Aspecto | Estado |
|---------|--------|
| `robots.txt` | No existe en `public/` |
| `sitemap.xml` | No existe |
| Sitemap dinámico | No implementado |

El `vite.config.ts` referencia `robots.txt` en `includeAssets` pero el archivo no existe en `public/`.

**Fix:** Crear `public/robots.txt` y generar sitemap dinámico.

---

### 5. Schema Markup / Structured Data — CRÍTICO

| Tipo de Schema | Estado |
|----------------|--------|
| Organization | Ausente |
| WebApplication | Ausente |
| SoftwareApplication | Ausente |
| FAQPage | Ausente |
| Course | Ausente |
| BreadcrumbList | Ausente |

**Nota:** No se puede detectar schema via `web_fetch` porque se inyecta con JavaScript. Pero tras revisar el código fuente completo, confirmo que no hay ningún `application/ld+json` en ningún componente.

**Fix:** Añadir schemas de Organization, SoftwareApplication, y Course.

---

### 6. Rendimiento y Core Web Vitals — MEDIO

| Aspecto | Estado | Nota |
|---------|--------|------|
| Code splitting por ruta | Ausente | Todas las rutas se cargan juntas |
| Lazy loading de componentes | Ausente | Framer Motion + Gemini se cargan siempre |
| Fonts | Google Fonts CDN | Render-blocking |
| Imágenes | Sin optimización | No hay pipeline WebP/AVIF |
| Bundle size | Grande | react + react-dom + framer-motion + supabase + genai + react-router |

**Problemas:**
- No hay `React.lazy()` para las rutas — todo se carga en el bundle inicial
- Google Fonts bloquea el primer paint
- No hay tree-shaking agresivo de lucide-react (se importan iconos individuales, OK)

**Fix:** Implementar lazy loading de rutas y preload de fuentes críticas.

---

### 7. PWA y Manifest — MEDIO

| Aspecto | Estado | Nota |
|---------|--------|------|
| Manifest | Parcial | Falta `start_url`, `display`, `background_color` |
| Iconos | 1 SVG | Necesita PNGs 192x192 y 512x512 |
| Service Worker | Configurado | `vite-plugin-pwa` con `autoUpdate` |
| Favicon | Emoji SVG | Funciona pero no es profesional |

**Fix:** Completar el manifest con todos los campos requeridos.

---

### 8. Accesibilidad (a11y) — MEDIO

| Aspecto | Estado |
|---------|--------|
| `user-scalable=no` | Presente — malo para a11y y Google lo penaliza |
| ARIA labels | Ausentes en muchos botones con solo íconos |
| Contraste | Depende del tema — verificar con auditoría |
| Focus management | No hay en modales de autenticación |
| Skip navigation link | Ausente |
| Language attribute | `lang="en"` en HTML — correcto |

**Fix:** Eliminar `user-scalable=no` del viewport y añadir ARIA labels.

---

### 9. Internacionales (i18n) — BAJO (futuro)

| Aspecto | Estado |
|---------|--------|
| Multi-idioma | No implementado |
| hreflang | No aplica (1 idioma) |
| `lang` attribute | `en` — correcto |

La UI está en inglés pero la meta description está en español. Decision de diseño pendiente: ¿el target es hispanohablantes aprendiendo inglés o angloparlantes?

---

### 10. Seguridad — MEDIO

| Aspecto | Estado | Nota |
|---------|--------|------|
| HTTPS | Pendiente deploy | Supabase ya usa HTTPS |
| API keys en cliente | `VITE_GEMINI_API_KEY` | Expuesta en el bundle |
| CORS | Configurado por Supabase | OK |
| Rate limiting | Ausente en Gemini | Sin protección contra abuso |

**Fix:** Mover API key de Gemini a un backend proxy. Nunca exponerla en el cliente.

---

## Hallazgos On-Page

### 11. Contenido del Home — ALTO

**Problema:** El home page dice "HELLO, {NAME}" — solo útil para usuarios autenticados. No hay landing page para visitantes nuevos.

**Elementos faltantes:**
- Hero section con value proposition clara
- Features/benefits para no usuarios
- Social proof (testimonios, estadísticas)
- CTA directo a signup
- Pricing information
- FAQ

### 12. Footer — BAJO

Actual: `© 2026 Profesoria AI. Powered by Gemini.`

**Falta:**
- Links a páginas importantes (Privacy, Terms, About)
- Sitemap links
- Social media links
- Contacto

---

## Plan de Mejoras Priorizado

### Fase 1 — Crítico (Semana 1-2)

| # | Mejora | Impacto | Esfuerzo |
|---|--------|----------|----------|
| 1 | **Migrar a Next.js con SSR** | Crítico | Alto |
| 2 | **Crear landing page pública** con hero, features, CTA | Crítico | Medio |
| 3 | **Añadir meta tags dinámicos** (react-helmet-async) | Crítico | Bajo |
| 4 | **Crear robots.txt y sitemap.xml** | Alto | Bajo |
| 5 | **Añadir Schema markup** (Organization, SoftwareApplication) | Alto | Bajo |
| 6 | **Eliminar `user-scalable=no`** del viewport | Medio | Bajo |

### Fase 2 — Alto (Semana 3-4)

| # | Mejora | Impacto | Esfuerzo |
|---|--------|----------|----------|
| 7 | **Crear páginas públicas:** /features, /how-it-works, /pricing | Alto | Medio |
| 8 | **Añadir Open Graph y Twitter Cards** | Alto | Bajo |
| 9 | **Implementar lazy loading de rutas** con React.lazy() | Alto | Bajo |
| 10 | **Completar PWA manifest** (iconos PNG, start_url, display) | Medio | Bajo |
| 11 | **Mover API key de Gemini a backend proxy** | Alto | Medio |
| 12 | **Añadir página 404** con catch-all route | Medio | Bajo |

### Fase 3 — Medio (Semana 5-8)

| # | Mejora | Impacto | Esfuerzo |
|---|--------|----------|----------|
| 13 | **Blog/Centro de recursos** para contenido SEO | Alto | Alto |
| 14 | **Preload de Google Fonts** o self-host | Medio | Bajo |
| 15 | **Añadir ARIA labels** y skip-nav | Medio | Medio |
| 16 | **Páginas de comparación** vs competidores | Alto | Medio |
| 17 | **FAQ con Schema FAQPage** | Medio | Bajo |
| 18 | **Canonical tags** en todas las páginas | Medio | Bajo |

### Fase 4 — Continuo

| # | Mejora | Impacto | Esfuerzo |
|---|--------|----------|----------|
| 19 | **Estrategia de contenido** (blog posts semanales) | Alto | Continuo |
| 20 | **Link building** (directorios de apps educativas) | Alto | Continuo |
| 21 | **Monitoreo con Google Search Console** | Alto | Bajo |
| 22 | **A/B testing de landing pages** | Medio | Continuo |
| 23 | **i18n completo** (español + inglés) | Alto | Alto |
| 24 | **Analytics con GA4** implementado correctamente | Medio | Bajo |

---

## Quick Wins Inmediatos (implementar hoy)

### 1. Crear `public/robots.txt`
```
User-agent: *
Allow: /
Sitemap: https://profesoria.app/sitemap.xml

User-agent: AdsBot-Google
Allow: /
```

### 2. Actualizar `index.html` — meta tags completos
```html
<meta name="description" content="Learn English with AI — Practice conversations, get real-time corrections, and master grammar with Profesoria. Personalized lessons from A1 to C2.">
<meta name="keywords" content="learn English, English tutor, AI English teacher, English practice, ESL, language learning">
<meta property="og:title" content="Profesoria — AI English Tutor">
<meta property="og:description" content="Master English with AI-powered conversations, grammar feedback, and personalized lessons.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://profesoria.app">
<meta property="og:image" content="https://profesoria.app/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://profesoria.app/">
```

### 3. Añadir Schema en `index.html`
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Profesoria",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "description": "AI-powered English tutor with real-time corrections, pronunciation feedback, and personalized lessons aligned to CEFR levels A1-C2.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

### 4. Eliminar `user-scalable=no`
```html
<!-- Cambiar de: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<!-- A: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### 5. Lazy loading de rutas en `App.tsx`
```tsx
const Practice = React.lazy(() => import('./pages/Practice'));
const Academy = React.lazy(() => import('./pages/Academy'));
const Lesson = React.lazy(() => import('./pages/Lesson'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
```

---

## Competencia SEO

| Competidor | Fortaleza SEO | Lo que Profesoria necesita |
|------------|--------------|---------------------------|
| Duolingo | Blog masivo, gamificación viral | Contenido educativo + gamificación ya existe |
| Babbel | Páginas de comparación | Páginas vs competidores |
| Busuu | CEFR content marketing | Contenido CEFR ya existe internamente |
| Elsa Speak | Pronunciation SEO | Contenido sobre pronunciación |
| ChatGPT | DA 100, brand authority | No competir en brand, competir en long-tail |

---

## Conclusión

El producto es sólido — gamificación, CEFR, práctica con IA, pronunciación — pero es invisible para Google. La prioridad #1 es crear páginas públicas indexables (landing + features + pricing) y migrar a SSR/SSG. Sin eso, ningún otro esfuerzo SEO tiene impacto.

**Prioridad inmediata:** Landing page pública → Meta tags → Sitemap → Schema → SSR migration.