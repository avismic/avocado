import '../../css/global.css';
import './modal.css';

let currentBackdrop = null;

function _createBackdrop() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  return backdrop;
}

function _createDialog({ title, message, primaryBtnText, primaryBtnCallback, secondaryBtnText, secondaryBtnCallback }) {
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';

  if (title) {
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.textContent = title;
    dialog.appendChild(header);
  }

  if (message) {
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.textContent = message;
    dialog.appendChild(body);
  }

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  if (secondaryBtnText) {
    const secondaryBtn = document.createElement('button');
    secondaryBtn.type = 'button';
    secondaryBtn.className = 'modal-secondary-btn';
    secondaryBtn.textContent = secondaryBtnText;
    secondaryBtn.addEventListener('click', () => {
      if (typeof secondaryBtnCallback === 'function') secondaryBtnCallback();
      _close();
    });
    actions.appendChild(secondaryBtn);
  }

  const primaryBtn = document.createElement('button');
  primaryBtn.type = 'button';
  primaryBtn.className = 'modal-primary-btn';
  primaryBtn.textContent = primaryBtnText || 'OK';
  primaryBtn.addEventListener('click', () => {
    if (typeof primaryBtnCallback === 'function') primaryBtnCallback();
    _close();
  });
  actions.appendChild(primaryBtn);

  dialog.appendChild(actions);
  return dialog;
}

function _close() {
  if (currentBackdrop) {
    currentBackdrop.removeEventListener('click', _handleBackdropClick);
    document.removeEventListener('keydown', _handleEscKey);
    currentBackdrop.parentNode?.removeChild(currentBackdrop);
    currentBackdrop = null;
  }
}

function _handleBackdropClick(e) {
  if (e.target === currentBackdrop) {
    _close();
  }
}

function _handleEscKey(e) {
  if (e.key === 'Escape') {
    _close();
  }
}

export function showModal({
  title = '',
  message = '',
  primaryBtnText = 'OK',
  primaryBtnCallback,
  secondaryBtnText,
  secondaryBtnCallback
}) {
  if (currentBackdrop) return;

  const backdrop = _createBackdrop();
  const dialog = _createDialog({ title, message, primaryBtnText, primaryBtnCallback, secondaryBtnText, secondaryBtnCallback });

  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  currentBackdrop = backdrop;

  const firstBtn = dialog.querySelector('button');
  firstBtn?.focus();

  backdrop.addEventListener('click', _handleBackdropClick);
  document.addEventListener('keydown', _handleEscKey);
}