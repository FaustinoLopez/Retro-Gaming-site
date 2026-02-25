document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const search = document.getElementById('search');
  const grid = document.getElementById('gameGrid');
  const themeToggle = document.getElementById('themeToggle');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  const setActiveNav = (id) => {
    if (!id) return;
    navLinks.forEach((link) => {
      const target = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('active', target === id);
    });
  };

  if (navLinks.length) {
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const target = link.getAttribute('href')?.replace('#', '');
        setActiveNav(target);
      });
    });

    const sections = ['vault', 'eras']
      .map((id) => document.getElementById(id))
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
        { rootMargin: '-35% 0px -55% 0px', threshold: 0.1 }
      );

      sections.forEach((section) => navObserver.observe(section));
    }
  }

  if (grid && search) {
    const cards = Array.from(grid.querySelectorAll('.card'));
    search.addEventListener('input', (event) => {
      const query = (event.target.value || '').trim().toLowerCase();
      cards.forEach((card) => {
        const title = (card.dataset.title || '').toLowerCase();
        card.hidden = !title.includes(query);
      });
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const enabled = body.classList.toggle('mode-shift');
      themeToggle.setAttribute('aria-pressed', String(enabled));
      themeToggle.textContent = enabled ? 'Shift Active' : 'Activate Shift';
    });
  }

  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    reveals.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;
      observer.observe(node);
    });
  } else {
    reveals.forEach((node) => node.classList.add('in-view'));
  }
});
