# 🚀 Guía de Inicio Rápido

## Paso 1: Compilar la aplicación ✅
```bash
npm run build
```

## Paso 2: Ejecutar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

## Paso 3: Configurar Supabase (OPCIONAL)

Si quieres sincronizar en la nube:

### 3.1 Crear proyecto en Supabase
- Ve a https://supabase.com
- Crea una cuenta gratis
- Crea un nuevo proyecto

### 3.2 Ejecutar el schema de base de datos
1. En tu proyecto Supabase, ve a **SQL Editor**
2. Copia el contenido de `schema.sql`
3. Pega y ejecuta

### 3.3 Obtener credenciales
1. Ve a **Settings → API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.4 Configurar variables
Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3.5 Reiniciar
```bash
npm run dev
```

## ¡Listo! 🎉

Comienza a coleccionar figuritas. Tu progreso se guardará automáticamente.

### Modo Sin Conexión
Si no configuras Supabase, todo funciona localmente en tu navegador.

### Comandos Útiles
```bash
npm run dev      # Desarrollo
npm run build    # Compilar
npm run start    # Producción
npm run lint     # Verificar código
```

## Estructura de Figuritas

- **20 Intro**: Foil especiales (Panini, Emblemas, Históricos)
- **960 Jugadores**: 48 equipos × 20 figuritas
  - Índice 0: Escudo del equipo (Foil)
  - Índices 1-10: Jugadores
  - Índice 11: Foto del equipo
  - Índices 12-19: Más jugadores

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Puerto 3000 ocupado | `npm run dev -- -p 3001` |
| Módulos no encontrados | `npm install` |
| Variables no cargan | Reinicia con `npm run dev` |
| Datos no sincronizan | Verifica `.env.local` y Supabase |

---

¡Diviértete coleccionando! 🌟
