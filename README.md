# SGE Suite - Sistema de Gestión Gubernamental

Plataforma oficial del Gobierno de Tierra del Fuego para la gestión de documentos y herramientas digitales.

## 🚀 Características

- **Compresión de PDFs**: Herramienta para reducir el tamaño de archivos PDF manteniendo la calidad
- **Procesamiento local**: Los archivos se procesan 100% en el navegador del usuario
- **Diseño responsivo**: Adaptado para escritorio y dispositivos móviles
- **Sistema de diseño**: Implementación del manual de marca gubernamental

## 🛠️ Tecnologías

- **Framework**: Angular 21 (standalone components, signals)
- **Estilos**: Tailwind CSS 4
- **Procesamiento PDF**: Ghostscript WASM (@okathira/ghostpdl-wasm)
- **Gestor de paquetes**: Bun

## 📋 Requisitos

- Node.js 18+
- Bun (gestor de paquetes recomendado)

## 🔧 Instalación

```bash
# Instalar dependencias
bun install

# Iniciar servidor de desarrollo
bun start

# Construir para producción
bun run build
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── features/
│   │   ├── layout/          # Header, Footer, componentes globales
│   │   ├── home/            # Página principal
│   │   ├── pdf-compressor/  # Herramienta de compresión PDF
│   │   ├── tools/           # Listado de herramientas
│   │   └── support/         # Página de soporte
│   └── core/                # Servicios, modelos, utilidades
├── public/
│   ├── fonts/               # Fuentes personalizadas
│   └── img/                 # Imágenes y logos
└── styles.css               # Tokens de diseño globales
```

## 📄 Scripts Disponibles

| Comando         | Descripción                             |
| --------------- | --------------------------------------- |
| `bun start`     | Inicia el servidor de desarrollo        |
| `bun run build` | Construye la aplicación para producción |
| `bun run watch` | Construcción en modo watch              |
| `bun run test`  | Ejecuta las pruebas unitarias           |

## 🎨 Sistema de Diseño

El proyecto implementa un sistema de diseño basado en el manual de marca oficial del Gobierno de Tierra del Fuego:

- **Tipografía**: Passenger Sans con interletrado -25%
- **Colores oficiales**:
  - Naranja: `#FF6600`
  - Gris texto: `#666666`
  - Gris footer: `#F1F2F2`

## 🔐 Seguridad

- Los archivos PDF se procesan completamente en el navegador del cliente
- No se envía ningún documento a servidores externos
- No se almacenan datos personales

## 📝 Licencia

Todos los derechos reservados - Gobierno de Tierra del Fuego

## 👥 Contacto

Para soporte técnico: soporte@gobierno.tdf.gob.ar
