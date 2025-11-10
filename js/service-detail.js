const API_BASE_URL = 'https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblgNTJT4nQVw6EIx';
const AUTH_TOKEN = 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0';
const FALLBACK_IMAGE = 'img/casaquintaclasica.jpg';

const stringValue = value => {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
};

const getFirstValue = (fields, keys = []) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined && fields[key] !== null) {
      return fields[key];
    }
  }
  return undefined;
};

const formatMeasurement = value => {
  if (typeof value === 'number') {
    return `${value} m²`;
  }
  const text = stringValue(value);
  return text || '—';
};

const formatCount = value => {
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return String(value.length);
  }
  const text = stringValue(value);
  return text || '—';
};

const formatCurrency = value => {
  if (typeof value === 'number') {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(value);
    } catch (error) {
      return `$${value}`;
    }
  }
  const text = stringValue(value);
  return text || 'Consultar';
};

const firstSentence = value => {
  const text = stringValue(value);
  if (!text) {
    return '';
  }
  const match = text.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
};

const toList = value => {
  if (Array.isArray(value)) {
    return value
      .map(item => stringValue(item))
      .map(item => item.replace(/^[-•\s]+/, ''))
      .filter(Boolean);
  }
  const text = stringValue(value);
  if (!text) {
    return [];
  }
  return text
    .split(/\r?\n|\u2022|,/)
    .map(item => item.trim())
    .filter(Boolean);
};

const getRecordId = () => {
  const params = new URLSearchParams(window.location.search);
  const queryId = stringValue(params.get('id'));
  if (queryId) {
    return queryId;
  }

  try {
    const storedId = stringValue(sessionStorage.getItem('selectedExperienceId'));
    if (storedId) {
      sessionStorage.removeItem('selectedExperienceId');
      return storedId;
    }
  } catch (error) {
    console.warn('No se pudo acceder a sessionStorage.', error);
  }

  return '';
};

const updateTextContent = (selector, value) => {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }
  const text = stringValue(value);
  if (text) {
    element.textContent = text;
  }
};

const updateHTMLContent = (selector, value) => {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }
  if (Array.isArray(value)) {
    element.innerHTML = '';
    value.forEach(paragraph => {
      const text = stringValue(paragraph);
      if (!text) {
        return;
      }
      const p = document.createElement('p');
      p.textContent = text;
      element.appendChild(p);
    });
    return;
  }
  const text = stringValue(value);
  if (text) {
    element.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = text;
    element.appendChild(p);
  }
};

const updateListContent = (selector, value, fallback) => {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }
  const items = toList(value);
  if (items.length === 0) {
    if (fallback) {
      element.innerHTML = '';
      const li = document.createElement('li');
      li.textContent = fallback;
      element.appendChild(li);
    }
    return;
  }
  element.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    element.appendChild(li);
  });
};

const updateImages = (elements, attachments, name) => {
  const images = Array.isArray(attachments) ? attachments : [];
  elements.forEach((img, index) => {
    const attachment = images[index];
    const src =
      attachment?.thumbnails?.large?.url || attachment?.url || img.getAttribute('src') || FALLBACK_IMAGE;
    img.src = src;
    img.alt = name ? `Imagen de ${name}` : img.alt;
  });
};

const showStatus = (element, message, isError = false) => {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.toggle('experiences__status--error', Boolean(isError));
  element.hidden = false;
};

const clearStatus = element => {
  if (!element) {
    return;
  }
  element.hidden = true;
  element.classList.remove('experiences__status--error');
  element.textContent = '';
};

document.addEventListener('DOMContentLoaded', () => {
  const statusElement = document.querySelector('[data-service-status]');
  const recordId = getRecordId();

  if (!recordId) {
    showStatus(statusElement, 'No encontramos el servicio seleccionado. Volvé al inicio para intentarlo nuevamente.', true);
    return;
  }

  showStatus(statusElement, 'Cargando servicio...');

  fetch(`${API_BASE_URL}/${encodeURIComponent(recordId)}`, {
    headers: {
      Authorization: AUTH_TOKEN
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se encontró el servicio solicitado.');
      }
      return response.json();
    })
    .then(record => {
      const fields = record?.fields || {};
      const name =
        getFirstValue(fields, ['Nombre', 'Titulo', 'Título']) ||
        'Servicio sin nombre';

      document.title = `${name} – Descripción del servicio`;

      updateTextContent('[data-service-name]', name);
      updateTextContent('[data-service-eyebrow]', getFirstValue(fields, ['Categoria', 'Tipo']) || 'Servicio destacado');

      const description =
        getFirstValue(fields, ['Resumen', 'DescripcionCorta']) || getFirstValue(fields, ['Descripcion']);
      const summary = firstSentence(description) || 'Estamos preparando los detalles del servicio.';
      updateTextContent('[data-service-summary]', summary);

      const location =
        stringValue(
          getFirstValue(fields, ['Ubicacion', 'Ubicación', 'Direccion', 'Dirección'])
        ) || '';
      updateTextContent('[data-service-location]', location || 'Ubicación disponible próximamente.');

      const metaIntro =
        getFirstValue(fields, ['IntroduccionCaracteristicas', 'Resumen']) ||
        (location ? `La propiedad se encuentra en ${location}.` : '');
      updateTextContent('[data-service-meta-intro]', metaIntro);

      updateTextContent(
        '[data-service-total-area]',
        formatMeasurement(
          getFirstValue(fields, ['SuperficieTotal', 'Superficietotal', 'Superficie total'])
        )
      );
      updateTextContent(
        '[data-service-covered-area]',
        formatMeasurement(getFirstValue(fields, ['SuperficieCubierta', 'Superficie cubierta']))
      );
      updateTextContent(
        '[data-service-rooms-count]',
        formatCount(getFirstValue(fields, ['CantidadAmbientes', 'Ambientes']))
      );
      updateTextContent(
        '[data-service-capacity]',
        formatCount(getFirstValue(fields, ['Capacidad', 'CapacidadMaxima', 'Capacidad máxima']))
      );
      updateTextContent(
        '[data-service-bathrooms]',
        stringValue(getFirstValue(fields, ['Banos', 'Baños', 'Banios'])) || '—'
      );
      updateTextContent('[data-service-checkin]', stringValue(getFirstValue(fields, ['CheckIn', 'Check-in'])));
      updateTextContent('[data-service-checkout]', stringValue(getFirstValue(fields, ['CheckOut', 'Check-out'])));

      updateListContent(
        '[data-service-ambiences]',
        fields.AmbientesListado || fields.Ambientes || fields.AmbientesDescripcion,
        'No se registraron ambientes específicos para este servicio.'
      );
      updateListContent(
        '[data-service-amenities]',
        fields.Comodidades || fields.Equipamiento || fields.Amenities,
        'No se listaron comodidades adicionales para este servicio.'
      );

      const descriptionContent = [];
      const detailedDescription = getFirstValue(fields, ['DescripcionDetallada', 'Descripcion']);
      const notesDescription = getFirstValue(fields, ['NotasDescripcion']);
      if (detailedDescription) {
        descriptionContent.push(detailedDescription);
      }
      if (notesDescription) {
        descriptionContent.push(notesDescription);
      }
      if (descriptionContent.length === 0) {
        descriptionContent.push('No contamos con una descripción ampliada por el momento.');
      }
      updateHTMLContent('[data-service-description]', descriptionContent);

      updateTextContent('[data-service-rates-intro]', getFirstValue(fields, ['IntroduccionTarifas', 'CondicionesTarifas']) || '');

      updateTextContent('[data-service-weekday-title]', getFirstValue(fields, ['TituloTarifaSemana']) || 'Lunes a jueves');
      updateTextContent(
        '[data-service-weekday-rate]',
        formatCurrency(getFirstValue(fields, ['TarifaSemana', 'TarifaLunesAJueves', 'PrecioLunesJueves']))
      );
      updateTextContent(
        '[data-service-weekday-description]',
        fields.DescripcionTarifaSemana || fields.DetalleTarifaSemana || 'Consultá disponibilidad para obtener el valor final.'
      );

      updateTextContent('[data-service-weekend-title]', getFirstValue(fields, ['TituloTarifaFinde']) || 'Viernes, sábados, domingos y feriados');
      updateTextContent(
        '[data-service-weekend-rate]',
        formatCurrency(getFirstValue(fields, ['TarifaFinDeSemana', 'TarifaFinde', 'PrecioFinDeSemana']))
      );
      updateTextContent(
        '[data-service-weekend-description]',
        fields.DescripcionTarifaFinde || fields.DetalleTarifaFinde || 'Consultá disponibilidad para obtener el valor final.'
      );

      updateListContent(
        '[data-service-notes]',
        fields.Condiciones || fields.Notas || fields.Observaciones,
        'Consultá con nuestro equipo para conocer las condiciones del servicio.'
      );

      const imageElements = document.querySelectorAll('[data-service-image]');
      const images = fields.ImagenesDetalle || fields.ImagenUrl || [];
      updateImages(imageElements, images, name);

      clearStatus(statusElement);
    })
    .catch(error => {
      console.error(error);
      showStatus(
        statusElement,
        'Ocurrió un problema al cargar la información del servicio. Refrescá la página o volvé a intentarlo más tarde.',
        true
      );
    });
});
