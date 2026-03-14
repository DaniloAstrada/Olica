# Olica

Este proyecto es una aplicación de gestión para kioscos (ventas, compras, stock, etc.).

## Instalación y uso (para compradores)

### Versión de Escritorio
1. Descarga el instalador desde el release de GitHub (busca "Olica Setup.exe" o similar).
2. Ejecuta el instalador y sigue las instrucciones.
3. Abre la aplicación desde el menú de inicio o el escritorio.

### Versión Móvil
1. Descarga la APK desde el release de GitHub (busca "Olica.apk").
2. Instala la APK en tu dispositivo Android (permite instalaciones de fuentes desconocidas).
3. Abre la app.

La aplicación incluye todo lo necesario y funciona sin conexión a internet ni configuraciones adicionales (datos se sincronizan con el servidor).

**Nota para móvil:** La versión móvil requiere que el backend esté desplegado en un servidor (como Render) para sincronizar datos entre dispositivos.

## Desarrollo

### Requisitos
- Node.js (descárgalo de [nodejs.org](https://nodejs.org))
- Para móvil: Android Studio (para Android) o Xcode (para iOS)

### Uso local
1. Instala dependencias: `npm install`
2. Ejecuta: `npm start`

### Construir instalador de escritorio
1. Instala dependencias de desarrollo: `npm install --only=dev`
2. Construye: `npm run dist`

Esto genera instaladores en la carpeta `dist/`.

### Construir app móvil
1. Inicializa Capacitor: `npm run cap:init`
2. Añade plataforma Android: `npm run cap:add:android`
3. Construye y sincroniza: `npm run cap:build && npm run cap:sync`
4. Abre en Android Studio: `npx cap open android`
5. Construye la APK desde Android Studio.

Para iOS: `npm run cap:add:ios` y abre en Xcode.

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
