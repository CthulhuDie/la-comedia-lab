// Configuración de tus datos de pago reales
const MIS_DATOS_PAGO = {
    binanceId: "575045643 (Pay ID)", // Reemplaza este ID por el tuyo cuando lo tengas a mano
    zinliEmail: "bboying36579@gmail.com",
    paypalEmail: "bboying36579@gmail.com",
    pagoMovil: {
        banco: "Banco de Venezuela (0102)",
        telefono: "0412-4944568",
        cedula: "V-27384141"
    },
    // Tasas de respaldo con los valores del mercado real actualizados
    tasaBCV: 736.93,
    tasaParalelo: 856.50 
};

// Define qué tasa quieres usar para los cálculos de Pago Móvil en tu escuela
// Opciones válidas: 'BCV' o 'PARALELO'
const TASA_A_USAR = 'BCV'; 

let itemActual = { name: '', price: 0 };

// Función asíncrona para consultar las tasas reales de Venezuela en vivo y pintarlas en la web
async function obtenerTasasEnTiempoReal() {
    // Usamos el endpoint público y estable de pydolarvenezuela
    const URL_API = 'https://pydolarvenezuela-api.vercel.app/api/v1/dollar';

    try {
        const response = await fetch(URL_API);
        if (!response.ok) throw new Error('Error de red al consultar el API');
        
        const data = await response.json();
        
        // 1. Extraemos y actualizamos las tasas del objeto de forma segura desde la API externa
        if (data.monitors && data.monitors.bcv && data.monitors.bcv.price) {
            MIS_DATOS_PAGO.tasaBCV = parseFloat(data.monitors.bcv.price);
        }
        
        // Buscamos EnParaleloVzla o Binance dentro de la respuesta de la API
        const precioParaleloReal = data.monitors?.enparalelovzla?.price || data.monitors?.binance?.price;
        if (precioParaleloReal) {
            MIS_DATOS_PAGO.tasaParalelo = parseFloat(precioParaleloReal);
        }
        
        // 2. Pintamos los valores actualizados en la barra superior del sitio web
        document.getElementById('tasa-bcv-val').innerText = `${MIS_DATOS_PAGO.tasaBCV.toFixed(2)} Bs`;
        document.getElementById('tasa-paralelo-val').innerText = `${MIS_DATOS_PAGO.tasaParalelo.toFixed(2)} Bs`;
        
        // 3. Cambiamos el indicador de estado a verde (Conectado con éxito en vivo)
        const indicator = document.querySelector('.status-indicator');
        if (indicator) {
            indicator.style.backgroundColor = '#2ed573';
        }
        
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.innerText = 'Tasas en vivo:';
        }

        console.log(`Tasas actualizadas e impresas -> BCV: ${MIS_DATOS_PAGO.tasaBCV} | Paralelo: ${MIS_DATOS_PAGO.tasaParalelo}`);
    } catch (error) {
        console.warn("No se pudieron cargar las tasas en vivo. Usando tasas de respaldo fijas.", error);
        
        // Si el API falla, mostramos los valores por defecto que configuraste arriba sin romper el HTML
        document.getElementById('tasa-bcv-val').innerText = `${MIS_DATOS_PAGO.tasaBCV.toFixed(2)} Bs`;
        document.getElementById('tasa-paralelo-val').innerText = `${MIS_DATOS_PAGO.tasaParalelo.toFixed(2)} Bs`;
        
        // Cambiamos el texto a modo manual/fijo para mantener la transparencia
        const indicator = document.querySelector('.status-indicator');
        if (indicator) {
            indicator.style.backgroundColor = '#ffb142'; // Color amarillo/naranja de advertencia amigable
        }
        
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.innerText = 'Tasas del día (Fijas):';
        }
    }
}

// Ejecutamos la consulta inmediatamente al cargar el script
document.addEventListener('DOMContentLoaded', obtenerTasasEnTiempoReal);

function openPaymentModal(itemName, itemPrice) {
    itemActual.name = itemName;
    itemActual.price = itemPrice;
    
    document.getElementById('modal-item-name').innerText = itemName;
    document.getElementById('modal-item-price').innerText = `$${itemPrice.toFixed(2)}`;
    
    // Resetear instrucciones
    const instDiv = document.getElementById('payment-instructions');
    instDiv.style.display = 'none';
    instDiv.innerHTML = '';

    document.getElementById('payment-modal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('payment-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function processPayment(method) {
    const instDiv = document.getElementById('payment-instructions');
    instDiv.style.display = 'block';
    
    let htmlContent = '';
    
    switch(method) {
        case 'Binance':
            htmlContent = `
                <h4><i class="fa-solid fa-coins"></i> Instrucciones Binance Pay:</h4>
                <p>Envía <strong>$${itemActual.price.toFixed(2)} USDT</strong> al siguiente Pay ID:</p>
                <p class="copiar-texto" onclick="copyToClipboard('${MIS_DATOS_PAGO.binanceId}')"><strong>ID: ${MIS_DATOS_PAGO.binanceId}</strong> <i class="fa-regular fa-copy"></i></p>
                <p class="nota">Una vez realices el pago, envíame el comprobante a mi WhatsApp / Email para darte acceso instantáneo.</p>
            `;
            break;
        case 'PayPal':
            const paypalLink = `https://www.paypal.me/cthulhudie/${itemActual.price.toFixed(2)}`;
            htmlContent = `
                <h4><i class="fab fa-paypal"></i> Instrucciones PayPal:</h4>
                <p>Puedes pagar de manera rápida haciendo clic en el siguiente enlace:</p>
                <a href="${paypalLink}" target="_blank" class="btn-primary" style="margin: 10px 0; text-decoration: none; display:inline-block; width:auto;">Ir a Pagar en PayPal</a>
                <p>O envía manualmente a: <strong>${MIS_DATOS_PAGO.paypalEmail}</strong></p>
                <p class="nota">*Asegúrate de cubrir la comisión si no lo haces por el link directo.</p>
            `;
            break;
        case 'Pago Móvil':
            // Selecciona de forma inteligente y reactiva la tasa configurada arriba
            const tasaActiva = (TASA_A_USAR === 'BCV') ? MIS_DATOS_PAGO.tasaBCV : MIS_DATOS_PAGO.tasaParalelo;
            const nombreTasa = (TASA_A_USAR === 'BCV') ? 'Tasa BCV' : 'Tasa Paralelo (Binance)';
            const totalBs = (itemActual.price * tasaActiva).toFixed(2);
            
            htmlContent = `
                <h4><i class="fa-solid fa-mobile-screen"></i> Pago Móvil:</h4>
                <p>Tasa aplicada: <strong>${tasaActiva.toFixed(2)} Bs. (${nombreTasa})</strong></p>
                <p>Monto exacto a transferir: <strong style="font-size: 1.25rem; color: #ff4757;">${totalBs} Bs.</strong></p>
                <hr style="border: 0; border-top: 1px solid #2f3542; margin: 10px 0;">
                <p><strong>Banco:</strong> ${MIS_DATOS_PAGO.pagoMovil.banco}</p>
                <p><strong>Teléfono:</strong> ${MIS_DATOS_PAGO.pagoMovil.telefono}</p>
                <p><strong>Cédula:</strong> ${MIS_DATOS_PAGO.pagoMovil.cedula}</p>
                <p class="nota">Por favor envía captura de pantalla de la transferencia con la referencia visible.</p>
            `;
            break;
        case 'Zinli':
            htmlContent = `
                <h4><i class="fa-solid fa-credit-card"></i> Instrucciones Zinli:</h4>
                <p>Envía <strong>$${itemActual.price.toFixed(2)} USD</strong> al correo asociado a Zinli:</p>
                <p class="copiar-texto" onclick="copyToClipboard('${MIS_DATOS_PAGO.zinliEmail}')"><strong>${MIS_DATOS_PAGO.zinliEmail}</strong> <i class="fa-regular fa-copy"></i></p>
                <p class="nota">Notifícame de inmediato para agendar tu espacio.</p>
            `;
            break;
    }
    
    instDiv.innerHTML = htmlContent;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("¡Copiado al portapapeles!");
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}
