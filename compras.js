// ============================================
// BASE DE DATOS LOCAL - REGISTRO DE COMPRAS
// ============================================

let comprasRegistradas = [];

// Cargar datos al abrir la página
document.addEventListener('DOMContentLoaded', function() {
    cargarComprasDelAlmacenamiento().then(() => {
        configurarFormulario();
        inicializarProductos();
        actualizarTabla();
        actualizarTotalesGenerales();
    });
});

const API = 'http://localhost:3000/api';

async function cargarComprasDelAlmacenamiento() {
    try {
        const res = await fetch(`${API}/compras`);
        if (res.ok) {
            comprasRegistradas = await res.json();
        }
    } catch (e) {
        const datos = localStorage.getItem('comprasOlica');
        if (datos) {
            comprasRegistradas = JSON.parse(datos);
        }
    }
}

// ============================================
// ALMACENAMIENTO LOCAL (LocalStorage)
// ============================================

function guardarComprasEnAlmacenamiento() {
    localStorage.setItem('comprasOlica', JSON.stringify(comprasRegistradas));
}

function cargarComprasDelAlmacenamiento() {
    const datos = localStorage.getItem('comprasOlica');
    if (datos) {
        comprasRegistradas = JSON.parse(datos);
    }
}

// ============================================
// CONFIGURACIÓN DEL FORMULARIO
// ============================================

function configurarFormulario() {
    const form = document.getElementById('formulario-compra');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Obtener datos generales
        const proveedor = document.getElementById('proveedor').value.trim();
        const fechaCompra = document.getElementById('fecha-compra').value;
        const metodoPago = document.getElementById('metodo-pago-compra').value;

        // Obtener productos
        const productos = obtenerProductosDelFormulario();

        if (productos.length === 0) {
            alert('Debes agregar al menos un producto');
            return;
        }

        // Calcular totales
        const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0);
        const iva = subtotal * 0.21; // IVA 21%
        const total = subtotal + iva;

        // Crear objeto de compra
        const compra = {
            id: Date.now(),
            proveedor,
            fechaCompra,
            metodoPago,
            productos,
            subtotal,
            iva,
            total,
            fechaRegistro: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            horaRegistro: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        // Agregar a array
        comprasRegistradas.push(compra);

        // actualizar stock por cada producto de la compra
        compra.productos.forEach(p => {
            // buscar por nombre (no hay código en compras)
            let item = datosApp.stock.find(i => i.producto.toLowerCase() === p.nombre.toLowerCase());
            if (item) {
                actualizarStock(item.codigo, p.cantidad);
            } else {
                // si no existe, se crea con código simple basado en timestamp
                const nuevoCodigo = 'P' + Date.now();
                datosApp.stock.push({
                    codigo: nuevoCodigo,
                    producto: p.nombre,
                    cantidad: p.cantidad,
                    precioUnitario: p.precio,
                    estado: p.cantidad <= STOCK_BAJO ? 'Bajo Stock' : 'Disponible'
                });
            }
        });
        // guardar cambios de stock
        guardarDatos();

        // Guardar en localStorage
        guardarComprasEnAlmacenamiento();

        // enviar al backend
        fetch('http://localhost:3000/api/compras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(compra)
        }).then(r=>r.json()).then(data=>{
            console.log('compra guardada en servidor', data);
        }).catch(err=>console.error('error enviando compra al servidor', err));

        // registrar en historial
        if (typeof logEvent === 'function') {
            logEvent('compra', `Compra a ${compra.proveedor} total $${compra.total.toFixed(2)}`);
        }

        // Mostrar resumen
        mostrarResumenCompra(compra);

        // Actualizar tabla
        actualizarTabla();
        actualizarTotalesGenerales();

        // Limpiar formulario
        form.reset();
        inicializarProductos();

        // Mensaje de éxito
        console.log('✓ Compra registrada correctamente');
    });
}

// ============================================
// GESTIÓN DE PRODUCTOS DINÁMICOS
// ============================================

function inicializarProductos() {
    const listaProductos = document.getElementById('lista-productos');
    listaProductos.innerHTML = '';

    // Agregar primer producto por defecto
    agregarProducto();

    // Configurar botón de agregar producto
    document.getElementById('agregar-producto').addEventListener('click', abrirModalProducto);
}

function agregarProducto() {
    const listaProductos = document.getElementById('lista-productos');
    const productoId = Date.now();

    const productoHTML = `
        <div class="producto-item" data-id="${productoId}">
            <div class="fila-producto">
                <div class="grupo-form">
                    <label>Producto:</label>
                    <input type="text" class="producto-nombre" placeholder="Ej: Coca Cola 2.25L" required>
                </div>

                <div class="grupo-form">
                    <label>Cantidad:</label>
                    <input type="number" class="producto-cantidad" min="1" placeholder="0" required>
                </div>

                <div class="grupo-form">
                    <label>Precio Unitario ($):</label>
                    <input type="number" class="producto-precio" min="0" step="0.01" placeholder="0.00" required>
                </div>

                <div class="grupo-form">
                    <label>Subtotal:</label>
                    <input type="text" class="producto-subtotal" readonly value="$0.00">
                </div>

                <div class="acciones-producto">
                    <button type="button" class="boton-eliminar-producto" onclick="eliminarProducto(${productoId})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    listaProductos.insertAdjacentHTML('beforeend', productoHTML);

    // Configurar eventos para cálculos automáticos
    configurarEventosProducto(productoId);
}

function configurarEventosProducto(productoId) {
    const productoDiv = document.querySelector(`[data-id="${productoId}"]`);
    const cantidadInput = productoDiv.querySelector('.producto-cantidad');
    const precioInput = productoDiv.querySelector('.producto-precio');
    const subtotalInput = productoDiv.querySelector('.producto-subtotal');

    function calcularSubtotal() {
        const cantidad = parseFloat(cantidadInput.value) || 0;
        const precio = parseFloat(precioInput.value) || 0;
        const subtotal = cantidad * precio;

        subtotalInput.value = `$${subtotal.toFixed(2)}`;
        calcularTotalesGenerales();
    }

    cantidadInput.addEventListener('input', calcularSubtotal);
    precioInput.addEventListener('input', calcularSubtotal);
}

function eliminarProducto(productoId) {
    const productoDiv = document.querySelector(`[data-id="${productoId}"]`);
    if (productoDiv) {
        productoDiv.remove();
        calcularTotalesGenerales();
    }
}

function obtenerProductosDelFormulario() {
    const productos = [];
    const productosDivs = document.querySelectorAll('.producto-item');

    productosDivs.forEach(div => {
        const nombre = div.querySelector('.producto-nombre').value.trim();
        const cantidad = parseFloat(div.querySelector('.producto-cantidad').value) || 0;
        const precio = parseFloat(div.querySelector('.producto-precio').value) || 0;
        const abono = parseFloat(div.querySelector('.producto-abono').value) || 0;
        const subtotal = cantidad * precio;

        if (nombre && cantidad > 0 && precio > 0) {
            productos.push({
                nombre,
                cantidad,
                precio,
                abono,
                subtotal
            });
        }
    });

    return productos;
}

function calcularTotalesGenerales() {
    const productos = obtenerProductosDelFormulario();
    const subtotal = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    document.getElementById('subtotal-compra').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva-compra').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total-compra').textContent = `$${total.toFixed(2)}`;
}

// ============================================
// MODAL PARA AGREGAR PRODUCTO
// ============================================

function abrirModalProducto() {
    const modal = document.getElementById('modal-agregar-producto');
    modal.classList.add('show');
    // Limpiar campos
    document.getElementById('modal-producto-nombre').value = '';
    document.getElementById('modal-producto-cantidad').value = '';
    document.getElementById('modal-producto-precio').value = '';
    document.getElementById('modal-producto-abono').value = '';
    // Mostrar total abonado actual
    const totalAbonado = calcularTotalAbonado();
    document.getElementById('total-abonado-modal').textContent = totalAbonado.toFixed(2);
}

function cerrarModalProducto() {
    const modal = document.getElementById('modal-agregar-producto');
    modal.classList.remove('show');
}

function guardarProductoModal() {
    const nombre = document.getElementById('modal-producto-nombre').value.trim();
    const cantidad = parseFloat(document.getElementById('modal-producto-cantidad').value) || 0;
    const precio = parseFloat(document.getElementById('modal-producto-precio').value) || 0;
    const abono = parseFloat(document.getElementById('modal-producto-abono').value) || 0;

    if (!nombre || cantidad <= 0 || precio <= 0) {
        alert('Por favor, completa todos los campos correctamente.');
        return;
    }

    // Agregar el producto
    agregarProductoDesdeModal(nombre, cantidad, precio, abono);

    // Cerrar modal
    cerrarModalProducto();
}

function agregarProductoDesdeModal(nombre, cantidad, precio, abono) {
    const listaProductos = document.getElementById('lista-productos');
    const productoId = Date.now();
    const subtotal = cantidad * precio;

    const productoHTML = `
        <div class="producto-item" data-id="${productoId}">
            <div class="fila-producto">
                <div class="grupo-form">
                    <label>Producto:</label>
                    <input type="text" class="producto-nombre" value="${nombre}" required>
                </div>

                <div class="grupo-form">
                    <label>Cantidad:</label>
                    <input type="number" class="producto-cantidad" min="1" value="${cantidad}" required>
                </div>

                <div class="grupo-form">
                    <label>Precio Unitario ($):</label>
                    <input type="number" class="producto-precio" min="0" step="0.01" value="${precio}" required>
                </div>

                <div class="grupo-form">
                    <label>Monto Abonado ($):</label>
                    <input type="number" class="producto-abono" min="0" step="0.01" value="${abono}" required>
                </div>

                <div class="grupo-form">
                    <label>Subtotal:</label>
                    <input type="text" class="producto-subtotal" readonly value="$${subtotal.toFixed(2)}">
                </div>

                <div class="acciones-producto">
                    <button type="button" class="boton-eliminar-producto" onclick="eliminarProducto(${productoId})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    listaProductos.insertAdjacentHTML('beforeend', productoHTML);

    // Configurar eventos
    configurarEventosProducto(productoId);

    // Recalcular totales
    calcularTotalesGenerales();
}

function calcularTotalAbonado() {
    const productos = obtenerProductosDelFormulario();
    return productos.reduce((sum, p) => sum + (p.abono || 0), 0);
}

// ============================================
// MOSTRAR RESUMEN DE COMPRA
// ============================================

function mostrarResumenCompra(compra) {
    const resumenDiv = document.getElementById('resumen-compra');

    const productosHTML = compra.productos.map(p =>
        `<li>${p.nombre} - ${p.cantidad} x $${p.precio.toFixed(2)} = $${p.subtotal.toFixed(2)}</li>`
    ).join('');

    const html = `
        <div class="alerta-exito">
            <i class="bi bi-check-circle"></i>
            <div class="contenido-alerta">
                <h3>¡Compra Registrada Correctamente!</h3>
                <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
                <p><strong>Productos:</strong></p>
                <ul class="lista-productos-resumen">
                    ${productosHTML}
                </ul>
                <p><strong>Total:</strong> $${compra.total.toFixed(2)} | <strong>Método:</strong> ${compra.metodoPago}</p>
                <p>Registrado el ${compra.fechaRegistro} a las ${compra.horaRegistro}</p>
            </div>
        </div>
    `;

    resumenDiv.innerHTML = html;

    // Limpiar después de 5 segundos
    setTimeout(() => {
        resumenDiv.innerHTML = '';
    }, 5000);
}

// ============================================
// ACTUALIZAR TABLA
// ============================================

function actualizarTabla() {
    const tbody = document.getElementById('tbody-compras-registro');
    tbody.innerHTML = '';

    // Mostrar compras en orden inverso (más recientes primero)
    const comprasOrdenadas = [...comprasRegistradas].reverse();

    comprasOrdenadas.forEach((compra, index) => {
        const clasePago = compra.metodoPago.toLowerCase().replace(/\s/g, '-');
        const productosResumen = compra.productos.map(p => `${p.nombre} (${p.cantidad})`).join(', ');

        const fila = `
            <tr>
                <td>${comprasRegistradas.length - index}</td>
                <td><strong>${compra.proveedor}</strong></td>
                <td class="productos-cell">${productosResumen}</td>
                <td>$${compra.subtotal.toFixed(2)}</td>
                <td>$${compra.iva.toFixed(2)}</td>
                <td><strong>$${compra.total.toFixed(2)}</strong></td>
                <td><span class="etiqueta-pago ${clasePago}">${compra.metodoPago}</span></td>
                <td>${compra.fechaCompra}</td>
                <td>
                    <button class="boton-eliminar" onclick="eliminarCompra(${compra.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;

        tbody.innerHTML += fila;
    });
}

// ============================================
// ELIMINAR COMPRA
// ============================================

function eliminarCompra(id) {
    if (confirm('¿Está seguro de que desea eliminar esta compra?')) {
        comprasRegistradas = comprasRegistradas.filter(c => c.id !== id);
        guardarComprasEnAlmacenamiento();
        actualizarTabla();
        actualizarTotalesGenerales();
        console.log('✓ Compra eliminada');
    }
}

// ============================================
// ACTUALIZAR TOTALES GENERALES
// ============================================

function actualizarTotalesGenerales() {
    const totalCompras = comprasRegistradas.reduce((sum, c) => sum + c.total, 0);
    const totalEfectivo = comprasRegistradas
        .filter(c => c.metodoPago === 'Efectivo')
        .reduce((sum, c) => sum + c.total, 0);
    const totalTransferencia = comprasRegistradas
        .filter(c => c.metodoPago === 'Transferencia')
        .reduce((sum, c) => sum + c.total, 0);
    const totalCredito = comprasRegistradas
        .filter(c => c.metodoPago === 'Crédito')
        .reduce((sum, c) => sum + c.total, 0);

    document.getElementById('total-general-compras').textContent = `$${totalCompras.toFixed(2)}`;
    document.getElementById('total-efectivo-compras').textContent = `$${totalEfectivo.toFixed(2)}`;
    document.getElementById('total-transferencia-compras').textContent = `$${totalTransferencia.toFixed(2)}`;
    document.getElementById('total-credito-compras').textContent = `$${totalCredito.toFixed(2)}`;
}

// ============================================
// EXPORTAR A EXCEL
// ============================================

document.getElementById('btnExportarCompras').addEventListener('click', function() {
    if (comprasRegistradas.length === 0) {
        alert('No hay compras para exportar');
        return;
    }

    // Preparar datos para Excel
    const datos = [];
    comprasRegistradas.forEach((compra, index) => {
        compra.productos.forEach(producto => {
            datos.push({
                'N° Compra': index + 1,
                'Proveedor': compra.proveedor,
                'Producto': producto.nombre,
                'Cantidad': producto.cantidad,
                'Precio Unitario': producto.precio,
                'Subtotal Producto': producto.subtotal,
                'Subtotal Compra': compra.subtotal,
                'IVA': compra.iva,
                'Total Compra': compra.total,
                'Método de Pago': compra.metodoPago,
                'Fecha Compra': compra.fechaCompra,
                'Fecha Registro': compra.fechaRegistro,
                'Hora Registro': compra.horaRegistro
            });
        });
    });

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datos);

    // Establecer anchos de columna
    ws['!cols'] = [
        { wch: 10 },   // N° Compra
        { wch: 20 },   // Proveedor
        { wch: 25 },   // Producto
        { wch: 10 },   // Cantidad
        { wch: 15 },   // Precio Unitario
        { wch: 15 },   // Subtotal Producto
        { wch: 15 },   // Subtotal Compra
        { wch: 10 },   // IVA
        { wch: 15 },   // Total Compra
        { wch: 18 },   // Método de Pago
        { wch: 12 },   // Fecha Compra
        { wch: 12 },   // Fecha Registro
        { wch: 10 }    // Hora Registro
    ];

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compras Detalladas');

    // Agregar hoja de resumen
    const resumenDatos = [
        { Concepto: 'Total de Compras', Monto: comprasRegistradas.reduce((sum, c) => sum + c.total, 0) },
        { Concepto: 'Compras en Efectivo', Monto: comprasRegistradas.filter(c => c.metodoPago === 'Efectivo').reduce((sum, c) => sum + c.total, 0) },
        { Concepto: 'Compras por Transferencia', Monto: comprasRegistradas.filter(c => c.metodoPago === 'Transferencia').reduce((sum, c) => sum + c.total, 0) },
        { Concepto: 'Compras a Crédito', Monto: comprasRegistradas.filter(c => c.metodoPago === 'Crédito').reduce((sum, c) => sum + c.total, 0) },
        { Concepto: 'Cantidad de Compras', Monto: comprasRegistradas.length },
        { Concepto: 'Promedio por Compra', Monto: comprasRegistradas.length > 0 ? comprasRegistradas.reduce((sum, c) => sum + c.total, 0) / comprasRegistradas.length : 0 }
    ];

    const wsResumen = XLSX.utils.json_to_sheet(resumenDatos);
    wsResumen['!cols'] = [
        { wch: 25 },
        { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Descargar archivo
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(wb, `Compras_Olica_${fecha}.xlsx`);

    console.log('✓ Archivo Excel descargado');
});

// ============================================
// LIMPIAR TABLA
// ============================================

document.getElementById('btnLimpiarCompras').addEventListener('click', function() {
    if (comprasRegistradas.length === 0) {
        alert('No hay compras para limpiar');
        return;
    }

    if (confirm('⚠️ ¿Está seguro de que desea eliminar TODAS las compras? Esta acción no se puede deshacer.')) {
        if (confirm('Esta es la última confirmación. ¿Desea continuar?')) {
            comprasRegistradas = [];
            guardarComprasEnAlmacenamiento();
            actualizarTabla();
            actualizarTotalesGenerales();
            console.log('✓ Tabla limpiada');
        }
    }
});

console.log('✓ Sistema de compras cargado correctamente');
