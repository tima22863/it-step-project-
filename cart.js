(() => {
  const storageKey = 'chitkvest-cart';
  const gameClasses = {
    Valorant: 'valorant',
    CS2: 'cs2',
    'Dota 2': 'dota-2',
    'Apex Legends': 'apex-legends',
    'GTA V': 'gta-v',
    Warzone: 'warzone',
    Minecraft: 'minecraft',
  };

  function load() {
    try {
      const entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(entries)) {
        return [];
      }

      return entries.filter((entry) =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.game === 'string' &&
        Number.isFinite(entry.price)
      );
    } catch {
      return [];
    }
  }

  function save(entries) {
    localStorage.setItem(storageKey, JSON.stringify(entries));
    window.dispatchEvent(new Event('chitkvest-cart-updated'));
  }

  function gameClass(game) {
    return gameClasses[game] || 'other';
  }

  window.ChitKvestCart = { load, save, gameClass };
})();
