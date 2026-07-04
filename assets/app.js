/* Ram Dudh Dairy — shared language toggle + basket/checkout (demo, no payments) */
(function(){
  "use strict";

  var WA = "91XXXXXXXXXX";             // TODO: replace with real WhatsApp number (10 digits, no spaces)
  var LANG_KEY = "rd_lang";
  var CART_KEY = "rd_cart";

  /* ---------------- language ---------------- */
  function getLang(){ return localStorage.getItem(LANG_KEY) || "mr"; }
  function setLang(l){ localStorage.setItem(LANG_KEY, l); applyLang(l); }
  window.rdSetLang = setLang;
  window.rdToggleLang = function(){ setLang(getLang()==="mr" ? "en" : "mr"); };

  function applyLang(l){
    var en = (l === "en");
    document.querySelectorAll("[data-mr]").forEach(function(el){
      var v = en ? el.getAttribute("data-en") : el.getAttribute("data-mr");
      if (v !== null) el.innerHTML = v;
    });
    document.body.classList.toggle("lang-en", en);
    document.documentElement.lang = en ? "en" : "mr";
    document.querySelectorAll(".lang-btn").forEach(function(b){
      b.textContent = en ? "मराठी" : "ENG";
    });
    renderCart();
  }

  /* ---------------- cart ---------------- */
  function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCount(); renderCart(); }
  function count(){ return getCart().reduce(function(s,i){ return s + i.qty; }, 0); }

  function addItem(key, mr, en){
    var c = getCart(), f = c.filter(function(i){ return i.key===key; })[0];
    if (f) f.qty++; else c.push({ key:key, mr:mr, en:en, qty:1 });
    saveCart(c); openCart();
  }
  function changeQty(key, d){
    var c = getCart(), f = c.filter(function(i){ return i.key===key; })[0];
    if (!f) return;
    f.qty += d;
    if (f.qty <= 0) c = c.filter(function(i){ return i.key!==key; });
    saveCart(c);
  }
  function clearCart(){ saveCart([]); }

  function updateCount(){
    var n = count();
    document.querySelectorAll(".cart-count").forEach(function(b){
      b.textContent = n; b.style.display = n ? "grid" : "none";
    });
  }

  function openCart(){ var d = document.getElementById("rd-drawer"); if (d){ d.classList.add("open"); document.getElementById("rd-scrim").classList.add("open"); } }
  function closeCart(){ var d = document.getElementById("rd-drawer"); if (d){ d.classList.remove("open"); document.getElementById("rd-scrim").classList.remove("open"); resetCheckout(); } }
  window.rdOpenCart = openCart;

  function t(mr,en){ return getLang()==="en" ? en : mr; }

  function renderCart(){
    var body = document.getElementById("rd-items");
    if (!body) return;
    var c = getCart();
    if (!c.length){
      body.innerHTML = '<p class="rd-empty">' + t("तुमची बास्केट रिकामी आहे.","Your basket is empty.") +
        '<br><span>' + t("वस्तू जोडण्यासाठी यादी पाहा.","Add items from the menu.") + '</span></p>';
      var f = document.getElementById("rd-foot"); if (f) f.style.display = "none";
      return;
    }
    document.getElementById("rd-foot").style.display = "block";
    var html = "";
    c.forEach(function(i){
      html += '<div class="rd-row">' +
        '<div class="rd-nm">' + t(i.mr, i.en) + '</div>' +
        '<div class="rd-qty">' +
          '<button aria-label="less" onclick="rdQty(\'' + esc(i.key) + '\',-1)">−</button>' +
          '<span>' + i.qty + '</span>' +
          '<button aria-label="more" onclick="rdQty(\'' + esc(i.key) + '\',1)">+</button>' +
        '</div></div>';
    });
    body.innerHTML = html;
  }
  function esc(s){ return String(s).replace(/'/g,"\\'"); }
  window.rdQty = changeQty;

  /* ---------------- checkout ---------------- */
  function resetCheckout(){
    var co = document.getElementById("rd-checkout");
    if (co) co.classList.remove("done");
  }
  function waOrder(){
    var c = getCart(); if (!c.length) return;
    var name = (document.getElementById("rd-name")||{}).value || "";
    var lines = c.map(function(i){ return "• " + t(i.mr,i.en) + " × " + i.qty; }).join("%0A");
    var msg = t("नमस्कार राम दूध डेअरी, मला खालील वस्तू हव्या आहेत:",
                "Hello Ram Dudh Dairy, I would like to order:") +
              "%0A%0A" + lines +
              (name ? ("%0A%0A" + t("नाव","Name") + ": " + encodeURIComponent(name)) : "");
    window.open("https://wa.me/" + WA + "?text=" + msg, "_blank");
  }
  window.rdWaOrder = waOrder;
  window.rdDemoOrder = function(){
    if (!getCart().length) return;
    var co = document.getElementById("rd-checkout");
    co.classList.add("done");
    clearCart();
  };

  /* ---------------- inject UI ---------------- */
  function inject(){
    var css = document.createElement("style");
    css.textContent = [
      "body.lang-en .disp{font-family:'Baloo 2',cursive}",
      "body.lang-en .only-mr{display:none!important}",
      "body:not(.lang-en) .only-en{display:none!important}",
      "#rd-fab{position:fixed;right:20px;bottom:20px;z-index:90;height:58px;padding:0 20px 0 16px;border-radius:999px;border:none;cursor:pointer;background:linear-gradient(135deg,#1E8A5A,#0E5637);color:#fff;font-size:1rem;font-weight:700;box-shadow:0 16px 34px -10px rgba(14,86,55,.6);display:flex;align-items:center;gap:.55rem;transition:transform .18s}",
      "#rd-fab:hover{transform:translateY(-3px)}",
      "#rd-fab .lbl{font-family:inherit}",
      ".cart-count{min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:#F6B93B;color:#0E5637;font-size:.78rem;font-weight:800;display:none;place-items:center}",
      "#rd-scrim{position:fixed;inset:0;background:rgba(15,40,28,.5);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .25s;z-index:95}",
      "#rd-scrim.open{opacity:1;pointer-events:auto}",
      "#rd-drawer{position:fixed;top:0;right:0;height:100%;width:min(390px,92vw);background:#FBF8F0;z-index:100;transform:translateX(102%);transition:transform .3s cubic-bezier(.4,.1,.2,1);display:flex;flex-direction:column;box-shadow:-20px 0 50px -20px rgba(14,60,40,.5)}",
      "#rd-drawer.open{transform:none}",
      "#rd-dh{background:linear-gradient(135deg,#1E8A5A,#0E5637);color:#fff;padding:1.15rem 1.2rem;display:flex;align-items:center;justify-content:space-between}",
      "#rd-dh h3{font-family:'Baloo 2',cursive;font-weight:700;font-size:1.3rem;margin:0}",
      "#rd-dh button{background:rgba(255,255,255,.2);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:1.2rem;cursor:pointer}",
      "#rd-items{flex:1;overflow-y:auto;padding:1rem 1.2rem}",
      ".rd-row{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.75rem 0;border-bottom:1px dashed rgba(14,86,55,.18)}",
      ".rd-nm{font-family:'Baloo 2','Mukta',cursive;font-weight:600;font-size:1.05rem;color:#21302A}",
      ".rd-qty{display:flex;align-items:center;gap:.55rem;flex:0 0 auto}",
      ".rd-qty button{width:31px;height:31px;border-radius:50%;border:none;background:#E7F4EC;color:#0E5637;font-size:1.15rem;font-weight:700;cursor:pointer;line-height:1}",
      ".rd-qty button:hover{background:#F6B93B;color:#0E5637}",
      ".rd-qty span{min-width:18px;text-align:center;font-weight:700;color:#0E5637}",
      ".rd-empty{text-align:center;color:#6B7A70;margin-top:2rem}.rd-empty span{font-size:.85rem}",
      "#rd-foot{padding:1rem 1.2rem;border-top:1px solid rgba(14,86,55,.12);background:#FFF3DC}",
      "#rd-name{width:100%;padding:.75rem .9rem;border:1.5px solid rgba(14,86,55,.2);border-radius:12px;font:inherit;margin-bottom:.7rem;background:#fff}",
      ".rd-cta{display:flex;flex-direction:column;gap:.55rem}",
      ".rd-cta button{padding:.85rem 1rem;border-radius:999px;border:none;font:inherit;font-weight:700;cursor:pointer}",
      ".rd-wa{background:#1faf54;color:#fff}",
      ".rd-demo{background:linear-gradient(135deg,#F6B93B,#E8A317);color:#0E5637}",
      "#rd-checkout.done #rd-foot,#rd-checkout.done #rd-items{display:none}",
      "#rd-thanks{display:none;padding:2.4rem 1.4rem;text-align:center}",
      "#rd-checkout.done #rd-thanks{display:block}",
      "#rd-thanks h4{font-family:'Baloo 2',cursive;font-weight:700;color:#0E5637;font-size:1.5rem;margin:.6rem 0 .3rem}",
      "#rd-thanks p{color:#6B7A70;font-size:.92rem}"
    ].join("\n");
    document.head.appendChild(css);

    var fab = document.createElement("button");
    fab.id = "rd-fab"; fab.setAttribute("aria-label","Basket");
    fab.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 10.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.5z"/><path d="M9 8l3-4 3 4"/></svg><span class="lbl" data-mr="बास्केट" data-en="Basket">बास्केट</span><span class="cart-count">0</span>';
    fab.onclick = openCart;

    var scrim = document.createElement("div");
    scrim.id = "rd-scrim"; scrim.onclick = closeCart;

    var drawer = document.createElement("div");
    drawer.id = "rd-drawer";
    drawer.innerHTML =
      '<div id="rd-checkout">' +
        '<div id="rd-dh"><h3 data-mr="तुमची बास्केट" data-en="Your Basket"></h3>' +
          '<button aria-label="close" onclick="rdCloseCart()">×</button></div>' +
        '<div id="rd-items"></div>' +
        '<div id="rd-foot">' +
          '<input id="rd-name" placeholder="" data-mr="तुमचे नाव (ऐच्छिक)" data-en="Your name (optional)">' +
          '<div class="rd-cta">' +
            '<button class="rd-wa" onclick="rdWaOrder()" data-mr="WhatsApp वर ऑर्डर पाठवा" data-en="Send order on WhatsApp"></button>' +
            '<button class="rd-demo" onclick="rdDemoOrder()" data-mr="ऑर्डर करा (डेमो)" data-en="Place order (demo)"></button>' +
          '</div>' +
        '</div>' +
        '<div id="rd-thanks">' +
          '<div class="big"><svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#1faf54" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg></div>' +
          '<h4 data-mr="ऑर्डरबद्दल धन्यवाद!" data-en="Thank you for your order!"></h4>' +
          '<p data-mr="ही डेमो ऑर्डर आहे — पैसे आकारले जात नाहीत. डेअरी लवकरच संपर्क करेल." data-en="This is a demo order — no payment taken. The dairy will be in touch."></p>' +
          '<p style="margin-top:.8rem"><button class="rd-demo" style="display:inline-block;padding:.6rem 1.4rem;border-radius:999px" onclick="rdCloseCart()" data-mr="ठीक आहे" data-en="Done"></button></p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);
    window.rdCloseCart = closeCart;
  }

  /* wire "add" buttons present in the page */
  function wireAdds(){
    document.querySelectorAll(".add").forEach(function(btn){
      btn.addEventListener("click", function(){
        addItem(btn.getAttribute("data-key"), btn.getAttribute("data-name-mr"), btn.getAttribute("data-name-en"));
        btn.classList.add("added");
        setTimeout(function(){ btn.classList.remove("added"); }, 700);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    inject();
    wireAdds();
    applyLang(getLang());
    updateCount();
  });
})();
