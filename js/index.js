document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const id = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id) || document.querySelector(`[name="${id}"]`);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-auto-carousel]').forEach(carousel => {
    const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    if (slides.length === 0) {
      return;
    }

    let activeIndex = slides.findIndex(slide => slide.classList.contains('is-active'));
    if (activeIndex < 0) {
      activeIndex = 0;
      slides[0].classList.add('is-active');
    }

    const setActive = newIndex => {
      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === newIndex);
      });
      activeIndex = newIndex;
    };

    setActive(activeIndex);

    if (prefersReducedMotion || slides.length === 1) {
      return;
    }

    const rawInterval = Number(carousel.dataset.interval);
    const delay = Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : 6000;

    setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      setActive(nextIndex);
    }, delay);
  });

  const experiencesGrid = document.querySelector('[data-experiences-grid]');
  if (experiencesGrid) {
    const loadingMessage = document.createElement('p');
    loadingMessage.className = 'experiences__status';
    loadingMessage.textContent = 'Cargando experiencias...';
    experiencesGrid.appendChild(loadingMessage);

    const createCard = record => {
      const name = record?.fields?.Nombre || 'Experiencia sin nombre';
      const description = record?.fields?.Descripcion || 'Sin descripción disponible.';
      const imageUrl = record?.fields?.ImagenUrl?.[0]?.thumbnails?.large?.url;

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

      const link = document.createElement('a');
      link.className = 'btn btn--secondary';
      link.href = 'descripcion-servicio.html';
      link.textContent = 'Descripción del servicio';

      article.appendChild(figure);
      article.appendChild(body);
      article.appendChild(link);

      return article;
    };

    const showError = message => {
      experiencesGrid.innerHTML = '';
      const error = document.createElement('p');
      error.className = 'experiences__status experiences__status--error';
      error.textContent = message;
      experiencesGrid.appendChild(error);
    };

    fetch('https://api.airtable.com/v0/appFi8PlgyRQhq8ht/tblgNTJT4nQVw6EIx', {
      headers: {
        Authorization: 'Bearer patEKsY6puNkNzDpL.bcf37f2fae1f632e10b8b749019446f8bb509ae25bd85faf972d8c2f45e370d0'
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
        experiencesGrid.innerHTML = '';

        if (records.length === 0) {
          showError('No hay experiencias disponibles por el momento.');
          return;
        }

        records.forEach(record => {
          experiencesGrid.appendChild(createCard(record));
        });
      })
      .catch(() => {
        showError('Ocurrió un error al cargar las experiencias. Intentá nuevamente más tarde.');
      });
  }

  const searchInput = document.querySelector('.nav-search-input');
  if (searchInput) {
    const clearHighlights = () => {
      document.querySelectorAll('mark').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      });
    };

    const highlightMatches = query => {
      if (!query) return [];

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      const foundMarks = [];

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent;
        const regex = new RegExp(`(${query})`, 'gi');

        if (regex.test(text)) {
          const span = document.createElement('span');
          span.innerHTML = text.replace(regex, '<mark>$1</mark>');
          node.parentNode.replaceChild(span, node);
        }
      }

      document.querySelectorAll('mark').forEach(mark => foundMarks.push(mark));
      return foundMarks;
    };

    const scrollToFirst = markElements => {
      if (markElements.length > 0) {
        markElements[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      clearHighlights();

      if (query.length > 1) {
        const results = highlightMatches(query);
        scrollToFirst(results);
      }
    });
  }
});
