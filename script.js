const gameData = {
  Valorant: [
    {
      id: 'valorant-esp-1',
      name: 'Precision X',
      game: 'Valorant',
      categories: ['ESP', 'Radar'],
      description: '2D-радар і контури супротивників (Glow ESP) із відображенням дистанції та здоров’я.',
      price: 189,
      tags: ['Мінімальний слід', 'Оновлення 1 раз/міс.'],
    },
    {
      id: 'valorant-aim-1',
      name: 'AimSense Pro',
      game: 'Valorant',
      categories: ['Aimbot', 'No Recoil'],
      description: 'Плавне доведення прицілу (Smooth Aim) із вибором зони влучання та компенсацією віддачі.',
      price: 259,
      tags: ['Розширені налаштування', 'Сумісний з Windows'],
    },
    {
      id: 'valorant-wall-1',
      name: 'Ghost Vision',
      game: 'Valorant',
      categories: ['Wallhack', 'ESP'],
      description: 'Підсвічування моделей ворогів крізь стіни з налаштуванням кольорів і радіуса видимості.',
      price: 219,
      tags: ['Підтримка 60 FPS', 'Легкий в налаштуванні'],
    },
    {
      id: 'valorant-trigger-1',
      name: 'Reflex Core',
      game: 'Valorant',
      categories: ['TriggerBot'],
      description: 'Автопостріл при перетині прицілу з ціллю. Налаштування затримки в мілісекундах.',
      price: 169,
      tags: ['Гнучка затримка', 'Просте налаштування'],
    },
    {
      id: 'valorant-skin-1',
      name: 'Style Shift',
      game: 'Valorant',
      categories: ['Skin Changer'],
      description: 'Локальна зміна скінів зброї, ножів та анімацій огляду без зміни файлів гри.',
      price: 129,
      tags: ['Колекція стилів', 'Швидкий вибір'],
    },
    {
      id: 'valorant-phantom-protocol',
      name: 'Phantom Protocol',
      game: 'Valorant',
      categories: ['ESP', 'Radar'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 199,
      tags: ['Уявний приклад', 'Не завантажується'],
    },
    {
      id: 'valorant-range-echo',
      name: 'Range Echo',
      game: 'Valorant',
      categories: ['Aimbot', 'TriggerBot'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 159,
      tags: ['Уявний приклад', 'Не працює'],
    },
  ],
  CS2: [
    {
      id: 'cs2-radar-1',
      name: 'CounterScan',
      game: 'CS2',
      categories: ['Radar', 'ESP'],
      description: 'Показ ворогів на міні-мапі та 2D-радарі поза прямою лінією видимості.',
      price: 179,
      tags: ['Підтримка 2D radar', 'Швидкий старт'],
    },
    {
      id: 'cs2-trigger-1',
      name: 'QuickFire',
      game: 'CS2',
      categories: ['TriggerBot', 'Aimbot'],
      description: 'Снайперський тригербот із налаштуванням зони хітбокса (голова/тіло) та реакції.',
      price: 299,
      tags: ['Рівень точності High', 'Авто-перевірка'],
    },
    {
      id: 'cs2-wall-1',
      name: 'SmokeSignal',
      game: 'CS2',
      categories: ['Wallhack'],
      description: 'Chams-підсвічування моделей крізь дим і флеш-ефекти з вибором кольорової палітри.',
      price: 229,
      tags: ['Налаштування кольорів', 'Профілі мап'],
    },
    {
      id: 'cs2-recoil-1',
      name: 'SteadyHands',
      game: 'CS2',
      categories: ['No Recoil'],
      description: 'Компенсація патерну віддачі (RCS) для AK-47, M4A1-S та пістолетів-кулеметів.',
      price: 199,
      tags: ['Профілі зброї', 'Легкий інтерфейс'],
    },
    {
      id: 'cs2-mirage-console',
      name: 'Mirage Console',
      game: 'CS2',
      categories: ['ESP', 'Radar'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 179,
      tags: ['Уявний приклад', 'Не завантажується'],
    },
    {
      id: 'cs2-spray-myth',
      name: 'Spray Myth',
      game: 'CS2',
      categories: ['No Recoil', 'Aimbot'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 219,
      tags: ['Уявний приклад', 'Не працює'],
    },
  ],
  'Dota 2': [
    {
      id: 'dota-esp-1',
      name: 'LaneWatch',
      game: 'Dota 2',
      categories: ['ESP', 'Radar'],
      description: 'Таймери вардів, радіус веж та показ прихованих супротивників у тумані війни.',
      price: 149,
      tags: ['Мапа 360°', 'Підходить для новачків'],
    },
    {
      id: 'dota-loot-1',
      name: 'Map Insight',
      game: 'Dota 2',
      categories: ['Loot ESP', 'Radar'],
      description: 'Сповіщення про появу рун, кулдауни ворожих здібностей та статус телепортів.',
      price: 210,
      tags: ['Зручний інтерфейс', 'Оцінка мапи'],
    },
    {
      id: 'dota-skin-1',
      name: 'Arcana Preview',
      game: 'Dota 2',
      categories: ['Skin Changer'],
      description: 'Локальне увімкнення аркан, предметів безсмертя (Immortal) та погодних ефектів.',
      price: 139,
      tags: ['Стилі героїв', 'Швидкий вибір'],
    },
    {
      id: 'dota-rune-oracle',
      name: 'Rune Oracle',
      game: 'Dota 2',
      categories: ['ESP', 'Radar'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 149,
      tags: ['Уявний приклад', 'Не завантажується'],
    },
    {
      id: 'dota-draft-echo',
      name: 'Draft Echo',
      game: 'Dota 2',
      categories: ['Loot ESP', 'Skin Changer'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 169,
      tags: ['Уявний приклад', 'Не працює'],
    },
  ],
  'Apex Legends': [
    {
      id: 'apex-aim-1',
      name: 'TargetLock',
      game: 'Apex Legends',
      categories: ['Aimbot', 'TriggerBot'],
      description: 'Предиктивний аімбот із врахуванням балістики куль та швидкості переміщення цілі.',
      price: 239,
      tags: ['Стабільна реакція', 'Гарячі клавіші'],
    },
    {
      id: 'apex-esp-1',
      name: 'RingScope',
      game: 'Apex Legends',
      categories: ['ESP', 'Radar'],
      description: 'Box ESP: відображення броні, активної зброї та дистанції до ворожого скваду.',
      price: 209,
      tags: ['Огляд мапи', 'Гнучкі параметри'],
    },
    {
      id: 'apex-drop-phantom',
      name: 'Drop Phantom',
      game: 'Apex Legends',
      categories: ['ESP', 'Radar'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 189,
      tags: ['Уявний приклад', 'Не завантажується'],
    },
    {
      id: 'apex-ring-mirage',
      name: 'Ring Mirage',
      game: 'Apex Legends',
      categories: ['Aimbot', 'TriggerBot'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 199,
      tags: ['Уявний приклад', 'Не працює'],
    },
  ],
  'GTA V': [
    {
      id: 'gta-esp-1',
      name: 'CityView X',
      game: 'GTA V',
      categories: ['ESP', 'Radar'],
      description: 'ESP-маркери гравців, транспорту, предметів та поліцейських гелікоптерів.',
      price: 199,
      tags: ['Налаштування під стиль гри', 'Легкий старт'],
    },
    {
      id: 'gta-skin-1',
      name: 'StreetStyle',
      game: 'GTA V',
      categories: ['Skin Changer'],
      description: 'Зміна одягу персонажа, анімацій та швидкий спавн кастомного транспорту.',
      price: 119,
      tags: ['Колекція образів', 'Швидке перемикання'],
    },
    {
      id: 'gta-sunset-stories',
      name: 'Sunset Stories',
      game: 'GTA V',
      categories: ['ESP', 'Radar'],
      description: 'Вигадана ідея модифікації для одиночного режиму; реального файлу немає.',
      price: 129,
      tags: ['Уявний приклад', 'Лише макет'],
    },
    {
      id: 'gta-neon-garage',
      name: 'Neon Garage',
      game: 'GTA V',
      categories: ['Skin Changer'],
      description: 'Вигадана ідея косметичного доповнення для одиночного режиму; не завантажується.',
      price: 149,
      tags: ['Уявний приклад', 'Лише макет'],
    },
  ],
  Warzone: [
    {
      id: 'warzone-aim-1',
      name: 'DropSight',
      game: 'Warzone',
      categories: ['Aimbot', 'No Recoil'],
      description: 'Аімбот із розрахунком випередження для снайперських гвинтівок та контроль спрею.',
      price: 279,
      tags: ['Підтримка трекінгу', 'Режим FPS'],
    },
    {
      id: 'warzone-wall-1',
      name: 'Tactical Vision',
      game: 'Warzone',
      categories: ['Wallhack', 'ESP'],
      description: 'Контури гравців крізь будівлі з маркерами дистанції та рівня захисних пластин.',
      price: 239,
      tags: ['Стратегічний режим', 'Повний огляд'],
    },
    {
      id: 'warzone-radar-1',
      name: 'ZoneTracker',
      game: 'Warzone',
      categories: ['Radar'],
      description: 'Радарна сітка з відображенням напрямку звуків пострілів та дропів спорядження.',
      price: 189,
      tags: ['Огляд зони', 'Налаштування мапи'],
    },
    {
      id: 'warzone-supply-mirage',
      name: 'Supply Mirage',
      game: 'Warzone',
      categories: ['ESP', 'Radar'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 179,
      tags: ['Уявний приклад', 'Не завантажується'],
    },
    {
      id: 'warzone-ghost-loadout',
      name: 'Ghost Loadout',
      game: 'Warzone',
      categories: ['Aimbot', 'No Recoil'],
      description: 'Демонстраційна картка для перевірки фільтрів макета.',
      price: 229,
      tags: ['Уявний приклад', 'Не працює'],
    },
  ],
  Minecraft: [
    {
      id: 'minecraft-sodium',
      name: 'Sodium',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/sodium',
      categories: ['Продуктивність'],
      description: 'Мод оптимізації рендерингу, що може помітно підвищити FPS. Потрібен сумісний завантажувач модів.',
      price: 0,
      suggestedPrice: 49,
      tags: ['Оптимізація графіки', 'Fabric / NeoForge'],
    },
    {
      id: 'minecraft-lithium',
      name: 'Lithium',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/lithium',
      categories: ['Продуктивність'],
      description: 'Оптимізує багато ігрових обчислень у світі без зміни базових механік.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Оптимізація логіки', 'Fabric'],
    },
    {
      id: 'minecraft-ferritecore',
      name: 'FerriteCore',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/ferrite-core',
      categories: ['Продуктивність'],
      description: 'Зменшує використання оперативної пам’яті, особливо у збірках із багатьма модами.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Економія пам’яті', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-entityculling',
      name: 'Entity Culling',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/entityculling',
      categories: ['Продуктивність'],
      description: 'Не рендерить невидимих за перешкодами сутностей, щоб зменшити зайве навантаження.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Оптимізація рендерингу', 'Клієнтський мод'],
    },
    {
      id: 'minecraft-jei',
      name: 'Just Enough Items (JEI)',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/jei',
      categories: ['Рецепти'],
      description: 'Дозволяє шукати предмети та переглядати рецепти крафту й використання.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Пошук предметів', 'Forge / NeoForge'],
    },
    {
      id: 'minecraft-rei',
      name: 'Roughly Enough Items (REI)',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/rei',
      categories: ['Рецепти'],
      description: 'Зручний перегляд рецептів і предметів, популярний у збірках на Fabric.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Перегляд рецептів', 'Fabric / NeoForge'],
    },
    {
      id: 'minecraft-jade',
      name: 'Jade',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/jade',
      categories: ['Інтерфейс'],
      description: 'Показує корисну довідку про блок або сутність, на яку наведено приціл.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Підказки в грі', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-appleskin',
      name: 'AppleSkin',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/appleskin',
      categories: ['Інтерфейс'],
      description: 'Додає зрозумілі індикатори насичення та відновлення голоду від їжі.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Інформація про їжу', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-xaeros-minimap',
      name: "Xaero's Minimap",
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/xaeros-minimap',
      categories: ['Мапа'],
      description: 'Додає міні-мапу та маркери власних точок, щоб легше орієнтуватися у світі.',
      price: 0,
      suggestedPrice: 49,
      tags: ['Міні-мапа', 'Fabric / Forge'],
    },
    {
      id: 'minecraft-xaeros-worldmap',
      name: "Xaero's World Map",
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/xaeros-world-map',
      categories: ['Мапа'],
      description: 'Відображає досліджені місця на повноекранній мапі та підтримує власні маркери.',
      price: 0,
      suggestedPrice: 49,
      tags: ['Мапа світу', 'Fabric / Forge'],
    },
    {
      id: 'minecraft-mousetweaks',
      name: 'Mouse Tweaks',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/mouse-tweaks',
      categories: ['Інвентар'],
      description: 'Робить переміщення предметів у контейнерах швидшим і зручнішим за допомогою миші.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Зручність інвентарю', 'Fabric / Forge'],
    },
    {
      id: 'minecraft-controlling',
      name: 'Controlling',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/controlling',
      categories: ['Інтерфейс'],
      description: 'Додає пошук за назвою та клавішею у меню керування, щоб швидше знаходити прив’язки.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Пошук клавіш', 'Forge / NeoForge'],
    },
    {
      id: 'minecraft-iris',
      name: 'Iris Shaders',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/iris',
      categories: ['Шейдери'],
      description: 'Додає підтримку шейдерів і працює разом із Sodium для налаштування графіки.',
      price: 0,
      suggestedPrice: 49,
      tags: ['Графіка', 'Fabric / NeoForge'],
    },
    {
      id: 'minecraft-modmenu',
      name: 'Mod Menu',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/modmenu',
      categories: ['Інтерфейс'],
      description: 'Показує встановлені моди в окремому меню та допомагає знаходити їхні налаштування.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Список модів', 'Fabric'],
    },
    {
      id: 'minecraft-betterf3',
      name: 'BetterF3',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/betterf3',
      categories: ['Інтерфейс'],
      description: 'Дозволяє налаштовувати інформаційний екран F3 і залишати на ньому потрібні дані.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Налаштовуваний F3', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-shulkerboxtooltip',
      name: 'ShulkerBoxTooltip',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/shulkerboxtooltip',
      categories: ['Інвентар'],
      description: 'Показує вміст шалкер-боксу у підказці, не відкриваючи його.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Зручність інвентарю', 'Fabric / Forge'],
    },
    {
      id: 'minecraft-natures-compass',
      name: "Nature's Compass",
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/natures-compass',
      categories: ['Дослідження'],
      description: 'Допомагає знаходити біоми за допомогою компаса та його пошукового інтерфейсу.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Пошук біомів', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-waystones',
      name: 'Waystones',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/waystones',
      categories: ['Дослідження'],
      description: 'Додає ігрові камені-шляхи для подорожей між відкритими локаціями.',
      price: 0,
      suggestedPrice: 49,
      tags: ['Подорожі', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-clumps',
      name: 'Clumps',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/clumps',
      categories: ['Продуктивність'],
      description: 'Об’єднує сфери досвіду поруч, щоб зменшити зайве навантаження.',
      price: 0,
      suggestedPrice: 29,
      tags: ['Оптимізація досвіду', 'Fabric / Forge / NeoForge'],
    },
    {
      id: 'minecraft-fallingtree',
      name: 'FallingTree',
      game: 'Minecraft',
      url: 'https://modrinth.com/mod/fallingtree',
      categories: ['Зручність'],
      description: 'Додає налаштовуване швидке зрубування дерева під час гри.',
      price: 0,
      suggestedPrice: 39,
      tags: ['Зручність', 'Fabric / Forge / NeoForge'],
    },
  ],
};

Object.entries(gameData).forEach(([game, items]) => {
  if (game === 'Minecraft') {
    return;
  }

  items.forEach((item) => {
    item.demoOnly = true;
    if (!item.description.startsWith('Вигадана')) {
      item.description = `Вигаданий приклад для макета. Реального продукту немає; ${item.description}`;
    }
  });
});

const defaultCategories = [
  'ESP',
  'Aimbot',
  'Wallhack',
  'Radar',
  'TriggerBot',
  'Loot ESP',
  'Skin Changer',
  'No Recoil',
];
const categoriesByGame = {
  Minecraft: [
    'Продуктивність',
    'Рецепти',
    'Інтерфейс',
    'Мапа',
    'Інвентар',
    'Шейдери',
    'Дослідження',
    'Зручність',
  ],
};

const storageKey = 'chitkvest-library';
const searchStorageKey = 'chitkvest-searches';

const form = document.getElementById('searchForm');
const gameSelect = document.getElementById('gameSelect');
const categoryChips = document.getElementById('categoryChips');
const resultsList = document.getElementById('resultsList');
const libraryList = document.getElementById('libraryList');
const resultsCount = document.getElementById('resultsCount');
const savedSearchCount = document.getElementById('savedSearchCount');
const activeVariantCount = document.getElementById('activeVariantCount');
const playerCount = document.getElementById('playerCount');
const libraryCount = document.getElementById('libraryCount');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const catalogSearchInput = document.getElementById('catalogSearchInput');
const template = document.getElementById('resultCardTemplate');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const clearCartButton = document.getElementById('clearCartBtn');
const premiumGoogleSearchForm = document.getElementById('premiumGoogleSearchForm');
const premiumSearchLocked = document.getElementById('premiumSearchLocked');
const premiumSearchAccountButton = document.getElementById('premiumSearchAccountButton');
const premiumSearchResult = document.getElementById('premiumSearchResult');
const premiumSearchStatus = document.getElementById('premiumSearchStatus');

let selectedCategories = ['ESP'];
let library = loadLibrary();
let savedSearches = loadSavedSearches();
activeVariantCount.textContent = String(Object.values(gameData).flat().length);

function updatePlayerCount() {
  const players = Math.floor(1200 + Math.random() * 3600);
  playerCount.textContent = new Intl.NumberFormat('uk-UA', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(players);
}

updatePlayerCount();
window.setInterval(updatePlayerCount, 10000);

function loadLibrary() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLibrary() {
  localStorage.setItem(storageKey, JSON.stringify(library));
  updateLibraryUI();
}

function loadSavedSearches() {
  try {
    const raw = localStorage.getItem(searchStorageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSearches() {
  localStorage.setItem(searchStorageKey, JSON.stringify(savedSearches));
  savedSearchCount.textContent = String(savedSearches.length);
}

function updateLibraryUI() {
  libraryCount.textContent = String(library.length);
  const libraryCountNav = document.getElementById('libraryCountNav');
  if (libraryCountNav) libraryCountNav.textContent = String(library.length);

  if (!library.length) {
    libraryList.innerHTML = '<div class="empty-state">Тут поки пусто. Збережіть варіант, щоб додати його в бібліотеку.</div>';
    return;
  }

  libraryList.innerHTML = library
    .map(
      (entry) => {
        const catalogEntry = Object.values(gameData)
          .flat()
          .find((item) => item.id === entry.id);
        const price = catalogEntry?.demoOnly
          ? 'Демо · не продається'
          : catalogEntry?.suggestedPrice
          ? `Ідея: ${catalogEntry.suggestedPrice}₴`
          : entry.price === 0
            ? 'Безкоштовно'
            : `${entry.price}₴`;
        return `
        <div class="library-card">
          <div class="library-card-info">
            <strong>${entry.name}</strong>
            <span>${entry.game} • ${entry.categories.join(', ')}</span>
          </div>
          <strong>${price}</strong>
        </div>
      `;
      }
    )
    .join('');
}

function renderResults(items) {
  resultsList.innerHTML = '';
  resultsCount.textContent = `${items.length} варіантів`;

  if (!items.length) {
    resultsList.innerHTML = '<div class="empty-state">Нічого не знайдено. Спробуйте змінити категорії або гру.</div>';
    return;
  }

  items.forEach((item) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.result-card');
    const isSaved = library.some((entry) => entry.id === item.id);
    const gameClass = window.ChitKvestCart ? window.ChitKvestCart.gameClass(item.game) : 'other';
    card.classList.add('card-game--' + gameClass);
    card.setAttribute('data-game', item.game);
    const statusPill = clone.querySelector('.card-status-pill');
    if (statusPill) {
      if (item.demoOnly) {
        statusPill.textContent = 'ДЕМО';
        statusPill.className = 'card-status-pill status-demo';
      } else if (item.game === 'Minecraft') {
        statusPill.textContent = 'MODRINTH';
        statusPill.className = 'card-status-pill status-mod';
      } else {
        statusPill.textContent = 'UNDETECTED';
        statusPill.className = 'card-status-pill status-undetected';
      }
    }

    clone.querySelector('.card-game').textContent = item.game;
    clone.querySelector('.card-title').textContent = item.name;
    clone.querySelector('.card-description').textContent = item.description;
    clone.querySelector('.price-block span').textContent = item.demoOnly
      ? 'Вигадана ціна · демо'
      : item.suggestedPrice
      ? 'Ідея ціни (демо)'
      : 'Ціна';
    clone.querySelector('.card-price').textContent = item.demoOnly
      ? 'Не продається'
      : item.suggestedPrice
      ? `${item.suggestedPrice}₴`
      : item.price === 0
        ? 'Безкоштовно'
        : `${item.price}₴`;

    const tagsContainer = clone.querySelector('.card-tags');
    if (item.demoOnly) {
      const demoTag = document.createElement('span');
      demoTag.className = 'demo-only-tag';
      demoTag.textContent = 'Вигадано · не працює';
      tagsContainer.appendChild(demoTag);
    }
    item.categories.forEach((category) => {
      const tag = document.createElement('span');
      tag.textContent = category;
      tagsContainer.appendChild(tag);
    });

    const saveBtn = clone.querySelector('.save-btn');
    saveBtn.classList.toggle('saved', isSaved);
    saveBtn.textContent = isSaved ? '♥' : '♡';
    saveBtn.addEventListener('click', () => {
      const existingIndex = library.findIndex((entry) => entry.id === item.id);

      if (existingIndex >= 0) {
        library.splice(existingIndex, 1);
      } else {
        library.push(item);
      }

      saveLibrary();
      renderResults(getFilteredResults());
    });

    const miniBtn = clone.querySelector('.card-details-btn');
    const modLink = clone.querySelector('.mod-link');
    const addToCartButton = clone.querySelector('.card-add-to-cart');
    const cart = window.ChitKvestCart.load();
    const isInCart = cart.some((entry) => entry.id === item.id);
    addToCartButton.textContent = isInCart ? 'У кошику' : 'До кошика';
    addToCartButton.classList.toggle('is-added', isInCart);
    addToCartButton.setAttribute('aria-pressed', String(isInCart));
    addToCartButton.addEventListener('click', () => {
      const currentCart = window.ChitKvestCart.load();
      const existingIndex = currentCart.findIndex((entry) => entry.id === item.id);
      if (existingIndex >= 0) {
        currentCart.splice(existingIndex, 1);
      } else {
        currentCart.push({
          id: item.id,
          name: item.name,
          game: item.game,
          price: item.demoOnly ? 0 : item.price,
          demoOnly: Boolean(item.demoOnly),
          productId: item.game === 'Minecraft' && item.url
            ? item.url.split('/').pop()
            : null,
        });
      }

      window.ChitKvestCart.save(currentCart);
      renderResults(getFilteredResults());
    });

    if (item.url) {
      if (modLink) {
        modLink.href = item.url;
        modLink.hidden = false;
      }
      if (miniBtn) miniBtn.hidden = true;
    } else if (miniBtn) {
      miniBtn.addEventListener('click', () => {
        const price = item.demoOnly ? 'Не продається · демо' : `${item.price}₴`;
        alert(`${item.name} • ${price}\n${item.description}`);
      });
    }

    resultsList.appendChild(card);
  });
}

function renderCart() {
  const cart = window.ChitKvestCart.load();
  cartItems.replaceChildren();
  cartCount.textContent = String(cart.length);
  const navCartBadge = document.getElementById('navCartBadge');
  if (navCartBadge) {
    navCartBadge.textContent = String(cart.length);
    navCartBadge.classList.toggle('has-items', cart.length > 0);
  }
  cartTotal.textContent = '0₴';
  document.getElementById('checkoutBtn').disabled = !cart.length;

  if (!cart.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'cart-empty';
    emptyMessage.textContent = 'Кошик поки порожній. Додавайте варіанти з різних ігор.';
    cartItems.appendChild(emptyMessage);
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement('div');
    row.className = `cart-item cart-item--${window.ChitKvestCart.gameClass(item.game)}`;

    const details = document.createElement('div');
    details.className = 'cart-item-details';
    const game = document.createElement('span');
    game.className = `cart-game-tag cart-game-tag--${window.ChitKvestCart.gameClass(item.game)}`;
    game.textContent = item.game;
    const name = document.createElement('strong');
    name.textContent = item.name;
    const description = document.createElement('span');
    description.textContent = item.game === 'Minecraft'
      ? 'Безкоштовно'
      : 'Демо · не продається';
    details.append(game, name, description);

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-cart-item';
    removeButton.type = 'button';
    removeButton.textContent = 'Прибрати';
    removeButton.setAttribute('aria-label', `Прибрати ${item.name} з кошика`);
    removeButton.addEventListener('click', () => {
      window.ChitKvestCart.save(cart.filter((entry) => entry.id !== item.id));
      renderResults(getFilteredResults());
    });

    row.append(details, removeButton);
    cartItems.appendChild(row);
  });
}

clearCartButton.addEventListener('click', () => {
  window.ChitKvestCart.save([]);
  renderResults(getFilteredResults());
});

window.addEventListener('chitkvest-cart-updated', renderCart);
window.addEventListener('storage', (event) => {
  if (event.key === 'chitkvest-cart') {
    renderCart();
    renderResults(getFilteredResults());
  }
});

function renderCategoryChips() {
  const categories = categoriesByGame[gameSelect.value] || defaultCategories;
  selectedCategories = selectedCategories.filter((category) => categories.includes(category));
  if (!selectedCategories.length) {
    selectedCategories = [categories[0]];
  }

  categoryChips.innerHTML = '';
  categories.forEach((category) => {
    const button = document.createElement('button');
    button.className = 'chip';
    button.type = 'button';
    button.dataset.category = category;
    button.textContent = category;
    button.classList.toggle('active', selectedCategories.includes(category));
    button.addEventListener('click', () => updateSelectedCategories(button));
    categoryChips.appendChild(button);
  });
}

function getFilteredResults() {
  const selectedGame = gameSelect.value;
  const data = gameData[selectedGame] || [];

  if (!selectedCategories.length) {
    return data;
  }

  return data.filter((item) =>
    selectedCategories.some((category) => item.categories.includes(category))
  );
}

function updateSelectedCategories(button) {
  const category = button.dataset.category;

  if (button.classList.contains('active')) {
    selectedCategories = selectedCategories.filter((item) => item !== category);
    button.classList.remove('active');
  } else {
    selectedCategories = [...selectedCategories, category];
    button.classList.add('active');
  }

  renderResults(getFilteredResults());
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const searchData = {
    game: gameSelect.value,
    categories: [...selectedCategories],
    createdAt: new Date().toISOString(),
  };

  const exists = savedSearches.some(
    (item) =>
      item.game === searchData.game &&
      JSON.stringify(item.categories) === JSON.stringify(searchData.categories)
  );

  if (!exists) {
    savedSearches.unshift(searchData);
    saveSearches();
  }

  renderResults(getFilteredResults());
});

if (catalogSearchInput) {
  catalogSearchInput.addEventListener('input', () => {
    renderResults(getFilteredResults());
  });
}

resetFiltersBtn.addEventListener('click', () => {
  if (catalogSearchInput) catalogSearchInput.value = '';
  const categories = categoriesByGame[gameSelect.value] || defaultCategories;
  selectedCategories = [categories[0]];
  renderCategoryChips();
  renderResults(getFilteredResults());
});

gameSelect.addEventListener('change', () => {
  selectedCategories = [];
  renderCategoryChips();
  renderResults(getFilteredResults());
});

function hasPremiumSearchAccess() {
  try {
    const user = JSON.parse(localStorage.getItem('chitkvest_auth_user') || 'null');
    const subscription = user?.settings?.premiumSearchSubscription;
    if (subscription && typeof subscription === 'object') {
      if (typeof subscription.expiresAt !== 'string') return true;
      const expiresAt = Date.parse(subscription.expiresAt);
      return Number.isFinite(expiresAt) && expiresAt > Date.now();
    }
    return user?.status === 'Преміум користувач';
  } catch {
    return false;
  }
}

function renderPremiumSearchAccess() {
  const isPremium = hasPremiumSearchAccess();
  premiumSearchLocked.hidden = isPremium;
  premiumGoogleSearchForm.hidden = !isPremium;
  if (!isPremium) {
    premiumSearchResult.hidden = true;
    premiumSearchStatus.hidden = true;
  }
}

if (premiumSearchAccountButton) {
  premiumSearchAccountButton.addEventListener('click', () => {
    document.getElementById('authButton')?.click();
  });
}

if (premiumGoogleSearchForm) {
  premiumGoogleSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!hasPremiumSearchAccess()) {
      renderPremiumSearchAccess();
      return;
    }

    const query = document.getElementById('premiumSearchQuery').value.trim();
    if (!query) return;

    const game = document.getElementById('premiumSearchGame').value;
    if (!game) return;
    const searchType = document.getElementById('premiumSearchType').value;
    const searchTerms = searchType === 'mods'
      ? `${game} ${query} game mods`
      : `${game} ${query} in-game codes walkthrough tips`;
    const searchUrl = new URL('https://www.google.com/search');
    searchUrl.searchParams.set('q', searchTerms);

    premiumSearchResult.href = searchUrl.toString();
    premiumSearchResult.textContent = `Відкрити результати Google: ${searchTerms}`;
    premiumSearchResult.hidden = false;
    premiumSearchStatus.textContent = 'Посилання на пошукові результати готове.';
    premiumSearchStatus.hidden = false;
  });
}

window.addEventListener('chitkvest-auth-updated', renderPremiumSearchAccess);
window.addEventListener('storage', (event) => {
  if (event.key === 'chitkvest_auth_user') renderPremiumSearchAccess();
});
renderPremiumSearchAccess();

savedSearchCount.textContent = String(savedSearches.length);
renderCategoryChips();
updateLibraryUI();
renderCart();
renderResults(getFilteredResults());

const screens = [...document.querySelectorAll('[data-screen]')];

function showCurrentScreen(targetScreenId) {
  let screenId = targetScreenId || window.location.hash.replace(/^#/, '') || 'cabinet';
  if (screenId === 'search') screenId = 'cabinet';

  const activeScreen = screens.find((screen) => screen.id === screenId) || screens.find((s) => s.id === 'cabinet') || screens[0];

  screens.forEach((screen) => {
    const isActive = (screen === activeScreen);
    screen.hidden = !isActive;
    screen.classList.toggle('active-screen', isActive);
  });

  const navItems = document.querySelectorAll('.nav-links .nav-item, .navbar a[href^="#"]');
  navItems.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkTarget = href.replace(/^#/, '');
    const isMatch = (linkTarget === activeScreen.id) || (activeScreen.id === 'cabinet' && linkTarget === 'search');
    link.classList.toggle('is-active', isMatch);
    if (isMatch) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (activeScreen.id === 'library') {
    updateLibraryUI();
  } else if (activeScreen.id === 'cart') {
    renderCart();
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#') return;

  const targetId = href.replace(/^#/, '');
  const targetScreen = screens.find((s) => s.id === targetId || (targetId === 'search' && s.id === 'cabinet'));
  if (targetScreen) {
    event.preventDefault();
    try {
      if (window.location.hash !== href) {
        window.history.pushState(null, '', href);
      }
    } catch (_) {}
    showCurrentScreen(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

window.addEventListener('popstate', () => {
  showCurrentScreen();
});

window.addEventListener('hashchange', () => {
  showCurrentScreen();
});

showCurrentScreen();

const fastGameButtons = document.querySelectorAll('[data-game-target]');
if (fastGameButtons.length && typeof gameSelect !== 'undefined') {
  fastGameButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetGame = btn.dataset.gameTarget;
      if (targetGame && gameSelect) {
        gameSelect.value = targetGame;
        gameSelect.dispatchEvent(new Event('change'));
        fastGameButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
        window.location.hash = '#search';
      }
    });
  });

  gameSelect.addEventListener('change', () => {
    fastGameButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.gameTarget === gameSelect.value));
  });
}

// Sidebar Game list sync
const sidebarGameItems = document.querySelectorAll('#sidebarGameList [data-game]');
if (sidebarGameItems.length && typeof gameSelect !== 'undefined') {
  sidebarGameItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetGame = btn.dataset.game;
      if (targetGame && gameSelect) {
        gameSelect.value = targetGame;
        gameSelect.dispatchEvent(new Event('change'));
        sidebarGameItems.forEach((item) => item.classList.toggle('is-selected', item === btn));
      }
    });
  });

  gameSelect.addEventListener('change', () => {
    sidebarGameItems.forEach((item) => {
      item.classList.toggle('is-selected', item.dataset.game === gameSelect.value);
    });
  });
}
