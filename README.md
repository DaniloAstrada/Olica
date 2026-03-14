# Olica

Este proyecto es una aplicación de gestión para kioscos (ventas, compras, stock, etc.).

## Instalación y uso (para compradores)

1. Descarga el instalador desde el release de GitHub (busca "Olica Setup.exe" o similar).
2. Ejecuta el instalador y sigue las instrucciones.
3. Abre la aplicación desde el menú de inicio o el escritorio.

La aplicación incluye todo lo necesario (frontend y backend) y funciona sin conexión a internet ni configuraciones adicionales.

## Desarrollo

### Requisitos
- Node.js (descárgalo de [nodejs.org](https://nodejs.org))

### Uso local
1. Instala dependencias: `npm install`
2. Ejecuta: `npm start`

### Construir instalador
1. Instala dependencias de desarrollo: `npm install --only=dev`
2. Construye: `npm run dist`

Esto genera instaladores en la carpeta `dist/`.

## Publicación (GitHub Pages)
Este repositorio está configurado para publicarse automáticamente en GitHub Pages.

La URL pública será:

https://DaniloAstrada.github.io/Olica/

> **Nota:** es posible que tarde unos minutos en actualizarse después de subir cambios.

## Despliegue del backend (opcional para desarrollo)
Para que la aplicación funcione en múltiples dispositivos con datos compartidos:

1. Despliega el backend en un servicio como Render (gratuito):
   - Ve a [render.com](https://render.com) y crea una cuenta.
   - Conecta tu repo de GitHub.
   - Despliega el directorio `backend/`.
   - Obtén la URL del backend (ej. `https://tu-backend.onrender.com`).

2. Actualiza el frontend para usar el backend:
   - En los archivos JS (ventas.js, etc.), cambia `localStorage` por `fetch` a la URL del backend.
   - Sube los cambios a GitHub.

3. La aplicación ahora compartirá datos entre dispositivos.
