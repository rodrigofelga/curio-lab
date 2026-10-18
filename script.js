/* CurioLab — small, dependency-free progressive enhancements. */
(() => {
  const menuButton = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-category]'));
  const featured = document.getElementById('featured-grid');
  const coming = document.getElementById('coming-section');
  const search = document.getElementById('experience-search');
  const status = document.getElementById('search-status');
  const empty = document.getElementById('empty-state');
  let activeFilter = 'all';

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNav.hidden = true;
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !open;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const updateCards = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let shown = 0;
    let featuredShown = 0;
    let comingShown = 0;
    for (const card of cards) {
      const category = card.dataset.category;
      const matchesFilter = activeFilter === 'all' || category === activeFilter;
      const matchesSearch = !query || `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase().includes(query);
      const visible = matchesFilter && matchesSearch;
      card.hidden = !visible;
      if (visible) {
        shown++;
        if (category === 'coming-soon') comingShown++;
        else featuredShown++;
      }
    }
    featured.hidden = featuredShown === 0;
    coming.hidden = comingShown === 0;
    empty.hidden = shown !== 0;
    status.textContent = `${shown} ${shown === 1 ? 'subject' : 'subjects'} shown.`;
  };
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
    updateCards();
  }));
  search.addEventListener('input', updateCards);
  document.getElementById('clear-filters').addEventListener('click', () => {
    search.value = '';
    filterButtons[0].click();
    search.focus();
  });
  document.getElementById('year').textContent = new Date().getFullYear();
  updateCards();
})();
