# Industrial Depot Analytics

Dashboard de analítica privada para **TheIndustrialDepot.com**, conectado a Google Analytics 4 (GA4) mediante **Vercel OIDC** y **Google Cloud Workload Identity Federation (WIF)**.

---

## 🛠️ Tecnologías

- **Framework:** Next.js 16 (App Router, Node.js runtime server-side)
- **Lenguaje:** TypeScript (modo estricto)
- **Estilos:** Tailwind CSS (Sistema de diseño B2B industrial)
- **Autenticación App:** NextAuth.js v5 (JWT Session)
- **Autenticación GA4:** `@vercel/oidc` + `google-auth-library` (Workload Identity Federation sin Service Account JSON)
- **API GA4:** `@google-analytics/data` (v1beta / BetaAnalyticsDataClient)
- **Validación:** Zod
- **Gráficos:** Recharts

---

## 🔐 Seguridad y Autenticación con GA4

Esta aplicación utiliza **Workload Identity Federation** entre Vercel y Google Cloud Console.

### Principios de Seguridad:
1. **Sin archivos JSON ni claves privadas permanentes** (`GOOGLE_PRIVATE_KEY` no requerida).
2. **Token OIDC dinámico:** Vercel genera un token JWT OIDC de corta duración firmado por despliegue (`@vercel/oidc`).
3. **Impersonación de Service Account:** Google STS intercambia el token OIDC de Vercel por un token de acceso de corta duración para la cuenta `ga4-dashboard-reader@industrial-depot-analytics.iam.gserviceaccount.com`.
4. **Server-Side Only:** Toda la autenticación y las consultas a GA4 se ejecutan exclusivamente en Node.js runtime en el servidor. El navegador nunca recibe tokens ni credenciales.

---

## ⚙️ Variables de Entorno Requeridas

Configura las siguientes variables en el Panel de Vercel (**Settings → Environment Variables**):

```env
# ─── NextAuth ───
NEXTAUTH_SECRET=tu-secret-nextauth-32-chars
NEXTAUTH_URL=https://tu-dominio-vercel.app

# ─── Credenciales Admin ───
ADMIN_EMAIL=admin@theindustrialdepot.com
ADMIN_PASSWORD=tu-contrasena-segura

# ─── Google Analytics 4 ───
GA4_PROPERTY_ID=properties/502218884
NEXT_PUBLIC_GA4_PROPERTY_ID=502218884

# ─── Google Cloud Workload Identity Federation ───
GCP_PROJECT_ID=industrial-depot-analytics
GCP_PROJECT_NUMBER=72682370676
GCP_WORKLOAD_IDENTITY_PROVIDER=projects/72682370676/locations/global/workloadIdentityPools/vercel/providers/vercel
GCP_SERVICE_ACCOUNT=ga4-dashboard-reader@industrial-depot-analytics.iam.gserviceaccount.com

# ─── Cron ───
CRON_SECRET=tu-secreto-cron
```

---

## 🚀 Despliegue en Vercel

1. Sube el código al repositorio de GitHub: `theindustrialdepotmarketing-del/industrial-depot-analytics`.
2. Conecta el repositorio en Vercel.
3. Habilita **Vercel OIDC** en las configuraciones del proyecto en Vercel.
4. Configura las variables de entorno.
5. El despliegue automático generará la conexión OIDC segura con Google Cloud.
