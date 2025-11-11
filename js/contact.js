const CONTACT_API_URL = 'https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblySLyneSjYlUZhL';
const AIRTABLE_TOKEN = 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  let statusMessage = document.querySelector('[data-form-status]');

  if (!statusMessage) {
    statusMessage = document.createElement('p');
    statusMessage.className = 'form-status';
    statusMessage.dataset.formStatus = '';
    statusMessage.setAttribute('aria-live', 'polite');
    form.insertAdjacentElement('afterend', statusMessage);
  }

  const setStatus = (type, message) => {
    statusMessage.textContent = message;
    statusMessage.classList.remove(
      'form-status--info',
      'form-status--success',
      'form-status--error',
      'is-visible'
    );

    if (type) {
      statusMessage.classList.add(`form-status--${type}`);
    }

    statusMessage.classList.add('is-visible');
  };

  const formatNumberValue = value => {
    const cleaned = String(value || '')
      .trim()
      .replace(/[^0-9]/g, '');
    return cleaned ? Number(cleaned) : undefined;
  };

  const getPayload = formData => {
    const nombre = formData.get('nombre')?.trim();
    const apellido = formData.get('apellido')?.trim();
    const dni = formatNumberValue(formData.get('dni'));
    const telefono = formData.get('telefono')?.trim();
    const correo = formData.get('email')?.trim();
    const direccion = formData.get('direccion')?.trim();
    const fechaReserva = formData.get('fecha');
    const cantidadPersonas = formatNumberValue(formData.get('personas'));

    return {
      records: [
        {
          fields: {
            ...(nombre ? { Nombre: nombre } : {}),
            ...(apellido ? { Apellido: apellido } : {}),
            ...(dni !== undefined ? { Dni: dni } : {}),
            ...(telefono ? { Telefono: telefono } : {}),
            ...(correo ? { Correo: correo } : {}),
            ...(direccion ? { Direccion: direccion } : {}),
            ...(fechaReserva ? { FechaReserva: fechaReserva } : {}),
            ...(cantidadPersonas !== undefined
              ? { CantidadPersonas: cantidadPersonas }
              : {}),
          },
        },
      ],
    };
  };

  const submitButton = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = getPayload(formData);

    submitButton?.setAttribute('disabled', 'true');
    setStatus('info', 'Enviando tu reserva...');

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: {
          Authorization: AIRTABLE_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('La solicitud no fue exitosa.');
      }

      setStatus('success', '¡Tu reserva se envió con éxito! Te contactaremos a la brevedad.');
      form.reset();
    } catch (error) {
      console.error(error);
      setStatus(
        'error',
        'Ocurrió un problema al enviar tu reserva. Intentá nuevamente más tarde.'
      );
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });
});
