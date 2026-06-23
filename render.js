(function(){  
function ri(){  
  var t=0,ok=0;  
  document.querySelectorAll("i[data-icon]").forEach(function(el){  
    t++;  
    var n=el.getAttribute("data-icon"),sz=el.getAttribute("data-size")||"24";  
    var ic=window.SI&&window.SI[n];  
    if(!ic||!ic.img){console.warn("Not found or no img:",n);return;}  
    ok++;  
    var srcOverride=el.getAttribute("data-icon-src");  
    var raw=(srcOverride&&srcOverride.length>0)?srcOverride:ic.img;  
    var base=typeof window.SI_IMG_BASE!=="undefined"&&window.SI_IMG_BASE?window.SI_IMG_BASE:"";  
    if(raw&&!/^https?:|^\/|^data:/.test(raw))raw=base+raw;  
    var im=document.createElement("img");  
    im.src=raw;  
    im.alt=ic.title||"";  
    im.width=Number(sz);  
    im.height=Number(sz);  
    im.style.cssText="display:inline-block;vertical-align:middle;object-fit:contain;flex-shrink:0";  
    if(!ic.title)im.setAttribute("aria-hidden","true");  
    el.replaceWith(im);  
  });  
  console.log("Rendered:"+ok+"/"+t);  
}  
document.addEventListener("DOMContentLoaded",function(){  
  if(typeof window.SI==="undefined"||!window.SI){console.warn("window.SI がありません。icons.js を render.js より前に読み込んでください。");}  
  ri();  
});  
})();  
