const API_BASE_URL = 'https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblgNTJT4nQVw6EIx';
const AUTH_TOKEN = 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0';

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-favorites-grid]');
  const statusElement = document.querySelector('[data-favorites-status]');
  const createCard = window.ExperienceUtils?.createExperienceCard;

  if (!grid || !statusElement || typeof createCard !== 'function') {
    return;
  }

  const setStatus = (message, isError = false) => {
    statusElement.textContent = message;
    statusElement.hidden = !message;
    statusElement.classList.toggle('experiences__status--error', Boolean(isError));
  };

  const favorites = window.ExperienceUtils.loadFavorites();
  const uniqueFavoriteIds = Array.from(new Set(favorites)).filter(Boolean);

  if (uniqueFavoriteIds.length === 0) {
    setStatus('Todavía no guardaste ninguna casa quinta. Explorá las experiencias y sumá tus favoritas.');
    return;
  }

  setStatus('Cargando tus favoritos...');

  fetch(API_BASE_URL, {
    headers: {
      Authorization: AUTH_TOKEN
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudieron cargar los favoritos.');
      }
      return response.json();
    })
    .then(data => {
      const records = Array.isArray(data?.records) ? data.records : [];
      const filteredRecords = uniqueFavoriteIds
        .map(id => records.find(record => record.id === id))
        .filter(Boolean);
      grid.innerHTML = '';

      if (filteredRecords.length === 0) {
        setStatus('No pudimos encontrar información para tus favoritos.');
        return;
      }

      filteredRecords.forEach(record => {
        const card = createCard(record, {
          onFavoriteToggle: (recordId, isFavorite, cardElement) => {
            if (!isFavorite && cardElement?.parentNode) {
              cardElement.parentNode.removeChild(cardElement);
            }
            if (!grid.querySelector('.experience-card')) {
              setStatus('Eliminaste todas tus casas favoritas. Volvé al inicio para seguir explorando.');
            }
          }
        });
        grid.appendChild(card);
      });

      setStatus('');
    })
    .catch(() => {
      setStatus('Ocurrió un error al recuperar tus favoritos. Intentá nuevamente más tarde.', true);
    });
});
