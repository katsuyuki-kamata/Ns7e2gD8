function toggleAccordion(id) {  
  const body = document.getElementById(id + '-body');  
  const arrow = document.getElementById(id + '-arrow');  
  if (body) body.classList.toggle('closed');  
  if (arrow) arrow.classList.toggle('open');  
  const trigger = document.getElementById(id + '-trigger');  
  if (trigger && body) {  
    trigger.setAttribute('aria-expanded', String(!body.classList.contains('closed')));  
  }  
}

function syncInspectorToggleIcon(btn, collapsed) {
  var img = btn.querySelector('.vd-inspector-toggle__icon');
  var expandedSrc = btn.getAttribute('data-src-expanded');
  var collapsedSrc = btn.getAttribute('data-src-collapsed');
  if (!img || !expandedSrc || !collapsedSrc) return;
  img.setAttribute('src', collapsed ? collapsedSrc : expandedSrc);
}

function setInspectorPaneCollapsed(collapsed) {
  var pane = document.getElementById('voucher-detail-inspector-pane');
  var bodyIn = document.querySelector('.voucher-detail-body-in');
  var btn = document.getElementById('vd-inspector-toggle');
  if (!pane || !bodyIn || !btn) return;
  pane.classList.toggle('vd-inspector-column--collapsed', collapsed);
  bodyIn.classList.toggle('voucher-detail-body-in--inspector-collapsed', collapsed);
  syncInspectorToggleIcon(btn, collapsed);
  btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  btn.setAttribute('aria-label', collapsed ? 'インスペクタを開く' : 'インスペクタを閉じる');
  try {
    sessionStorage.setItem('yayoiInspectorCollapsed', collapsed ? '1' : '0');
  } catch (e) {}
}

function toggleInspectorPane() {
  var pane = document.getElementById('voucher-detail-inspector-pane');
  if (!pane) return;
  setInspectorPaneCollapsed(!pane.classList.contains('vd-inspector-column--collapsed'));
}

function initInspectorPaneToggle() {
  var stored = null;
  try {
    stored = sessionStorage.getItem('yayoiInspectorCollapsed');
  } catch (e) {}
  if (stored === '1') setInspectorPaneCollapsed(true);
}

function switchShareLinkTab(id) {
  var tabs = ['active', 'history'];
  for (var i = 0; i < tabs.length; i++) {
    var tabId = tabs[i];
    var tab = document.getElementById('vd-share-tab-' + tabId);
    var panel = document.getElementById('vd-share-panel-' + tabId);
    var active = tabId === id;
    if (tab) {
      tab.classList.toggle('vd-share-tab--active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    if (panel) {
      panel.classList.toggle('vd-share-panel--active', active);
      panel.hidden = !active;
    }
  }
}

function copyShareLinkUrl(btn) {
  var row = btn.closest('.vd-share-url-row');
  if (!row) return;
  var urlEl = row.querySelector('.vd-share-url');
  if (!urlEl) return;
  var text = urlEl.textContent.trim();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  }
}

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
document.addEventListener('click', (e) => {  
  if (!e.target.closest('.status-select-wrap')) {  
    document.querySelectorAll('.status-select-panel.show').forEach(p => p.classList.remove('show'));  
    document.querySelectorAll('.status-select-trigger[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));  
  }  
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInspectorPaneToggle);
} else {
  initInspectorPaneToggle();
}
