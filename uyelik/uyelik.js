const $ = (id) => document.getElementById(id);

const state = {
  emailVerified: false,
  verifiedEmail: '',
};

function setStatus(id, message, type = 'info') {
  const el = $(id);
  el.textContent = message;
  el.className = `status ${type === 'success' ? 'success' : type === 'error' ? 'error' : ''}`.trim();
  el.hidden = false;
}

function clearStatus(id) {
  const el = $(id);
  el.textContent = '';
  el.hidden = true;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, message: text || 'Sunucu yanıtı okunamadı.' };
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || 'İşlem tamamlanamadı.');
  }
  return data;
}

function onlyDigits(input, maxLength) {
  input.value = input.value.replace(/\D/g, '').slice(0, maxLength);
}

function updateTaxHint() {
  const value = $('taxNo').value;
  const hint = $('taxNoHint');
  if (!value) {
    hint.textContent = '';
  } else if (value.length < 10) {
    hint.textContent = `Vergi no 10 haneli olmalı. ${10 - value.length} rakam eksik.`;
  } else {
    hint.textContent = '';
  }
}

$('taxNo').addEventListener('input', (event) => {
  onlyDigits(event.target, 10);
  updateTaxHint();
});

$('authorizedPhone').addEventListener('input', (event) => {
  onlyDigits(event.target, 15);
});

$('verificationCode').addEventListener('input', (event) => {
  onlyDigits(event.target, 6);
});

$('forgotCode').addEventListener('input', (event) => {
  onlyDigits(event.target, 6);
});

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus('loginStatus');
  const button = $('loginButton');
  button.disabled = true;
  button.textContent = 'Giriş yapılıyor...';
  try {
    const data = await postJson('/api/member-login.php', {
      email: $('loginEmail').value.trim(),
      password: $('loginPassword').value,
    });
    if (data.member) {
      sessionStorage.setItem('p24_member', JSON.stringify(data.member));
    }
    window.location.href = '/panel/';
  } catch (error) {
    setStatus('loginStatus', error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Giriş Yap';
  }
});

$('forgotToggle').addEventListener('click', () => {
  const form = $('forgotForm');
  form.hidden = !form.hidden;
  clearStatus('forgotStatus');
  if (!form.hidden && $('loginEmail').value.trim()) {
    $('forgotEmail').value = $('loginEmail').value.trim();
  }
});

$('forgotCodeButton').addEventListener('click', async () => {
  clearStatus('forgotStatus');
  const button = $('forgotCodeButton');
  button.disabled = true;
  button.textContent = 'Gönderiliyor...';
  try {
    const data = await postJson('/api/member-password.php', {
      action: 'request-reset',
      email: $('forgotEmail').value.trim(),
    });
    setStatus('forgotStatus', data.message || 'Kod gönderildi.', 'success');
  } catch (error) {
    setStatus('forgotStatus', error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Kod Gönder';
  }
});

$('forgotForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus('forgotStatus');
  const code = $('forgotCode').value.replace(/\D/g, '');
  if (code.length !== 6) {
    setStatus('forgotStatus', '6 haneli doğrulama kodunu girin.', 'error');
    return;
  }
  const button = $('forgotSubmitButton');
  button.disabled = true;
  button.textContent = 'Güncelleniyor...';
  try {
    const data = await postJson('/api/member-password.php', {
      action: 'reset',
      email: $('forgotEmail').value.trim(),
      code,
      newPassword: $('forgotPassword').value,
    });
    setStatus('forgotStatus', data.message || 'Şifreniz güncellendi.', 'success');
    $('loginEmail').value = $('forgotEmail').value.trim();
    $('loginPassword').focus();
    event.target.reset();
  } catch (error) {
    setStatus('forgotStatus', error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Şifreyi Güncelle';
  }
});

$('sendVerificationButton').addEventListener('click', async () => {
  clearStatus('verificationStatus');
  state.emailVerified = false;
  state.verifiedEmail = '';
  const button = $('sendVerificationButton');
  button.disabled = true;
  button.textContent = 'Gönderiliyor...';
  try {
    const data = await postJson('/api/public-submit.php', {
      type: 'verification',
      authorizedEmail: $('authorizedEmail').value.trim(),
      authorizedName: $('authorizedName').value.trim(),
      companyName: $('companyName').value.trim(),
    });
    setStatus('verificationStatus', data.message || 'Doğrulama kodu gönderildi.', 'success');
  } catch (error) {
    setStatus('verificationStatus', error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Doğrulama Kodu Gönder';
  }
});

$('verifyCodeButton').addEventListener('click', async () => {
  clearStatus('verificationStatus');
  const email = $('authorizedEmail').value.trim();
  const code = $('verificationCode').value.replace(/\D/g, '');
  if (code.length !== 6) {
    setStatus('verificationStatus', '6 haneli doğrulama kodunu girin.', 'error');
    return;
  }
  const button = $('verifyCodeButton');
  button.disabled = true;
  button.textContent = 'Onaylanıyor...';
  try {
    const data = await postJson('/api/public-submit.php', {
      type: 'verify-code',
      authorizedEmail: email,
      verificationCode: code,
    });
    state.emailVerified = true;
    state.verifiedEmail = email;
    setStatus('verificationStatus', data.message || 'E-posta doğrulandı.', 'success');
  } catch (error) {
    state.emailVerified = false;
    state.verifiedEmail = '';
    setStatus('verificationStatus', error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Kodu Onayla';
  }
});

$('authorizedEmail').addEventListener('input', () => {
  state.emailVerified = false;
  state.verifiedEmail = '';
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus('registerStatus');
  updateTaxHint();

  const email = $('authorizedEmail').value.trim();
  if (!state.emailVerified || state.verifiedEmail !== email) {
    setStatus('registerStatus', 'Üyelik için önce e-posta doğrulama kodunu onaylayın.', 'error');
    return;
  }
  if ($('taxNo').value.length !== 10) {
    setStatus('registerStatus', 'Vergi no 10 haneli olmalı ve sadece rakam içermelidir.', 'error');
    return;
  }
  if ($('password').value !== $('passwordConfirm').value) {
    setStatus('registerStatus', 'Şifreler eşleşmiyor.', 'error');
    return;
  }

  const button = $('registerButton');
  button.disabled = true;
  button.textContent = 'Başvuru gönderiliyor...';
  try {
    const data = await postJson('/api/public-submit.php', {
      type: 'membership',
      companyName: $('companyName').value.trim(),
      address: $('address').value.trim(),
      taxNo: $('taxNo').value.trim(),
      taxOffice: $('taxOffice').value.trim(),
      authorizedName: $('authorizedName').value.trim(),
      authorizedPhone: $('authorizedPhone').value.trim(),
      authorizedEmail: email,
      verificationCode: $('verificationCode').value.trim(),
      emailVerified: true,
      agreement: $('agreement').checked,
      password: $('password').value,
    });
    setStatus('registerStatus', data.message || 'Üyeliğiniz oluşturuldu.', 'success');
    if (data.member) {
      sessionStorage.setItem('p24_member', JSON.stringify(data.member));
    }
    window.setTimeout(() => {
      window.location.href = '/panel/';
    }, 900);
  } catch (error) {
    setStatus('registerStatus', error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Üyelik Başvurusunu Tamamla';
  }
});
