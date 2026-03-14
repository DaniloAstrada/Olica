// ============================================
// BASE DE DATOS LOCAL (Almacenamiento)
// ============================================

let datosApp = {
    ventas: [],
    gastos: [
        { id: 1, concepto: 'Alquiler', cantidad: 1, monto: 5000, fecha: '2026-03-01' },
        { id: 2, concepto: 'Servicios', cantidad: 1, monto: 500, fecha: '2026-03-05' },
        { id: 3, concepto: 'Inventario', cantidad: 1, monto: 2000, fecha: '2026-03-10' },
    ],
    stock: [
        { codigo: 'P001', producto: 'Refresco', cantidad: 50, precioUnitario: 50, estado: 'Disponible' },
        { codigo: 'P002', producto: 'Snack', cantidad: 30, precioUnitario: 30, estado: 'Disponible' },
        { codigo: 'P003', producto: 'Yogurt', cantidad: 5, precioUnitario: 80, estado: 'Bajo Stock' },
        { codigo: 'P004', producto: 'Agua', cantidad: 100, precioUnitario: 20, estado: 'Disponible' },
    ],
    usuarios: [],          // lista de cuentas
    historial: []          // registros de acciones
};

let currentUser = sessionStorage.getItem('currentUser') || null;

// thresholds for stock alerts
const STOCK_BAJO = 10;      // muestra mensaje de bajo stock
const STOCK_CRITICO = 5;    // muestra mensaje de stock crítico


// Cargar datos del localStorage
document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    configurarNavegacionSecciones();
    actualizarTablaVentasInicio();
    cargarGastos();
    cargarStock();
    inicializarStockForm();   // only runs if the stock form exists on the page
    cargarGananciasYPerdidas();
    cargarReporteFinanciero();
    inicializarRegistro();
});

// stub para boton Google
function inicializarGoogle() {
    const btn = document.getElementById('btn-google');
    if (!btn) return;
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        alert('La autenticación con Google no está implementada en esta versión.');
    });
}

// asegurar inicialización del stub también
window.addEventListener('DOMContentLoaded', inicializarGoogle);


// ============================================
// ALMACENAMIENTO Y CARGA DE DATOS
// ============================================

function cargarDatos() {
    const datosGuardados = localStorage.getItem('datosAppOlica');
    if (datosGuardados) {
        // cargamos todo el objeto (ventas, gastos, stock, usuarios, historial)
        datosApp = JSON.parse(datosGuardados);
    } else {
        // compatibilidad con versiones anteriores que sólo guardaban ventas
        const ventasOlica = localStorage.getItem('ventasOlica');
        if (ventasOlica) {
            datosApp.ventas = JSON.parse(ventasOlica);
        }
    }

    // garantizar que las nuevas propiedades siempre existan
    if (!Array.isArray(datosApp.usuarios)) datosApp.usuarios = [];
    if (!Array.isArray(datosApp.historial)) datosApp.historial = [];
}


function guardarDatos() {
    // persistimos el objeto completo y también la clave antigua
    localStorage.setItem('datosAppOlica', JSON.stringify(datosApp));
    localStorage.setItem('ventasOlica', JSON.stringify(datosApp.ventas));
}

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================

function configurarNavegacionSecciones() {
    // Hacer que los botones internos cambien de sección
    const botonesMenu = document.querySelectorAll('[data-section]');
    botonesMenu.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const seccion = this.getAttribute('data-section');
            mostrarSeccion(seccion);
        });
    });
}

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    const secciones = document.querySelectorAll('main > section');
    secciones.forEach(s => s.classList.remove('seccion-activa'));

    // Mostrar la sección seleccionada
    const seccionActiva = document.getElementById(seccion);
    if (seccionActiva) {
        seccionActiva.classList.add('seccion-activa');
        window.scrollTo(0, 0);
    }
}

// ============================================
// AUTENTICACIÓN Y HISTORIAL
// ============================================

function logEvent(tipo, detalle) {
    const evento = {
        tipo,
        detalle,
        fecha: new Date().toLocaleString(),
        usuario: currentUser || 'anonimo'
    };
    datosApp.historial.push(evento);
    guardarDatos();
    // enviar al servidor si está disponible
    fetch('http://localhost:3000/api/historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
    }).catch(() => {});
}

function registrarUsuario(nombre, clave) {
    if (datosApp.usuarios.find(u => u.nombre === nombre)) {
        return false;
    }
    datosApp.usuarios.push({ nombre, clave });
    logEvent('usuario', `Registro de usuario ${nombre}`);
    guardarDatos();
    return true;
}

function loginUsuario(nombre, clave) {
    const u = datosApp.usuarios.find(u => u.nombre === nombre && u.clave === clave);
    if (u) {
        currentUser = nombre;
        sessionStorage.setItem('currentUser', nombre);
        logEvent('usuario', `Login de ${nombre}`);
        return true;
    }
    return false;
}

function logoutUsuario() {
    logEvent('usuario', `Logout de ${currentUser}`);
    currentUser = null;
    sessionStorage.removeItem('currentUser');
}

function mostrarHistorial() {
    const tbody = document.getElementById('tbody-historial');
    if (!tbody) return;
    tbody.innerHTML = '';
    datosApp.historial.forEach(evt => {
        const fila = `
            <tr>
                <td>${evt.tipo}</td>
                <td>${evt.detalle}</td>
                <td>${evt.fecha}</td>
                <td>${evt.usuario}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

function inicializarRegistro() {
    const formReg = document.getElementById('form-registro');
    const formLogin = document.getElementById('form-login');
    const areaHist = document.getElementById('area-historial');
    const btnLogout = document.getElementById('btn-logout');

    const API = 'http://localhost:3000/api';

    async function apiRegister(nombre, clave) {
        const res = await fetch(`${API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, clave })
        });
        return res.json();
    }

    async function apiLogin(nombre, clave) {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, clave })
        });
        return res.json();
    }

    if (formReg) {
        formReg.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nombre = document.getElementById('reg-nombre').value.trim();
            const clave = document.getElementById('reg-clave').value;
            if (!nombre || !clave) {
                alert('Completa ambos campos');
                return;
            }
            const resultado = await apiRegister(nombre, clave);
            if (resultado.success) {
                alert('Usuario registrado en el servidor. Ya puedes iniciar sesión.');
                formReg.reset();
            } else {
                alert('Error: ' + (resultado.error || 'Nombre en uso'));
            }
        });
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nombre = document.getElementById('login-nombre').value.trim();
            const clave = document.getElementById('login-clave').value;
            const resultado = await apiLogin(nombre, clave);
            if (resultado.success) {
                currentUser = nombre;
                sessionStorage.setItem('currentUser', nombre);
                mostrarSesionActiva();
            } else {
                alert('Credenciales incorrectas');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            logoutUsuario();
            mostrarSesionActiva();
        });
    }

    // mostrar u ocultar formularios según sesión
    function mostrarSesionActiva() {
        const sesionActiva = !!currentUser;
        document.getElementById('sesion-formularios').style.display = sesionActiva ? 'none' : 'block';
        if (areaHist) areaHist.style.display = sesionActiva ? 'block' : 'none';
        if (sesionActiva) {
            if (document.getElementById('usuario-actual')) {
                document.getElementById('usuario-actual').textContent = currentUser;
            }
            mostrarHistorial();
        }
    }

    mostrarSesionActiva();
}


// ============================================
// ACTUALIZAR TABLA DE VENTAS EN INICIO
// ============================================

function actualizarTablaVentasInicio() {
    const tbody = document.getElementById('tbody-ventas');
    if (!tbody) return;

    if (datosApp.ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No hay ventas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = datosApp.ventas.slice(-5).reverse().map((v, index) => {
        const clasePago = v.metodoPago === 'Efectivo' ? 'efectivo' : 'transferencia';
        return `
            <tr>
                <td><strong>${v.producto}</strong></td>
                <td>${v.cantidad}</td>
                <td>$${v.precio.toFixed(2)}</td>
                <td><strong>$${v.total.toFixed(2)}</strong></td>
                <td><span class="etiqueta-pago ${clasePago}">${v.metodoPago}</span></td>
                <td>${v.fecha}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// GASTOS
// ============================================

async function cargarGastos() {
    const tbody = document.getElementById('tbody-gastos');
    if (!tbody) return;

    // intentar recuperar desde servidor
    try {
        const res = await fetch('http://localhost:3000/api/gastos');
        if (res.ok) {
            datosApp.gastos = await res.json();
            guardarDatos();
        }
    } catch (e) {
        // seguir con local
    }

    tbody.innerHTML = '';

    datosApp.gastos.forEach(gasto => {
        const fila = `
            <tr>
                <td>${gasto.id}</td>
                <td>${gasto.concepto}</td>
                <td>${gasto.cantidad}</td>
                <td>$${gasto.monto.toFixed(2)}</td>
                <td>${gasto.fecha}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// ============================================
// STOCK
// ============================================

async function cargarStock() {
    const tbody = document.getElementById('tbody-stock');
    if (!tbody) return;
    
    // intentar cargar desde backend si está disponible
    try {
        const res = await fetch('http://localhost:3000/api/stock');
        if (res.ok) {
            const data = await res.json();
            datosApp.stock = data;
            guardarDatos();
        }
    } catch (e) {
        // no hay servidor; seguir con local
    }

    const showActions = !!document.getElementById('formulario-stock');
    tbody.innerHTML = '';

    datosApp.stock.forEach(item => {
        const rowClass = item.estado === 'Bajo Stock' || item.estado === 'Crítico' ? 'fila-alerta' : '';
        let acciones = '<td></td>';
        if (showActions) {
            acciones = `
                <td>
                    <button class="boton-accion" onclick="editarProducto('${item.codigo}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="boton-accion" onclick="eliminarProducto('${item.codigo}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        }
        const fila = `
            <tr class="${rowClass}">
                <td>${item.codigo}</td>
                <td>${item.producto}</td>
                <td>${item.cantidad}</td>
                <td>$${item.precioUnitario.toFixed(2)}</td>
                <td><span class="etiqueta-${item.estado.toLowerCase().replace(/\s/g, '-')}">${item.estado}</span></td>
                ${acciones}
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// ============================================
// FORMULARIO DE STOCK
// ============================================

function inicializarStockForm() {
    const form = document.getElementById('formulario-stock');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const codigo = document.getElementById('stock-codigo').value.trim();
        const producto = document.getElementById('stock-producto').value.trim();
        const cantidad = parseInt(document.getElementById('stock-cantidad').value);
        const precio = parseFloat(document.getElementById('stock-precio').value);

        if (!codigo || !producto || isNaN(cantidad) || isNaN(precio)) {
            alert('Por favor completa todos los campos del producto');
            return;
        }

        let item = datosApp.stock.find(i => i.codigo === codigo);
        if (item) {
            item.producto = producto;
            item.cantidad = cantidad;
            item.precioUnitario = precio;
            item.estado = cantidad <= STOCK_BAJO ? 'Bajo Stock' : 'Disponible';
            mostrarResumenStock(`Producto actualizado: ${producto}`, 'info');
            if (typeof logEvent === 'function') logEvent('stock', `Actualizado ${producto} (${codigo}) cantidad ${cantidad}`);
        } else {
            const estado = cantidad <= STOCK_BAJO ? 'Bajo Stock' : 'Disponible';
            datosApp.stock.push({ codigo, producto, cantidad, precioUnitario: precio, estado });
            mostrarResumenStock(`Producto agregado: ${producto}`, 'exito');
            if (typeof logEvent === 'function') logEvent('stock', `Agregado ${producto} (${codigo}) cantidad ${cantidad}`);
        }
        // enviar al backend
        fetch('http://localhost:3000/api/stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, producto, cantidad, precioUnitario: precio, estado: cantidad <= STOCK_BAJO ? 'Bajo Stock' : 'Disponible' })
        }).then(r=>r.json()).then(()=>console.log('stock enviado al servidor')).catch(()=>{});


        guardarDatos();
        cargarStock();
        form.reset();
    });
}

function mostrarResumenStock(mensaje, tipo) {
    const div = document.getElementById('resumen-stock');
    if (!div) return;
    const clase = tipo === 'exito' ? 'alerta-exito' : 'alerta-info';
    div.innerHTML = `<div class="${clase}">${mensaje}</div>`;
    setTimeout(() => { div.innerHTML = ''; }, 4000);
}

function actualizarStock(codigo, delta) {
    const item = datosApp.stock.find(i => i.codigo === codigo || i.producto === codigo);
    if (!item) return null;
    item.cantidad += delta;
    if (item.cantidad < 0) item.cantidad = 0;

    if (item.cantidad <= STOCK_CRITICO) {
        item.estado = 'Crítico';
        alert(`¡Stock crítico! Quedan ${item.cantidad} unidades de ${item.producto}`);
    } else if (item.cantidad <= STOCK_BAJO) {
        item.estado = 'Bajo Stock';
        alert(`Stock bajo: ${item.producto} (${item.cantidad})`);
    } else {
        item.estado = 'Disponible';
    }

    if (typeof logEvent === 'function' && item) {
        logEvent('stock', `Stock ${item.producto} (${item.codigo}) modificado, nuevo nivel ${item.cantidad}`);
    }
    guardarDatos();
    cargarStock();

    return item;
}

function editarProducto(codigo) {
    const item = datosApp.stock.find(i => i.codigo === codigo);
    if (!item) return;
    document.getElementById('stock-codigo').value = item.codigo;
    document.getElementById('stock-producto').value = item.producto;
    document.getElementById('stock-cantidad').value = item.cantidad;
    document.getElementById('stock-precio').value = item.precioUnitario;
}

function eliminarProducto(codigo) {
    if (!confirm('¿Eliminar este producto del stock?')) return;
    datosApp.stock = datosApp.stock.filter(i => i.codigo !== codigo);
    guardarDatos();
    cargarStock();
}


// ============================================
// GANANCIAS Y PÉRDIDAS
// ============================================

function cargarGananciasYPerdidas() {
    const container = document.getElementById('resumen-financiero');
    if (!container) return;

    // Calcular totales
    const totalVentas = datosApp.ventas.reduce((sum, v) => sum + v.total, 0);
    const totalGastos = datosApp.gastos.reduce((sum, g) => sum + g.monto, 0);
    const ganancia = totalVentas - totalGastos;
    const porcentaje = totalVentas > 0 ? ((ganancia / totalVentas) * 100).toFixed(2) : 0;

    const claseEstado = ganancia > 0 ? 'positivo' : 'negativo';

    container.innerHTML = `
        <div class="tarjetas-financieras">
            <div class="tarjeta">
                <h3>Total de Ventas</h3>
                <p class="valor">$${totalVentas.toFixed(2)}</p>
            </div>
            <div class="tarjeta">
                <h3>Total de Gastos</h3>
                <p class="valor gasto">$${totalGastos.toFixed(2)}</p>
            </div>
            <div class="tarjeta ${claseEstado}">
                <h3>Ganancia Neta</h3>
                <p class="valor">${ganancia > 0 ? '+' : ''}$${ganancia.toFixed(2)}</p>
                <p class="porcentaje">${porcentaje}%</p>
            </div>
        </div>

        <div class="grafico-resumen">
            <h3>Detalles Financieros</h3>
            <ul>
                <li><strong>Número de Ventas:</strong> ${datosApp.ventas.length}</li>
                <li><strong>Número de Gastos:</strong> ${datosApp.gastos.length}</li>
                <li><strong>Venta Promedio:</strong> $${datosApp.ventas.length > 0 ? (totalVentas / datosApp.ventas.length).toFixed(2) : '0.00'}</li>
                <li><strong>Gasto Promedio:</strong> $${datosApp.gastos.length > 0 ? (totalGastos / datosApp.gastos.length).toFixed(2) : '0.00'}</li>
            </ul>
        </div>
    `;
}

// resumen diario/mensual desglosado
function cargarReporteFinanciero() {
    const container = document.getElementById('reporte-financiero');
    if (!container) return;

    function parseFecha(str) {
        const [d, m, y] = str.split('/').map(Number);
        return new Date(y, m - 1, d);
    }

    const hoy = new Date();
    const ventasDia = datosApp.ventas.filter(v => {
        const d = parseFecha(v.fecha);
        return d.toDateString() === hoy.toDateString();
    });
    const ventasMes = datosApp.ventas.filter(v => {
        const d = parseFecha(v.fecha);
        return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
    });
    const gastosDia = datosApp.gastos.filter(g => {
        const d = parseFecha(g.fecha);
        return d.toDateString() === hoy.toDateString();
    });
    const gastosMes = datosApp.gastos.filter(g => {
        const d = parseFecha(g.fecha);
        return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
    });

    const totalVentasDia = ventasDia.reduce((s, v) => s + v.total, 0);
    const totalVentasMes = ventasMes.reduce((s, v) => s + v.total, 0);
    const totalGastosDia = gastosDia.reduce((s, g) => s + g.monto, 0);
    const totalGastosMes = gastosMes.reduce((s, g) => s + g.monto, 0);

    const pagoRepositorDia = gastosDia
        .filter(g => /repositor/i.test(g.concepto))
        .reduce((s, g) => s + g.monto, 0);
    const pagoRepositorMes = gastosMes
        .filter(g => /repositor/i.test(g.concepto))
        .reduce((s, g) => s + g.monto, 0);

    const otrosGastosDia = totalGastosDia - pagoRepositorDia;
    const otrosGastosMes = totalGastosMes - pagoRepositorMes;

    const gananciaDia = totalVentasDia - totalGastosDia;
    const gananciaMes = totalVentasMes - totalGastosMes;

    const porcentajeGananciaDia = totalVentasDia > 0 ? ((gananciaDia / totalVentasDia) * 100).toFixed(2) : 0;
    const porcentajePerdidaDia = totalVentasDia > 0 ? ((totalGastosDia / totalVentasDia) * 100).toFixed(2) : 0;
    const porcentajeGananciaMes = totalVentasMes > 0 ? ((gananciaMes / totalVentasMes) * 100).toFixed(2) : 0;
    const porcentajePerdidaMes = totalVentasMes > 0 ? ((totalGastosMes / totalVentasMes) * 100).toFixed(2) : 0;

    container.innerHTML = `
        <div class="grafico-resumen">
            <h3>Resumen del Día (${hoy.toLocaleDateString('es-ES')})</h3>
            <ul>
                <li><strong>Ventas:</strong> $${totalVentasDia.toFixed(2)}</li>
                <li><strong>Gastos:</strong> $${totalGastosDia.toFixed(2)}</li>
                <li><strong>Ganancia neta:</strong> $${gananciaDia.toFixed(2)} (${porcentajeGananciaDia}% de ventas)</li>
                <li><strong>Pérdida:</strong> $${totalGastosDia.toFixed(2)} (${porcentajePerdidaDia}% de ventas)</li>
                <li><strong>Detalle de ingresos:</strong> Venta $${totalVentasDia.toFixed(2)} | Otros $0.00</li>
                <li><strong>Detalle de gastos:</strong> Pago a repositor $${pagoRepositorDia.toFixed(2)} | Otros $${otrosGastosDia.toFixed(2)}</li>
            </ul>
        </div>
        <div class="grafico-resumen">
            <h3>Resumen del Mes (${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()})</h3>
            <ul>
                <li><strong>Ventas:</strong> $${totalVentasMes.toFixed(2)}</li>
                <li><strong>Gastos:</strong> $${totalGastosMes.toFixed(2)}</li>
                <li><strong>Ganancia neta:</strong> $${gananciaMes.toFixed(2)} (${porcentajeGananciaMes}% de ventas)</li>
                <li><strong>Pérdida:</strong> $${totalGastosMes.toFixed(2)} (${porcentajePerdidaMes}% de ventas)</li>
                <li><strong>Detalle de ingresos:</strong> Venta $${totalVentasMes.toFixed(2)} | Otros $0.00</li>
                <li><strong>Detalle de gastos:</strong> Pago a repositor $${pagoRepositorMes.toFixed(2)} | Otros $${otrosGastosMes.toFixed(2)}</li>
            </ul>
        </div>
    `;
}


console.log('✓ Sistema Olica cargado correctamente');

// actualizar stock y otros datos cuando cambian en otra pestaña
window.addEventListener('storage', function(e) {
    if (e.key === 'datosAppOlica' || e.key === 'ventasOlica') {
        cargarDatos();
        cargarStock();
        actualizarTablaVentasInicio();
        cargarGananciasYPerdidas();
        cargarReporteFinanciero();
    }
});
