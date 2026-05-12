# 🚀 Guía de Despliegue en Vercel

## Paso 1: Subir a GitHub

```bash
# Crear repositorio en GitHub
# Ve a https://github.com/new
# Crea un repositorio llamado "album-mundial-2026"

# Conectar repositorio local con GitHub
git remote add origin https://github.com/TU_USUARIO/album-mundial-2026.git
git branch -M main
git push -u origin main
```

## Paso 2: Desplegar en Vercel

### Opción A: Despliegue Automático (Recomendado)

1. **Ve a [vercel.com](https://vercel.com)**
2. **Conecta tu cuenta de GitHub**
3. **Importa el repositorio** `album-mundial-2026`
4. **Vercel detectará automáticamente** Next.js

### Opción B: Desde Terminal

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Seguir las instrucciones en pantalla
```

## Paso 3: Configurar Variables de Entorno

En el dashboard de Vercel:

1. Ve a tu proyecto → **Settings** → **Environment Variables**
2. Agrega estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://lwttzrboabtfweassaxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## Paso 4: ¡Listo!

- Vercel desplegará automáticamente
- Tu app estará en `https://album-mundial-2026.vercel.app`
- Cada push a `main` actualizará la producción

## 🔧 Comandos Útiles

```bash
# Ver logs de despliegue
vercel logs

# Desplegar preview
vercel --prod=false

# Configurar dominio personalizado
vercel domains add tudominio.com
```

## 📊 Monitoreo

- **Analytics**: Vercel incluye analytics gratis
- **Logs**: Revisa errores en el dashboard
- **Performance**: Monitorea tiempos de carga

## 🚨 Troubleshooting

| Problema | Solución |
|----------|----------|
| Build falla | Verifica `package.json` y dependencias |
| Variables no cargan | Reinicia el despliegue |
| DB no conecta | Verifica credenciales de Supabase |
| 404 en rutas | Next.js App Router usa `/` no `/pages` |

---

**¡Tu álbum está listo para el mundo! 🌍⚽**