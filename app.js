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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointerFine = window.matchMedia('(pointer: fine)').matches;
  const desktopViewport = window.matchMedia('(min-width: 1024px)').matches;

  if (!reducedMotion && pointerFine && desktopViewport) {
    cards.forEach((card) => {
      let rafId = 0;
      let nextTilt = null;

      const renderTilt = () => {
        rafId = 0;
        if (!nextTilt) return;

        card.style.setProperty('--tilt-x', nextTilt.tiltX);
        card.style.setProperty('--tilt-y', nextTilt.tiltY);
        card.style.setProperty('--spot-x', nextTilt.spotX);
        card.style.setProperty('--spot-y', nextTilt.spotY);
      };

      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const tiltX = (0.5 - y) * 5;
        const tiltY = (x - 0.5) * 6;

        nextTilt = {
          tiltX: `${tiltX.toFixed(2)}deg`,
          tiltY: `${tiltY.toFixed(2)}deg`,
          spotX: `${(x * 100).toFixed(2)}%`,
          spotY: `${(y * 100).toFixed(2)}%`
        };

        if (!rafId) {
          rafId = requestAnimationFrame(renderTilt);
        }
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        nextTilt = null;
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--spot-x', '50%');
        card.style.setProperty('--spot-y', '50%');
      });
    });
  }

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

  const loadGameArt = async () => {
    if (!gameArtPanels.length) return;

    const fetchWikipediaThumbnail = async (title) => {
      const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('thumbnail request failed');
      const payload = await response.json();
      return payload.thumbnail?.source || '';
    };

    const createFallbackCard = (title) => {
      const item = document.createElement('article');
      item.className = 'game-art-card is-fallback';
      item.innerHTML = `<div class="game-art-fallback">No cover</div><p>${title}</p>`;
      return item;
    };

    await Promise.all(
      gameArtPanels.map(async (panel) => {
        const games = (panel.dataset.games || '')
          .split('|')
          .map((name) => name.trim())
          .filter(Boolean);

        if (!games.length) return;

        panel.innerHTML = '';

        for (const title of games) {
          try {
            const thumbnail = await fetchWikipediaThumbnail(title);
            if (!thumbnail) {
              panel.appendChild(createFallbackCard(title));
              continue;
            }

            const item = document.createElement('article');
            item.className = 'game-art-card';
            item.innerHTML = `<img src="${thumbnail}" alt="${title} cover art" loading="lazy"><p>${title}</p>`;
            panel.appendChild(item);
          } catch (_error) {
            panel.appendChild(createFallbackCard(title));
          }
        }
      })
    );
  };

  applyFilters();
  loadGameArt();

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
      node.style.transitionDelay = `${Math.min(index * 70, 320)}ms`;
      revealObserver.observe(node);
    });
  } else {
    revealNodes.forEach((node) => node.classList.add('in-view'));
  }
});
