const authButton = document.getElementById('authButton');
const authDialog = document.getElementById('authDialog');
const authCloseButton = document.getElementById('authCloseButton');
const authTitle = document.getElementById('authTitle');
const authDescription = document.getElementById('authDescription');
const authAccount = document.getElementById('authAccount');
const authSubscriptionButton = document.getElementById('authSubscriptionButton');
const authSubscriptionMenu = document.getElementById('authSubscriptionMenu');
const authSubscriptionBackButton = document.getElementById('authSubscriptionBackButton');
const subscriptionDurationOptions = document.getElementById('subscriptionDurationOptions');
const subscriptionDurationSelection = document.getElementById('subscriptionDurationSelection');
const subscriptionBuyButton = document.getElementById('subscriptionBuyButton');
const subscriptionAudioPlayer = document.getElementById('subscriptionAudioPlayer');
const authAvatar = document.getElementById('authAvatar');
const authAvatarFallback = document.getElementById('authAvatarFallback');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authStatusPill = document.getElementById('authStatusPill');
const authPremiumDaysRemaining = document.getElementById('authPremiumDaysRemaining');
const authLogoutButton = document.getElementById('authLogoutButton');
const authMessage = document.getElementById('authMessage');

const authFormsContainer = document.getElementById('authFormsContainer');
const authTabLogin = document.getElementById('authTabLogin');
const authTabRegister = document.getElementById('authTabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const registerUsernameInput = document.getElementById('registerUsername');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');
const googleSignInButton = document.getElementById('googleSignInButton');
const authDivider = document.getElementById('authDivider');

const AUTH_STORAGE_KEY = 'chitkvest_auth_user';
const SUBSCRIPTION_PREVIEW_SECONDS = 20;

// Базові дефолтні налаштування акаунту для нових та існуючих користувачів
const DEFAULT_ACCOUNT_SETTINGS = {
  status: 'Базовий',
  role: 'Користувач',
  tier: 'Базовий',
  settings: {
    theme: 'dark',
    notifications: true,
    cabinetVersion: 2,
  },
};

function isPremiumSubscriptionActive(subscription) {
  if (!subscription || typeof subscription !== 'object') return false;
  const expiresAt = getPremiumSubscriptionExpiry(subscription);
  return expiresAt === null || expiresAt > Date.now();
}

function getPremiumSubscriptionExpiry(subscription) {
  if (typeof subscription?.expiresAt === 'string') {
    const expiresAt = Date.parse(subscription.expiresAt);
    return Number.isFinite(expiresAt) ? expiresAt : null;
  }
  const purchasedAt = Date.parse(subscription?.purchasedAt || '');
  const days = Number(subscription?.days);
  if (Number.isFinite(purchasedAt) && Number.isFinite(days) && days > 0) {
    return purchasedAt + days * 24 * 60 * 60 * 1000;
  }
  return null;
}

function getPremiumDaysRemaining(subscription) {
  const expiresAt = getPremiumSubscriptionExpiry(subscription);
  if (expiresAt === null) {
    const legacyDays = Number(subscription?.days);
    return Number.isFinite(legacyDays) && legacyDays > 0 ? Math.ceil(legacyDays) : null;
  }
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

/**
 * Нормалізація акаунта: автоматично підтягує дефолтний статус та налаштування
 * для нових користувачів, а також забезпечує зворотну сумісність для тих,
 * хто зареєструвався раніше, без втрати їхніх збережених даних.
 */
function normalizeUserAccount(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const existingSettings = (rawUser.settings && typeof rawUser.settings === 'object')
    ? rawUser.settings
    : {};
  const expiredSubscription = existingSettings.premiumSearchSubscription &&
    !isPremiumSubscriptionActive(existingSettings.premiumSearchSubscription);

  return {
    ...DEFAULT_ACCOUNT_SETTINGS,
    ...rawUser,
    status: expiredSubscription ? DEFAULT_ACCOUNT_SETTINGS.status : rawUser.status || DEFAULT_ACCOUNT_SETTINGS.status,
    role: rawUser.role || DEFAULT_ACCOUNT_SETTINGS.role,
    tier: expiredSubscription ? DEFAULT_ACCOUNT_SETTINGS.tier : rawUser.tier || DEFAULT_ACCOUNT_SETTINGS.tier,
    settings: {
      ...DEFAULT_ACCOUNT_SETTINGS.settings,
      ...existingSettings,
    },
  };
}

/**
 * Безпечне збереження сесії користувача в локальному сховищі
 */
function persistUserSession(user) {
  try {
    if (user) {
      const normalized = normalizeUserAccount(user);
      const existingUser = restorePersistedSession();
      const existingSubscription = existingUser?.id === normalized.id
        ? existingUser.settings?.premiumSearchSubscription
        : null;
      if (isPremiumSubscriptionActive(existingSubscription)) {
        normalized.status = 'Преміум користувач';
        normalized.tier = 'Преміум';
        normalized.settings.premiumSearchSubscription = existingSubscription;
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  } catch {
    return user;
  }
}

/**
 * Відновлення збереженої сесії при перезавантаженні сторінки
 */
function restorePersistedSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeUserAccount(parsed);
  } catch {
    return null;
  }
}

let googleClientId = '';
// Миттєво підтягуємо збережену сесію, щоб стан не скидався при оновленні сторінки
let signedInUser = restorePersistedSession();
let googleButtonReady = false;
let googleButtonRendered = false;
let googleSignInInProgress = false;
let subscriptionMenuOpen = false;
let selectedSubscriptionDays = null;
let subscriptionPreviewTimeout = null;

function showAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.hidden = !message;
  authMessage.classList.toggle('is-error', isError);
}

function switchAuthTab(targetTab) {
  showAuthMessage('');
  const isLogin = (targetTab === 'login');
  
  if (authTabLogin) {
    authTabLogin.classList.toggle('is-active', isLogin);
    authTabLogin.setAttribute('aria-selected', String(isLogin));
  }
  if (authTabRegister) {
    authTabRegister.classList.toggle('is-active', !isLogin);
    authTabRegister.setAttribute('aria-selected', String(!isLogin));
  }
  if (loginForm) loginForm.hidden = !isLogin;
  if (registerForm) registerForm.hidden = isLogin;

  if (authTitle) {
    authTitle.textContent = isLogin ? 'Вхід до акаунту' : 'Реєстрація акаунту';
  }
  if (authDescription) {
    authDescription.textContent = isLogin
      ? 'Увійдіть за допомогою логіна та пароля для доступу до збережень.'
      : 'Створіть новий акаунт. Йому автоматично буде надано базовий статус.';
  }
}

if (authTabLogin) {
  authTabLogin.addEventListener('click', () => switchAuthTab('login'));
}
if (authTabRegister) {
  authTabRegister.addEventListener('click', () => switchAuthTab('register'));
}

if (authSubscriptionButton) {
  authSubscriptionButton.addEventListener('click', () => {
    subscriptionMenuOpen = true;
    renderAuth();
  });
}

if (authSubscriptionBackButton) {
  authSubscriptionBackButton.addEventListener('click', () => {
    subscriptionMenuOpen = false;
    renderAuth();
  });
}

if (subscriptionDurationOptions) {
  subscriptionDurationOptions.addEventListener('click', (event) => {
    const button = event.target.closest('.subscription-duration-btn');
    if (!button || !subscriptionDurationOptions.contains(button)) return;

    subscriptionDurationOptions.querySelectorAll('.subscription-duration-btn').forEach((option) => {
      const selected = option === button;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });

    if (subscriptionDurationSelection) {
      subscriptionDurationSelection.textContent = `Обраний термін: ${button.dataset.label}.`;
      subscriptionDurationSelection.hidden = false;
    }
    selectedSubscriptionDays = Number(button.dataset.days);
    if (subscriptionBuyButton) subscriptionBuyButton.disabled = false;
  });
}

if (subscriptionBuyButton) {
  subscriptionBuyButton.addEventListener('click', async () => {
    if (!selectedSubscriptionDays) {
      showAuthMessage('Спочатку оберіть термін підписки.', true);
      return;
    }

    if (!subscriptionAudioPlayer) {
      showAuthMessage('Аудіопрогравач недоступний.', true);
      return;
    }

    subscriptionBuyButton.disabled = true;
    subscriptionBuyButton.textContent = 'Зберігаємо...';
    try {
      const response = await fetch('/api/auth/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ days: selectedSubscriptionDays }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.user) {
        throw new Error(result?.error || 'Не вдалося зберегти преміум-статус.');
      }

      signedInUser = persistUserSession(result.user);
      subscriptionMenuOpen = false;
      renderAuth();
      authDialog.close();

      subscriptionAudioPlayer.currentTime = 0;
      subscriptionAudioPlayer.play().then(() => {
        clearTimeout(subscriptionPreviewTimeout);
        subscriptionPreviewTimeout = setTimeout(() => {
          subscriptionAudioPlayer.pause();
          subscriptionAudioPlayer.currentTime = 0;
        }, SUBSCRIPTION_PREVIEW_SECONDS * 1000);
      }).catch((error) => {
        authDialog.showModal();
        showAuthMessage(`Не вдалося відтворити аудіо: ${error.message}`, true);
      });
    } catch (error) {
      showAuthMessage(window.location.protocol === 'file:'
        ? 'Для збереження преміум-статусу запусти застосунок ЧитКвест .exe.'
        : error instanceof TypeError
          ? 'Не вдалося з’єднатися із сервером. Перезапусти застосунок і спробуй ще раз.'
          : error.message || 'Не вдалося зберегти преміум-статус.', true);
    } finally {
      subscriptionBuyButton.disabled = !selectedSubscriptionDays;
      subscriptionBuyButton.textContent = 'Купити';
    }
  });
}

if (subscriptionAudioPlayer) {
  subscriptionAudioPlayer.addEventListener('timeupdate', () => {
    if (subscriptionAudioPlayer.currentTime >= SUBSCRIPTION_PREVIEW_SECONDS) {
      clearTimeout(subscriptionPreviewTimeout);
      subscriptionAudioPlayer.pause();
      subscriptionAudioPlayer.currentTime = 0;
    }
  });
}

function renderAuth() {
  if (signedInUser) {
    const displayName = signedInUser.name || signedInUser.username || signedInUser.email || 'Користувач';
    authButton.textContent = displayName;
    authButton.title = `Акаунт: ${displayName} (Статус: ${signedInUser.status || 'Базовий'})`;

    if (authDescription) {
      authDescription.textContent = subscriptionMenuOpen
        ? 'Підписка на платний пошук.'
        : 'Ви увійшли у свій акаунт.';
    }
    if (authTitle) {
      authTitle.textContent = subscriptionMenuOpen ? 'Платний пошук' : 'Мій акаунт';
    }

    if (authAccount) authAccount.hidden = subscriptionMenuOpen;
    if (authSubscriptionMenu) authSubscriptionMenu.hidden = !subscriptionMenuOpen;
    if (authSubscriptionButton) {
      authSubscriptionButton.hidden = isPremiumSubscriptionActive(
        signedInUser.settings?.premiumSearchSubscription
      );
    }
    if (authFormsContainer) authFormsContainer.hidden = true;
    if (authName) authName.textContent = displayName;
    if (authEmail) authEmail.textContent = signedInUser.email || '';

    const premiumSubscription = signedInUser.settings?.premiumSearchSubscription;
    const premiumDaysRemaining = isPremiumSubscriptionActive(premiumSubscription)
      ? getPremiumDaysRemaining(premiumSubscription)
      : null;
    if (authPremiumDaysRemaining) {
      authPremiumDaysRemaining.hidden = premiumDaysRemaining === null;
      if (premiumDaysRemaining !== null) {
        authPremiumDaysRemaining.textContent = `Залишилося: ${premiumDaysRemaining} ${premiumDaysRemaining === 1 ? 'день' : premiumDaysRemaining < 5 ? 'дні' : 'днів'}`;
      }
    }

    if (authStatusPill) {
      authStatusPill.textContent = signedInUser.status || 'Базовий';
    }

    if (signedInUser.picture) {
      if (authAvatar) {
        authAvatar.src = signedInUser.picture;
        authAvatar.hidden = false;
      }
      if (authAvatarFallback) authAvatarFallback.hidden = true;
    } else {
      if (authAvatar) authAvatar.hidden = true;
      if (authAvatarFallback) {
        authAvatarFallback.hidden = false;
        authAvatarFallback.textContent = (displayName[0] || 'U').toUpperCase();
      }
    }

    if (googleSignInButton) googleSignInButton.hidden = true;
    if (authLogoutButton) authLogoutButton.hidden = false;
    window.dispatchEvent(new Event('chitkvest-auth-updated'));
    return;
  }

  // Not signed in
  authButton.textContent = 'Увійти';
  authButton.title = 'Увійти або зареєструватися';
  if (authTitle) authTitle.textContent = 'Вхід до акаунту';
  if (authDescription) {
    authDescription.textContent =
      'Увійдіть або зареєструйтесь для збереження конфігів та налаштувань.';
  }

  if (authAccount) authAccount.hidden = true;
  if (authSubscriptionButton) authSubscriptionButton.hidden = false;
  if (authPremiumDaysRemaining) authPremiumDaysRemaining.hidden = true;
  if (authSubscriptionMenu) authSubscriptionMenu.hidden = true;
  subscriptionMenuOpen = false;
  if (authFormsContainer) authFormsContainer.hidden = false;
  if (authLogoutButton) authLogoutButton.hidden = true;

  if (authDivider) authDivider.hidden = !Boolean(googleClientId);
  if (googleSignInButton) {
    googleSignInButton.hidden = !Boolean(googleClientId);
    if (googleClientId && googleButtonReady && !googleButtonRendered) {
      window.google.accounts.id.renderButton(googleSignInButton, {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'uk',
      });
      googleButtonRendered = true;
    }
  }
  window.dispatchEvent(new Event('chitkvest-auth-updated'));
}

async function handleGoogleCredential(response) {
  if (!response?.credential || googleSignInInProgress) {
    showAuthMessage('Google не повернув підтвердження входу. Спробуй ще раз.', true);
    return;
  }

  googleSignInInProgress = true;
  showAuthMessage('Перевірка входу через Google...');
  try {
    const result = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ credential: response.credential }),
    });
    const payload = await result.json().catch(() => null);
    if (!result.ok || !payload?.user) {
      throw new Error(payload?.error || 'Не вдалося завершити вхід через Google.');
    }

    signedInUser = persistUserSession(payload.user);
    renderAuth();
    showAuthMessage(payload.accountCreated
      ? 'Акаунт створено з базовим статусом. Ви увійшли.'
      : 'Ви успішно увійшли.');
  } catch (error) {
    showAuthMessage(error.message || 'Не вдалося завершити вхід через Google.', true);
  } finally {
    googleSignInInProgress = false;
  }
}

// FORM SUBMISSIONS: LOGIN
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const login = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    if (!login || !password) {
      showAuthMessage('Будь ласка, заповніть усі поля.', true);
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Перевірка...';
    showAuthMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ login, password }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (result?.code === 'GOOGLE_USER_NO_PASSWORD') {
          showAuthMessage(result.error, false);
          return;
        }
        throw new Error(result?.error || 'Невірний логін або пароль.');
      }

      signedInUser = persistUserSession(result.user);
      renderAuth();
      showAuthMessage(result.message || `Успішний вхід! Вітаємо, ${signedInUser.name || signedInUser.username}.`);
      loginForm.reset();
    } catch (error) {
      showAuthMessage(window.location.protocol === 'file:'
        ? 'Для входу запусти застосунок ЧитКвест .exe. Відкритий окремо файл index.html не має сервера авторизації.'
        : error instanceof TypeError
          ? 'Не вдалося з’єднатися із сервером. Перезапусти застосунок і спробуй ще раз.'
          : error.message || 'Помилка авторизації.', true);
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = 'Увійти до акаунту';
    }
  });
}

// FORM SUBMISSIONS: REGISTER
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = registerUsernameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

    if (!username || !password) {
      showAuthMessage('Будь ласка, заповніть обов\'язкові поля (логін та пароль).', true);
      return;
    }

    if (username.length < 3) {
      showAuthMessage('Логін має містити щонайменше 3 символи.', true);
      return;
    }

    if (password.length < 4) {
      showAuthMessage('Пароль має містити щонайменше 4 символи.', true);
      return;
    }

    registerSubmitBtn.disabled = true;
    registerSubmitBtn.textContent = 'Реєстрація...';
    showAuthMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, email, password }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (result?.code === 'USER_ALREADY_EXISTS' || (result?.error && result.error.includes('вже зареєстрований'))) {
          showAuthMessage(result.error || 'Користувач вже зареєстрований. Переходимо на вкладку входу...', false);
          setTimeout(() => {
            switchAuthTab('login');
            if (loginUsernameInput) {
              loginUsernameInput.value = username || email;
            }
            if (loginPasswordInput) {
              loginPasswordInput.focus();
            }
          }, 1200);
          return;
        }
        throw new Error(result?.error || 'Не вдалося створити акаунт.');
      }

      signedInUser = persistUserSession(result.user);
      renderAuth();
      showAuthMessage(result.message || `Акаунт створено з базовим статусом! Вітаємо, ${signedInUser.name || signedInUser.username}.`);
      registerForm.reset();
    } catch (error) {
      showAuthMessage(window.location.protocol === 'file:'
        ? 'Для створення акаунту запусти застосунок ЧитКвест .exe. Відкритий окремо файл index.html не має сервера реєстрації.'
        : error instanceof TypeError
          ? 'Не вдалося з’єднатися із сервером. Перезапусти застосунок і спробуй ще раз.'
          : error.message || 'Помилка реєстрації.', true);
    } finally {
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.textContent = 'Зареєструватися';
    }
  });
}

async function loadCurrentUser() {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 || !result?.user) {
        signedInUser = null;
        persistUserSession(null);
        renderAuth();
      }
      return;
    }
    if (result.user) {
      signedInUser = persistUserSession(result.user);
      renderAuth();
    }
  } catch (error) {
    if (signedInUser) {
      renderAuth();
    }
  }
}

function initializeGoogleSignIn() {
  if (googleButtonReady || !googleClientId || !window.google?.accounts?.id) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: googleClientId,
    ux_mode: 'popup',
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  googleButtonReady = true;
  renderAuth();
}

authButton.addEventListener('click', () => {
  showAuthMessage('');
  authDialog.showModal();
  if (googleClientId) {
    initializeGoogleSignIn();
  }
});

authCloseButton.addEventListener('click', () => authDialog.close());
authDialog.addEventListener('click', (event) => {
  if (event.target === authDialog) {
    authDialog.close();
  }
});

authLogoutButton.addEventListener('click', async () => {
  authLogoutButton.disabled = true;
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Не вдалося вийти з акаунту.');
    }
    signedInUser = null;
    persistUserSession(null);
    renderAuth();
    showAuthMessage('Ви вийшли з акаунту.');
  } catch (error) {
    signedInUser = null;
    persistUserSession(null);
    renderAuth();
    showAuthMessage(error.message || 'Ви вийшли з акаунту на цьому пристрої.');
  } finally {
    authLogoutButton.disabled = false;
  }
});

// Первинне відображення сесії
renderAuth();

(async () => {
  try {
    const [configResponse] = await Promise.all([
      fetch('/api/auth/config', { credentials: 'same-origin' }),
      loadCurrentUser(),
    ]);
    const config = await configResponse.json();
    if (configResponse.ok) {
      googleClientId = typeof config.clientId === 'string' ? config.clientId : '';
      if (googleClientId) {
        initializeGoogleSignIn();
      }
      renderAuth();
    }

    const authResult = new URLSearchParams(window.location.search).get('auth');
    if (authResult) {
      authDialog.showModal();
      if (authResult === 'created') {
        showAuthMessage('Акаунт створено з базовим статусом. Ви увійшли.');
      } else if (authResult === 'success' && signedInUser) {
        showAuthMessage('Ви успішно увійшли.');
      } else {
        showAuthMessage('Не вдалося завершити вхід через Google. Спробуй ще раз.', true);
      }

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('auth');
      window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }
  } catch {
    if (!signedInUser) {
      renderAuth();
    }
  }
})();
