document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const headerBar = document.querySelector('.site-header__bar');

  if (navToggle && headerBar) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      headerBar.classList.toggle('is-nav-open', !expanded);
    });

    const desktopMediaQuery = window.matchMedia('(min-width: 701px)');
    const handleDesktopChange = event => {
      if (event.matches) {
        headerBar.classList.remove('is-nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    };

    if (typeof desktopMediaQuery.addEventListener === 'function') {
      desktopMediaQuery.addEventListener('change', handleDesktopChange);
    } else if (typeof desktopMediaQuery.addListener === 'function') {
      desktopMediaQuery.addListener(handleDesktopChange);
    }
  }

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

        const createCard = window.ExperienceUtils?.createExperienceCard;

        records.forEach(record => {
          if (typeof createCard === 'function') {
            experiencesGrid.appendChild(createCard(record));
          }
        });

        initializeExperienceSearch(experiencesGrid);
      })
      .catch(() => {
        showError('Ocurrió un error al cargar las experiencias. Intentá nuevamente más tarde.');
      });
  }

  const initializeExperienceSearch = grid => {
    const searchInput = document.querySelector('.nav-search-input');
    if (!searchInput || !grid) {
      return;
    }

    const emptyStateId = 'experiences-empty-state';
    let emptyState = document.getElementById(emptyStateId);
    if (!emptyState) {
      emptyState = document.createElement('p');
      emptyState.id = emptyStateId;
      emptyState.className = 'experiences__status experiences__status--empty';
      emptyState.textContent = 'No encontramos experiencias que coincidan con tu búsqueda.';
      emptyState.hidden = true;
      grid.parentNode.insertBefore(emptyState, grid.nextSibling);
    }

    const filterCards = query => {
      const normalizedQuery = query.trim().toLowerCase();
      let visibleCount = 0;

      grid.querySelectorAll('.experience-card').forEach(card => {
        const body = card.querySelector('.experience-card__body');
        const headingText = body?.querySelector('h3')?.textContent || '';
        const paragraphsText = Array.from(body?.querySelectorAll('p') || [])
          .map(paragraph => paragraph.textContent)
          .join(' ');
        const searchableText = `${headingText} ${paragraphsText}`.trim().toLowerCase();
        const matches = !normalizedQuery || searchableText.includes(normalizedQuery);
        card.style.display = matches ? '' : 'none';
        if (matches) {
          visibleCount += 1;
        }
      });

      emptyState.hidden = visibleCount > 0;
    };

    searchInput.addEventListener('input', () => {
      filterCards(searchInput.value);
    });

    filterCards(searchInput.value);
  };
});
