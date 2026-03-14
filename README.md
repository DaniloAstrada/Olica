# Olica

Este proyecto es una aplicación de gestión para kioscos (ventas, compras, stock, etc.).

## Uso local
1. Abre `Olica.html` en tu navegador.

## Publicación (GitHub Pages)
Este repositorio está configurado para publicarse automáticamente en GitHub Pages.

La URL pública será:

https://DaniloAstrada.github.io/Olica/

> **Nota:** es posible que tarde unos minutos en actualizarse después de subir cambios.

## Despliegue del backend
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
