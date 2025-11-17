(function () {
  const FAVORITES_STORAGE_KEY = 'favoriteQuintas';

  const safeString = value => {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return '';
  };

  const readFavorites = () => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      console.warn('No se pudieron leer los favoritos almacenados.', error);
      return [];
    }
  };

  const writeFavorites = favorites => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.warn('No se pudieron guardar los favoritos.', error);
    }
    return favorites;
  };

  const isFavorite = recordId => {
    const id = safeString(recordId);
    if (!id) {
      return false;
    }
    return readFavorites().includes(id);
  };

  const toggleFavorite = recordId => {
    const id = safeString(recordId);
    if (!id) {
      return readFavorites();
    }
    const favorites = readFavorites();
    const index = favorites.indexOf(id);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(id);
    }
    const updatedFavorites = writeFavorites(favorites);
    window.dispatchEvent(
      new CustomEvent('favorites:updated', {
        detail: { favorites: updatedFavorites }
      })
    );
    return updatedFavorites;
  };

  const createFavoriteButton = (recordId, options = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--ghost experience-card__favorite-button';
    button.dataset.experienceId = recordId || '';

    const render = () => {
      const favorite = isFavorite(recordId);
      button.classList.toggle('is-favorite', favorite);
      button.setAttribute('aria-pressed', favorite ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
      );
      button.innerHTML = '';
      const icon = document.createElement('span');
      icon.className = 'experience-card__favorite-icon';
      icon.textContent = favorite ? '★' : '☆';
      const label = document.createElement('span');
      label.className = 'experience-card__favorite-label';
      label.textContent = favorite ? 'En favoritos' : 'Guardar en favoritos';
      button.appendChild(icon);
      button.appendChild(label);
    };

    button.addEventListener('click', () => {
      const updatedFavorites = toggleFavorite(recordId);
      const favoriteNow = updatedFavorites.includes(recordId);
      if (typeof options.onToggle === 'function') {
        options.onToggle(favoriteNow);
      }
    });

    window.addEventListener('storage', event => {
      if (event.key === FAVORITES_STORAGE_KEY) {
        render();
      }
    });

    window.addEventListener('favorites:updated', event => {
      if (Array.isArray(event?.detail?.favorites)) {
        render();
      }
    });

    render();
    return button;
  };

  const createExperienceCard = (record, options = {}) => {
    const fields = record?.fields || {};
    const name = safeString(fields?.Nombre) || 'Experiencia sin nombre';
    const description = safeString(fields?.Descripcion) || 'Sin descripción disponible.';
    const imageUrl = fields?.ImagenUrl?.[0]?.thumbnails?.large?.url;

    const article = document.createElement('article');
    article.className = 'experience-card';

    const figure = document.createElement('figure');
    figure.className = 'experience-card__media';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = `Imagen de ${name}`;
    img.src = imageUrl || 'img/casaquintaclasica.jpg';
    figure.appendChild(img);

    const body = document.createElement('div');
    body.className = 'experience-card__body';

    const title = document.createElement('h3');
    title.textContent = name;

    const paragraph = document.createElement('p');
    paragraph.textContent = description;

    body.appendChild(title);
    body.appendChild(paragraph);

    const actions = document.createElement('div');
    actions.className = 'experience-card__actions';

    const descriptionLink = document.createElement('a');
    descriptionLink.className = 'btn btn--secondary';
    descriptionLink.textContent = 'Descripción';

    if (record?.id) {
      descriptionLink.href = `descripcion-servicio.html?id=${encodeURIComponent(record.id)}`;
      descriptionLink.dataset.serviceId = record.id;
      descriptionLink.addEventListener('click', () => {
        try {
          sessionStorage.setItem('selectedExperienceId', record.id);
        } catch (error) {
          console.warn('No se pudo almacenar el identificador en sessionStorage.', error);
        }
      });
    } else {
      descriptionLink.href = 'descripcion-servicio.html';
    }

    const reserveButton = document.createElement('a');
    reserveButton.className = 'btn btn--primary';
    reserveButton.textContent = 'Reservar';
    reserveButton.href = 'Contacto.html';

    actions.appendChild(descriptionLink);
    actions.appendChild(reserveButton);

    if (record?.id) {
      const favoriteButton = createFavoriteButton(record.id, {
        onToggle: favoriteNow => {
          if (typeof options.onFavoriteToggle === 'function') {
            options.onFavoriteToggle(record.id, favoriteNow, article);
          }
        }
      });
      actions.appendChild(favoriteButton);
    }

    article.appendChild(figure);
    article.appendChild(body);
    article.appendChild(actions);

    return article;
  };

  window.ExperienceUtils = {
    createExperienceCard,
    loadFavorites: readFavorites,
    isFavorite,
    toggleFavorite
  };
})();
