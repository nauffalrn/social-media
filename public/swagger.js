(() => {
  function getMoonIcon() {
    return `
      <svg fill="none" viewBox="2 2 20 20" width="16" height="16" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="currentColor"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        >
        </path>
      </svg>
    `;
  }

  function getSunIcon() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-sun"
      >
        <circle cx="12" cy="12" r="5">
        </circle>
          <line x1="12" y1="1" x2="12" y2="3">
          </line>
          <line x1="12" y1="21" x2="12" y2="23">
          </line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64">
          </line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78">
          </line>
          <line x1="1" y1="12" x2="3" y2="12">
          </line>
          <line x1="21" y1="12" x2="23" y2="12">
          </line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36">
          </line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22">
          </line>
      </svg>
    `;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // const storedTheme = localStorage.getItem('swagger-theme');
  // localStorage.removeItem('swagger-theme');
  // const theme = storedTheme || (prefersDark ? 'dark' : 'light');
  const theme = prefersDark ? 'dark' : 'light';

  document.body.classList.add(`${theme}-mode`);
  4;
  // const iconButton = document.createElement('button');
  // iconButton.innerHTML = theme === 'dark' ? getSunIcon() : getMoonIcon();
  // iconButton.className = 'theme-toggle-button';
  // iconButton.title = 'Toggle Theme';

  // Object.assign(iconButton.style, {
  //   position: 'fixed',
  //   top: '10px',
  //   right: '10px',
  //   zIndex: 9999,
  //   fontSize: '20px',
  //   background: 'transparent',
  //   border: 'var(--primary-text-color)',
  //   cursor: 'pointer',
  //   padding: '4px',
  //   width: '32px',
  //   height: '32px',
  //   color: 'var(--swagger-color)',
  // });

  // iconButton.onclick = () => {
  //   const isDark = document.body.classList.contains('dark-mode');
  //   const nextTheme = isDark ? 'light' : 'dark';

  //   document.body.classList.remove(`${isDark ? 'dark' : 'light'}-mode`);
  //   document.body.classList.add(`${nextTheme}-mode`);
  //   localStorage.setItem('swagger-theme', nextTheme);
  //   iconButton.innerHTML = nextTheme === 'dark' ? getSunIcon() : getMoonIcon();
  // };

  // document.body.appendChild(iconButton);
})();
