# Álbum Mundial 2026 🌎⚽

Una aplicación web interactiva para coleccionar y gestionar figuritas del Panini Álbum de la Copa Mundial de la FIFA 2026.

## 🚀 Características

- **Colección Interactiva**: Marca tus figuritas como "tengo", "repetida" o "no tengo"
- **Seguimiento de Progreso**: Visualiza tu progreso en tiempo real con barras de progreso
- **Sincronización en Línea**: Integración opcional con Supabase para sincronizar tu colección
- **Modo Offline**: Funciona completamente sin conexión, almacenando datos localmente
- **Diseño Premium**: Tema oscuro elegante con efectos de shimmer y animaciones fluidas
- **Responsive**: Funciona perfectamente en dispositivos móviles, tablets y escritorio

## 📦 Requisitos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar o descargar el proyecto
cd Album

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar versión optimizada
npm run start
```

La aplicación estará disponible en `http://localhost:3000`

## ⚙️ Configuración

### Modo Local (sin Supabase)

La aplicación funciona por defecto en modo offline usando `localStorage`. No requiere configuración adicional.

### Modo Supabase (Opcional)

Para sincronizar datos en la nube:

1. Crea un proyecto en [supabase.com](https://supabase.com)

2. Ejecuta el SQL del schema en tu proyecto:
   - Abre el SQL Editor en Supabase
   - Copia el contenido de `schema.sql`
   - Pega y ejecuta

3. Copia tus credenciales en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

4. Reinicia el servidor con `npm run dev`

## 📱 Cómo Usar

1. **Inicio**: Ingresa tu nombre para comenzar
2. **Navegación**: 
   - "Introducción": Figuritas especiales (foil)
   - "Equipos": Figuritas de los 48 equipos participantes
   - "Todo": Galería completa

3. **Gestión de Figuritas**:
   - **Clic izquierdo**: Abre el menú de estado
   - ✓ Tengo: Marca como poseída
   - × Repetida: Marca como duplicada
   - ○ No tengo: Marca como faltante

4. **Progreso**: Ve tu colección actualizada en tiempo real

## 🎨 Estructura del Proyecto

```
src/
├── app/              # Páginas de Next.js
├── components/       # Componentes React
├── hooks/           # Hooks personalizados
├── lib/             # Utilidades y funciones
├── services/        # Servicios de datos
└── types/           # Definiciones de tipos
```

## 🔧 Tecnologías

- **Next.js 14**: Framework React con SSR
- **React 18**: Librería UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos CSS utilitarios
- **Framer Motion**: Animaciones fluidas
- **Supabase**: Base de datos en la nube (opcional)

## 📊 Datos

- **960 Figuritas totales**:
  - 20 Introducción (todas foil)
  - 48 Equipos × 20 figuritas cada uno
  - Incluye escudos foil, jugadores y fotos de equipos

## 🚨 Problemas Comunes

### "No se reconoce next"
```bash
# Reinstala dependencias
npm install
```

### Puertos ocupados
```bash
# Usa un puerto diferente
npm run dev -- -p 3001
```

### Datos no se sincronizan
- Verifica que `.env.local` tenga las credenciales correctas
- Asegúrate de ejecutar el schema SQL en Supabase

## 📝 Licencia

Este proyecto es personal y educativo.

## 🤝 Contribuciones

¡Las sugerencias y mejoras son bienvenidas!

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al desarrollador.

---

**¡Que disfrutes coleccionando figuritas del Mundial 2026! 🏆**
