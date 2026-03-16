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
  const timelineStops = Array.from(document.querySelectorAll('.timeline-stop'));
  const gameArtPanels = Array.from(document.querySelectorAll('[data-game-art]'));

  const THEME_STORAGE_KEY = 'pixelPanicTheme';

  const isTypingTarget = () => {
    const active = document.activeElement;
    const tag = active?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable;
  };

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

    const visibleCards = new Set(filtered);
    cards.forEach((card) => {
      card.hidden = !visibleCards.has(card);
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

  const triggerRandomPick = () => {
    const visible = cards.filter((card) => !card.hidden);
    if (!visible.length) return;

    cards.forEach((card) => card.classList.remove('is-spotlight'));

    const selected = visible[Math.floor(Math.random() * visible.length)];
    selected.classList.add('is-spotlight');
    selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    randomPick.addEventListener('click', triggerRandomPick);
  }

  const setThemeButtonState = (enabled) => {
    if (!themeToggle) return;

    themeToggle.setAttribute('aria-pressed', String(enabled));
    themeToggle.textContent = enabled ? 'Base Mode' : 'Hyper Mode';
  };

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'shift') {
      body.classList.add('mode-shift');
    }
  } catch (_error) {
    // Ignore storage access issues.
  }

  if (themeToggle) {
    setThemeButtonState(body.classList.contains('mode-shift'));

    themeToggle.addEventListener('click', () => {
      const enabled = body.classList.toggle('mode-shift');
      setThemeButtonState(enabled);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, enabled ? 'shift' : 'base');
      } catch (_error) {
        // Ignore storage access issues.
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (isTypingTarget()) return;

    if (event.key === '/' && search) {
      event.preventDefault();
      search.focus();
      search.select();
      return;
    }

    if ((event.key === 'r' || event.key === 'R') && randomPick) {
      event.preventDefault();
      triggerRandomPick();
    }
  });

  if (timelineStops.length && 'IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-hot', entry.isIntersecting);
        });
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: 0.2
      }
    );

    timelineStops.forEach((stop) => timelineObserver.observe(stop));
  }

  const loadGameArt = () => {
    if (!gameArtPanels.length) return;

    const cachePrefix = 'pixelPanicCover:';
    const thumbnailCache = new Map();

    const getCachedThumbnail = (title) => {
      if (thumbnailCache.has(title)) {
        return thumbnailCache.get(title);
      }

      try {
        const stored = sessionStorage.getItem(`${cachePrefix}${title}`);
        if (stored !== null) {
          thumbnailCache.set(title, stored);
          return stored;
        }
      } catch (_error) {
        // Ignore storage access issues.
      }

      return null;
    };

    const setCachedThumbnail = (title, value) => {
      thumbnailCache.set(title, value);

      try {
        sessionStorage.setItem(`${cachePrefix}${title}`, value);
      } catch (_error) {
        // Ignore storage access issues.
      }
    };

    const fetchWikipediaThumbnail = async (title) => {
      const cached = getCachedThumbnail(title);
      if (cached !== null) return cached;

      const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!response.ok) {
        setCachedThumbnail(title, '');
        return '';
      }

      const payload = await response.json();
      const thumbnail = payload.thumbnail?.source || '';
      setCachedThumbnail(title, thumbnail);
      return thumbnail;
    };

    const createFallbackCard = (title, label = 'No cover') => {
      const item = document.createElement('article');
      item.className = 'game-art-card is-fallback';
      item.innerHTML = `<div class="game-art-fallback">${label}</div><p>${title}</p>`;
      return item;
    };

    const mapWithConcurrency = async (items, limit, task) => {
      const results = new Array(items.length);
      let cursor = 0;
      const workerCount = Math.min(limit, items.length);

      const workers = Array.from({ length: workerCount }, async () => {
        while (cursor < items.length) {
          const current = cursor++;
          results[current] = await task(items[current], current);
        }
      });

      await Promise.all(workers);
      return results;
    };

    const renderGameArt = async (panel) => {
      if (panel.dataset.artLoaded === 'true') return;
      panel.dataset.artLoaded = 'true';

      const games = (panel.dataset.games || '')
        .split('|')
        .map((name) => name.trim())
        .filter(Boolean);

      if (!games.length) return;

      panel.innerHTML = '';
      const placeholders = games.map((title) => {
        const placeholder = createFallbackCard(title, 'Loading...');
        panel.appendChild(placeholder);
        return placeholder;
      });

      await mapWithConcurrency(games, 4, async (title, index) => {
        let nextCard = null;

        try {
          const thumbnail = await fetchWikipediaThumbnail(title);
          if (!thumbnail) {
            nextCard = createFallbackCard(title);
          } else {
            const item = document.createElement('article');
            item.className = 'game-art-card';
            item.innerHTML = `<img src="${thumbnail}" alt="${title} cover art" loading="lazy" decoding="async"><p>${title}</p>`;
            nextCard = item;
          }
        } catch (_error) {
          nextCard = createFallbackCard(title);
        }

        const placeholder = placeholders[index];
        if (placeholder?.isConnected && nextCard) {
          placeholder.replaceWith(nextCard);
        }
      });
    };

    if ('IntersectionObserver' in window) {
      const artObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            renderGameArt(entry.target);
          });
        },
        {
          rootMargin: '220px 0px',
          threshold: 0.01
        }
      );

      gameArtPanels.forEach((panel) => artObserver.observe(panel));
      return;
    }

    gameArtPanels.forEach((panel) => renderGameArt(panel));
  };

  applyFilters();
  loadGameArt();

  const revealNodes = Array.from(document.querySelectorAll('[data-reveal]'));
  revealNodes.forEach((node) => node.classList.add('in-view'));
});
