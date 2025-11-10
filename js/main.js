console.log('Bienvenido a las nuevas Quintas de Ezeiza');
(function () {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  console.log('Bienvenido a las nuevas Quintas de Ezeiza');
})();
