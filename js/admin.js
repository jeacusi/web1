const API_URL = 'https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblgNTJT4nQVw6EIx';
const AUTH_HEADER = {
  Authorization: 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0',
  'Content-Type': 'application/json'
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-servicio');
  const bodyTable = document.getElementById('servicios-body');
  const limpiarBtn = document.getElementById('btn-limpiar');

  const cargarServicios = async () => {
    const res = await fetch(API_URL, { headers: AUTH_HEADER });
    const data = await res.json();
    renderTabla(data.records);
  };

  const renderTabla = (records) => {
    bodyTable.innerHTML = '';
    records.forEach((record) => {
      const { Nombre, Descripcion, Precio } = record.fields;
      const row = document.createElement('tr');

      const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
      const isFav = favs.includes(record.id);

      row.innerHTML = `
        <td>${Nombre || '—'}</td>
        <td>${Descripcion || '—'}</td>
        <td>${Precio || '—'}</td>
        <td>
          <button class="btn btn--ghost btn-fav" data-id="${record.id}">
            ${isFav ? '💚' : '🤍'}
          </button>
        </td>
        <td>
          <button class="btn btn--secondary btn-editar" data-id="${record.id}">✏️</button>
          <button class="btn btn--ghost btn-borrar" data-id="${record.id}">🗑️</button>
        </td>
      `;
      bodyTable.appendChild(row);
    });
  };

  // Crear o actualizar un servicio
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('recordId').value.trim();
    const payload = {
      fields: {
        Nombre: document.getElementById('nombre').value,
        Descripcion: document.getElementById('descripcion').value,
        Precio: Number(document.getElementById('precio').value) || 0
      }
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: AUTH_HEADER,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(id ? 'Servicio actualizado ✅' : 'Servicio agregado ✅');
      form.reset();
      document.getElementById('recordId').value = '';
      cargarServicios();
    } else {
      alert('Error al guardar el servicio ❌');
    }
  });

  // Limpiar formulario
  limpiarBtn.addEventListener('click', () => form.reset());

  // Delegar acciones de editar, borrar, favorito
  bodyTable.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;

    if (e.target.classList.contains('btn-borrar')) {
      if (confirm('¿Seguro que querés borrar este servicio?')) {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: AUTH_HEADER
        });
        if (res.ok) {
          alert('Servicio eliminado 🗑️');
          cargarServicios();
        }
      }
    }

    if (e.target.classList.contains('btn-editar')) {
      const res = await fetch(`${API_URL}/${id}`, { headers: AUTH_HEADER });
      const data = await res.json();
      const fields = data.fields;

      document.getElementById('recordId').value = id;
      document.getElementById('nombre').value = fields.Nombre || '';
      document.getElementById('descripcion').value = fields.Descripcion || '';
      document.getElementById('precio').value = fields.Precio || '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (e.target.classList.contains('btn-fav')) {
      let favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
      if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
      } else {
        favs.push(id);
      }
      localStorage.setItem('favoritos', JSON.stringify(favs));
      cargarServicios(); // refresca corazones
    }
  });

  cargarServicios();
});