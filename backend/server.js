// servidor Express simple con SQLite para almacenar los datos de Olica

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); // opcional para el hash de contraseñas

const app = express();
app.use(cors());
app.use(bodyParser.json());

// base de datos local
const dbFile = './olica.db';
const db = new sqlite3.Database(dbFile, err => {
    if (err) return console.error(err);
    console.log('Conectado a SQLite en', dbFile);
});

// crear tablas si no existen
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            clave TEXT NOT NULL
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT,
            producto TEXT,
            cantidad INTEGER,
            precio REAL,
            total REAL,
            cliente TEXT,
            metodoPago TEXT,
            observaciones TEXT,
            fecha TEXT,
            hora TEXT,
            usuario TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            concepto TEXT,
            cantidad INTEGER,
            monto REAL,
            fecha TEXT,
            usuario TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS stock (
            codigo TEXT PRIMARY KEY,
            producto TEXT,
            cantidad INTEGER,
            precioUnitario REAL,
            estado TEXT
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT,
            detalle TEXT,
            fecha TEXT,
            usuario TEXT
        )
    `);
});

// rutas de autenticación
app.post('/api/register', (req, res) => {
    const { nombre, clave } = req.body;
    if (!nombre || !clave) return res.status(400).json({ error: 'falta nombre o clave' });
    const hashed = bcrypt.hashSync(clave, 10);
    db.run('INSERT INTO usuarios (nombre, clave) VALUES (?, ?)', [nombre, hashed], function(err) {
        if (err) return res.status(400).json({ error: 'nombre en uso' });
        res.json({ success: true, id: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
    const { nombre, clave } = req.body;
    db.get('SELECT * FROM usuarios WHERE nombre = ?', [nombre], (err, row) => {
        if (err || !row) return res.status(401).json({ error: 'credenciales inválidas' });
        if (!bcrypt.compareSync(clave, row.clave)) {
            return res.status(401).json({ error: 'credenciales inválidas' });
        }
        // en producción generar un token JWT aquí
        res.json({ success: true, usuario: nombre });
    });
});

// ejemplo de CRUD ventas
app.get('/api/ventas', (req, res) => {
    db.all('SELECT * FROM ventas', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/ventas', (req, res) => {
    const v = req.body;
    const stmt = db.prepare(`INSERT INTO ventas (codigo, producto, cantidad, precio, total, cliente, metodoPago, observaciones, fecha, hora, usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([v.codigo, v.producto, v.cantidad, v.precio, v.total, v.cliente, v.metodoPago, v.observaciones, v.fecha, v.hora, v.usuario || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// CRUD gastos
app.get('/api/gastos', (req, res) => {
    db.all('SELECT * FROM gastos', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/gastos', (req, res) => {
    const g = req.body;
    const stmt = db.prepare(`INSERT INTO gastos (concepto, cantidad, monto, fecha, usuario) VALUES (?, ?, ?, ?, ?)`);
    stmt.run([g.concepto, g.cantidad, g.monto, g.fecha, g.usuario || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// CRUD stock
app.get('/api/stock', (req, res) => {
    db.all('SELECT * FROM stock', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/stock', (req, res) => {
    const s = req.body;
    const stmt = db.prepare(`INSERT OR REPLACE INTO stock (codigo, producto, cantidad, precioUnitario, estado) VALUES (?, ?, ?, ?, ?)`);
    stmt.run([s.codigo, s.producto, s.cantidad, s.precioUnitario, s.estado], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
    stmt.finalize();
});

// CRUD compras (similar a ventas)
app.get('/api/compras', (req, res) => {
    db.all('SELECT * FROM compras', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/compras', (req, res) => {
    const c = req.body;
    const stmt = db.prepare(`INSERT INTO compras (proveedor, fechaCompra, metodoPago, productos, subtotal, iva, total, fechaRegistro, horaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([c.proveedor, c.fechaCompra, c.metodoPago, JSON.stringify(c.productos), c.subtotal, c.iva, c.total, c.fechaRegistro, c.horaRegistro], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// historial
app.get('/api/historial', (req, res) => {
    db.all('SELECT * FROM historial ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/historial', (req, res) => {
    const h = req.body;
    const stmt = db.prepare(`INSERT INTO historial (tipo, detalle, fecha, usuario) VALUES (?, ?, ?, ?)`);
    stmt.run([h.tipo, h.detalle, h.fecha, h.usuario || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// otras rutas (gastos, stock, historial) se pueden crear de manera similar

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
