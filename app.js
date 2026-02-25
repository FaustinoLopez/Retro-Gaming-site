document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const search = document.getElementById('search');
  const grid = document.getElementById('gameGrid');
  const themeToggle = document.getElementById('themeToggle');

  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.card'));
  const reveals = Array.from(document.querySelectorAll('[data-reveal]'));

  if (search) {
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
