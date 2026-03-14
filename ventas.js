// ============================================
// BASE DE DATOS LOCAL - REGISTRO DE VENTAS (utiliza datosApp)
// ============================================

let ventasRegistradas = [];

// Cargar datos al abrir la página
document.addEventListener('DOMContentLoaded', function() {
    // datosApp y funciones vienen de main.js
    cargarDatos();
    ventasRegistradas = datosApp.ventas || [];
    configurarFormulario();
    actualizarTabla();
    inicializarProductosVenta();
});

// ============================================
// ALMACENAMIENTO LOCAL (delegado a main.js)
// ============================================

function guardarEnAlmacenamiento() {
    datosApp.ventas = ventasRegistradas;
    guardarDatos(); // actualiza localStorage completo
}



// ============================================
// CONFIGURACIÓN DEL FORMULARIO
// ============================================

function configurarFormulario() {
    const form = document.getElementById('formulario-venta');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Leer código seleccionado y buscar nombre
        const codigo = document.getElementById('producto').value;
        const itemStock = datosApp.stock.find(i => i.codigo === codigo);
        const productoNombre = itemStock ? itemStock.producto : codigo;

        const cantidad = parseInt(document.getElementById('cantidad').value);
        const precio = parseFloat(document.getElementById('precio').value);
        const cliente = document.getElementById('cliente').value.trim() || 'Sin especificar';
        const metodoPago = document.getElementById('metodo-pago').value;
        const observaciones = document.getElementById('observaciones').value.trim() || '-';
        
        // Validar que se seleccione un producto y el método de pago
        if (!codigo) {
            alert('Por favor, selecciona un producto');
            return;
        }
        if (itemStock && cantidad > itemStock.cantidad) {
            alert('La cantidad solicitada supera el stock disponible');
            return;
        }
        if (!metodoPago) {
            alert('Por favor, selecciona un método de pago');
            return;
        }
        
        // Crear objeto de venta
        const venta = {
            id: Date.now(),
            codigo: codigo,
            producto: productoNombre,
            cantidad,
            precio,
            total: cantidad * precio,
            cliente,
            metodoPago,
            observaciones,
            fecha: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            hora: new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        // Agregar a array
        ventasRegistradas.push(venta);
        actualizarStock(codigo, -cantidad);

        // Enviar al backend
        fetch(`${API}/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        }).then(r=>r.json()).then(data=>{
            console.log('venta guardada en servidor', data);
        }).catch(err=>console.error('error enviando al servidor', err));

        // Guardar en localStorage también por compatibilidad
        guardarEnAlmacenamiento();

        // Mostrar resumen
        mostrarResumenVenta(venta);
        
        // Actualizar tabla
        actualizarTabla();
        
        // Limpiar formulario
        form.reset();
        
        // Mensaje de éxito
        console.log('✓ Venta registrada correctamente');
        // registrar en historial
        if (typeof logEvent === 'function') {
            logEvent('venta', `Producto ${venta.producto} x${venta.cantidad} (código ${venta.codigo || 'N/A'})`);
        }
    });
}

// ============================================
// MOSTRAR RESUMEN DE VENTA
// ============================================

function mostrarResumenVenta(venta) {
    const resumenDiv = document.getElementById('resumen-venta');
    
    const html = `
        <div class="alerta-exito">
            <i class="bi bi-check-circle"></i>
            <div class="contenido-alerta">
                <h3>¡Venta Registrada Correctamente!</h3>
                <p><strong>${venta.producto}</strong> - Cantidad: ${venta.cantidad} x $${venta.precio.toFixed(2)}</p>
                <p><strong>Total:</strong> $${venta.total.toFixed(2)} | <strong>Método:</strong> ${venta.metodoPago}</p>
                <p>Registrado el ${venta.fecha} a las ${venta.hora}</p>
            </div>
        </div>
    `;
    
    resumenDiv.innerHTML = html;
    
    // Limpiar después de 4 segundos
    setTimeout(() => {
        resumenDiv.innerHTML = '';
    }, 4000);
}

// ============================================
// CONFIGURACIÓN ADICIONAL
// ============================================

function inicializarProductosVenta() {
    const select = document.getElementById('producto');
    if (!select) return;

    function rellenar() {
        select.innerHTML = '<option value="">-- Selecciona un producto --</option>';
        datosApp.stock.forEach(item => {
            select.innerHTML += `<option value="${item.codigo}">${item.producto}</option>`;
        });
    }

    rellenar();

    select.addEventListener('change', function() {
        const codigo = this.value;
        const item = datosApp.stock.find(i => i.codigo === codigo);
        if (item) {
            document.getElementById('precio').value = item.precioUnitario;
            document.getElementById('cantidad').setAttribute('max', item.cantidad);
        } else {
            document.getElementById('precio').value = '';
            document.getElementById('cantidad').removeAttribute('max');
        }
    });

    // si otro tab modifica el stock, recargar opciones
    window.addEventListener('storage', function(e) {
        if (e.key === 'datosAppOlica' || e.key === 'ventasOlica') {
            cargarDatos();
            rellenar();
        }
    });
}

// ============================================
// ACTUALIZAR TABLA
// ============================================

function actualizarTabla() {
    const tbody = document.getElementById('tbody-ventas-registro');
    tbody.innerHTML = '';
    
    // Mostrar ventas en orden inverso (más recientes primero)
    const ventasOrdenadas = [...ventasRegistradas].reverse();
    
    ventasOrdenadas.forEach((venta, index) => {
        const clasePago = venta.metodoPago === 'Efectivo' ? 'efectivo' : 'transferencia';
        const iconoPago = venta.metodoPago === 'Efectivo' ? '💵' : '💳';
        
        const fila = `
            <tr>
                <td>${ventasRegistradas.length - index}</td>
                <td>${venta.codigo || ''}</td>
                <td><strong>${venta.producto}</strong></td>
                <td>${venta.cantidad}</td>
                <td>$${venta.precio.toFixed(2)}</td>
                <td><strong>$${venta.total.toFixed(2)}</strong></td>
                <td>${venta.cliente}</td>
                <td><span class="etiqueta-pago ${clasePago}">${iconoPago} ${venta.metodoPago}</span></td>
                <td>${venta.observaciones}</td>
                <td>${venta.fecha}</td>
                <td>
                    <button class="boton-eliminar" onclick="eliminarVenta(${venta.id})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        
        tbody.innerHTML += fila;
    });
    
    // Actualizar totales
    actualizarTotales();
}

// ============================================
// ELIMINAR VENTA
// ============================================

function eliminarVenta(id) {
    if (confirm('¿Está seguro de que desea eliminar esta venta?')) {
        ventasRegistradas = ventasRegistradas.filter(v => v.id !== id);
        guardarEnAlmacenamiento();
        actualizarTabla();
        console.log('✓ Venta eliminada');
    }
}

// ============================================
// ACTUALIZAR TOTALES
// ============================================

function actualizarTotales() {
    const totalVentas = ventasRegistradas.reduce((sum, v) => sum + v.total, 0);
    const totalEfectivo = ventasRegistradas
        .filter(v => v.metodoPago === 'Efectivo')
        .reduce((sum, v) => sum + v.total, 0);
    const totalTransferencia = ventasRegistradas
        .filter(v => v.metodoPago === 'Transferencia')
        .reduce((sum, v) => sum + v.total, 0);
    
    document.getElementById('total-ventas').textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById('total-efectivo').textContent = `$${totalEfectivo.toFixed(2)}`;
    document.getElementById('total-transferencia').textContent = `$${totalTransferencia.toFixed(2)}`;
}

// ============================================
// EXPORTAR A EXCEL
// ============================================

document.getElementById('btnExportar').addEventListener('click', function() {
    if (ventasRegistradas.length === 0) {
        alert('No hay ventas para exportar');
        return;
    }
    
    // Preparar datos para Excel
    const datos = ventasRegistradas.map((venta, index) => ({
        'N°': index + 1,
        'Código': venta.codigo || '',
        'Producto': venta.producto,
        'Cantidad': venta.cantidad,
        'Precio Unitario': venta.precio,
        'Total': venta.total,
        'Cliente': venta.cliente,
        'Método de Pago': venta.metodoPago,
        'Observaciones': venta.observaciones,
        'Fecha': venta.fecha,
        'Hora': venta.hora
    }));
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datos);
    
    // Establecer anchos de columna
    ws['!cols'] = [
        { wch: 5 },   // N°
        { wch: 10 },  // Código
        { wch: 15 },  // Producto
        { wch: 10 },  // Cantidad
        { wch: 15 },  // Precio Unitario
        { wch: 15 },  // Total
        { wch: 20 },  // Cliente
        { wch: 18 },  // Método de Pago
        { wch: 20 },  // Observaciones
        { wch: 12 },  // Fecha
        { wch: 10 }   // Hora
    ];
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    
    // Agregar hoja de resumen
    const resumenDatos = [
        { Concepto: 'Total de Ventas', Monto: ventasRegistradas.reduce((sum, v) => sum + v.total, 0) },
        { Concepto: 'Ventas en Efectivo', Monto: ventasRegistradas.filter(v => v.metodoPago === 'Efectivo').reduce((sum, v) => sum + v.total, 0) },
        { Concepto: 'Ventas por Transferencia', Monto: ventasRegistradas.filter(v => v.metodoPago === 'Transferencia').reduce((sum, v) => sum + v.total, 0) },
        { Concepto: 'Cantidad de Transacciones', Monto: ventasRegistradas.length }
    ];
    
    const wsResumen = XLSX.utils.json_to_sheet(resumenDatos);
    wsResumen['!cols'] = [
        { wch: 25 },
        { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    
    // Descargar archivo
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    XLSX.writeFile(wb, `Ventas_Olica_${fecha}.xlsx`);
    
    console.log('✓ Archivo Excel descargado');
});

// ============================================
// LIMPIAR TABLA
// ============================================

document.getElementById('btnLimpiarVentas').addEventListener('click', function() {
    if (ventasRegistradas.length === 0) {
        alert('No hay ventas para limpiar');
        return;
    }
    
    if (confirm('⚠️ ¿Está seguro de que desea eliminar ALL las ventas? Esta acción no se puede deshacer.')) {
        if (confirm('Esta es la última confirmación. ¿Desea continuar?')) {
            ventasRegistradas = [];
            guardarEnAlmacenamiento();
            actualizarTabla();
            console.log('✓ Tabla limpiada');
        }
    }
});

console.log('✓ Sistema de ventas cargado correctamente');
