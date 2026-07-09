/* ==================================================
   Plastik24 – Checkout JavaScript
   ================================================== */

const API = '/api/';
const CONTENT_API = '/api/content.php';

const state = {
  member: null,
  cart: [],
  orderId: null,
  orderNumber: null,
  step: 1,
};

// ─── Helpers ────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function showToast(msg, dur = 3500) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { t.hidden = true; }, dur);
}

function escHtml(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtPrice(val, currency = 'EUR') {
  return Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

async function apiFetch(path, opts = {}) {
  const resp = await fetch(path, {
    credentials: 'same-origin',
    ...opts,
    headers: opts.body instanceof FormData
      ? (opts.headers || {})
      : { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await resp.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: false, message: text }; }
  if (!resp.ok || data.ok === false) {
    const err = new Error(data.message || 'Hata oluştu.');
    err.status = resp.status;
    throw err;
  }
  return data;
}

// ─── Cart ────────────────────────────────────────────
function loadCart() {
  try {
    const raw = localStorage.getItem('p24_cart') || sessionStorage.getItem('p24_cart') || '[]';
    return JSON.parse(raw);
  } catch { return []; }
}

function calcTotals(items) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price || it.regularPrice || 0) * Number(it.quantity || it.qty || 1)), 0);
  const taxTotal = 0; // KDV ayrıca hesaplanabilir
  const grandTotal = subtotal + taxTotal;
  const currency = items[0]?.currency || 'EUR';
  return { subtotal, taxTotal, grandTotal, currency };
}

// ─── Session ─────────────────────────────────────────
async function checkSession() {
  const data = await apiFetch(API + 'member-session.php');
  if (data.loggedIn && data.member) {
    state.member = data.member;
    return true;
  }
  return false;
}

// ─── Content (bank accounts etc.) ────────────────────
async function loadContent() {
  try {
    const resp = await fetch(CONTENT_API, { cache: 'no-store' });
    return await resp.json();
  } catch { return {}; }
}

// ─── Render Functions ─────────────────────────────────
function renderSummary() {
  const items = state.cart;
  const { subtotal, taxTotal, grandTotal, currency } = calcTotals(items);

  $('summaryItems').innerHTML = items.length
    ? items.map(it => {
        const price = Number(it.price || it.regularPrice || 0);
        const qty = Number(it.quantity || it.qty || 1);
        return `
          <div class="summary-item">
            <div>
              <div class="si-name">${escHtml(it.name || it.productName || 'Ürün')}</div>
              ${it.sku ? `<div class="si-sku">${escHtml(it.sku)}</div>` : ''}
              <div class="si-qty">× ${qty}</div>
            </div>
            <div class="si-price">${fmtPrice(price * qty, currency)}</div>
          </div>`;
      }).join('')
    : '<div class="loading-text">Sepet boş</div>';

  $('sumSubtotal').textContent = fmtPrice(subtotal, currency);
  $('sumTax').textContent = taxTotal > 0 ? fmtPrice(taxTotal, currency) : 'Dahil';
  $('sumTotal').textContent = fmtPrice(grandTotal, currency);
  $('taxRow').style.display = taxTotal > 0 ? '' : 'none';
}

function renderBillingForm() {
  const m = state.member;
  if (!m) return;
  $('bName').value  = m.authorizedName  || '';
  $('bPhone').value = m.authorizedPhone || '';
  $('bEmail').value = m.authorizedEmail || '';
  $('bCompany').value = m.companyName   || '';
  $('bTaxNo').value   = m.taxNo         || '';
  $('bTaxOffice').value = m.taxOffice   || '';
  $('bAddress').value = m.address       || '';
}

async function renderBankAccounts(content) {
  const accounts = (content?.paymentSettings?.bankAccounts || []).filter(a => a.enabled !== false);
  if (!accounts.length) {
    $('bankAccountsList').innerHTML = `
      <div class="bank-account">
        <div class="bank-name">Plastik24</div>
        <div class="bank-iban" title="Kopyalamak için tıklayın" onclick="copyIban(this, 'TR00 0000 0000 0000 0000 0000 00')">TR00 0000 0000 0000 0000 0000 00</div>
        <div class="copy-hint">Yukarıdaki IBAN'a tıklayarak kopyalayabilirsiniz</div>
      </div>`;
    return;
  }

  $('bankAccountsList').innerHTML = accounts.map(acc => `
    <div class="bank-account">
      <div class="bank-name">${escHtml(acc.bankName || 'Banka')} — ${escHtml(acc.accountName || '')}</div>
      <div class="bank-iban" title="Kopyalamak için tıklayın"
           onclick="copyIban(this, '${escHtml(acc.iban || '')}')">
        ${escHtml(acc.iban || '—')}
      </div>
      <div class="bank-currency">${escHtml(acc.currency || 'EUR')}</div>
      <div class="copy-hint">↑ Tıklayarak IBAN'ı kopyalayabilirsiniz</div>
    </div>`).join('');
}

window.copyIban = function(el, iban) {
  navigator.clipboard.writeText(iban).then(() => {
    el.style.borderColor = 'var(--success)';
    showToast('✓ IBAN panoya kopyalandı!');
    setTimeout(() => { el.style.borderColor = ''; }, 2000);
  }).catch(() => showToast('IBAN: ' + iban));
};

// ─── Steps ────────────────────────────────────────────
function setStepIndicator(n) {
  ['step1indicator', 'step2indicator', 'step3indicator'].forEach((id, i) => {
    const el = $(id);
    if (!el) return;
    el.className = 'step' + (i + 1 === n ? ' active' : i + 1 < n ? ' done' : '');
  });
}

function goToStep(n) {
  state.step = n;
  ['step1', 'step2', 'step3'].forEach((id, i) => {
    const el = $(id);
    if (el) el.hidden = (i + 1) !== n;
  });
  setStepIndicator(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Order Submit ─────────────────────────────────────
async function submitOrder() {
  const m = state.member;
  const { subtotal, taxTotal, grandTotal, currency } = calcTotals(state.cart);
  const billingAddress = $('bAddress').value.trim();
  const shippingAddr = $('sameAddress').checked ? billingAddress : ($('bShipping')?.value.trim() || billingAddress);

  const payload = {
    billingAddress,
    shippingAddress: shippingAddr,
    notes: $('bNotes').value.trim(),
    items: state.cart,
    subtotal,
    taxTotal,
    grandTotal,
    currency,
  };

  const data = await apiFetch(API + 'order-submit.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  state.orderId = data.orderId;
  state.orderNumber = data.orderNumber;
  return data;
}

// ─── Event Bindings ───────────────────────────────────
$('billingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Kontrol ediliyor...';
  try {
    // Update member address if changed
    const newAddress = $('bAddress').value.trim();
    if (newAddress && newAddress !== state.member.address) {
      await apiFetch(API + 'member-update.php', {
        method: 'POST',
        body: JSON.stringify({ address: newAddress, taxOffice: $('bTaxOffice').value.trim() }),
      });
    }
    goToStep(2);
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ödeme Adımına Geç →';
  }
});

$('sameAddress').addEventListener('change', function () {
  $('shippingSection').hidden = this.checked;
});

$('submitOrderBtn').addEventListener('click', async () => {
  const btn = $('submitOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Sipariş oluşturuluyor...';
  try {
    await submitOrder();
    // Show order number
    $('orderNumberDisplay').textContent = state.orderNumber;
    $('orderNumberBox').hidden = false;
    // Update receipt mail link
    $('receiptMailLink').href = `mailto:info@plastik24.com.tr?subject=Dekont – ${state.orderNumber}`;
    // Show receipt section
    $('submitOrderSection').hidden = true;
    $('receiptSection').hidden = false;
    showToast('✓ Siparişiniz oluşturuldu!');
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
    btn.textContent = 'Siparişi Oluştur';
  }
});

$('uploadReceiptBtn').addEventListener('click', async () => {
  const file = $('receiptFile').files?.[0];
  if (!file) { showToast('Önce bir dosya seçin.'); return; }
  const fd = new FormData();
  fd.append('receipt', file);
  fd.append('orderId', state.orderId || '');
  fd.append('orderNumber', state.orderNumber || '');

  const btn = $('uploadReceiptBtn');
  btn.disabled = true;
  btn.textContent = 'Yükleniyor...';
  try {
    await apiFetch(API + 'receipt-upload.php', { method: 'POST', body: fd });
    const status = $('receiptStatus');
    status.textContent = '✓ Dekontunuz başarıyla yüklendi.';
    status.hidden = false;
    showToast('✓ Dekont yüklendi.');
    setTimeout(() => goToConfirm(), 1500);
  } catch (err) {
    showToast(err.message);
    btn.disabled = false;
    btn.textContent = 'Dekontu Yükle';
  }
});

$('skipReceiptBtn').addEventListener('click', () => {
  goToConfirm();
});

function goToConfirm() {
  $('confirmOrderNum').textContent = state.orderNumber || '—';
  // Clear cart
  localStorage.removeItem('p24_cart');
  sessionStorage.removeItem('p24_cart');
  goToStep(3);
}

// ─── Init ─────────────────────────────────────────────
(async () => {
  try {
    const [loggedIn, content] = await Promise.all([checkSession(), loadContent()]);

    if (!loggedIn) {
      $('guestView').hidden = false;
      $('checkoutView').hidden = true;
      return;
    }

    state.cart = loadCart();

    if (!state.cart.length) {
      $('emptyCartView').hidden = false;
      $('checkoutView').hidden = true;
      return;
    }

    $('checkoutView').hidden = false;
    renderSummary();
    renderBillingForm();
    await renderBankAccounts(content);
    goToStep(1);

  } catch (err) {
    console.error(err);
    $('guestView').hidden = false;
  }
})();
