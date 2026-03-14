# Backend de Olica

Este directorio contiene un servidor Express simple que utiliza SQLite para
almacenar los datos de la aplicación.

## Instrucciones de arranque

1. Abre una terminal y cambia al directorio `backend`:
   ```bash
   cd "c:\Users\danil\OneDrive\Desktop\Cosas de Danilo\Olica\backend"
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```

El servidor escuchará en el puerto `3000` (o el valor de `PORT` si lo defines).

## Endpoints de ejemplo

- `POST /api/register` – `{ nombre, clave }`
- `POST /api/login` – `{ nombre, clave }`
- `GET /api/ventas` – lista todas las ventas
- `POST /api/ventas` – guarda una venta (debe enviarse JSON con los campos)

Puedes añadir rutas similares para gastos, stock, historial, etc.

## Notas

- Las contraseñas se hash con `bcrypt` (instálalo manualmente si no aparece en
  package.json).
- En un entorno real conviene usar JWT o sesiones con cookies para la
  autenticación.
- SQLite almacena los datos en `backend/olica.db`.
