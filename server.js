const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const os = require('node:os');

const root = __dirname;
const port = Number(process.env.PORT || 8001);
const host = process.env.HOST || '127.0.0.1';
const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID ||
  '1055031722656-fp4lj2ua2d8i0m7pr1sque0ljc5lhq4d.apps.googleusercontent.com';
const authDataDirectory = process.env.CHITKVEST_DATA_DIR || path.join(os.homedir(), '.chitkvest');
const authUsersFile = path.join(authDataDirectory, 'users.json');
const authSessionKeyFile = path.join(authDataDirectory, 'session.key');
const googleAppsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
const googleAppsScriptToken = process.env.GOOGLE_APPS_SCRIPT_TOKEN;
const requestLimits = new Map();
const authRequestLimits = new Map();
const maxBodyBytes = 10 * 1024;
const authSessionDurationSeconds = 30 * 24 * 60 * 60;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
class AppsScriptResponseError extends Error {}
class InvalidGoogleCredentialError extends Error {}

let authSessionKey;
let googleSigningKeysCache;
let authUsersWrite = Promise.resolve();

function getAppsScriptFailureMessage(errorCode) {
  switch (errorCode) {
    case 'EMAIL_PERMISSION_REQUIRED':
      return 'Google Apps Script не має дозволу надсилати email. Запусти authorizeEmail у редакторі Apps Script і підтверди доступ.';
    case 'EMAIL_QUOTA_EXCEEDED':
      return 'Вичерпано денну квоту надсилання Google Apps Script. Спробуй пізніше.';
    case 'EMAIL_SEND_FAILED':
      return 'Apps Script не зміг надіслати лист. Перевір журнал виконань (Executions) у Google Apps Script.';
    case 'EMAIL_STORAGE_FAILED':
      return 'Google Apps Script працює зі старою версією, яка зупиняє надсилання через помилку таблиці. Онови код із google-apps-script.gs, запусти setupEmailSpreadsheet, надай дозволи й розгорни нову версію вебзастосунку.';
    default:
      return 'Google Apps Script не підтвердив надсилання. Перевір URL, токен і квоти Gmail.';
  }
}

const products = {
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
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
};
const publicFiles = new Set([
  'index.html',
  'styles.css',
  'cart.js',
  'cart-checkout.js',
  'auth.js',
  'script.js',
  'subscription-song.mp3',
]);

function getCookie(request, name) {
  const cookies = request.headers.cookie || '';
  const prefix = `${name}=`;
  const value = cookies.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(prefix));
  return value ? value.slice(prefix.length) : '';
}

function serializeSessionCookie(value, maxAge) {
  const secureEnabled = process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && !['localhost', '127.0.0.1', '::1'].includes(host));
  const secure = secureEnabled ? '; Secure' : '';
  return `chitkvest_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function getSessionToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + authSessionDurationSeconds,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', authSessionKey).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function getSessionUserId(request) {
  const token = getCookie(request, 'chitkvest_session');
  const [payload, signature, ...extra] = token.split('.');
  if (!payload || !signature || extra.length || !authSessionKey) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', authSessionKey).update(payload).digest();
  let actualSignature;
  try {
    actualSignature = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof session.userId === 'string' &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Math.floor(Date.now() / 1000)
      ? session.userId
      : null;
  } catch {
    return null;
  }
}

async function loadAuthUsers() {
  try {
    const content = await fs.promises.readFile(authUsersFile, 'utf8');
    const users = JSON.parse(content);
    if (!Array.isArray(users)) {
      throw new Error('Stored account data must be an array.');
    }
    return users;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function saveAuthUsers(users) {
  await fs.promises.mkdir(authDataDirectory, { recursive: true });
  const temporaryFile = `${authUsersFile}.${crypto.randomBytes(8).toString('hex')}.tmp`;
  try {
    await fs.promises.writeFile(temporaryFile, JSON.stringify(users, null, 2), { mode: 0o600 });
    await fs.promises.rename(temporaryFile, authUsersFile);
  } catch (error) {
    await fs.promises.rm(temporaryFile, { force: true });
    throw error;
  }
}

function upsertAuthUser(profile) {
  return queueAuthUsersWrite(async () => {
    const users = await loadAuthUsers();
    const existingIndex = users.findIndex((user) => user.id === profile.id);
    const accountCreated = existingIndex < 0;
    const now = new Date().toISOString();
    const user = {
      ...(accountCreated ? {} : users[existingIndex]),
      ...profile,
      createdAt: accountCreated ? now : users[existingIndex].createdAt,
      lastLoginAt: now,
    };
    if (accountCreated) {
      users.push(user);
    } else {
      users[existingIndex] = user;
    }
    await saveAuthUsers(users);
    return { user, accountCreated };
  });
}

function queueAuthUsersWrite(operation) {
  const result = authUsersWrite.then(operation);
  authUsersWrite = result.catch(() => {});
  return result;
}

async function initializeAuth() {
  await fs.promises.mkdir(authDataDirectory, { recursive: true });
  try {
    const handle = await fs.promises.open(authSessionKeyFile, 'wx', 0o600);
    try {
      await handle.writeFile(crypto.randomBytes(32));
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  authSessionKey = await fs.promises.readFile(authSessionKeyFile);
  if (authSessionKey.length !== 32) {
    throw new Error('The saved authentication session key has an invalid length.');
  }
}

function isAuthRateLimited(request) {
  const address = request.socket.remoteAddress || 'local';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = 20;
  const current = authRequestLimits.get(address);
  if (!current || now - current.startedAt >= windowMs) {
    authRequestLimits.set(address, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

function hasSameOrigin(request) {
  if (!request.headers.origin) {
    return true;
  }
  try {
    return new URL(request.headers.origin).host === request.headers.host;
  } catch {
    return false;
  }
}

async function getGoogleSigningKeys() {
  if (googleSigningKeysCache && googleSigningKeysCache.expiresAt > Date.now()) {
    return googleSigningKeysCache.keys;
  }

  let response;
  try {
    response = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('Could not reach Google public signing keys.');
  }
  if (!response.ok) {
    throw new Error(`Google signing keys returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.keys)) {
    throw new Error('Google returned an invalid signing key list.');
  }
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 300);
  googleSigningKeysCache = {
    keys: payload.keys,
    expiresAt: Date.now() + Math.min(Math.max(maxAge, 60), 86400) * 1000,
  };
  return googleSigningKeysCache.keys;
}

async function verifyGoogleCredential(credential) {
  if (typeof credential !== 'string' || credential.length > 10_000) {
    throw new InvalidGoogleCredentialError('Invalid Google credential.');
  }

  const parts = credential.split('.');
  if (parts.length !== 3) {
    throw new InvalidGoogleCredentialError('Invalid Google credential.');
  }

  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new InvalidGoogleCredentialError('Invalid Google credential.');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    throw new InvalidGoogleCredentialError('Invalid Google credential.');
  }

  const keys = await getGoogleSigningKeys();
  const signingKey = keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
  if (!signingKey) {
    googleSigningKeysCache = null;
    const refreshedKeys = await getGoogleSigningKeys();
    const refreshedKey = refreshedKeys.find((key) => key.kid === header.kid && key.kty === 'RSA');
    if (!refreshedKey) {
      throw new InvalidGoogleCredentialError('Unknown Google signing key.');
    }
    return verifyGoogleCredentialSignature(parts, refreshedKey, claims);
  }

  return verifyGoogleCredentialSignature(parts, signingKey, claims);
}

function verifyGoogleCredentialSignature(parts, signingKey, claims) {
  const publicKey = crypto.createPublicKey({ key: signingKey, format: 'jwk' });
  const signature = Buffer.from(parts[2], 'base64url');
  if (!crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, signature)) {
    throw new InvalidGoogleCredentialError('Invalid Google credential signature.');
  }

  const audienceMatches = claims.aud === googleClientId ||
    (Array.isArray(claims.aud) && claims.aud.includes(googleClientId));
  const issuerMatches = claims.iss === 'https://accounts.google.com' ||
    claims.iss === 'accounts.google.com';
  const now = Math.floor(Date.now() / 1000);
  if (
    !audienceMatches ||
    !issuerMatches ||
    typeof claims.sub !== 'string' ||
    !claims.sub ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now ||
    !Number.isFinite(claims.iat) ||
    claims.iat > now + 60 ||
    typeof claims.email !== 'string' ||
    !emailPattern.test(claims.email) ||
    (claims.email_verified !== true && claims.email_verified !== 'true')
  ) {
    throw new InvalidGoogleCredentialError('Google credential claims are invalid.');
  }

  return {
    id: claims.sub,
    email: claims.email.toLowerCase(),
    name: typeof claims.name === 'string' && claims.name ? claims.name : claims.email,
    picture: typeof claims.picture === 'string' ? claims.picture : '',
  };
}

function getPublicUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    username: user.username || '',
    email: user.email,
    name: user.name || user.username || user.email,
    picture: user.picture,
    status: user.status || 'Базовий',
    role: user.role || 'Користувач',
    tier: user.tier || 'Базовий',
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    settings: user.settings || {},
  };
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64'), 10000, 32, 'sha1').toString('base64');
}

function passwordsMatch(password, user) {
  if (!user.passwordHash || !user.passwordSalt) {
    return false;
  }
  const expected = Buffer.from(user.passwordHash, 'base64');
  const actual = Buffer.from(hashPassword(password, user.passwordSalt), 'base64');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

async function handleRegister(request, response) {
  if (!hasSameOrigin(request)) {
    sendJson(response, 403, { error: 'Запит відхилено.' });
    return;
  }
  if (isAuthRateLimited(request)) {
    sendJson(response, 429, { error: 'Забагато спроб реєстрації. Спробуй пізніше.' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.message === 'Request body is too large.' ? 413 : 400, {
      error: error.message === 'Request body is too large.' ? error.message : 'Перевір формат запиту.',
    });
    return;
  }

  const username = typeof payload?.username === 'string' ? payload.username.trim() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const suppliedEmail = typeof payload?.email === 'string' ? payload.email.trim() : '';
  if (!username || !password) {
    sendJson(response, 400, { error: 'Будь ласка, вкажіть логін та пароль.' });
    return;
  }
  if (username.length < 3 || username.length > 32) {
    sendJson(response, 400, { error: 'Логін має містити від 3 до 32 символів.' });
    return;
  }
  if (password.length < 4 || password.length > 1024) {
    sendJson(response, 400, { error: 'Пароль має містити від 4 до 1024 символів.' });
    return;
  }
  if (suppliedEmail && (suppliedEmail.length > 254 || !emailPattern.test(suppliedEmail))) {
    sendJson(response, 400, { error: 'Перевір формат email.' });
    return;
  }

  const email = (suppliedEmail || `${username}@local`).toLowerCase();
  try {
    const user = await queueAuthUsersWrite(async () => {
      const users = await loadAuthUsers();
      const usernameOwner = users.find((entry) =>
        typeof entry.username === 'string' &&
        entry.username.toLowerCase() === username.toLowerCase()
      );
      const emailOwner = users.find((entry) =>
        typeof entry.email === 'string' &&
        entry.email.toLowerCase() === email
      );
      const existingUser = usernameOwner || emailOwner;

      if (existingUser) {
        if (existingUser.passwordHash) {
          const error = new Error('Користувач із таким логіном або email вже зареєстрований. Перейдіть на вкладку «Вхід», щоб увійти.');
          error.statusCode = 409;
          error.code = 'USER_ALREADY_EXISTS';
          throw error;
        }
        if ((usernameOwner && usernameOwner !== existingUser) || (emailOwner && emailOwner !== existingUser)) {
          const error = new Error('Користувач із таким логіном або email вже зареєстрований.');
          error.statusCode = 409;
          error.code = 'USER_ALREADY_EXISTS';
          throw error;
        }

        const salt = crypto.randomBytes(16).toString('base64');
        existingUser.username = username;
        existingUser.email ||= email;
        existingUser.passwordSalt = salt;
        existingUser.passwordHash = hashPassword(password, salt);
        existingUser.status ||= 'Базовий';
        existingUser.role ||= 'Користувач';
        existingUser.tier ||= 'Базовий';
        existingUser.settings ||= {
          theme: 'dark',
          notifications: true,
          cabinetVersion: 2,
        };
        existingUser.lastLoginAt = new Date().toISOString();
        await saveAuthUsers(users);
        return existingUser;
      }

      const salt = crypto.randomBytes(16).toString('base64');
      const now = new Date().toISOString();
      const newUser = {
        id: `usr_${crypto.randomUUID().replaceAll('-', '')}`,
        username,
        email,
        name: username,
        passwordSalt: salt,
        passwordHash: hashPassword(password, salt),
        status: 'Базовий',
        role: 'Користувач',
        tier: 'Базовий',
        createdAt: now,
        lastLoginAt: now,
        settings: {
          theme: 'dark',
          notifications: true,
          cabinetVersion: 2,
        },
      };
      users.push(newUser);
      await saveAuthUsers(users);
      return newUser;
    });

    response.setHeader('Set-Cookie', serializeSessionCookie(getSessionToken(user.id), authSessionDurationSeconds));
    sendJson(response, 200, {
      success: true,
      message: 'Акаунт створено з базовим статусом. Ви увійшли.',
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.statusCode === 409) {
      sendJson(response, 409, { error: error.message, code: error.code });
      return;
    }
    console.error('Account registration failed:', error.message);
    sendJson(response, 500, { error: 'Не вдалося створити акаунт через помилку збереження.' });
  }
}

async function handleLogin(request, response) {
  if (!hasSameOrigin(request)) {
    sendJson(response, 403, { error: 'Запит відхилено.' });
    return;
  }
  if (isAuthRateLimited(request)) {
    sendJson(response, 429, { error: 'Забагато спроб входу. Спробуй пізніше.' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.message === 'Request body is too large.' ? 413 : 400, {
      error: error.message === 'Request body is too large.' ? error.message : 'Перевір формат запиту.',
    });
    return;
  }

  const login = typeof payload?.login === 'string' ? payload.login.trim() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  if (!login || !password) {
    sendJson(response, 400, { error: 'Введіть логін та пароль.' });
    return;
  }

  try {
    const user = await queueAuthUsersWrite(async () => {
      const users = await loadAuthUsers();
      const account = users.find((entry) =>
        (typeof entry.username === 'string' && entry.username.toLowerCase() === login.toLowerCase()) ||
        (typeof entry.email === 'string' && entry.email.toLowerCase() === login.toLowerCase())
      );
      if (!account) {
        const error = new Error('Користувача не знайдено. Перевірте логін або зареєструйтесь.');
        error.statusCode = 401;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }
      if (!account.passwordHash || !account.passwordSalt) {
        const error = new Error('Цей акаунт створено через Google. Увійдіть через Google або створіть пароль на вкладці «Реєстрація».');
        error.statusCode = 401;
        error.code = 'GOOGLE_USER_NO_PASSWORD';
        throw error;
      }
      if (!passwordsMatch(password, account)) {
        const error = new Error('Невірний логін або пароль.');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
      }
      account.lastLoginAt = new Date().toISOString();
      await saveAuthUsers(users);
      return account;
    });

    response.setHeader('Set-Cookie', serializeSessionCookie(getSessionToken(user.id), authSessionDurationSeconds));
    sendJson(response, 200, {
      success: true,
      message: `Успішний вхід! Вітаємо, ${user.name || user.username}.`,
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.statusCode === 401) {
      sendJson(response, 401, { error: error.message, code: error.code });
      return;
    }
    console.error('Account login failed:', error.message);
    sendJson(response, 500, { error: 'Не вдалося виконати вхід через помилку збереження.' });
  }
}

async function handlePremiumSubscription(request, response) {
  if (!hasSameOrigin(request)) {
    sendJson(response, 403, { error: 'Запит відхилено.' });
    return;
  }
  const userId = getSessionUserId(request);
  if (!userId) {
    sendJson(response, 401, { error: 'Увійди в акаунт, щоб зберегти підписку.' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.message === 'Request body is too large.' ? 413 : 400, {
      error: error.message === 'Request body is too large.' ? error.message : 'Перевір формат запиту.',
    });
    return;
  }

  const allowedDurations = new Set([1, 30, 90, 180, 365, 1200000]);
  if (!allowedDurations.has(payload?.days)) {
    sendJson(response, 400, { error: 'Обери один із доступних термінів підписки.' });
    return;
  }

  try {
    const user = await queueAuthUsersWrite(async () => {
      const users = await loadAuthUsers();
      const account = users.find((entry) => entry.id === userId);
      if (!account) {
        const error = new Error('Акаунт не знайдено. Увійди знову.');
        error.statusCode = 401;
        throw error;
      }

      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt.getTime() + payload.days * 24 * 60 * 60 * 1000);
      account.status = 'Преміум користувач';
      account.tier = 'Преміум';
      account.settings = {
        ...(account.settings && typeof account.settings === 'object' ? account.settings : {}),
        premiumSearchSubscription: {
          days: payload.days,
          purchasedAt: purchasedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      };
      await saveAuthUsers(users);
      return account;
    });

    sendJson(response, 200, {
      success: true,
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.statusCode === 401) {
      sendJson(response, 401, { error: error.message });
      return;
    }
    console.error('Premium subscription save failed:', error.message);
    sendJson(response, 500, { error: 'Не вдалося зберегти преміум-статус. Спробуй ще раз.' });
  }
}

async function handleGoogleSignIn(request, response) {
  if (!googleClientId) {
    sendJson(response, 503, { error: 'Google-вхід не налаштовано. Додай GOOGLE_OAUTH_CLIENT_ID у змінні сервера.' });
    return;
  }
  if (isAuthRateLimited(request)) {
    sendJson(response, 429, { error: 'Забагато спроб входу. Спробуй пізніше.' });
    return;
  }
  const contentType = request.headers['content-type'] || '';
  const isPopupRequest = contentType.toLowerCase().startsWith('application/json');
  let credential;

  if (isPopupRequest) {
    if (!request.headers.origin || !hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'Запит відхилено.' });
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, error.message === 'Request body is too large.' ? 413 : 400, { error: error.message });
      return;
    }
    credential = payload?.credential;
  } else if (contentType.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    let form;
    try {
      form = new URLSearchParams(await readFormBody(request));
    } catch (error) {
      sendJson(response, error.message === 'Request body is too large.' ? 413 : 400, { error: error.message });
      return;
    }

    const csrfCookie = getCookie(request, 'g_csrf_token');
    const csrfField = form.get('g_csrf_token');
    if (!csrfCookie || !csrfField || csrfCookie !== csrfField) {
      sendJson(response, 403, { error: 'Запит відхилено.' });
      return;
    }
    credential = form.get('credential');
  } else {
    sendJson(response, 415, { error: 'Формат запиту не підтримується.' });
    return;
  }

  if (typeof credential !== 'string' || !credential) {
    sendJson(response, 400, { error: 'Не отримано підтвердження входу Google.' });
    return;
  }

  try {
    const profile = await verifyGoogleCredential(credential);
    const { user, accountCreated } = await upsertAuthUser(profile);

    response.setHeader('Set-Cookie', serializeSessionCookie(getSessionToken(user.id), authSessionDurationSeconds));
    if (isPopupRequest) {
      sendJson(response, 200, { user: getPublicUser(user), accountCreated });
    } else {
      redirectAuthResult(response, accountCreated ? 'created' : 'success');
    }
  } catch (error) {
    if (error instanceof InvalidGoogleCredentialError) {
      if (isPopupRequest) {
        sendJson(response, 401, { error: 'Підтвердження від Google недійсне або застаріле. Спробуй ще раз.' });
      } else {
        redirectAuthResult(response, 'error');
      }
      return;
    }
    console.error('Google sign-in failed:', error.message);
    if (isPopupRequest) {
      sendJson(response, 500, { error: 'Не вдалося завершити вхід через Google. Спробуй ще раз.' });
    } else {
      redirectAuthResult(response, 'error');
    }
  }
}

async function handleAuthMe(request, response) {
  const userId = getSessionUserId(request);
  if (!userId) {
    sendJson(response, 200, { user: null });
    return;
  }

  try {
    const users = await loadAuthUsers();
    const user = users.find((entry) => entry.id === userId);
    sendJson(response, 200, { user: user ? getPublicUser(user) : null });
  } catch (error) {
    console.error('Could not load signed-in account:', error.message);
    sendJson(response, 500, { error: 'Не вдалося завантажити акаунт.' });
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

function redirectAuthResult(response, result, sessionCookie) {
  const headers = {
    'Cache-Control': 'no-store',
    'Location': `/?auth=${encodeURIComponent(result)}`,
  };
  if (sessionCookie) {
    headers['Set-Cookie'] = sessionCookie;
  }
  response.writeHead(303, headers);
  response.end();
}

function readFormBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      body += chunk;
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    request.on('error', reject);
  });
}

function isRateLimited(request) {
  const now = Date.now();
  const clientAddress = request.socket.remoteAddress || 'local';
  const windowMs = 10 * 60 * 1000;
  const limit = 5;
  const current = requestLimits.get(clientAddress);

  if (!current || now - current.startedAt >= windowMs) {
    requestLimits.set(clientAddress, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

async function sendDownloadEmail(email, productIds) {
  const result = await fetch(googleAppsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: googleAppsScriptToken,
      email,
      productIds,
    }),
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });

  if (!result.ok) {
    throw new Error(`Google Apps Script returned HTTP ${result.status}.`);
  }

  const resultData = await result.json();
  if (resultData.success !== true) {
    throw new AppsScriptResponseError(getAppsScriptFailureMessage(resultData.errorCode));
  }

  return resultData;
}

async function handleSendDownloadLinks(request, response) {
  if (isRateLimited(request)) {
    sendJson(response, 429, { error: 'Забагато запитів. Спробуй пізніше.' });
    return;
  }

  if (request.headers.origin) {
    try {
      const origin = new URL(request.headers.origin);
      if (origin.host !== request.headers.host) {
        sendJson(response, 403, { error: 'Запит відхилено.' });
        return;
      }
    } catch {
      sendJson(response, 403, { error: 'Некоректне джерело запиту.' });
      return;
    }
  }

  if (!googleAppsScriptUrl || !googleAppsScriptToken) {
    sendJson(response, 503, {
      error: 'Надсилання ще не налаштовано. Додай URL розгорнутого Google Apps Script і спільний токен у змінні сервера.',
    });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.message === 'Request body is too large.' ? 413 : 400, {
      error: error.message,
    });
    return;
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    sendJson(response, 400, { error: 'Перевір формат запиту.' });
    return;
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const productIds = payload.productIds;
  if (
    email.length > 254 ||
    !emailPattern.test(email) ||
    !Array.isArray(productIds) ||
    productIds.length < 1 ||
    productIds.length > Object.keys(products).length ||
    productIds.some((id) => typeof id !== 'string' || !Object.hasOwn(products, id))
  ) {
    sendJson(response, 400, { error: 'Перевір email і вибрані моди.' });
    return;
  }

  const uniqueProductIds = [...new Set(productIds)];
  try {
    const result = await sendDownloadEmail(email, uniqueProductIds);
    sendJson(response, 200, {
      message: typeof result.message === 'string'
        ? result.message
        : `Лист із посиланнями на моди надіслано на ${email}.`,
    });
  } catch (error) {
    console.error('Google Apps Script email request failed:', error.message);
    sendJson(response, 502, {
      error: error instanceof AppsScriptResponseError
        ? error.message
        : 'Google Apps Script не підтвердив надсилання. Перевір URL, токен і квоти Gmail.',
    });
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/auth/config') {
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    sendJson(response, 200, { clientId: googleClientId || null });
    return;
  }

  if (requestUrl.pathname === '/api/auth/me') {
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    await handleAuthMe(request, response);
    return;
  }

  if (requestUrl.pathname === '/api/auth/register') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    await handleRegister(request, response);
    return;
  }

  if (requestUrl.pathname === '/api/auth/login') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    await handleLogin(request, response);
    return;
  }

  if (requestUrl.pathname === '/api/auth/premium') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    await handlePremiumSubscription(request, response);
    return;
  }

  if (requestUrl.pathname === '/api/auth/google') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    await handleGoogleSignIn(request, response);
    return;
  }

  if (requestUrl.pathname === '/api/auth/logout') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }
    if (!request.headers.origin || !hasSameOrigin(request)) {
      sendJson(response, 403, { error: 'Запит відхилено.' });
      return;
    }
    response.setHeader('Set-Cookie', serializeSessionCookie('', 0));
    sendJson(response, 200, { success: true });
    return;
  }

  if (requestUrl.pathname === '/api/send-download-links') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      sendJson(response, 405, { error: 'Метод не підтримується.' });
      return;
    }

    await handleSendDownloadLinks(request, response);
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendJson(response, 405, { error: 'Метод не підтримується.' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    sendJson(response, 400, { error: 'Некоректна адреса.' });
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!publicFiles.has(relativePath)) {
    sendJson(response, 404, { error: 'Файл не знайдено.' });
    return;
  }

  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    sendJson(response, 403, { error: 'Доступ заборонено.' });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, error.code === 'ENOENT' ? 404 : 500, {
        error: error.code === 'ENOENT' ? 'Файл не знайдено.' : 'Не вдалося прочитати файл.',
      });
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  });
});

initializeAuth().then(() => {
  server.listen(port, host, () => {
    console.log(`ЧитКвест доступний: http://${host}:${port}`);
    console.log(`Google Apps Script налаштовано: ${Boolean(googleAppsScriptUrl && googleAppsScriptToken)}`);
    console.log(`Google OAuth налаштовано: ${Boolean(googleClientId)}`);
  });
}).catch((error) => {
  console.error('Authentication storage initialization failed:', error.message);
  process.exitCode = 1;
});
