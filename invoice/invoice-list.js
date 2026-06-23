const STATUS_LABELS = { UNBILLED: '未請求', BILLED: '請求済み', DEPOSITED: '入金済み' };  
function setStatusTriggerVariant(trigger, value) {  
  trigger.classList.remove('status-select--unbilled', 'status-select--billed', 'status-select--deposited');  
  if (value === 'UNBILLED') trigger.classList.add('status-select--unbilled');  
  else if (value === 'BILLED') trigger.classList.add('status-select--billed');  
  else if (value === 'DEPOSITED') trigger.classList.add('status-select--deposited');  
}  
function toggleStatusSelectPanel(btn) {  
  const panel = btn.nextElementSibling;  
  const open = panel.classList.contains('show');  
  document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));  
  document.querySelectorAll('.status-select-panel.show').forEach(p => p.classList.remove('show'));  
  document.querySelectorAll('.status-select-trigger').forEach(b => b.setAttribute('aria-expanded', 'false'));  
  if (!open) {  
    panel.classList.add('show');  
    btn.setAttribute('aria-expanded', 'true');  
  }  
}  
function applyInvoiceStatus(itemBtn) {  
  const value = itemBtn.getAttribute('data-value');  
  const wrap = itemBtn.closest('.status-select-wrap');  
  const trigger = wrap.querySelector('.status-select-trigger');  
  const labelEl = trigger.querySelector('.status-select-label');  
  labelEl.textContent = STATUS_LABELS[value] || '';  
  setStatusTriggerVariant(trigger, value);  
  wrap.querySelector('.status-select-panel').classList.remove('show');  
  trigger.setAttribute('aria-expanded', 'false');  
}  
function toggleMenu(btn) {  
  const menu = btn.nextElementSibling;  
  const isOpen = menu.classList.contains('show');  
  document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));  
  document.querySelectorAll('.status-select-panel.show').forEach(p => p.classList.remove('show'));  
  document.querySelectorAll('.status-select-trigger[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));  
  if (!isOpen) menu.classList.add('show');  
}  
// Close menus on outside click  
document.addEventListener('click', (e) => {  
  if (!e.target.closest('.icon-btn') && !e.target.closest('.dropdown-menu')) {  
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));  
  }  
  if (!e.target.closest('.status-select-wrap')) {  
    document.querySelectorAll('.status-select-panel.show').forEach(p => p.classList.remove('show'));  
    document.querySelectorAll('.status-select-trigger[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));  
  }  
});  
