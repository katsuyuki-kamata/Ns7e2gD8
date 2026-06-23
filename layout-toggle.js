(function () {  
  var KEY = 'yayoiSideNavCollapsed';  
  function root() {  
    return document.querySelector('.L');  
  }  
  function collapseBtn() {  
    return document.querySelector('.La-collapse');  
  }  
  function syncCollapseIcon(b, collapsed) {  
    var img = b.querySelector('.La-collapse__icon');  
    var exp = b.getAttribute('data-src-expanded');  
    var col = b.getAttribute('data-src-collapsed');  
    if (!img || !exp || !col) return;  
    img.setAttribute('src', collapsed ? col : exp);  
  }  
  function setCollapsed(collapsed) {  
    var r = root();  
    var b = collapseBtn();  
    if (!r || !b) return;  
    r.classList.toggle('L--side-collapsed', collapsed);  
    syncCollapseIcon(b, collapsed);  
    b.setAttribute('aria-expanded', collapsed ? 'false' : 'true');  
    b.setAttribute('aria-label', collapsed ? 'サイドナビを展開' : 'サイドナビを折りたたむ');  
    try {  
      sessionStorage.setItem(KEY, collapsed ? '1' : '0');  
    } catch (e) {}  
  }  
  function init() {  
    var r = root();  
    var b = collapseBtn();  
    if (!r || !b) return;  
    var stored = null;  
    try {  
      stored = sessionStorage.getItem(KEY);  
    } catch (e) {}  
    if (stored === '1') setCollapsed(true);  
    else if (stored === '0') setCollapsed(false);  
    b.addEventListener('click', function () {  
      setCollapsed(!r.classList.contains('L--side-collapsed'));  
    });  
  }  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);  
  else init();  
})();  
