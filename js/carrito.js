// ====== MOSTRAR CARRITO ======
document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('lista-carrito');
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

  if (carrito.length === 0) {
    lista.innerHTML = '<p>El carrito está vacío.</p>';
    return;
  }

  carrito.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-card';
    div.innerHTML = `
      <h3>${item.nombre}</h3>
      <button class="btn btn--ghost" onclick="eliminarDelCarrito('${item.id}')">❌ Eliminar</button>
    `;
    lista.appendChild(div);
  });
});

// ====== ELIMINAR ITEM DEL CARRITO ======
function eliminarDelCarrito(id) {
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  carrito = carrito.filter(item => item.id !== id);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  location.reload();
}

// ====== VACIAR TODO EL CARRITO ======
function vaciarCarrito() {
  localStorage.removeItem('carrito');
  location.reload();
}