const loginForm = document.getElementById('login-form');
const statusElement = document.getElementById('login-status');

const setStatus = (message = '', variant) => {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.classList.remove('login-status--error', 'login-status--success');
  if (variant) {
    statusElement.classList.add(variant);
  }
};

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const usuario = event.target.usuario.value.trim();
  const password = event.target.password.value.trim();

  if (usuario === 'jea' && password === '123456') {
    setStatus('Acceso concedido. Redirigiendo...', 'login-status--success');
    window.location.href = 'AdministrarPagina.html';
  } else {
    setStatus('Usuario o contraseña incorrectos.', 'login-status--error');
  }
});
