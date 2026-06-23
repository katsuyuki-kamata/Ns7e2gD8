/**
 * サイドナビ（La + Lc）とトップナビ（Lb）を生成し、.L 内の .Ld の直前に挿入する。
 * 同期スクリプトとして </body> 直前で実行し、render.js の DOMContentLoaded より先に DOM を差し込むこと。
 */
(function (global) {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** <base href> でルートが固定されている前提の共通パス（階層に依存しない） */
  var NAV_DEFAULTS = {
    assetBase: '',
    homeHref: 'index.html',
    invoiceListHref: 'invoice/invoice-list.html',
  };

  var PRESETS = {
    root: {},
    invoice: { shellClass: 'invoice-shell' },
    invoiceDetail: { shellClass: 'invoice-shell' },
  };

  function sideNavHTML(cfg) {
    var b = cfg.assetBase;
    var home = cfg.homeHref;
    var invList = cfg.invoiceListHref;
    var active = cfg.activeNav || '';
    var homeSel = active === 'home' ? ' sn-item--sel' : '';
    var homeIconAttr = active === 'home' ? ' data-icon-src="img/home_color.svg"' : '';
    var invCascadeClass = 'sn-cascade group' + (active === 'invoice' ? ' sn-cascade--sel' : '');
    var invIconAttr = active === 'invoice' ? ' data-icon-src="img/invoices_on.svg"' : '';

    return (
      '<div class="La">' +
      '<div class="La-row">' +
      '<a href="' +
      esc(home) +
      '"><img src="' +
      esc(b + 'img/logo-yayoi-invoice-next.svg') +
      '" width="107" height="16" alt="" role="img" aria-label="弥生請求 Next"/></a>' +
      '<button type="button" class="La-collapse" data-pendo="collapse-button" data-src-expanded="' +
      esc(b + 'img/nav-close.svg') +
      '" data-src-collapsed="' +
      esc(b + 'img/menu_open.svg') +
      '" aria-expanded="true" aria-label="サイドナビを折りたたむ"><img class="La-collapse__icon" src="' +
      esc(b + 'img/nav-close.svg') +
      '" width="20" height="20" alt="" aria-hidden="true"/></button>' +
      '</div></div>' +
      '<div class="Lc"><nav>' +
      '<a href="' +
      esc(home) +
      '" class="sn-link" data-pendo="side-nav-home"><div class="sn-item' +
      homeSel +
      '" aria-label="ホーム"><span class="sn-icon"><i data-icon="home" data-size="24"' +
      homeIconAttr +
      '></i></span><span class="sn-label">ホーム</span></div></a>' +
      '<a href="/estimate" class="sn-link" data-pendo="side-nav-estimate"><div class="sn-item" aria-label="見積書"><span class="sn-icon"><i data-icon="estimate" data-size="24"></i></span><span class="sn-label">見積書</span></div></a>' +
      '<a href="/delivery-note" class="sn-link" data-pendo="side-nav-delivery-note"><div class="sn-item" aria-label="納品書"><span class="sn-icon"><i data-icon="delivery-note" data-size="24"></i></span><span class="sn-label">納品書</span></div></a>' +
      '<div class="' +
      invCascadeClass +
      '" tabindex="0" aria-haspopup="menu" aria-expanded="false" aria-controls="invoice-cascade-menu"><div class="sn-cascade__row" aria-label="請求書"><span class="sn-icon"><i data-icon="invoice" data-size="24"' +
      invIconAttr +
      '></i></span><span class="sn-label">請求書</span></div><svg class="sn-cascade__arrow" height="24" width="24" role="img" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>右向矢印</title><path fill="currentColor" d="M21.2938 17.0768L13.7738 24.5968C13.1838 25.1868 12.2138 25.1868 11.6238 24.5968C11.0338 24.0068 11.0338 23.0368 11.6238 22.4468L17.9938 15.9968L11.6238 9.62684C11.0338 9.03684 11.0338 8.06684 11.6238 7.47684C12.2138 6.88684 13.1838 6.88684 13.7738 7.47684L21.2938 14.9968C21.8838 15.5068 21.8838 16.4868 21.2938 17.0768Z"/></svg><div class="sn-cascade__panel" id="invoice-cascade-menu" aria-hidden="true"><div class="sn-cascade__card"><div class="sn-menu" role="menu"><a href="' +
      esc(invList) +
      '" class="sn-menuitem" role="menuitem" data-pendo="side-nav-invoice"><span>請求書</span></a><a href="/invoice/schedule" class="sn-menuitem" role="menuitem" data-pendo="side-nav-invoice-schedule"><span>自動作成</span></a></div></div></div></div>' +
      '<a href="/receipt" class="sn-link" data-pendo="side-nav-receipt"><div class="sn-item" aria-label="領収書"><span class="sn-icon"><i data-icon="receipt" data-size="24"></i></span><span class="sn-label">領収書</span></div></a>' +
      '<hr class="sn-hr" />' +
      '<a href="/delivery-destination" class="sn-link" data-pendo="side-nav-delivery-destination"><div class="sn-item" aria-label="取引先・送付先"><span class="sn-icon"><i data-icon="building" data-size="24"></i></span><span class="sn-label">取引先・送付先</span></div></a>' +
      '<a href="/product" class="sn-link" data-pendo="side-nav-product"><div class="sn-item" aria-label="品目"><span class="sn-icon"><i data-icon="cardboard-box" data-size="24"></i></span><span class="sn-label">品目</span></div></a>' +
      '<a href="/settings" class="sn-link" data-pendo="side-nav-settings"><div class="sn-item" aria-label="設定"><span class="sn-icon"><i data-icon="gear" data-size="24"></i></span><span class="sn-label">設定</span></div></a>' +
      '<hr class="sn-hr" />' +
      '<div class="sn-cascade group" tabindex="0" aria-haspopup="menu" aria-expanded="false" aria-controls="trash-cascade-menu"><div class="sn-cascade__row" aria-label="ごみ箱"><span class="sn-icon"><i data-icon="trash" data-size="24"></i></span><span class="sn-label">ごみ箱</span></div><svg class="sn-cascade__arrow" height="24" width="24" role="img" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>右向矢印</title><path fill="currentColor" d="M21.2938 17.0768L13.7738 24.5968C13.1838 25.1868 12.2138 25.1868 11.6238 24.5968C11.0338 24.0068 11.0338 23.0368 11.6238 22.4468L17.9938 15.9968L11.6238 9.62684C11.0338 9.03684 11.0338 8.06684 11.6238 7.47684C12.2138 6.88684 13.1838 6.88684 13.7738 7.47684L21.2938 14.9968C21.8838 15.5068 21.8838 16.4868 21.2938 17.0768Z"/></svg><div class="sn-cascade__panel" id="trash-cascade-menu" aria-hidden="true"><div class="sn-cascade__card"><div class="sn-menu" role="menu"><a href="/trash-can/estimate" class="sn-menuitem" role="menuitem" data-pendo="side-nav-trash-can-estimate"><span>見積書</span></a><a href="/trash-can/delivery-note" class="sn-menuitem" role="menuitem" data-pendo="side-nav-trash-can-delivery-note"><span>納品書</span></a><a href="/trash-can/invoice" class="sn-menuitem" role="menuitem" data-pendo="side-nav-trash-can-invoice"><span>請求書</span></a><a href="/trash-can/delivery-destination" class="sn-menuitem" role="menuitem" data-pendo="side-nav-trash-can-delivery-destination"><span>送付先</span></a><a href="/trash-can/product" class="sn-menuitem" role="menuitem" data-pendo="side-nav-trash-can-product"><span>品目</span></a></div></div></div></div>' +
      '</nav></div>'
    );
  }

  function topNavHTML(cfg) {
    var title = esc(cfg.pageTitle || '');
    var company = esc(cfg.companyName != null ? cfg.companyName : 'Y坂建設株式会社');
    return (
      '<div class="Lb"><header class="Tv"><h1 class="Tt">' +
      title +
      '</h1><div class="Tr"><span class="Tc">' +
      company +
      '</span><div class="Tn-ico">' +
      '<button type="button" class="Tib" title="サポートメニューを開く" aria-haspopup="dialog" aria-expanded="false"><span class="Tib__in"><i data-icon="question.circle" data-size="24"></i></span></button>' +
      '<button type="button" class="Tib" title="弥生からのお知らせ" aria-haspopup="dialog" aria-expanded="false"><span class="Tib__in"><i data-icon="bell.filled" data-size="24"></i></span></button></div>' +
      '<button type="button" class="Tav" aria-haspopup="dialog" aria-expanded="false" data-pendo="button-avatar"><span class="Tav__ring" aria-hidden="true"></span><span class="Tav__shell"><span class="Tav__face" role="img" aria-label="太郎　弥生">太</span></span></button>' +
      '</div></header></div>'
    );
  }

  function mount(userCfg) {
    var preset = userCfg && userCfg.preset ? PRESETS[userCfg.preset] : {};
    var cfg = Object.assign({}, NAV_DEFAULTS, preset, userCfg || {});
    delete cfg.preset;

    var L = document.querySelector('.L');
    var main = L && L.querySelector(':scope > .Ld');
    if (!L || !main) {
      console.warn('AppLayout.mount: .L > .Ld が見つかりません');
      return;
    }
    if (L.getAttribute('data-app-layout-mounted') === '1') {
      console.warn('AppLayout.mount: 二重マウントをスキップしました');
      return;
    }

    if (cfg.shellClass) {
      cfg.shellClass.split(/\s+/).forEach(function (c) {
        if (c) L.classList.add(c);
      });
    }

    var html = sideNavHTML(cfg) + topNavHTML(cfg);
    var t = document.createElement('template');
    t.innerHTML = html;
    var root = t.content;
    while (root.firstChild) {
      L.insertBefore(root.firstChild, main);
    }
    L.setAttribute('data-app-layout-mounted', '1');
  }

  global.AppLayout = {
    mount: mount,
    PRESETS: PRESETS,
    NAV_DEFAULTS: NAV_DEFAULTS,
    sideNavHTML: sideNavHTML,
    topNavHTML: topNavHTML,
  };
})(typeof window !== 'undefined' ? window : this);
