const checkoutSubmitButton = document.getElementById('checkoutBtn');
const checkoutOpenButton = document.getElementById('checkoutBtn');
const checkoutDialog = document.getElementById('checkoutEmailDialog');
const checkoutDialogCloseButton = document.getElementById('checkoutEmailCloseButton');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutEmailSubmitButton = document.getElementById('checkoutSubmitBtn');
const checkoutEmail = document.getElementById('checkoutEmail');
const checkoutMessage = document.getElementById('checkoutMessage');
const checkoutDialogMessage = document.getElementById('checkoutDialogMessage');

const CHECKOUT_BUTTON_TEXT = 'Купити';
const CHECKOUT_SUBMIT_TEXT = 'Надіслати';

function getCartItemIds() {
  return window.ChitKvestCart.load()
    .map((item) => (item.game === 'Minecraft' && typeof item.productId === 'string'
      ? item.productId
      : item.id))
    .filter((id) => typeof id === 'string' && id.length > 0);
}

function showCheckoutMessage(target, text) {
  target.replaceChildren();
  target.hidden = false;
  const message = document.createElement('span');
  message.textContent = text;
  target.appendChild(message);
}

checkoutOpenButton.addEventListener('click', () => {
  if (!getCartItemIds().length) return;
  checkoutDialogMessage.replaceChildren();
  checkoutDialogMessage.hidden = true;
  checkoutDialog.showModal();
  checkoutEmail.focus();
});

checkoutDialogCloseButton.addEventListener('click', () => checkoutDialog.close());
checkoutDialog.addEventListener('click', (event) => {
  if (event.target === checkoutDialog) checkoutDialog.close();
});

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const productIds = getCartItemIds();
  checkoutDialogMessage.replaceChildren();
  checkoutDialogMessage.hidden = true;

  if (!productIds.length || !checkoutEmail.reportValidity()) {
    return;
  }

  checkoutEmailSubmitButton.disabled = true;
  checkoutEmailSubmitButton.textContent = 'Надсилаємо...';

  (async () => {
    try {
      const response = await fetch('/api/send-download-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: checkoutEmail.value.trim(),
          productIds,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Сервер не зміг надіслати лист.');
      }

      window.ChitKvestCart.save([]);
      checkoutDialog.close();
      showCheckoutMessage(checkoutMessage, result.message);
      checkoutForm.reset();
    } catch (error) {
      showCheckoutMessage(checkoutDialogMessage, error instanceof TypeError
        ? 'Не вдалося з’єднатися із сервером. Перезапусти застосунок і спробуй ще раз.'
        : error.message || 'Помилка надсилання. Спробуй ще раз.');
    } finally {
      checkoutSubmitButton.disabled = !window.ChitKvestCart.load().length;
      checkoutSubmitButton.textContent = CHECKOUT_BUTTON_TEXT;
      checkoutEmailSubmitButton.disabled = false;
      checkoutEmailSubmitButton.textContent = CHECKOUT_SUBMIT_TEXT;
    }
  })();
});
