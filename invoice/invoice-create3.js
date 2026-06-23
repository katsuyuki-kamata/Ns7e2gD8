function switchTab(tabName) {
  var root = document.querySelector('.form-pane');
  var voucherTab = document.getElementById('voucher-info-tab');
  var taxTab = document.getElementById('tax-config-tab');
  var voucherPanel = document.getElementById('voucher-info');
  var taxPanel = document.getElementById('tax-config');
  if (!voucherTab || !taxTab || !voucherPanel || !taxPanel) return;
  if (root && !root.contains(voucherTab)) return;

  if (tabName === 'voucher-info') {
    voucherTab.setAttribute('aria-selected', 'true');
    voucherTab.classList.remove('tab--inactive');
    voucherTab.classList.add('tab--active');
    taxTab.setAttribute('aria-selected', 'false');
    taxTab.classList.remove('tab--active');
    taxTab.classList.add('tab--inactive');
    voucherPanel.classList.add('tabpanel--active');
    voucherPanel.classList.remove('active');
    taxPanel.classList.remove('tabpanel--active');
    taxPanel.classList.remove('active');
  } else {
    taxTab.setAttribute('aria-selected', 'true');
    taxTab.classList.remove('tab--inactive');
    taxTab.classList.add('tab--active');
    voucherTab.setAttribute('aria-selected', 'false');
    voucherTab.classList.remove('tab--active');
    voucherTab.classList.add('tab--inactive');
    taxPanel.classList.add('tabpanel--active');
    taxPanel.classList.remove('active');
    voucherPanel.classList.remove('tabpanel--active');
    voucherPanel.classList.remove('active');
  }
}

/** @type {{ clientAnchor: Element | null, ddAnchor: Element | null, closeClient: (() => void) | null, closeDd: (() => void) | null }} */
var invoiceMenuAnchors = {
  clientAnchor: null,
  ddAnchor: null,
  closeClient: null,
  closeDd: null,
};

/** hidden 等を JS で更新したあと、フォームの input/change 委譲でも同期できるようにする */
function dispatchFormFieldSync(el) {
  if (!el) return;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function closeDeliveryDestinationGuidePopover() {
  var pop = document.getElementById('delivery-destination-guide-popover');
  var btn = document.getElementById('dd-guide-dialog-open');
  if (pop) pop.classList.remove('is-open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function wireGlobalMenuDismiss() {
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Node)) return;
    if (invoiceMenuAnchors.clientAnchor && !invoiceMenuAnchors.clientAnchor.contains(t) && invoiceMenuAnchors.closeClient) {
      invoiceMenuAnchors.closeClient();
    }
    if (invoiceMenuAnchors.ddAnchor && !invoiceMenuAnchors.ddAnchor.contains(t) && invoiceMenuAnchors.closeDd) {
      invoiceMenuAnchors.closeDd();
    }
    var guidePop = document.getElementById('delivery-destination-guide-popover');
    var guideAnchor = guidePop && guidePop.closest('.dd-guide-popover-anchor');
    if (guidePop && guidePop.classList.contains('is-open') && guideAnchor && !guideAnchor.contains(t)) {
      closeDeliveryDestinationGuidePopover();
    }
    closeProductNameComboboxesExcept(t);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var clientPop = document.getElementById('client-menu-popover');
    var ddPop = document.getElementById('dd-menu-popover');
    var guidePop = document.getElementById('delivery-destination-guide-popover');
    var clientTrigger = document.getElementById('client-select-trigger');
    var ddTrigger = document.getElementById('dd-select-trigger');
    var guideBtn = document.getElementById('dd-guide-dialog-open');
    if (closeOpenProductNameCombobox()) return;
    if (clientPop && clientPop.classList.contains('is-open') && invoiceMenuAnchors.closeClient) {
      invoiceMenuAnchors.closeClient();
      if (clientTrigger) clientTrigger.focus();
      return;
    }
    if (ddPop && ddPop.classList.contains('is-open') && invoiceMenuAnchors.closeDd) {
      invoiceMenuAnchors.closeDd();
      if (ddTrigger) ddTrigger.focus();
      return;
    }
    if (guidePop && guidePop.classList.contains('is-open')) {
      closeDeliveryDestinationGuidePopover();
      if (guideBtn) guideBtn.focus();
    }
  });
}

/** @param {Element} root */
function resetProductNameComboboxState(root) {
  var input = root.querySelector('.combobox-input');
  var trigger = root.querySelector('.combobox-trigger');
  var content = getProductNameComboboxContent(root);
  var items = content ? content.querySelectorAll('.combobox-item') : [];
  hideAllProductNameComboboxItemTooltips(root);
  root.setAttribute('data-state', 'closed');
  if (content) content.hidden = true;
  resetProductNameComboboxMenuLayout(root);
  unportalProductNameComboboxMenu(root);
  if (input) input.setAttribute('aria-expanded', 'false');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  for (var i = 0; i < items.length; i++) {
    items[i].hidden = false;
    items[i].removeAttribute('data-highlighted');
  }
}

/** @param {Node | null} target */
function closeProductNameComboboxesExcept(target) {
  var open = document.querySelectorAll('.combobox-root[data-state="open"]');
  for (var i = 0; i < open.length; i++) {
    var root = open[i];
    if (target instanceof Node && root.contains(target)) continue;
    var content = getProductNameComboboxContent(root);
    if (target instanceof Node && content && content.contains(target)) continue;
    setProductNameComboboxOpen(root, false);
  }
}

/** @returns {boolean} 閉じたコンボボックスがあれば true */
function closeOpenProductNameCombobox() {
  var open = document.querySelector('.combobox-root[data-state="open"]');
  if (!open) return false;
  setProductNameComboboxOpen(open, false);
  var input = open.querySelector('.combobox-input');
  if (input) input.focus();
  return true;
}

var PRODUCT_COMBOBOX_MENU_MAX_WIDTH = 600;
var productComboboxWidthProbe = null;
var productComboboxPositionBound = false;
var productComboboxPortals = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

/** @param {Element} root @returns {Element | null} */
function getProductNameComboboxContent(root) {
  if (productComboboxPortals && productComboboxPortals.has(root)) {
    return productComboboxPortals.get(root).content;
  }
  return root.querySelector('.combobox-content');
}

/** @param {Element} root */
function portalProductNameComboboxMenu(root) {
  if (productComboboxPortals && productComboboxPortals.has(root)) return;
  var content = root.querySelector('.combobox-content');
  if (!content) return;
  var placeholder = document.createComment('combobox-content');
  if (content.parentNode) {
    content.parentNode.insertBefore(placeholder, content);
  }
  document.body.appendChild(content);
  content.classList.add('combobox-content--portal');
  if (productComboboxPortals) {
    productComboboxPortals.set(root, { content: content, placeholder: placeholder });
  }
}

/** @param {Element} root */
function unportalProductNameComboboxMenu(root) {
  if (!productComboboxPortals || !productComboboxPortals.has(root)) return;
  var entry = productComboboxPortals.get(root);
  var content = entry.content;
  var placeholder = entry.placeholder;
  content.classList.remove('combobox-content--portal');
  if (placeholder.parentNode) {
    placeholder.parentNode.insertBefore(content, placeholder);
    placeholder.remove();
  } else {
    var control = root.querySelector('.combobox-control');
    if (control && control.parentNode) {
      control.parentNode.insertBefore(content, control.nextSibling);
    } else {
      root.appendChild(content);
    }
  }
  productComboboxPortals.delete(root);
}

function getProductComboboxWidthProbe() {
  if (productComboboxWidthProbe) return productComboboxWidthProbe;
  productComboboxWidthProbe = document.createElement('span');
  productComboboxWidthProbe.setAttribute('aria-hidden', 'true');
  productComboboxWidthProbe.style.cssText =
    'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;top:-9999px;left:-9999px;';
  document.body.appendChild(productComboboxWidthProbe);
  return productComboboxWidthProbe;
}

/** @param {Element} root */
function updateProductNameComboboxMenuWidth(root) {
  var content = getProductNameComboboxContent(root);
  if (!content || content.hidden) return;
  var minWidth = root.getBoundingClientRect().width;
  var items = content.querySelectorAll('.combobox-item:not([hidden])');
  content.style.maxWidth = PRODUCT_COMBOBOX_MENU_MAX_WIDTH + 'px';
  if (!items.length) {
    content.style.width = Math.min(PRODUCT_COMBOBOX_MENU_MAX_WIDTH, minWidth) + 'px';
    return;
  }
  var probe = getProductComboboxWidthProbe();
  var sampleText = items[0].querySelector('.combobox-item-text');
  if (sampleText) {
    var cs = getComputedStyle(sampleText);
    probe.style.font = cs.font;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.letterSpacing = cs.letterSpacing;
  }
  var itemStyle = getComputedStyle(items[0]);
  var itemPadX = parseFloat(itemStyle.paddingLeft) + parseFloat(itemStyle.paddingRight);
  var widest = minWidth;
  for (var i = 0; i < items.length; i++) {
    var textEl = items[i].querySelector('.combobox-item-text');
    if (!textEl) continue;
    probe.textContent = textEl.textContent || '';
    widest = Math.max(widest, probe.getBoundingClientRect().width + itemPadX);
  }
  content.style.width = Math.min(PRODUCT_COMBOBOX_MENU_MAX_WIDTH, Math.max(minWidth, widest)) + 'px';
}

/** @param {Element} root */
function resetProductNameComboboxMenuLayout(root) {
  var content = getProductNameComboboxContent(root);
  if (!content) return;
  content.style.width = '';
  content.style.top = '';
  content.style.left = '';
  content.style.maxWidth = '';
}

/** @param {Element} root */
function updateProductNameComboboxMenuPosition(root) {
  var control = root.querySelector('.combobox-control');
  var content = getProductNameComboboxContent(root);
  if (!control || !content || content.hidden) return;
  updateProductNameComboboxMenuWidth(root);
  var rect = control.getBoundingClientRect();
  content.style.top = Math.round(rect.bottom) + 'px';
  content.style.left = Math.round(rect.left) + 'px';
  syncProductNameComboboxItemTruncation(root);
}

/** @param {Element} content */
function ensureProductNameComboboxItemTooltips(content) {
  var items = content.querySelectorAll('.combobox-item');
  for (var i = 0; i < items.length; i++) {
    if (items[i].querySelector('.tooltip-positioner')) continue;
    var positioner = document.createElement('span');
    positioner.className = 'tooltip-positioner';
    positioner.setAttribute('aria-hidden', 'true');
    var tooltipText = document.createElement('span');
    tooltipText.className = 'tooltip-text';
    positioner.appendChild(tooltipText);
    items[i].appendChild(positioner);
  }
}

/** @param {Element} root */
function syncProductNameComboboxItemTruncation(root) {
  var content = getProductNameComboboxContent(root);
  if (!content) return;
  ensureProductNameComboboxItemTooltips(content);
  var menuWidth = content.getBoundingClientRect().width;
  if (menuWidth > 0) {
    content.style.setProperty('--combobox-menu-width', Math.round(menuWidth) + 'px');
  }
  var items = content.querySelectorAll('.combobox-item');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var textEl = item.querySelector('.combobox-item-text');
    hideProductNameComboboxItemTooltip(item);
    if (!textEl || item.hidden) {
      item.removeAttribute('data-truncated');
      continue;
    }
    var truncated = textEl.scrollWidth > textEl.clientWidth;
    if (truncated) {
      item.setAttribute('data-truncated', 'true');
      var tooltipText = item.querySelector('.tooltip-text');
      if (tooltipText) tooltipText.textContent = textEl.textContent || '';
    } else {
      item.removeAttribute('data-truncated');
    }
  }
}

/** @param {Element} item @param {Element} root */
function showProductNameComboboxItemTooltip(item, root) {
  if (!item.hasAttribute('data-truncated')) return;
  var content = getProductNameComboboxContent(root);
  var positioner = item.querySelector('.tooltip-positioner');
  var textEl = item.querySelector('.combobox-item-text');
  var tooltipText = positioner ? positioner.querySelector('.tooltip-text') : null;
  if (!content || !positioner || !textEl || !tooltipText) return;

  tooltipText.textContent = textEl.textContent || '';
  var contentRect = content.getBoundingClientRect();
  var textRect = textEl.getBoundingClientRect();
  var menuWidth = Math.round(contentRect.width);

  positioner.style.position = 'fixed';
  positioner.style.width = menuWidth + 'px';
  positioner.style.left = Math.round(contentRect.left) + 'px';
  positioner.style.bottom = 'auto';
  positioner.style.transform = 'translateY(-100%)';
  positioner.style.zIndex = '1001';

  var gap = 4;
  /* top をテキスト上端 − gap に置き、translateY(-100%) で下辺が text 上端 − gap になる */
  positioner.style.top = Math.round(textRect.top - gap) + 'px';
  item.classList.add('combobox-item--tooltip-open');
}

/** @param {Element} item */
function hideProductNameComboboxItemTooltip(item) {
  if (!item) return;
  item.classList.remove('combobox-item--tooltip-open');
  var positioner = item.querySelector('.tooltip-positioner');
  if (!positioner) return;
  positioner.style.position = '';
  positioner.style.width = '';
  positioner.style.left = '';
  positioner.style.top = '';
  positioner.style.bottom = '';
  positioner.style.transform = '';
  positioner.style.zIndex = '';
  positioner.style.opacity = '';
  positioner.style.visibility = '';
}

/** @param {Element} root */
function hideAllProductNameComboboxItemTooltips(root) {
  var content = getProductNameComboboxContent(root);
  if (!content) return;
  var items = content.querySelectorAll('.combobox-item.combobox-item--tooltip-open');
  for (var i = 0; i < items.length; i++) {
    hideProductNameComboboxItemTooltip(items[i]);
  }
}

function repositionOpenProductNameComboboxes() {
  var open = document.querySelectorAll('.combobox-root[data-state="open"]');
  for (var i = 0; i < open.length; i++) {
    hideAllProductNameComboboxItemTooltips(open[i]);
    updateProductNameComboboxMenuPosition(open[i]);
  }
}

function bindProductComboboxPositionListeners() {
  if (productComboboxPositionBound) return;
  productComboboxPositionBound = true;
  window.addEventListener('resize', repositionOpenProductNameComboboxes);
  var scrollEl = document.querySelector('.form-pane-scroll');
  if (scrollEl) {
    scrollEl.addEventListener('scroll', repositionOpenProductNameComboboxes, { passive: true });
  }
}

/** @param {Element} root @param {boolean} open */
function setProductNameComboboxOpen(root, open) {
  var input = root.querySelector('.combobox-input');
  var trigger = root.querySelector('.combobox-trigger');
  root.setAttribute('data-state', open ? 'open' : 'closed');
  if (open) {
    portalProductNameComboboxMenu(root);
    var openContent = getProductNameComboboxContent(root);
    if (openContent) openContent.hidden = false;
    if (input) input.setAttribute('aria-expanded', 'true');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    filterProductNameComboboxItems(root);
    return;
  }
  hideAllProductNameComboboxItemTooltips(root);
  var content = getProductNameComboboxContent(root);
  if (content) content.hidden = true;
  resetProductNameComboboxMenuLayout(root);
  unportalProductNameComboboxMenu(root);
  if (input) input.setAttribute('aria-expanded', 'false');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

/** @param {Element} root */
function filterProductNameComboboxItems(root) {
  var input = root.querySelector('.combobox-input');
  var content = getProductNameComboboxContent(root);
  if (!input || !content) return;
  var items = content.querySelectorAll('.combobox-item');
  var q = input.value.trim().toLowerCase();
  for (var i = 0; i < items.length; i++) {
    var textEl = items[i].querySelector('.combobox-item-text');
    var text = textEl ? textEl.textContent.toLowerCase() : '';
    items[i].hidden = !!(q && text.indexOf(q) < 0);
    items[i].removeAttribute('data-highlighted');
  }
  updateProductNameComboboxMenuPosition(root);
}

/**
 * @param {Element} root
 * @param {number} direction 1=次, -1=前, 0=先頭の表示項目
 */
function highlightProductNameComboboxItem(root, direction) {
  var content = getProductNameComboboxContent(root);
  if (!content) return;
  var items = content.querySelectorAll('.combobox-item');
  var visible = [];
  for (var i = 0; i < items.length; i++) {
    if (!items[i].hidden) visible.push(items[i]);
  }
  if (!visible.length) return;
  var current = -1;
  for (var j = 0; j < visible.length; j++) {
    if (visible[j].hasAttribute('data-highlighted')) current = j;
  }
  var next = 0;
  if (direction === 0) {
    next = 0;
  } else if (current < 0) {
    next = direction > 0 ? 0 : visible.length - 1;
  } else {
    next = current + direction;
    if (next < 0) next = visible.length - 1;
    if (next >= visible.length) next = 0;
  }
  for (var k = 0; k < visible.length; k++) {
    visible[k].removeAttribute('data-highlighted');
  }
  visible[next].setAttribute('data-highlighted', '');
  visible[next].scrollIntoView({ block: 'nearest' });
}

/** @param {Element} root @param {Element} item */
function selectProductNameComboboxItem(root, item) {
  var input = root.querySelector('.combobox-input');
  var textEl = item.querySelector('.combobox-item-text');
  if (input && textEl) {
    input.value = textEl.textContent;
    dispatchFormFieldSync(input);
  }
  setProductNameComboboxOpen(root, false);
}

/** @param {Element} root */
function wireProductNameCombobox(root) {
  if (root.getAttribute('data-combobox-wired') === '1') return;
  root.setAttribute('data-combobox-wired', '1');
  var input = root.querySelector('.combobox-input');
  var trigger = root.querySelector('.combobox-trigger');
  var content = root.querySelector('.combobox-content');
  var items = root.querySelectorAll('.combobox-item');
  if (!input || !trigger || !content) return;

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var isOpen = root.getAttribute('data-state') === 'open';
    if (!isOpen) closeProductNameComboboxesExcept(root);
    setProductNameComboboxOpen(root, !isOpen);
    if (!isOpen) input.focus();
  });

  input.addEventListener('focus', function () {
    closeProductNameComboboxesExcept(root);
    setProductNameComboboxOpen(root, true);
  });

  input.addEventListener('input', function () {
    if (root.getAttribute('data-state') !== 'open') setProductNameComboboxOpen(root, true);
    else filterProductNameComboboxItems(root);
    dispatchFormFieldSync(input);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (root.getAttribute('data-state') !== 'open') setProductNameComboboxOpen(root, true);
      highlightProductNameComboboxItem(root, 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (root.getAttribute('data-state') !== 'open') setProductNameComboboxOpen(root, true);
      highlightProductNameComboboxItem(root, -1);
      return;
    }
    if (e.key === 'Enter') {
      var content = getProductNameComboboxContent(root);
      var highlighted = content ? content.querySelector('.combobox-item[data-highlighted]') : null;
      if (highlighted && root.getAttribute('data-state') === 'open') {
        e.preventDefault();
        e.stopPropagation();
        selectProductNameComboboxItem(root, highlighted);
      }
      return;
    }
    if (e.key === 'Escape') {
      if (root.getAttribute('data-state') === 'open') {
        e.preventDefault();
        e.stopPropagation();
        setProductNameComboboxOpen(root, false);
      }
    }
  });

  for (var i = 0; i < items.length; i++) {
    (function (item) {
      item.addEventListener('mousedown', function (e) {
        e.preventDefault();
      });
      item.addEventListener('click', function (e) {
        e.preventDefault();
        selectProductNameComboboxItem(root, item);
      });
      item.addEventListener('mouseenter', function () {
        showProductNameComboboxItemTooltip(item, root);
      });
      item.addEventListener('mouseleave', function () {
        hideProductNameComboboxItemTooltip(item);
      });
    })(items[i]);
  }
  ensureProductNameComboboxItemTooltips(content);
}

/** @param {ParentNode} [scope] */
function initProductNameComboboxes(scope) {
  bindProductComboboxPositionListeners();
  var roots = (scope || document).querySelectorAll('.combobox-root');
  for (var i = 0; i < roots.length; i++) {
    wireProductNameCombobox(roots[i]);
  }
}

function initClientSelectMenu() {
  var anchor = document.getElementById('client-select-dropdown');
  var trigger = document.getElementById('client-select-trigger');
  var popover = document.getElementById('client-menu-popover');
  var searchInput = document.getElementById('client-select-search');
  var menuList = document.getElementById('client-menu-list');
  var selectedPanel = document.getElementById('client-selected-panel');
  if (!anchor || !trigger || !popover || !menuList) return;

  var hiddenName = document.querySelector('input[name="client.clientName"]');

  invoiceMenuAnchors.clientAnchor = anchor;
  invoiceMenuAnchors.closeClient = closeMenu;

  function setOpen(open) {
    popover.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && searchInput) {
      window.setTimeout(function () {
        searchInput.focus();
      }, 50);
    }
  }

  function toggleMenu() {
    setOpen(!popover.classList.contains('is-open'));
    if (popover.classList.contains('is-open') && invoiceMenuAnchors.closeDd) {
      invoiceMenuAnchors.closeDd();
    }
  }

  function closeMenu() {
    setOpen(false);
  }

  function selectClient(label) {
    trigger.textContent = label;
    trigger.classList.remove('placeholder');
    if (hiddenName) hiddenName.value = label;
    dispatchFormFieldSync(hiddenName);
    if (selectedPanel) selectedPanel.hidden = false;
    closeMenu();
    if (searchInput) {
      searchInput.value = '';
      filterClientMenu('');
    }
    syncInvoicePreview();
  }

  function filterClientMenu(query) {
    var q = (query || '').trim().toLowerCase();
    var items = menuList.querySelectorAll('.menu-item[role="menuitem"]');
    for (var i = 0; i < items.length; i++) {
      var btn = items[i];
      var text = (btn.getAttribute('aria-label') || btn.textContent || '').toLowerCase();
      var match = !q || text.indexOf(q) !== -1;
      btn.classList.toggle('is-filtered-out', !match);
    }
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  menuList.addEventListener('click', function (e) {
    var item = e.target.closest('.menu-item[role="menuitem"]');
    if (!item) return;
    var label = item.getAttribute('data-client-label');
    if (label) selectClient(label);
  });

  var footerBtn = popover.querySelector('.menu-footer .text-button-primary');
  if (footerBtn) {
    footerBtn.addEventListener('click', function () {
      closeMenu();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      filterClientMenu(searchInput.value);
    });
    searchInput.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  popover.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

function initDeliveryDestinationMenu() {
  var anchor = document.getElementById('delivery-select-dropdown');
  var trigger = document.getElementById('dd-select-trigger');
  var popover = document.getElementById('dd-menu-popover');
  var searchInput = document.getElementById('dd-menu-search');
  var menuList = document.getElementById('dd-menu-list');
  var editBtn = document.getElementById('dd-edit-button');
  if (!anchor || !trigger || !popover || !menuList) return;

  var hiddenName = document.querySelector('input[name="client.deliveryDestinationName"]');
  var hiddenId = document.querySelector('input[name="client.deliveryDestinationId"]');

  invoiceMenuAnchors.ddAnchor = anchor;
  invoiceMenuAnchors.closeDd = closeDdMenu;

  function setOpen(open) {
    popover.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && searchInput) {
      window.setTimeout(function () {
        searchInput.focus();
      }, 50);
    }
  }

  function toggleDdMenu() {
    setOpen(!popover.classList.contains('is-open'));
    if (popover.classList.contains('is-open') && invoiceMenuAnchors.closeClient) {
      invoiceMenuAnchors.closeClient();
    }
  }

  function closeDdMenu() {
    setOpen(false);
  }

  function selectDeliveryDestination(label) {
    var clear = label === null || label === '';
    if (clear) {
      trigger.textContent = '送付先を選択してください';
      trigger.classList.add('placeholder');
      if (hiddenName) hiddenName.value = '';
      if (hiddenId) hiddenId.value = '';
      dispatchFormFieldSync(hiddenName);
      dispatchFormFieldSync(hiddenId);
      if (editBtn) editBtn.hidden = true;
    } else {
      trigger.textContent = label;
      trigger.classList.remove('placeholder');
      if (hiddenName) hiddenName.value = label;
      if (hiddenId) hiddenId.value = '';
      dispatchFormFieldSync(hiddenName);
      dispatchFormFieldSync(hiddenId);
      if (editBtn) editBtn.hidden = false;
    }
    closeDdMenu();
    if (searchInput) {
      searchInput.value = '';
      filterDdMenu('');
    }
    syncInvoicePreview();
  }

  function filterDdMenu(query) {
    var q = (query || '').trim().toLowerCase();
    var items = menuList.querySelectorAll('.dd-menu-item[role="menuitem"]');
    for (var i = 0; i < items.length; i++) {
      var btn = items[i];
      if (btn.getAttribute('data-dd-clear') === 'true') {
        btn.classList.remove('is-filtered-out');
        continue;
      }
      var text = (btn.getAttribute('data-dd-label') || btn.textContent || '').toLowerCase();
      var match = !q || text.indexOf(q) !== -1;
      btn.classList.toggle('is-filtered-out', !match);
    }
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleDdMenu();
  });

  menuList.addEventListener('click', function (e) {
    var item = e.target.closest('.dd-menu-item[role="menuitem"]');
    if (!item) return;
    if (item.getAttribute('data-dd-clear') === 'true') {
      selectDeliveryDestination(null);
      return;
    }
    var label = item.getAttribute('data-dd-label');
    if (label) selectDeliveryDestination(label);
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      filterDdMenu(searchInput.value);
    });
    searchInput.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  popover.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

function initInvoiceNoteCounter() {
  var ta = document.getElementById('note-input');
  var counter = document.getElementById('note-counter');
  if (!ta || !counter) return;
  var max = ta.getAttribute('maxlength');
  var limit = max ? parseInt(max, 10) : 1000;
  if (isNaN(limit) || limit < 1) limit = 1000;
  function sync() {
    counter.textContent = ta.value.length + '/' + limit;
  }
  ta.addEventListener('input', sync);
  sync();
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseMoneyInput(str) {
  var n = parseFloat(String(str || '').replace(/,/g, '').trim());
  return isFinite(n) ? n : 0;
}

function formatMoneyInt(n) {
  if (!isFinite(n)) return '0';
  return Math.round(n).toLocaleString('ja-JP');
}

/**
 * 請求日・お支払期限をプレビュー用「YYYY年M月D日」に整形。解釈できない場合は入力のまま返す。
 * @param {string} raw
 * @returns {string}
 */
function formatDateForPreview(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';
  var m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
  if (!m) {
    m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  }
  if (!m) return s;
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10);
  var d = parseInt(m[3], 10);
  var dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return s;
  return y + '年' + mo + '月' + d + '日';
}

function formatYenTotal(n) {
  return '¥' + formatMoneyInt(n) + '-';
}

function taxRateFromSelect(value) {
  if (value === 'PER8R') return 0.08;
  if (value === 'PER10') return 0.1;
  return 0;
}

function accountTypeLabel(value) {
  if (value === 'CHECKING') return '当座';
  return '普通';
}

/**
 * 送付先ラベルまたは取引先名から 宛名 / 敬称 を分解
 * @param {string} rawLine
 * @param {string} honorHidden
 */
function splitClientForPreview(rawLine, honorHidden) {
  var h = String(honorHidden || '').trim();
  var line = String(rawLine || '').trim();
  var name;
  var honor;
  if (!line && !h) {
    return { name: '—', honor: '' };
  }
  if (h) {
    name = line || '—';
    honor = h;
  } else {
    var m = line.match(/^(.+?)\s+(様|御中)$/);
    if (m) {
      name = m[1].trim();
      honor = m[2];
    } else {
      name = line || '—';
      honor = '';
    }
  }
  if (name && name !== '—' && !honor) {
    honor = '御中';
  }
  return { name: name, honor: honor };
}

/** @param {Element | null} el */
function setPreviewHidden(el, hidden) {
  if (!el) return;
  if (hidden) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

var INVOICE_LINES_MAX = 80;

function replaceLineAriaIndex(str, idx) {
  if (!str) return str;
  return str.replace(/明細 \d+/, '明細 ' + idx);
}

function setLineRowIndex(row, idx) {
  var els = row.querySelectorAll('input[name^="lines["], select[name^="lines["]');
  for (var j = 0; j < els.length; j++) {
    var el = els[j];
    var name = el.getAttribute('name');
    if (name) el.setAttribute('name', name.replace(/lines\[\d+\]/, 'lines[' + idx + ']'));
    var al = el.getAttribute('aria-label');
    if (al && /明細 \d+/.test(al)) el.setAttribute('aria-label', replaceLineAriaIndex(al, idx));
  }
  var delBtn = row.querySelector('.del-btn');
  if (delBtn) {
    var dal = delBtn.getAttribute('aria-label');
    if (dal) delBtn.setAttribute('aria-label', replaceLineAriaIndex(dal, idx));
  }
  var amt = row.querySelector('.gc-amount');
  if (amt) {
    amt.id = 'line-form-amount-' + idx;
    var aal = amt.getAttribute('aria-label');
    if (aal) amt.setAttribute('aria-label', replaceLineAriaIndex(aal, idx));
  }
}

function reindexInvoiceLineRows() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return;
  var rows = body.querySelectorAll('.gt-row');
  for (var i = 0; i < rows.length; i++) {
    setLineRowIndex(rows[i], i);
  }
}

function getInvoiceLineCount() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return 0;
  return body.querySelectorAll('.gt-row').length;
}

function cloneEmptyInvoiceLineRow(templateRow) {
  var row = templateRow.cloneNode(true);
  var inputs = row.querySelectorAll('input');
  for (var k = 0; k < inputs.length; k++) {
    inputs[k].value = '';
  }
  var sel = row.querySelector('select');
  if (sel) sel.selectedIndex = 0;
  var combobox = row.querySelector('.combobox-root');
  if (combobox) {
    combobox.removeAttribute('data-combobox-wired');
    resetProductNameComboboxState(combobox);
  }
  return row;
}

/** @param {number} index 挿入位置（0 〜 現在行数。現在行数なら末尾） */
/** @returns {boolean} 挿入に成功したとき true */
function insertInvoiceLineAt(index) {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return false;
  var rows = body.querySelectorAll('.gt-row');
  var n = rows.length;
  if (n >= INVOICE_LINES_MAX) return false;
  if (index < 0 || index > n) return false;
  var template = rows.length ? rows[Math.max(0, n - 1)] : null;
  if (!template) return false;
  var row = cloneEmptyInvoiceLineRow(template);
  if (index < n) {
    body.insertBefore(row, rows[index]);
  } else {
    body.appendChild(row);
  }
  reindexInvoiceLineRows();
  ensureInvoiceLineInserters();
  setInvoiceLineRowsDraggableFalse();
  initProductNameComboboxes(row);
  syncInvoicePreview();
  /* 末尾追加（index === n）のときは最終行直下の隙を開かない。途中挿入のみ新行の下の隙を開く */
  if (index < n) {
    keepRowInserterRevealedAtClickedGap(index + 1);
  }
  return true;
}

/**
 * 指定した隙（data-insert-index）の RowInserter だけを表示し続け、マウスがその領域を出るまで維持する。
 * 途中挿入後は gapIndex = insertBeforeRowIndex + 1（新行の直下の隙）。末尾追加後は呼ばない。
 * DOM 再構築の直後に同期的に付与・focus し、setTimeout による一瞬の非表示を防ぐ。
 */
function keepRowInserterRevealedAtClickedGap(gapIndex) {
  var root = document.getElementById('invoice-lines-data');
  if (!root) return;
  var oldRev = root.querySelectorAll('.row-inserter.row-inserter--revealed');
  for (var r = 0; r < oldRev.length; r++) {
    oldRev[r].classList.remove('row-inserter--revealed');
  }
  var ins = root.querySelector(
    '.row-inserter[data-insert-index="' + gapIndex + '"]'
  );
  if (!ins) return;
  ins.classList.add('row-inserter--revealed');
  function onLeave() {
    ins.classList.remove('row-inserter--revealed');
    /* focus があると :focus-within で表示が残るため、マウスアウト時に外す */
    var b = ins.querySelector('.row-inserter-btn');
    if (b && document.activeElement === b) {
      b.blur();
    }
  }
  ins.addEventListener('mouseleave', onLeave, { once: true });
  var btn = ins.querySelector('.row-inserter-btn');
  if (btn && !btn.disabled) {
    try {
      btn.focus({ preventScroll: true });
    } catch (e) {
      btn.focus();
    }
  }
}

function addInvoiceLineRow() {
  insertInvoiceLineAt(getInvoiceLineCount());
}

/** ドラッグ挿入位置（カーソルより上側の区切りに最も近い行の直前） */
function getInvoiceLineDragInsertBefore(container, draggedRow, y) {
  var rows = container.querySelectorAll('.gt-row');
  var closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  for (var i = 0; i < rows.length; i++) {
    var child = rows[i];
    if (child === draggedRow) continue;
    var box = child.getBoundingClientRect();
    var offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      closest = { offset: offset, element: child };
    }
  }
  return closest.element;
}

function getNextGtRowSibling(el) {
  var n = el.nextSibling;
  while (n) {
    if (n.nodeType === 1 && n.classList && n.classList.contains('gt-row')) return n;
    n = n.nextSibling;
  }
  return null;
}

function resetInvoiceLineRowFlipStyles(body) {
  var rows = body.querySelectorAll(':scope > .gt-row');
  for (var i = 0; i < rows.length; i++) {
    rows[i].style.transition = 'none';
    rows[i].style.transform = '';
  }
  void body.offsetHeight;
}

function collectGtRowRectsMap(body) {
  var rows = body.querySelectorAll(':scope > .gt-row');
  var map = new Map();
  for (var i = 0; i < rows.length; i++) {
    map.set(rows[i], rows[i].getBoundingClientRect());
  }
  return map;
}

/** DOM 入れ替え直後に FLIP で行の縦移動を滑らかにする */
function flipInvoiceLineRowsFromSnapshot(body, beforeMap) {
  if (!beforeMap || !beforeMap.size) return;
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
  } catch (e) {}
  var rows = body.querySelectorAll(':scope > .gt-row');
  var i;
  for (i = 0; i < rows.length; i++) {
    var el = rows[i];
    var fr = beforeMap.get(el);
    if (!fr) continue;
    var ar = el.getBoundingClientRect();
    var dy = fr.top - ar.top;
    if (Math.abs(dy) < 0.5) continue;
    el.style.transition = 'none';
    el.style.transform = 'translate3d(0, ' + dy + 'px, 0)';
  }
  void body.offsetHeight;
  requestAnimationFrame(function () {
    var rows2 = body.querySelectorAll(':scope > .gt-row');
    for (var j = 0; j < rows2.length; j++) {
      var el2 = rows2[j];
      if (!beforeMap.has(el2)) continue;
      el2.style.transition =
        'transform 0.26s cubic-bezier(0.25, 0.46, 0.45, 0.99)';
      el2.style.transform = 'translate3d(0, 0, 0)';
    }
  });
}

/**
 * ポインター Y に応じて明細行を挿入位置へ移す（他行と入れ替わる）。
 * #invoice-lines-data の直子が .gt-row のみのとき（RowInserter を外したあと）で呼ぶ。
 */
function moveInvoiceLineToPointerY(body, row, y) {
  if (!body || !row || !body.contains(row)) return;
  var before = getInvoiceLineDragInsertBefore(body, row, y);
  if (before) {
    if (getNextGtRowSibling(row) !== before) {
      resetInvoiceLineRowFlipStyles(body);
      var snap = collectGtRowRectsMap(body);
      body.insertBefore(row, before);
      flipInvoiceLineRowsFromSnapshot(body, snap);
    }
  } else {
    var rows = body.querySelectorAll(':scope > .gt-row');
    if (!rows.length) return;
    var last = rows[rows.length - 1];
    if (last === row) return;
    resetInvoiceLineRowFlipStyles(body);
    var snap2 = collectGtRowRectsMap(body);
    body.insertBefore(row, last.nextSibling);
    flipInvoiceLineRowsFromSnapshot(body, snap2);
  }
}

function removeInvoiceLineInsertersOnly() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return;
  var ins = body.querySelectorAll('.row-inserter');
  for (var i = 0; i < ins.length; i++) {
    ins[i].remove();
  }
}

function createRowInserterEl(insertIndex, disabled) {
  var d = document.createElement('div');
  d.className = 'row-inserter';
  d.setAttribute('data-insert-index', String(insertIndex));
  d.innerHTML =
    '<div class="row-inserter-area">' +
    '<div class="row-inserter-btn-wrap">' +
    '<button type="button" class="row-inserter-btn" aria-label="この位置に行を追加">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">' +
    '<path fill="currentColor" d="M14.5 26.5C14.5 27.3284 15.1716 28 16 28C16.8284 28 17.5 27.3284 17.5 26.5V17.5H26.5C27.3284 17.5 28 16.8284 28 16C28 15.1716 27.3284 14.5 26.5 14.5H17.5V5.5C17.5 4.67157 16.8284 4 16 4C15.1716 4 14.5 4.67157 14.5 5.5V14.5H5.5C4.67157 14.5 4 15.1716 4 16C4 16.8284 4.67157 17.5 5.5 17.5H14.5V26.5Z"/>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '<div class="row-inserter-line" aria-hidden="true"></div>' +
    '<span class="row-inserter-tooltip">行を追加</span>';
  if (disabled) {
    var b = d.querySelector('.row-inserter-btn');
    if (b) b.disabled = true;
  }
  return d;
}

function ensureInvoiceLineInserters() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return;
  var old = body.querySelectorAll('.row-inserter');
  for (var o = 0; o < old.length; o++) {
    old[o].remove();
  }
  var rows = body.querySelectorAll('.gt-row');
  var n = rows.length;
  var atMax = n >= INVOICE_LINES_MAX;
  for (var k = 0; k < n; k++) {
    body.insertBefore(createRowInserterEl(k, atMax), rows[k]);
  }
  body.appendChild(createRowInserterEl(n, atMax));
}

function setInvoiceLineRowsDraggableFalse() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return;
  var rows = body.querySelectorAll('.gt-row');
  for (var i = 0; i < rows.length; i++) {
    rows[i].setAttribute('draggable', 'false');
  }
}

function wireInvoiceLinesDragHandlesAria() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return;
  var id = 'invoice-dnd-described-by';
  var btns = body.querySelectorAll('.dh-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].setAttribute('aria-describedby', id);
  }
}

var invoiceLinePtrState = {
  row: null,
  move: null,
  up: null,
  raf: null,
  pendingY: null,
};

function wireInvoiceLinesPointerDrag() {
  var body = document.getElementById('invoice-lines-data');
  if (!body) return;

  function clearDragClasses() {
    body.classList.remove('is-line-drag-active');
    var all = body.querySelectorAll('.gt-row');
    for (var i = 0; i < all.length; i++) {
      all[i].classList.remove('is-active', 'is-dragging-other');
      all[i].style.transition = '';
      all[i].style.transform = '';
    }
    var ins = body.querySelectorAll('.row-inserter');
    for (var j = 0; j < ins.length; j++) {
      ins[j].style.display = '';
    }
  }

  function onPtrMove(e) {
    if (!invoiceLinePtrState.row) return;
    invoiceLinePtrState.pendingY = e.clientY;
    if (invoiceLinePtrState.raf) return;
    invoiceLinePtrState.raf = requestAnimationFrame(function () {
      invoiceLinePtrState.raf = null;
      var y = invoiceLinePtrState.pendingY;
      if (y == null || !invoiceLinePtrState.row) return;
      moveInvoiceLineToPointerY(body, invoiceLinePtrState.row, y);
    });
  }

  function onPtrUp(e) {
    document.removeEventListener('pointermove', invoiceLinePtrState.move);
    document.removeEventListener('pointerup', invoiceLinePtrState.up);
    document.removeEventListener('pointercancel', invoiceLinePtrState.up);

    if (invoiceLinePtrState.raf) {
      cancelAnimationFrame(invoiceLinePtrState.raf);
      invoiceLinePtrState.raf = null;
    }
    invoiceLinePtrState.pendingY = null;

    var row = invoiceLinePtrState.row;
    invoiceLinePtrState.row = null;
    invoiceLinePtrState.move = null;
    invoiceLinePtrState.up = null;

    if (!row || !body.contains(row)) {
      body.classList.remove('is-line-drag-active');
      return;
    }

    clearDragClasses();

    moveInvoiceLineToPointerY(body, row, e.clientY);

    reindexInvoiceLineRows();
    ensureInvoiceLineInserters();
    wireInvoiceLinesDragHandlesAria();
    setInvoiceLineRowsDraggableFalse();
    syncInvoicePreview();

    var live = document.getElementById('invoice-dnd-live');
    if (live) live.textContent = '行の並び替えを完了しました';
  }

  body.addEventListener(
    'pointerdown',
    function (e) {
      if (!(e.target instanceof Element)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var btn = e.target.closest('.dh-btn');
      if (!btn || !body.contains(btn)) return;
      var row = btn.closest('.gt-row');
      if (!row || !body.contains(row)) return;
      e.preventDefault();

      removeInvoiceLineInsertersOnly();

      body.classList.add('is-line-drag-active');

      invoiceLinePtrState.row = row;

      row.classList.add('is-active');
      var others = body.querySelectorAll('.gt-row');
      for (var i = 0; i < others.length; i++) {
        if (others[i] !== row) others[i].classList.add('is-dragging-other');
      }

      var live = document.getElementById('invoice-dnd-live');
      if (live) live.textContent = '行の並び替えを開始しました';

      invoiceLinePtrState.move = onPtrMove;
      invoiceLinePtrState.up = onPtrUp;
      document.addEventListener('pointermove', onPtrMove);
      document.addEventListener('pointerup', onPtrUp);
      document.addEventListener('pointercancel', onPtrUp);
    },
    true
  );
}

function initInvoiceLinesRowActions() {
  var addBtn = document.querySelector('[data-pendo="button-add-line"]');
  if (addBtn) {
    addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      addInvoiceLineRow();
    });
  }
  var form = document.getElementById('invoice-create-form');
  var body = document.getElementById('invoice-lines-data');
  if (!form || !body) return;
  form.addEventListener(
    'click',
    function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var del = t.closest('.del-btn');
      if (!del || !body.contains(del)) return;
      e.preventDefault();
      var row = del.closest('.gt-row');
      if (!row) return;
      if (body.querySelectorAll('.gt-row').length <= 1) return;
      row.remove();
      reindexInvoiceLineRows();
      ensureInvoiceLineInserters();
      wireInvoiceLinesDragHandlesAria();
      setInvoiceLineRowsDraggableFalse();
      syncInvoicePreview();
    },
    true
  );

  body.addEventListener(
    'click',
    function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      var btn = t.closest('.row-inserter-btn');
      if (!btn || btn.disabled) return;
      var ins = btn.closest('.row-inserter');
      if (!ins || !body.contains(ins)) return;
      e.preventDefault();
      var idx = parseInt(ins.getAttribute('data-insert-index'), 10);
      if (isNaN(idx)) return;
      if (!insertInvoiceLineAt(idx)) return;
    },
    true
  );

  ensureInvoiceLineInserters();
  wireInvoiceLinesPointerDrag();
  wireInvoiceLinesDragHandlesAria();
  setInvoiceLineRowsDraggableFalse();
}

function syncInvoicePreview() {
  var form = document.getElementById('invoice-create-form');
  if (!form) return;

  var accrual = document.getElementById('accrualDate');
  var due = document.getElementById('dueDate');
  var invNo = document.getElementById('invoiceNumber');
  var subject = document.getElementById('subject');
  var ownName = document.getElementById('ownCompany-companyName');
  var ownReg = document.getElementById('ownCompany-registrationNumber');
  var note = document.getElementById('note-input');

  var elDate = document.getElementById('preview-doc-date');
  var elInvNo = document.getElementById('preview-doc-invoice-no');
  var elClientName = document.getElementById('preview-client-name');
  var elClientHonor = document.getElementById('preview-client-honor');
  var elSubject = document.getElementById('preview-subject');
  var elTotalYen = document.getElementById('preview-total-yen');
  var elDue = document.getElementById('preview-due-date');
  var elOwnName = document.getElementById('preview-own-name');
  var elOwnAddr = document.getElementById('preview-own-address');
  var elOwnTf = document.getElementById('preview-own-tel-fax');
  var elOwnMail = document.getElementById('preview-own-email');
  var elOwnReg = document.getElementById('preview-own-reg');
  var tbody = document.getElementById('preview-detail-tbody');
  var elSub = document.getElementById('preview-sum-subtotal');
  var elTax = document.getElementById('preview-sum-tax');
  var elTot = document.getElementById('preview-sum-total');
  var elT10b = document.getElementById('preview-tax10-base');
  var elT10t = document.getElementById('preview-tax10-amount');
  var elT8b = document.getElementById('preview-tax8-base');
  var elT8t = document.getElementById('preview-tax8-amount');
  var elNote = document.getElementById('preview-note');
  var elBank = document.getElementById('preview-bank-lines');
  var elReduced = document.getElementById('preview-reduced-tax-note');

  if (!elDate) return;

  var tplSel = document.getElementById('invoice-template-select');
  var isWindowed = tplSel && tplSel.value === 'WINDOWED';
  var layoutDefault = document.getElementById('preview-layout-default');
  var layoutWindowed = document.getElementById('preview-layout-windowed');
  if (layoutDefault) layoutDefault.hidden = isWindowed;
  if (layoutWindowed) layoutWindowed.hidden = !isWindowed;

  var previewMain = elDate.closest('.inv-inv-main');

  var hasDate = accrual && accrual.value.trim();
  if (elDate) {
    elDate.textContent = hasDate ? formatDateForPreview(accrual.value) : '';
    setPreviewHidden(elDate, !hasDate);
  }

  var hasInvNo = invNo && invNo.value.trim();
  if (elInvNo) {
    elInvNo.textContent = hasInvNo ? '請求書番号：' + hasInvNo : '';
    setPreviewHidden(elInvNo, !hasInvNo);
  }

  var headerInfo = elDate.parentElement;
  if (headerInfo && headerInfo.classList.contains('inv-inv-header-info')) {
    setPreviewHidden(headerInfo, !hasDate && !hasInvNo);
  }

  var elWDate = document.getElementById('preview-w-doc-date');
  var elWInvNo = document.getElementById('preview-w-doc-invoice-no');
  var wDocMeta = document.querySelector('.inv-inv-windowed-doc-meta');
  if (elWDate) {
    elWDate.textContent = hasDate ? formatDateForPreview(accrual.value) : '';
    setPreviewHidden(elWDate, !hasDate);
  }
  if (elWInvNo) {
    elWInvNo.textContent = hasInvNo ? '請求書番号：' + invNo : '';
    setPreviewHidden(elWInvNo, !hasInvNo);
  }
  if (wDocMeta) setPreviewHidden(wDocMeta, !hasDate && !hasInvNo);

  var hasDue = due && due.value.trim();
  if (elDue) {
    elDue.textContent = hasDue ? formatDateForPreview(due.value) : '';
  }
  var elWDue = document.getElementById('preview-w-due-date');
  if (elWDue) {
    elWDue.textContent = hasDue ? formatDateForPreview(due.value) : '';
  }
  var dueRows = previewMain ? previewMain.querySelectorAll('.inv-inv-payment-due-row') : [];
  for (var dri = 0; dri < dueRows.length; dri++) {
    setPreviewHidden(dueRows[dri], !hasDue);
  }

  var hasSubject = subject && subject.value.trim();
  if (elSubject) {
    elSubject.textContent = hasSubject || '';
    setPreviewHidden(elSubject.closest('.inv-inv-subject-row'), !hasSubject);
  }
  var elWSubject = document.getElementById('preview-w-subject');
  if (elWSubject) {
    elWSubject.textContent = hasSubject || '';
    setPreviewHidden(elWSubject.closest('.inv-inv-subject-row'), !hasSubject);
  }

  var ddIn = form.querySelector('input[name="client.deliveryDestinationName"]');
  var ddVal = ddIn && ddIn.value.trim();
  var cnIn = form.querySelector('input[name="client.clientName"]');
  var honIn = form.querySelector('input[name="client.honorific"]');
  var recClient = splitClientForPreview(cnIn ? cnIn.value : '', honIn ? honIn.value : '');
  var recDd = ddVal ? splitClientForPreview(ddVal, '') : { name: '—', honor: '' };

  if (elClientName) elClientName.textContent = recClient.name === '—' ? '' : recClient.name;
  if (elClientHonor) {
    elClientHonor.textContent = recClient.honor ? recClient.honor : '';
  }
  var elClientHonorSpace = document.getElementById('preview-client-honor-space');
  if (elClientHonorSpace) {
    if (recClient.honor) {
      elClientHonorSpace.textContent = '\u0020';
      elClientHonorSpace.removeAttribute('hidden');
    } else {
      elClientHonorSpace.textContent = '';
      elClientHonorSpace.setAttribute('hidden', '');
    }
  }
  var hasClientParty =
    recClient.name !== '—' || !!(recClient.honor && String(recClient.honor).trim());
  var clientBlock = document.getElementById('preview-client-block');
  setPreviewHidden(clientBlock, !hasClientParty);

  var elDelName = document.getElementById('preview-delivery-name');
  var elDelHonor = document.getElementById('preview-delivery-honor');
  if (elDelName) elDelName.textContent = recDd.name === '—' ? '' : recDd.name;
  if (elDelHonor) {
    elDelHonor.textContent = recDd.honor ? recDd.honor : '';
  }
  var elDelHonorSpace = document.getElementById('preview-delivery-honor-space');
  if (elDelHonorSpace) {
    if (recDd.honor) {
      elDelHonorSpace.textContent = '\u0020';
      elDelHonorSpace.removeAttribute('hidden');
    } else {
      elDelHonorSpace.textContent = '';
      elDelHonorSpace.setAttribute('hidden', '');
    }
  }
  var hasDeliveryParty = recDd.name !== '—' || !!(recDd.honor && String(recDd.honor).trim());
  var deliveryBlock = document.getElementById('preview-delivery-block');
  setPreviewHidden(deliveryBlock, !hasDeliveryParty);

  var partiesWrap = document.getElementById('preview-parties-wrap');
  setPreviewHidden(partiesWrap, !hasClientParty && !hasDeliveryParty);

  var greetEls = previewMain ? previewMain.querySelectorAll('.inv-inv-greeting') : [];
  for (var gi = 0; gi < greetEls.length; gi++) {
    setPreviewHidden(greetEls[gi], !hasClientParty && !hasDeliveryParty);
  }

  var envAddr = document.getElementById('preview-env-address-block');
  if (envAddr) {
    var cPost = (form.querySelector('input[name="client.postCode"]') || {}).value || '';
    var cA1 = (form.querySelector('input[name="client.address1"]') || {}).value || '';
    var cA2 = (form.querySelector('input[name="client.address2"]') || {}).value || '';
    var envParts = [];
    if (cPost) envParts.push('<p>〒' + escapeHtml(String(cPost).trim()) + '</p>');
    String(cA1 || '')
      .split(/\r\n|\n|\r/)
      .forEach(function (line) {
        var t = line.trim();
        if (t) envParts.push('<p>' + escapeHtml(t) + '</p>');
      });
    String(cA2 || '')
      .split(/\r\n|\n|\r/)
      .forEach(function (line) {
        var t = line.trim();
        if (t) envParts.push('<p>' + escapeHtml(t) + '</p>');
      });
    envAddr.innerHTML = envParts.join('');
  }
  var envClient = document.getElementById('preview-env-client');
  var envHonor = document.getElementById('preview-env-honor');
  if (envClient) envClient.textContent = recClient.name === '—' ? '' : recClient.name;
  if (envHonor) {
    if (ddVal) {
      envHonor.textContent = '';
      envHonor.setAttribute('hidden', '');
    } else {
      envHonor.textContent = recClient.honor ? recClient.honor : '';
      if (recClient.honor) envHonor.removeAttribute('hidden');
      else envHonor.setAttribute('hidden', '');
    }
  }
  var envDel = document.getElementById('preview-env-delivery');
  if (envDel) {
    var dName = recDd.name !== '—' ? recDd.name : '';
    var dHon = recDd.honor ? String(recDd.honor).trim() : '';
    envDel.textContent = dName + (dName && dHon ? ' ' : '') + dHon;
    setPreviewHidden(envDel, !dName && !dHon);
  }

  var hasOwnName = ownName && ownName.value.trim();
  if (elOwnName) {
    elOwnName.textContent = hasOwnName || '';
    setPreviewHidden(elOwnName, !hasOwnName);
  }

  var post = (form.querySelector('input[name="ownCompany.postCode"]') || {}).value || '';
  var a1 = (form.querySelector('input[name="ownCompany.address1"]') || {}).value || '';
  var a2 = (form.querySelector('input[name="ownCompany.address2"]') || {}).value || '';
  var tel = (form.querySelector('input[name="ownCompany.tel"]') || {}).value || '';
  var fax = (form.querySelector('input[name="ownCompany.fax"]') || {}).value || '';
  var mail = (form.querySelector('input[name="ownCompany.email"]') || {}).value || '';

  if (elOwnAddr) {
    if (post || a1 || a2) {
      elOwnAddr.innerHTML =
        escapeHtml('〒' + post) +
        '<br />' +
        escapeHtml(a1 || '') +
        (a2 ? '<br />' + escapeHtml(a2) : '');
      setPreviewHidden(elOwnAddr, false);
    } else {
      elOwnAddr.innerHTML = '';
      setPreviewHidden(elOwnAddr, true);
    }
  }
  if (elOwnTf) {
    if (tel || fax) {
      var tfParts = [];
      if (tel) tfParts.push('TEL: ' + escapeHtml(tel));
      if (fax) tfParts.push('FAX: ' + escapeHtml(fax));
      elOwnTf.innerHTML = tfParts.join('<br />');
      setPreviewHidden(elOwnTf, false);
    } else {
      elOwnTf.innerHTML = '';
      setPreviewHidden(elOwnTf, true);
    }
  }
  if (elOwnMail) {
    elOwnMail.textContent = mail || '';
    setPreviewHidden(elOwnMail, !String(mail || '').trim());
  }

  var hasReg = ownReg && ownReg.value.trim();
  if (elOwnReg) {
    elOwnReg.textContent = hasReg || '';
    setPreviewHidden(elOwnReg.closest('.inv-inv-registration-row'), !hasReg);
  }

  var wName = document.getElementById('preview-w-own-name');
  var wAddr = document.getElementById('preview-w-own-address');
  var wTf = document.getElementById('preview-w-own-tel-fax');
  var wMail = document.getElementById('preview-w-own-email');
  var wReg = document.getElementById('preview-w-own-reg');
  if (wName && elOwnName) {
    wName.textContent = hasOwnName || '';
    setPreviewHidden(wName, !hasOwnName);
  }
  if (wAddr && elOwnAddr) {
    wAddr.innerHTML = elOwnAddr.innerHTML;
    setPreviewHidden(wAddr, elOwnAddr.hasAttribute('hidden'));
  }
  if (wTf && elOwnTf) {
    wTf.innerHTML = elOwnTf.innerHTML;
    setPreviewHidden(wTf, elOwnTf.hasAttribute('hidden'));
  }
  if (wMail && elOwnMail) {
    wMail.textContent = elOwnMail.textContent;
    setPreviewHidden(wMail, elOwnMail.hasAttribute('hidden'));
  }
  if (wReg && elOwnReg) {
    wReg.textContent = elOwnReg.textContent;
    var wRegRow = wReg.closest('.inv-inv-registration-row');
    setPreviewHidden(wRegRow, !hasReg);
  }

  var subtotal = 0;
  var taxTotal = 0;
  var base10 = 0;
  var tax10 = 0;
  var base8 = 0;
  var tax8 = 0;
  var has8 = false;
  var rowsHtml = [];

  var lineCount = getInvoiceLineCount();
  for (var i = 0; i < lineCount; i++) {
    var nameEl = form.querySelector('[name="lines[' + i + '].productName"]');
    var qtyEl = form.querySelector('[name="lines[' + i + '].productQuantity"]');
    var unitEl = form.querySelector('[name="lines[' + i + '].productUnit"]');
    var priceEl = form.querySelector('[name="lines[' + i + '].productPrice"]');
    var taxEl = form.querySelector('[name="lines[' + i + '].consumptionTaxRate"]');
    var pname = nameEl ? nameEl.value.trim() : '';
    var qty = qtyEl ? qtyEl.value.trim() : '';
    var unit = unitEl ? unitEl.value.trim() : '';
    var price = priceEl ? parseMoneyInput(priceEl.value) : 0;
    var qtyN = parseMoneyInput(qty);
    var rate = taxEl ? taxRateFromSelect(taxEl.value) : 0;

    var amount = Math.round(qtyN * price);
    var lineTax = rate > 0 ? Math.round(amount * rate) : 0;

    if (pname || qty || unit || price !== 0 || amount !== 0) {
      if (rate === 0.08) has8 = true;
      subtotal += amount;
      taxTotal += lineTax;
      if (rate === 0.1) {
        base10 += amount;
        tax10 += lineTax;
      } else if (rate === 0.08) {
        base8 += amount;
        tax8 += lineTax;
      }
    }

    var isReduced8 = taxEl && taxEl.value === 'PER8R';
    var nameCell = pname ? escapeHtml(pname) + (isReduced8 ? '※' : '') : '';
    var qtyDisp = '';
    if (qty || unit) {
      qtyDisp = escapeHtml((qty || '0') + (unit || ''));
    } else if (qty) {
      qtyDisp = escapeHtml(qty);
    }
    var priceCell = priceEl && priceEl.value.trim() ? escapeHtml(priceEl.value.trim()) : '';
    var amountCell =
      pname || qty || unit || price !== 0 || amount !== 0 ? formatMoneyInt(amount) : '';

    var lineFormAmt = document.getElementById('line-form-amount-' + i);
    if (lineFormAmt) lineFormAmt.textContent = amountCell;

    rowsHtml.push(
      '<tr><td class="inv-inv-td-name">' +
        nameCell +
        '</td><td class="inv-inv-td-qty">' +
        qtyDisp +
        '</td><td class="inv-inv-td-price">' +
        priceCell +
        '</td><td class="inv-inv-td-amount">' +
        amountCell +
        '</td></tr>'
    );
  }

  if (tbody) tbody.innerHTML = rowsHtml.join('');

  var grand = subtotal + taxTotal;
  if (elTotalYen) elTotalYen.textContent = formatYenTotal(grand);
  var elWTotalYen = document.getElementById('preview-w-total-yen');
  if (elWTotalYen) elWTotalYen.textContent = formatYenTotal(grand);
  var totalBars = previewMain ? previewMain.querySelectorAll('.inv-inv-total-amount-bar') : [];
  for (var tbi = 0; tbi < totalBars.length; tbi++) {
    setPreviewHidden(totalBars[tbi], grand === 0);
  }

  if (elSub) elSub.textContent = formatMoneyInt(subtotal);
  if (elTax) elTax.textContent = formatMoneyInt(taxTotal);
  if (elTot) elTot.textContent = formatMoneyInt(grand);
  if (elT10b) elT10b.textContent = formatMoneyInt(base10);
  if (elT10t) elT10t.textContent = formatMoneyInt(tax10);
  if (elT8b) elT8b.textContent = formatMoneyInt(base8);
  if (elT8t) elT8t.textContent = formatMoneyInt(tax8);

  if (elReduced) {
    elReduced.classList.toggle('is-empty', !has8);
  }

  var tax8Row = document.getElementById('preview-tax8-breakdown-row');
  setPreviewHidden(tax8Row, !has8);

  var noteText = note ? note.value.trim() : '';
  if (elNote) elNote.textContent = noteText;
  setPreviewHidden(elNote, !noteText);

  var bankParts = [];
  for (var b = 0; b < 3; b++) {
    var bn = form.querySelector('[name="ownBanks[' + b + '].bankName"]');
    var br = form.querySelector('[name="ownBanks[' + b + '].bankBranchName"]');
    var tp = form.querySelector('[name="ownBanks[' + b + '].bankAccountType"]');
    var num = form.querySelector('[name="ownBanks[' + b + '].bankAccountNumber"]');
    var an = form.querySelector('[name="ownBanks[' + b + '].bankAccountName"]');
    var hasNonSelect =
      (bn && bn.value.trim()) ||
      (br && br.value.trim()) ||
      (num && num.value.trim()) ||
      (an && an.value.trim());
    if (!hasNonSelect) continue;
    var segs = [];
    if (bn && bn.value.trim()) segs.push(bn.value.trim());
    if (br && br.value.trim()) segs.push(br.value.trim());
    if (tp && tp.value) segs.push(accountTypeLabel(tp.value));
    if (num && num.value.trim()) segs.push(num.value.trim());
    if (an && an.value.trim()) segs.push(an.value.trim());
    bankParts.push('<p>' + escapeHtml(segs.join(' ')) + '</p>');
  }
  if (elBank) {
    elBank.innerHTML = bankParts.length ? bankParts.join('') : '';
  }
  setPreviewHidden(elBank && elBank.closest('.inv-inv-bank-section'), bankParts.length === 0);

  var footerSpans = form.querySelectorAll('.lines-footer-summary .la-dd span');
  if (footerSpans[0]) footerSpans[0].textContent = formatMoneyInt(subtotal);
  if (footerSpans[1]) footerSpans[1].textContent = formatMoneyInt(taxTotal);
  if (footerSpans[2]) footerSpans[2].textContent = formatMoneyInt(grand);

  var submitVals = form.querySelectorAll('.inv-submit-bar .inv-submit-amount-value');
  if (submitVals[0]) submitVals[0].textContent = formatMoneyInt(subtotal);
  if (submitVals[1]) submitVals[1].textContent = formatMoneyInt(taxTotal);
  var sumVal = form.querySelector('.inv-submit-bar .inv-submit-amount-sum-value');
  if (sumVal) sumVal.textContent = formatMoneyInt(grand);
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function parseDateYMDInput(str) {
  var s = String(str || '').trim();
  var m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10);
  var d = parseInt(m[3], 10);
  var dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { y: y, m: mo, d: d };
}

function setDatePickerOpen(root, open) {
  var content = root.querySelector('.dp-content');
  var trigger = root.querySelector('[data-dp-trigger]');
  root.setAttribute('data-state', open ? 'open' : 'closed');
  if (content) content.setAttribute('data-state', open ? 'open' : 'closed');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/** 描画後: 入力値と一致する日があればそのボタンへフォーカス、なければダイアログ本体 */
function focusDatePickerContentOrSelected(root) {
  var content = root.querySelector('.dp-content');
  var selectedBtn = root.querySelector('.dp-cell-button[data-selected]');
  try {
    if (selectedBtn && typeof selectedBtn.focus === 'function') {
      selectedBtn.focus();
    } else if (content && typeof content.focus === 'function') {
      content.focus();
    }
  } catch (e) {}
}

function closeAllDatePickers() {
  document.querySelectorAll('.invoice-date-picker-root[data-state="open"]').forEach(function (r) {
    setDatePickerOpen(r, false);
  });
}

function renderDatePickerCalendar(root) {
  var y = parseInt(root.getAttribute('data-dp-year'), 10);
  var m = parseInt(root.getAttribute('data-dp-month'), 10);
  var rangeBtn = root.querySelector('[data-dp-range-text]');
  var tbody = root.querySelector('[data-dp-calendar-body]');
  var input = root.querySelector('input[type="text"]');
  if (!tbody || isNaN(y) || isNaN(m)) return;
  if (rangeBtn) rangeBtn.textContent = y + '年' + m + '月';
  tbody.innerHTML = '';
  var firstDay = new Date(y, m - 1, 1);
  var lastDay = new Date(y, m, 0);
  var startDow = firstDay.getDay();
  var daysInMonth = lastDay.getDate();
  var today = new Date();
  var todayStr = today.getFullYear() + '/' + pad2(today.getMonth() + 1) + '/' + pad2(today.getDate());
  var selectedRaw = input && input.value ? String(input.value).trim() : '';
  var parsedSel = selectedRaw ? parseDateYMDInput(selectedRaw) : null;
  var selectedNorm = parsedSel
    ? parsedSel.y + '/' + pad2(parsedSel.m) + '/' + pad2(parsedSel.d)
    : '';
  var day = 1;
  for (var row = 0; row < 6; row++) {
    if (day > daysInMonth) break;
    var tr = document.createElement('tr');
    for (var col = 0; col < 7; col++) {
      var td = document.createElement('td');
      if ((row === 0 && col < startDow) || day > daysInMonth) {
        td.textContent = '';
      } else {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dp-cell-button';
        btn.textContent = String(day);
        var dateStr = y + '/' + pad2(m) + '/' + pad2(day);
        if (dateStr === todayStr) btn.setAttribute('data-today', '');
        if (selectedNorm && dateStr === selectedNorm) btn.setAttribute('data-selected', '');
        (function (ds) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            selectDatePickerValue(root, ds);
          });
        })(dateStr);
        td.appendChild(btn);
        day++;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function selectDatePickerValue(root, dateStr) {
  var input = root.querySelector('input[type="text"]');
  if (input) {
    input.value = dateStr;
    dispatchFormFieldSync(input);
  }
  setDatePickerOpen(root, false);
}

function toggleDatePicker(root) {
  var isOpen = root.getAttribute('data-state') === 'open';
  if (isOpen) {
    setDatePickerOpen(root, false);
    return;
  }
  closeAllDatePickers();
  var input = root.querySelector('input[type="text"]');
  var parsed = input && parseDateYMDInput(input.value);
  var now = new Date();
  var y = parsed ? parsed.y : now.getFullYear();
  var mo = parsed ? parsed.m : now.getMonth() + 1;
  root.setAttribute('data-dp-year', String(y));
  root.setAttribute('data-dp-month', String(mo));
  setDatePickerOpen(root, true);
  renderDatePickerCalendar(root);
  focusDatePickerContentOrSelected(root);
}

function shiftDpMonth(root, delta) {
  var y = parseInt(root.getAttribute('data-dp-year'), 10);
  var mo = parseInt(root.getAttribute('data-dp-month'), 10);
  if (isNaN(y) || isNaN(mo)) return;
  mo += delta;
  if (mo > 12) {
    mo = 1;
    y++;
  }
  if (mo < 1) {
    mo = 12;
    y--;
  }
  root.setAttribute('data-dp-year', String(y));
  root.setAttribute('data-dp-month', String(mo));
  renderDatePickerCalendar(root);
  if (root.getAttribute('data-state') === 'open') {
    focusDatePickerContentOrSelected(root);
  }
}

function formatDateFieldOnBlur(el) {
  if (!(el instanceof HTMLInputElement)) return;
  var trimmed = el.value.trim();
  el.value = trimmed;
  var match = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return;
  var y = parseInt(match[1], 10);
  var mo = parseInt(match[2], 10);
  var d = parseInt(match[3], 10);
  var date = new Date(y, mo - 1, d);
  if (date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d) {
    el.value = y + '/' + pad2(mo) + '/' + pad2(d);
    dispatchFormFieldSync(el);
  }
}

function initClientCreateDialog() {
  var dlg = document.getElementById('client-form-dialog');
  var openBtn = document.getElementById('client-create-dialog-open');
  var cancelBtn = document.getElementById('client-create-dialog-cancel');
  var form = document.getElementById('client-create');
  if (!dlg || typeof dlg.showModal !== 'function') return;

  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dlg.showModal();
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      dlg.close();
    });
  }
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      dlg.close();
    });
  }
}

function syncClientUpdateDialogFromMainForm() {
  var main = document.getElementById('invoice-create-form');
  if (!main) return;
  var cn = main.querySelector('input[name="client.clientName"]');
  var hon = main.querySelector('input[name="client.honorific"]');
  var sid = main.querySelector('input[name="client.sharedMasterId"]');
  var nameIn = document.getElementById('client-update-name');
  var nickIn = document.getElementById('client-update-nickname');
  var honSel = document.getElementById('client-update-honorific');
  var dlgForm = document.getElementById('client-update');
  if (!dlgForm) return;
  var hidSid = dlgForm.querySelector('input[name="sharedMasterId"]');
  var hidVer = dlgForm.querySelector('input[name="sharedMasterRowVersion"]');
  var v = cn ? String(cn.value || '').trim() : '';
  if (nameIn) nameIn.value = v;
  if (nickIn) nickIn.value = v;
  if (honSel && hon) honSel.value = String(hon.value || '');
  if (hidSid && sid) hidSid.value = String(sid.value || '');
  if (hidVer) hidVer.value = '';
}

function applyClientUpdateDialogToMainForm() {
  var main = document.getElementById('invoice-create-form');
  if (!main) return;
  var nameIn = document.getElementById('client-update-name');
  var nickIn = document.getElementById('client-update-nickname');
  var honSel = document.getElementById('client-update-honorific');
  var dlgForm = document.getElementById('client-update');
  var dlgSid = dlgForm ? dlgForm.querySelector('input[name="sharedMasterId"]') : null;
  var hidName = main.querySelector('input[name="client.clientName"]');
  var hidHon = main.querySelector('input[name="client.honorific"]');
  var hidSid = main.querySelector('input[name="client.sharedMasterId"]');
  var legal = nameIn ? String(nameIn.value || '').trim() : '';
  var nick = nickIn ? String(nickIn.value || '').trim() : '';
  var display = nick || legal;
  if (hidName) hidName.value = display;
  if (hidHon && honSel) hidHon.value = String(honSel.value || '');
  if (hidSid && dlgSid) hidSid.value = String(dlgSid.value || '');
  var trigger = document.getElementById('client-select-trigger');
  if (trigger && display) {
    trigger.textContent = display;
    trigger.classList.remove('placeholder');
  }
  if (hidName) dispatchFormFieldSync(hidName);
  if (hidHon) dispatchFormFieldSync(hidHon);
  syncInvoicePreview();
}

var DD_CREATE_ICON_IMG = {
  INDIVIDUAL:
    '<img class="dd-create-icon-img" src="img/people.svg" alt="" width="20" height="20" decoding="async" />',
  GROUP:
    '<img class="dd-create-icon-img" src="img/people-group.svg" alt="" width="20" height="20" decoding="async" />',
  ORGANIZATION:
    '<img class="dd-create-icon-img" src="img/building.svg" alt="" width="20" height="20" decoding="async" />',
};

function setDdCreateIconType(type) {
  var hidden = document.getElementById('dd-create-type');
  var display = document.getElementById('dd-create-icon-display');
  var trigger = document.getElementById('dd-create-icon-trigger');
  var t = type === 'GROUP' || type === 'ORGANIZATION' ? type : 'INDIVIDUAL';
  if (hidden) hidden.value = t;
  if (display) display.innerHTML = DD_CREATE_ICON_IMG[t] || DD_CREATE_ICON_IMG.INDIVIDUAL;
  if (trigger) {
    trigger.setAttribute('value', t);
    var al =
      t === 'GROUP' ? 'アイコン（グループ）' : t === 'ORGANIZATION' ? 'アイコン（法人）' : 'アイコン（個人）';
    trigger.setAttribute('aria-label', al);
  }
}

function initDeliveryDestinationCreateDialog() {
  var dlg = document.getElementById('dd-create-form-dialog');
  var form = document.getElementById('delivery-destination-create');
  var cancelBtn = document.getElementById('dd-create-dialog-cancel');
  var iconTrigger = document.getElementById('dd-create-icon-trigger');
  var iconMenu = document.getElementById('dd-create-icon-menu');
  var iconPicker = document.querySelector('.dd-create-icon-picker');
  if (!dlg || typeof dlg.showModal !== 'function' || !form) return;

  function setIconMenuOpen(open) {
    if (!iconMenu || !iconTrigger) return;
    iconMenu.hidden = !open;
    iconTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function syncDdCreateDialogHeader() {
    var cn = document.querySelector('input[name="client.clientName"]');
    var nickEl = document.getElementById('dd-create-dialog-client-nick');
    var v = cn ? String(cn.value || '').trim() : '';
    if (nickEl) nickEl.textContent = v ? '（' + v + '）' : '';
  }

  function syncDdCreateClientId() {
    var cid = document.getElementById('dd-create-client-id');
    var sid = document.querySelector('input[name="client.sharedMasterId"]');
    var id = sid ? String(sid.value || '').trim() : '';
    if (cid) cid.value = id;
    var base = '/resource/delivery-destination/create-dialog/';
    form.setAttribute('action', id ? base + encodeURIComponent(id) : '/resource/delivery-destination/create-dialog');
  }

  function openDialog() {
    if (invoiceMenuAnchors.closeDd) invoiceMenuAnchors.closeDd();
    setIconMenuOpen(false);
    form.reset();
    setDdCreateIconType('INDIVIDUAL');
    syncDdCreateDialogHeader();
    syncDdCreateClientId();
    dlg.showModal();
    var first = document.getElementById('dd-create-name');
    if (first) {
      window.setTimeout(function () {
        first.focus();
      }, 0);
    }
  }

  function applyDdCreateToMainForm() {
    var nameTa = document.getElementById('dd-create-name');
    var raw = nameTa ? String(nameTa.value || '').trim() : '';
    if (!raw) return false;
    var label = raw.split('\n')[0].trim() || raw;
    var trigger = document.getElementById('dd-select-trigger');
    var hiddenName = document.querySelector('input[name="client.deliveryDestinationName"]');
    var hiddenId = document.querySelector('input[name="client.deliveryDestinationId"]');
    var editBtn = document.getElementById('dd-edit-button');
    if (trigger) {
      trigger.textContent = label;
      trigger.classList.remove('placeholder');
    }
    if (hiddenName) hiddenName.value = label;
    if (hiddenId) hiddenId.value = '';
    if (hiddenName) dispatchFormFieldSync(hiddenName);
    if (hiddenId) dispatchFormFieldSync(hiddenId);
    if (editBtn) editBtn.hidden = false;
    syncInvoicePreview();
    return true;
  }

  document.querySelectorAll('.js-dd-create-dialog-open').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openDialog();
    });
  });

  if (iconTrigger && iconMenu) {
    iconTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setIconMenuOpen(iconMenu.hidden);
    });
    iconMenu.querySelectorAll('[data-dd-icon-type]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var t = item.getAttribute('data-dd-icon-type');
        setDdCreateIconType(t);
        setIconMenuOpen(false);
        iconTrigger.focus();
      });
    });
  }

  document.addEventListener(
    'mousedown',
    function (e) {
      var t = e.target;
      if (!(t instanceof Node)) return;
      if (!iconMenu || iconMenu.hidden) return;
      if (iconPicker && iconPicker.contains(t)) return;
      setIconMenuOpen(false);
    },
    true
  );

  dlg.addEventListener('cancel', function (e) {
    if (iconMenu && !iconMenu.hidden) {
      e.preventDefault();
      setIconMenuOpen(false);
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      setIconMenuOpen(false);
      dlg.close();
    });
  }
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!applyDdCreateToMainForm()) return;
    setIconMenuOpen(false);
    dlg.close();
  });
}

function setDdUpdateIconType(type) {
  var hidden = document.getElementById('dd-update-type');
  var display = document.getElementById('dd-update-icon-display');
  var trigger = document.getElementById('dd-update-icon-trigger');
  var t = type === 'GROUP' || type === 'ORGANIZATION' ? type : 'INDIVIDUAL';
  if (hidden) hidden.value = t;
  if (display) display.innerHTML = DD_CREATE_ICON_IMG[t] || DD_CREATE_ICON_IMG.INDIVIDUAL;
  if (trigger) {
    trigger.setAttribute('value', t);
    var al =
      t === 'GROUP' ? 'アイコン（グループ）' : t === 'ORGANIZATION' ? 'アイコン（法人）' : 'アイコン（個人）';
    trigger.setAttribute('aria-label', al);
  }
}

function initDeliveryDestinationUpdateDialog() {
  var dlg = document.getElementById('dd-update-form-dialog');
  var form = document.getElementById('delivery-destination-update');
  var cancelBtn = document.getElementById('dd-update-dialog-cancel');
  var editBtn = document.getElementById('dd-edit-button');
  var iconTrigger = document.getElementById('dd-update-icon-trigger');
  var iconMenu = document.getElementById('dd-update-icon-menu');
  var iconPicker = dlg ? dlg.querySelector('.dd-create-icon-picker') : null;
  if (!dlg || typeof dlg.showModal !== 'function' || !form) return;

  function setIconMenuOpen(open) {
    if (!iconMenu || !iconTrigger) return;
    iconMenu.hidden = !open;
    iconTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function syncDdUpdateFormFromMain() {
    var hiddenName = document.querySelector('input[name="client.deliveryDestinationName"]');
    var hiddenId = document.querySelector('input[name="client.deliveryDestinationId"]');
    var nameTa = document.getElementById('dd-update-name');
    var idIn = document.getElementById('dd-update-record-id');
    var verIn = document.getElementById('dd-update-version');
    if (nameTa && hiddenName) nameTa.value = String(hiddenName.value || '');
    if (idIn && hiddenId) idIn.value = String(hiddenId.value || '');
    if (verIn) verIn.value = '0';
    ['dd-update-postCode', 'dd-update-address1', 'dd-update-address2', 'dd-update-email', 'dd-update-tel', 'dd-update-fax', 'dd-update-note'].forEach(
      function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      }
    );
    setDdUpdateIconType('INDIVIDUAL');
    var id = idIn ? String(idIn.value || '').trim() : '';
    var base = '/resource/delivery-destination/update-dialog/';
    form.setAttribute('action', id ? base + encodeURIComponent(id) : '/resource/delivery-destination/update-dialog');
  }

  function openDialog() {
    if (invoiceMenuAnchors.closeDd) invoiceMenuAnchors.closeDd();
    setIconMenuOpen(false);
    syncDdUpdateFormFromMain();
    dlg.showModal();
    var first = document.getElementById('dd-update-name');
    if (first) {
      window.setTimeout(function () {
        first.focus();
      }, 0);
    }
  }

  function applyDdUpdateToMainForm() {
    var nameTa = document.getElementById('dd-update-name');
    var raw = nameTa ? String(nameTa.value || '').trim() : '';
    if (!raw) return false;
    var label = raw.split('\n')[0].trim() || raw;
    var trigger = document.getElementById('dd-select-trigger');
    var hiddenName = document.querySelector('input[name="client.deliveryDestinationName"]');
    var hiddenId = document.querySelector('input[name="client.deliveryDestinationId"]');
    var idIn = document.getElementById('dd-update-record-id');
    if (trigger) {
      trigger.textContent = label;
      trigger.classList.remove('placeholder');
    }
    if (hiddenName) hiddenName.value = label;
    if (hiddenId && idIn) hiddenId.value = String(idIn.value || '');
    if (hiddenName) dispatchFormFieldSync(hiddenName);
    if (hiddenId) dispatchFormFieldSync(hiddenId);
    syncInvoicePreview();
    return true;
  }

  if (editBtn) {
    editBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openDialog();
    });
  }

  if (iconTrigger && iconMenu) {
    iconTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setIconMenuOpen(iconMenu.hidden);
    });
    iconMenu.querySelectorAll('[data-dd-icon-type]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var t = item.getAttribute('data-dd-icon-type');
        setDdUpdateIconType(t);
        setIconMenuOpen(false);
        iconTrigger.focus();
      });
    });
  }

  document.addEventListener(
    'mousedown',
    function (e) {
      var t = e.target;
      if (!(t instanceof Node)) return;
      if (!iconMenu || iconMenu.hidden) return;
      if (iconPicker && iconPicker.contains(t)) return;
      setIconMenuOpen(false);
    },
    true
  );

  dlg.addEventListener('cancel', function (e) {
    if (iconMenu && !iconMenu.hidden) {
      e.preventDefault();
      setIconMenuOpen(false);
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      setIconMenuOpen(false);
      dlg.close();
    });
  }
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!applyDdUpdateToMainForm()) return;
    setIconMenuOpen(false);
    dlg.close();
  });
}

function initDeliveryDestinationGuideDialog() {
  var pop = document.getElementById('delivery-destination-guide-popover');
  var openBtn = document.getElementById('dd-guide-dialog-open');
  var closeBtn = document.getElementById('dd-guide-popover-close');
  if (!pop || !openBtn) return;

  function setOpen(open) {
    pop.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && closeBtn) {
      window.setTimeout(function () {
        closeBtn.focus();
      }, 0);
    }
  }

  openBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var next = !pop.classList.contains('is-open');
    if (next && invoiceMenuAnchors.closeDd) invoiceMenuAnchors.closeDd();
    setOpen(next);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeDeliveryDestinationGuidePopover();
      openBtn.focus();
    });
  }
}

function initClientUpdateDialog() {
  var dlg = document.getElementById('client-update-form-dialog');
  var openBtn = document.getElementById('client-update-dialog-open');
  var cancelBtn = document.getElementById('client-update-dialog-cancel');
  var form = document.getElementById('client-update');
  if (!dlg || typeof dlg.showModal !== 'function') return;

  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      syncClientUpdateDialogFromMainForm();
      dlg.showModal();
      var first = document.getElementById('client-update-name');
      if (first) {
        window.setTimeout(function () {
          first.focus();
        }, 0);
      }
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      dlg.close();
    });
  }
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      applyClientUpdateDialogToMainForm();
      dlg.close();
    });
  }
}

function initDatePickers() {
  document.querySelectorAll('.invoice-date-picker-root[data-dp-root]').forEach(function (root) {
    var trigger = root.querySelector('[data-dp-trigger]');
    var input = root.querySelector('input[type="text"]');
    if (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        toggleDatePicker(root);
      });
    }
    if (input) {
      input.addEventListener('blur', function () {
        formatDateFieldOnBlur(input);
      });
    }
    var prev = root.querySelector('[data-dp-prev]');
    var next = root.querySelector('[data-dp-next]');
    if (prev) {
      prev.addEventListener('click', function (e) {
        e.preventDefault();
        shiftDpMonth(root, -1);
      });
    }
    if (next) {
      next.addEventListener('click', function (e) {
        e.preventDefault();
        shiftDpMonth(root, 1);
      });
    }
  });

  document.addEventListener(
    'mousedown',
    function (e) {
      var t = e.target;
      if (!(t instanceof Node)) return;
      document.querySelectorAll('.invoice-date-picker-root[data-state="open"]').forEach(function (root) {
        if (!root.contains(t)) setDatePickerOpen(root, false);
      });
    },
    true
  );

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeAllDatePickers();
  });
}

/** 請求日が未入力のとき、本日の yyyy/mm/dd を入れる */
function setDefaultAccrualDateIfEmpty() {
  var el = document.getElementById('accrualDate');
  if (!el || String(el.value || '').trim()) return;
  var d = new Date();
  el.value = d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
}

/** 請求書番号が未入力のとき、本日の yyyymmdd-001 を入れる */
function setDefaultInvoiceNumberIfEmpty() {
  var el = document.getElementById('invoiceNumber');
  if (!el || String(el.value || '').trim()) return;
  var d = new Date();
  var ymd = d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  el.value = ymd + '-001';
}

function initInvoicePreviewSync() {
  var form = document.getElementById('invoice-create-form');
  if (!form) return;

  setDefaultAccrualDateIfEmpty();
  setDefaultInvoiceNumberIfEmpty();

  form.addEventListener(
    'input',
    function (e) {
      var t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.closest('#invoice-preview-pane-body')) return;
      syncInvoicePreview();
    },
    true
  );

  form.addEventListener(
    'change',
    function (e) {
      var t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.closest('#invoice-preview-pane-body')) return;
      syncInvoicePreview();
    },
    true
  );

  syncInvoicePreview();
}

window.syncInvoicePreview = syncInvoicePreview;
window.setDefaultAccrualDateIfEmpty = setDefaultAccrualDateIfEmpty;
window.setDefaultInvoiceNumberIfEmpty = setDefaultInvoiceNumberIfEmpty;

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('invoice-create-form');
  if (!form) return;
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement)) return;
    var comboboxRoot = e.target.closest('.combobox-root');
    var comboboxContent = comboboxRoot ? getProductNameComboboxContent(comboboxRoot) : null;
    if (
      comboboxRoot &&
      comboboxRoot.getAttribute('data-state') === 'open' &&
      comboboxContent &&
      comboboxContent.querySelector('.combobox-item[data-highlighted]')
    ) {
      return;
    }
    e.preventDefault();
  });
  wireGlobalMenuDismiss();
  initClientSelectMenu();
  initDeliveryDestinationMenu();
  initDeliveryDestinationCreateDialog();
  initDeliveryDestinationUpdateDialog();
  initDeliveryDestinationGuideDialog();
  initInvoiceNoteCounter();
  initClientCreateDialog();
  initClientUpdateDialog();
  initDatePickers();
  initInvoiceLinesRowActions();
  initInvoicePreviewSync();
  initProductNameComboboxes();
});
