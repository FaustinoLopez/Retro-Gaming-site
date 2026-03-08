document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const grid = document.getElementById('gameGrid');
  const cards = grid ? Array.from(grid.querySelectorAll('.console-card')) : [];

  const search = document.getElementById('search');
  const makerFilter = document.getElementById('makerFilter');
  const formatFilter = document.getElementById('formatFilter');
  const eraFilter = document.getElementById('eraFilter');
  const sortBy = document.getElementById('sortBy');
  const resultCount = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const randomPick = document.getElementById('randomPick');
  const themeToggle = document.getElementById('themeToggle');

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  const setActiveNav = (id) => {
    if (!id) return;

    navLinks.forEach((link) => {
      const target = (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('active', target === id);
    });
  };

  if (navLinks.length) {
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const target = (link.getAttribute('href') || '').replace('#', '');
        setActiveNav(target);
      });
    });

    const sections = navLinks
      .map((link) => document.getElementById((link.getAttribute('href') || '').replace('#', '')))
      .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveNav(entry.target.id);
            }
          });
        },
        {
          rootMargin: '-35% 0px -55% 0px',
          threshold: 0.1
        }
      );

      sections.forEach((section) => navObserver.observe(section));
    }
  }

  const updateResultText = (count) => {
    if (!resultCount) return;

    const noun = count === 1 ? 'dossier' : 'dossiers';
    resultCount.textContent = `${count} console ${noun} loaded.`;
  };

  const applyFilters = () => {
    if (!grid || !cards.length) return;

    const query = (search?.value || '').trim().toLowerCase();
    const selectedMaker = makerFilter?.value || 'all';
    const selectedFormat = formatFilter?.value || 'all';
    const selectedEra = eraFilter?.value || 'all';
    const sortValue = sortBy?.value || 'year-asc';

    const filtered = cards.filter((card) => {
      const title = (card.dataset.title || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase();
      const maker = card.dataset.maker || '';
      const format = card.dataset.format || '';
      const era = card.dataset.era || '';

      const matchesQuery = !query || title.includes(query) || tags.includes(query);
      const matchesMaker = selectedMaker === 'all' || maker === selectedMaker;
      const matchesFormat = selectedFormat === 'all' || format === selectedFormat;
      const matchesEra = selectedEra === 'all' || era === selectedEra;

      return matchesQuery && matchesMaker && matchesFormat && matchesEra;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortValue === 'name-asc') {
        return (a.dataset.title || '').localeCompare(b.dataset.title || '');
      }

      const yearA = Number(a.dataset.year || '0');
      const yearB = Number(b.dataset.year || '0');

      if (sortValue === 'year-desc') {
        return yearB - yearA;
      }

      return yearA - yearB;
    });

    cards.forEach((card) => {
      card.hidden = !filtered.includes(card);
      card.classList.remove('is-spotlight');
    });

    sorted.forEach((card) => {
      grid.appendChild(card);
    });

    if (emptyState) {
      emptyState.hidden = sorted.length > 0;
    }

    updateResultText(sorted.length);
  };

  [search, makerFilter, formatFilter, eraFilter].forEach((control) => {
    if (control) {
      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    }
  });

  if (sortBy) {
    sortBy.addEventListener('change', applyFilters);
  }

  if (randomPick) {
    randomPick.addEventListener('click', () => {
      const visible = cards.filter((card) => !card.hidden);
      if (!visible.length) return;

      cards.forEach((card) => card.classList.remove('is-spotlight'));

      const selected = visible[Math.floor(Math.random() * visible.length)];
      selected.classList.add('is-spotlight');
      selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const setThemeButtonState = (enabled) => {
    if (!themeToggle) return;

    themeToggle.setAttribute('aria-pressed', String(enabled));
    themeToggle.textContent = enabled ? 'Base Mode' : 'Hyper Mode';
  };

  if (themeToggle) {
    setThemeButtonState(body.classList.contains('mode-shift'));

    themeToggle.addEventListener('click', () => {
      const enabled = body.classList.toggle('mode-shift');
      setThemeButtonState(enabled);
    });
  }

  applyFilters();

  const revealNodes = Array.from(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    revealNodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index * 70, 300)}ms`;
      revealObserver.observe(node);
    });
  } else {
    revealNodes.forEach((node) => node.classList.add('in-view'));
  }
});