const API_BASE_URL = 'https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblgNTJT4nQVw6EIx';
const RECORD_ID = 'rec2icigac7NLRBcG';
const AUTH_HEADER = 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0';
const FALLBACK_IMAGE = 'img/casaquintaclasica.jpg';

const getInputValue = (form, name) => form.elements[name]?.value?.trim() || '';

const setStatus = (element, message, isError = false) => {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.toggle('form-status--error', Boolean(isError));
};

const updatePreview = (form, fields = {}) => {
  const fallback = (value, fallbackText = '') => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || fallbackText;
  };

  const previewName = document.querySelector('[data-preview-name]');
  const previewDescription = document.querySelector('[data-preview-description]');
  const previewLocation = document.querySelector('[data-preview-location]');
  const previewWeekday = document.querySelector('[data-preview-weekday]');
  const previewWeekend = document.querySelector('[data-preview-weekend]');
  const previewImage = document.querySelector('[data-preview-image]');

  if (previewName) {
    previewName.textContent = fallback(fields.Nombre ?? getInputValue(form, 'nombre'), 'Servicio sin nombre');
  }
  if (previewDescription) {
    previewDescription.textContent =
      fallback(fields.Descripcion ?? getInputValue(form, 'descripcion'), 'Sumá una descripción breve para captar la atención.');
  }
  if (previewLocation) {
    previewLocation.textContent = fallback(fields.Ubicacion ?? getInputValue(form, 'ubicacion'), 'Ubicación pendiente');
  }
  if (previewWeekday) {
    previewWeekday.textContent = fallback(fields.TarifaSemana ?? getInputValue(form, 'tarifaSemana'), 'Tarifa semanal');
  }
  if (previewWeekend) {
    previewWeekend.textContent = fallback(fields.TarifaFinDeSemana ?? getInputValue(form, 'tarifaFinde'), 'Tarifa fin de semana');
  }
  if (previewImage) {
    const manualUrl = getInputValue(form, 'imagen');
    const attachmentUrl = fields?.ImagenUrl?.[0]?.url;
    previewImage.src = manualUrl || attachmentUrl || FALLBACK_IMAGE;
  }
};

const mapFormToFields = form => {
  const nombre = getInputValue(form, 'nombre');
  const resumen = getInputValue(form, 'resumen');
  const descripcion = getInputValue(form, 'descripcion');
  const ubicacion = getInputValue(form, 'ubicacion');
  const tarifaSemana = getInputValue(form, 'tarifaSemana');
  const tarifaFinde = getInputValue(form, 'tarifaFinde');
  const imagen = getInputValue(form, 'imagen');

  const fields = {};
  if (nombre) fields.Nombre = nombre;
  if (resumen) fields.Resumen = resumen;
  if (descripcion) fields.Descripcion = descripcion;
  if (ubicacion) fields.Ubicacion = ubicacion;
  if (tarifaSemana) fields.TarifaSemana = tarifaSemana;
  if (tarifaFinde) fields.TarifaFinDeSemana = tarifaFinde;
  if (imagen) {
    fields.ImagenUrl = [{ url: imagen }];
  }
  return fields;
};

const fillForm = (form, fields = {}) => {
  if (!form) {
    return;
  }
  form.elements.nombre.value = fields.Nombre || '';
  form.elements.resumen.value = fields.Resumen || '';
  form.elements.descripcion.value = fields.Descripcion || fields.DescripcionDetallada || '';
  form.elements.ubicacion.value = fields.Ubicacion || fields['Ubicación'] || '';
  form.elements.tarifaSemana.value = fields.TarifaSemana || fields.PrecioLunesJueves || '';
  form.elements.tarifaFinde.value = fields.TarifaFinDeSemana || fields.PrecioFinDeSemana || '';

  const imageAttachment = fields.ImagenUrl?.[0]?.url || '';
  form.elements.imagen.value = imageAttachment;
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('experience-form');
  const statusElement = document.querySelector('[data-editor-status]');

  if (!form) {
    return;
  }

  const loadRecord = () => {
    setStatus(statusElement, 'Cargando datos de Airtable...');
    return fetch(`${API_BASE_URL}/${RECORD_ID}`, {
      headers: {
        Authorization: AUTH_HEADER
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudo obtener el registro solicitado.');
        }
        return response.json();
      })
      .then(record => {
        const fields = record?.fields || {};
        fillForm(form, fields);
        updatePreview(form, fields);
        setStatus(statusElement, 'Datos sincronizados con Airtable.');
      })
      .catch(error => {
        console.error(error);
        setStatus(statusElement, 'Error al recuperar la información. Intentá nuevamente.', true);
      });
  };

  form.addEventListener('input', () => {
    updatePreview(form);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const fields = mapFormToFields(form);
    if (Object.keys(fields).length === 0) {
      setStatus(statusElement, 'No hay información para guardar.', true);
      return;
    }

    setStatus(statusElement, 'Guardando cambios...');

    fetch(API_BASE_URL, {
      method: 'PATCH',
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [
          {
            id: RECORD_ID,
            fields
          }
        ]
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('La API rechazó la actualización.');
        }
        return response.json();
      })
      .then(apiResponse => {
        const updatedFields = apiResponse?.records?.[0]?.fields || fields;
        fillForm(form, updatedFields);
        updatePreview(form, updatedFields);
        setStatus(statusElement, 'Cambios guardados correctamente.');
      })
      .catch(error => {
        console.error(error);
        setStatus(statusElement, 'No se pudo guardar. Revisá los datos e intentá nuevamente.', true);
      });
  });

  loadRecord();
});
