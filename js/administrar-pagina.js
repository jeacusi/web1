const API_URL = 'https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblgNTJT4nQVw6EIx';
const AUTH_HEADER = 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0';
const FALLBACK_IMAGE = 'img/casaquintaclasica.jpg';

const toText = value => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

const updateStatus = (element, message, isError = false) => {
  if (!element) {
    return;
  }
  element.hidden = !message;
  element.textContent = message;
  element.classList.toggle('experiences__status--error', Boolean(isError));
};

const createCard = (record, onDelete) => {
  const name = toText(record?.fields?.Nombre) || 'Experiencia sin nombre';
  const description = toText(record?.fields?.Descripcion) || 'Sin descripción disponible.';
  const attachments = Array.isArray(record?.fields?.ImagenUrl) ? record.fields.ImagenUrl : [];
  const imageUrl = attachments[0]?.thumbnails?.large?.url || attachments[0]?.url || FALLBACK_IMAGE;

  const article = document.createElement('article');
  article.className = 'experience-card';
  article.dataset.recordId = record?.id || '';

  const figure = document.createElement('figure');
  figure.className = 'experience-card__media';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = `Imagen de ${name}`;
  img.src = imageUrl;
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

  const editButton = document.createElement('a');
  editButton.className = 'btn btn--primary';
  editButton.textContent = 'Editar';
  editButton.href = record?.id
    ? `editar-experiencia.html?id=${encodeURIComponent(record.id)}`
    : 'editar-experiencia.html';

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn btn--danger';
  deleteButton.textContent = 'Eliminar';
  deleteButton.addEventListener('click', () => {
    if (typeof onDelete === 'function' && record?.id) {
      onDelete(record.id, article, deleteButton);
    }
  });

  actions.appendChild(descriptionLink);
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  article.appendChild(figure);
  article.appendChild(body);
  article.appendChild(actions);

  return article;
};

const handleDelete = (recordId, card, button, grid, statusElement) => {
  const confirmed = window.confirm('¿Estás seguro de eliminar esta experiencia? Esta acción no se puede deshacer.');
  if (!confirmed) {
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Eliminando...';

  fetch(`${API_URL}/${recordId}`, {
    method: 'DELETE',
    headers: {
      Authorization: AUTH_HEADER
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudo eliminar el registro.');
      }
      card.remove();
      if (!grid.querySelector('.experience-card')) {
        updateStatus(statusElement, 'No quedan experiencias publicadas.');
      }
    })
    .catch(error => {
      console.error('Error al eliminar la experiencia:', error);
      button.disabled = false;
      button.textContent = originalText;
      window.alert('Ocurrió un error al eliminar la experiencia. Intentalo nuevamente.');
    });
};

const loadExperiences = () => {
  const grid = document.querySelector('[data-admin-experiences]');
  const statusElement = document.querySelector('[data-admin-status]');

  if (!grid || !statusElement) {
    return;
  }

  updateStatus(statusElement, 'Cargando experiencias...');

  fetch(API_URL, {
    headers: {
      Authorization: AUTH_HEADER
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudieron cargar las experiencias.');
      }
      return response.json();
    })
    .then(data => {
      const records = Array.isArray(data?.records) ? data.records : [];
      grid.innerHTML = '';

      if (records.length === 0) {
        updateStatus(statusElement, 'No hay experiencias publicadas por el momento.');
        return;
      }

      updateStatus(statusElement, '');

      records.forEach(record => {
        const card = createCard(record, (id, article, button) =>
          handleDelete(id, article, button, grid, statusElement)
        );
        grid.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error al cargar las experiencias:', error);
      grid.innerHTML = '';
      updateStatus(statusElement, 'Ocurrió un error al cargar las experiencias. Intentá nuevamente más tarde.', true);
    });
};

document.addEventListener('DOMContentLoaded', loadExperiences);
