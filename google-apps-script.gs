// Deploy as a web app that executes as your Google account and allows access to anyone.
// Add the same long random value to Project Settings > Script properties as SHARED_TOKEN.
// Run setupEmailSpreadsheet once, authorize the requested scopes, then deploy a new web app version.
// The web app must execute as the deploying account and allow access to anyone.
// Redeploy the web app with the latest version after editing.

const PRODUCTS = {
  sodium: { name: 'Sodium', url: 'https://modrinth.com/mod/sodium' },
  lithium: { name: 'Lithium', url: 'https://modrinth.com/mod/lithium' },
  'ferrite-core': { name: 'FerriteCore', url: 'https://modrinth.com/mod/ferrite-core' },
  entityculling: { name: 'Entity Culling', url: 'https://modrinth.com/mod/entityculling' },
  jei: { name: 'Just Enough Items', url: 'https://modrinth.com/mod/jei' },
  rei: { name: 'Roughly Enough Items', url: 'https://modrinth.com/mod/rei' },
  jade: { name: 'Jade', url: 'https://modrinth.com/mod/jade' },
  appleskin: { name: 'AppleSkin', url: 'https://modrinth.com/mod/appleskin' },
  'xaeros-minimap': { name: "Xaero's Minimap", url: 'https://modrinth.com/mod/xaeros-minimap' },
  'xaeros-world-map': { name: "Xaero's World Map", url: 'https://modrinth.com/mod/xaeros-world-map' },
  'mouse-tweaks': { name: 'Mouse Tweaks', url: 'https://modrinth.com/mod/mouse-tweaks' },
  controlling: { name: 'Controlling', url: 'https://modrinth.com/mod/controlling' },
  iris: { name: 'Iris Shaders', url: 'https://modrinth.com/mod/iris' },
  modmenu: { name: 'Mod Menu', url: 'https://modrinth.com/mod/modmenu' },
  betterf3: { name: 'BetterF3', url: 'https://modrinth.com/mod/betterf3' },
  shulkerboxtooltip: { name: 'ShulkerBoxTooltip', url: 'https://modrinth.com/mod/shulkerboxtooltip' },
  'natures-compass': { name: "Nature's Compass", url: 'https://modrinth.com/mod/natures-compass' },
  waystones: { name: 'Waystones', url: 'https://modrinth.com/mod/waystones' },
  clumps: { name: 'Clumps', url: 'https://modrinth.com/mod/clumps' },
  fallingtree: { name: 'FallingTree', url: 'https://modrinth.com/mod/fallingtree' },
  'valorant-esp-1': { name: 'Precision X', game: 'Valorant', price: 189, demoOnly: true },
  'valorant-aim-1': { name: 'AimSense Pro', game: 'Valorant', price: 259, demoOnly: true },
  'valorant-wall-1': { name: 'Ghost Vision', game: 'Valorant', price: 219, demoOnly: true },
  'valorant-trigger-1': { name: 'Reflex Core', game: 'Valorant', price: 169, demoOnly: true },
  'valorant-skin-1': { name: 'Style Shift', game: 'Valorant', price: 129, demoOnly: true },
  'valorant-phantom-protocol': { name: 'Phantom Protocol', game: 'Valorant', price: 199, demoOnly: true },
  'valorant-range-echo': { name: 'Range Echo', game: 'Valorant', price: 159, demoOnly: true },
  'cs2-radar-1': { name: 'CounterScan', game: 'CS2', price: 179, demoOnly: true },
  'cs2-trigger-1': { name: 'QuickFire', game: 'CS2', price: 299, demoOnly: true },
  'cs2-wall-1': { name: 'SmokeSignal', game: 'CS2', price: 229, demoOnly: true },
  'cs2-recoil-1': { name: 'SteadyHands', game: 'CS2', price: 199, demoOnly: true },
  'cs2-mirage-console': { name: 'Mirage Console', game: 'CS2', price: 179, demoOnly: true },
  'cs2-spray-myth': { name: 'Spray Myth', game: 'CS2', price: 219, demoOnly: true },
  'dota-esp-1': { name: 'LaneWatch', game: 'Dota 2', price: 149, demoOnly: true },
  'dota-loot-1': { name: 'Map Insight', game: 'Dota 2', price: 210, demoOnly: true },
  'dota-skin-1': { name: 'Arcana Preview', game: 'Dota 2', price: 139, demoOnly: true },
  'dota-rune-oracle': { name: 'Rune Oracle', game: 'Dota 2', price: 149, demoOnly: true },
  'dota-draft-echo': { name: 'Draft Echo', game: 'Dota 2', price: 169, demoOnly: true },
  'apex-aim-1': { name: 'TargetLock', game: 'Apex Legends', price: 239, demoOnly: true },
  'apex-esp-1': { name: 'RingScope', game: 'Apex Legends', price: 209, demoOnly: true },
  'apex-drop-phantom': { name: 'Drop Phantom', game: 'Apex Legends', price: 189, demoOnly: true },
  'apex-ring-mirage': { name: 'Ring Mirage', game: 'Apex Legends', price: 199, demoOnly: true },
  'gta-esp-1': { name: 'CityView X', game: 'GTA V', price: 199, demoOnly: true },
  'gta-skin-1': { name: 'StreetStyle', game: 'GTA V', price: 119, demoOnly: true },
  'gta-sunset-stories': { name: 'Sunset Stories', game: 'GTA V', price: 129, demoOnly: true },
  'gta-neon-garage': { name: 'Neon Garage', game: 'GTA V', price: 149, demoOnly: true },
  'warzone-aim-1': { name: 'DropSight', game: 'Warzone', price: 279, demoOnly: true },
  'warzone-wall-1': { name: 'Tactical Vision', game: 'Warzone', price: 239, demoOnly: true },
  'warzone-radar-1': { name: 'ZoneTracker', game: 'Warzone', price: 189, demoOnly: true },
  'warzone-supply-mirage': { name: 'Supply Mirage', game: 'Warzone', price: 179, demoOnly: true },
  'warzone-ghost-loadout': { name: 'Ghost Loadout', game: 'Warzone', price: 229, demoOnly: true },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_SECONDS = 600;

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function authorizeEmail() {
  return MailApp.getRemainingDailyQuota();
}

function setupEmailSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('EMAIL_SPREADSHEET_ID');
  let spreadsheet;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('ЧитКвест — email-запити');
    properties.setProperty('EMAIL_SPREADSHEET_ID', spreadsheet.getId());
  }

  const sheet = spreadsheet.getSheetByName('Email requests') || spreadsheet.insertSheet('Email requests');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата', 'Електронна адреса', 'Вибрані товари']);
    SpreadsheetApp.flush();
  }

  Logger.log(`Таблиця email-запитів: ${spreadsheet.getUrl()}`);
  return spreadsheet.getUrl();
}

function saveEmailRequest(email, selectedProducts) {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheetId = properties.getProperty('EMAIL_SPREADSHEET_ID');
  let spreadsheet;

  if (spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('ЧитКвест — email-запити');
    spreadsheetId = spreadsheet.getId();
    properties.setProperty('EMAIL_SPREADSHEET_ID', spreadsheetId);
  }

  let sheet = spreadsheet.getSheetByName('Email requests');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Email requests');
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата', 'Електронна адреса', 'Вибрані товари']);
  }

  sheet.appendRow([
    new Date(),
    email,
    selectedProducts.map((product) => product.name).join(', '),
  ]);
  SpreadsheetApp.flush();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function isRateLimited(email) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    email.toLowerCase(),
  );
  const key = `email:${Utilities.base64EncodeWebSafe(digest)}`;
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const count = Number(cache.get(key) || 0);
    if (count >= MAX_EMAILS_PER_WINDOW) {
      return true;
    }

    cache.put(key, String(count + 1), RATE_LIMIT_WINDOW_SECONDS);
    return false;
  } finally {
    lock.releaseLock();
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents);
    const expectedToken = PropertiesService.getScriptProperties().getProperty('SHARED_TOKEN');
    if (!expectedToken || typeof payload.token !== 'string' || payload.token !== expectedToken) {
      return jsonResponse({ success: false, error: 'Запит не авторизовано.' });
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const productIds = payload.productIds;
    if (
      email.length > 254 ||
      !EMAIL_PATTERN.test(email) ||
      !Array.isArray(productIds) ||
      productIds.length < 1 ||
      productIds.length > Object.keys(PRODUCTS).length ||
      productIds.some((id) => typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(PRODUCTS, id))
    ) {
      return jsonResponse({ success: false, error: 'Перевір email і вибрані товари.' });
    }

    if (isRateLimited(email)) {
      return jsonResponse({ success: false, error: 'Для цієї адреси забагато запитів. Спробуй пізніше.' });
    }

    const selectedProducts = [...new Set(productIds)].map((id) => PRODUCTS[id]);

    // Storing the request is optional bookkeeping: a missing spreadsheet or scope
    // must never block the email the user asked for.
    let requestStored = true;
    try {
      saveEmailRequest(email, selectedProducts);
    } catch (error) {
      requestStored = false;
      const message = error && error.message ? error.message : String(error);
      console.warn(`Email request was not stored, sending the email anyway: ${message}`);
    }

    const htmlItems = selectedProducts
      .map((product) => (product.url
        ? `<li><a href="${product.url}">${escapeHtml(product.name)}</a> — безкоштовно</li>`
        : `<li>${escapeHtml(product.name)} (${escapeHtml(product.game || '')}) — ${product.price}₴, ` +
          'вигадана ціна; демонстраційний товар, не продається й не завантажується</li>'))
      .join('');
    const textItems = selectedProducts
      .map((product) => (product.url
        ? `${product.name}: ${product.url}`
        : `${product.name} (${product.game || ''}) — ${product.price}₴ ` +
          '(вигадана ціна, демонстраційний товар без завантаження)'))
      .join('\n');
    const footer =
      'Minecraft-моди безкоштовні; завантаження ведуть на сторінки проєктів у Modrinth. ' +
      'Демонстраційні позиції не продаються й не завантажуються.';

    MailApp.sendEmail({
      to: email,
      subject: 'Твій кошик ЧитКвест',
      body: `Привіт!\n\nОсь товари, які ти вибрав у ЧитКвест:\n${textItems}\n\n${footer}`,
      htmlBody: `<p>Привіт!</p><p>Ось товари, які ти вибрав у ЧитКвест:</p><ul>${htmlItems}</ul><p>${footer}</p>`,
      name: 'ЧитКвест',
    });

    return jsonResponse({
      success: true,
      message:
        `Лист зі списком товарів надіслано на ${email}.` +
        (requestStored ? ' Адресу збережено.' : ''),
    });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    console.error(`Download email request failed: ${message}`);
    const normalizedMessage = message.toLowerCase();
    const errorCode = /authorization|authoriz|permission|access denied|insufficient/.test(normalizedMessage)
      ? 'EMAIL_PERMISSION_REQUIRED'
      : /quota|too many times|limit exceeded/.test(normalizedMessage)
        ? 'EMAIL_QUOTA_EXCEEDED'
        : 'EMAIL_SEND_FAILED';
    return jsonResponse({
      success: false,
      errorCode,
    });
  }
}
