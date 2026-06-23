(function () {  
  function bind(el) {  
    var panel = el.querySelector('.sn-cascade__panel');  
    if (!panel || !panel.id) return;  
    if (!el.getAttribute('aria-controls')) el.setAttribute('aria-controls', panel.id);  
    function show() {  
      el.setAttribute('aria-expanded', 'true');  
      panel.setAttribute('aria-hidden', 'false');  
    }  
    function hide() {  
      el.setAttribute('aria-expanded', 'false');  
      panel.setAttribute('aria-hidden', 'true');  
    }  
    el.addEventListener('mouseenter', show);  
    el.addEventListener('mouseleave', function (e) {  
      var rel = e.relatedTarget;  
      if (rel && el.contains(rel)) return;  
      hide();  
    });  
    el.addEventListener('focusin', show);  
    el.addEventListener('focusout', function (e) {  
      var rel = e.relatedTarget;  
      if (rel && el.contains(rel)) return;  
      hide();  
    });  
  }  
  function init() {  
    document.querySelectorAll('.sn-cascade.group').forEach(bind);  
  }  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);  
  else init();  
})();  
