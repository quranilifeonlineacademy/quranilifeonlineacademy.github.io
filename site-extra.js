/* Qurani Life — extras: saved texts, home-page edit mode, WhatsApp submit option */
(function () {
  var API = (window.QL_CONFIG && window.QL_CONFIG.API_URL) || '';
  var WA_NO = '8801889012156';
  var curLang = function () { return document.documentElement.lang === 'bn' ? 'bn' : 'en'; };
  var bn = function () { return curLang() === 'bn'; };
  var SKIP = 'form, select, option, script, style, #langBtn, .modal, #cmodal, #courseGrid, #board, #teamGrid, #revGrid, #benefits, #slides, #dots, #clocks, .ql-edbar';

  /* ---------- stable keys for every static text ---------- */
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'k' + (h >>> 0).toString(36); }
  var editable = [];
  var seen = {};
  document.querySelectorAll('[data-bn]').forEach(function (el) {
    if (el.closest(SKIP)) return;
    if (el.querySelector('[data-bn]')) return;
    var en = (el.dataset.en !== undefined ? el.dataset.en : el.innerHTML).trim();
    if (!en) return;
    var k = hash(en);
    if (seen[k]) { seen[k]++; k = k + '_' + seen[k]; } else seen[k] = 1;
    el.dataset.k = k;
    if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
    editable.push(el);
  });

  function show(el) { el.innerHTML = bn() ? el.dataset.bn : el.dataset.en; }
  function applyContent(map) {
    if (!map) return;
    editable.forEach(function (el) {
      var o = map[el.dataset.k];
      if (!o) return;
      if (o.en) el.dataset.en = o.en;
      if (o.bn) el.dataset.bn = o.bn;
      show(el);
    });
  }
  if (API) fetch(API).then(function (r) { return r.json(); }).then(function (d) { applyContent(d.content); }).catch(function () {});

  /* ---------- helpers ---------- */
  function post(data) {
    var b = new URLSearchParams();
    Object.keys(data).forEach(function (k) { b.append(k, data[k]); });
    return fetch(API, { method: 'POST', body: b }).then(function (r) { return r.json(); });
  }
  function toast(msg, ok) {
    var t = document.createElement('div');
    t.className = 'ql-toast' + (ok === false ? ' bad' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('in'); }, 20);
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 400); }, 4200);
  }
  function clean(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 1) {
          var tag = c.tagName.toLowerCase();
          if (['br', 'b', 'strong', 'em', 'i', 'span', 'small'].indexOf(tag) < 0) {
            walk(c);
            while (c.firstChild) n.insertBefore(c.firstChild, c);
            n.removeChild(c);
            return;
          }
          Array.prototype.slice.call(c.attributes).forEach(function (a) { if (a.name !== 'class') c.removeAttribute(a.name); });
          walk(c);
        }
      });
    })(d);
    return d.innerHTML.replace(/&nbsp;/g, ' ').trim();
  }

  var css = document.createElement('style');
  css.textContent = [
    '.ql-toast{position:fixed;left:50%;bottom:90px;transform:translate(-50%,20px);opacity:0;z-index:9999;background:#00552C;color:#fff;padding:12px 18px;border-radius:14px;font:600 15px/1.5 "Hind Siliguri",Manrope,sans-serif;box-shadow:0 18px 40px -14px rgba(0,0,0,.5);max-width:min(92vw,520px);text-align:center;transition:.35s}',
    '.ql-toast.in{opacity:1;transform:translate(-50%,0)}.ql-toast.bad{background:#B23A2E}',
    '.two-opt{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:6px}.two-opt .or{color:var(--muted);font-weight:700;font-size:14px}',
    '.b-wa{background:#25D366;color:#fff;border:0;display:inline-flex;gap:8px;align-items:center;cursor:pointer}.b-wa:hover{filter:brightness(.95)}.b-wa svg{width:18px;height:18px}',
    'html.ql-editing [data-k]{outline:2px dashed #E0B415!important;outline-offset:3px;cursor:text;border-radius:4px}',
    'html.ql-editing [data-k]:hover{background:rgba(224,180,21,.12)}html.ql-editing [data-k]:focus{outline:2px solid #00703A!important;background:#fff;color:#111}',
    'html.ql-editing [data-k].dirty{outline-color:#00703A!important}',
    '.ql-edbar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9998;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;background:#0d1712;color:#fff;padding:10px 12px;border-radius:16px;box-shadow:0 20px 40px -12px rgba(0,0,0,.6);border:1px solid rgba(224,180,21,.6);font:600 14px "Hind Siliguri",Manrope,sans-serif;max-width:96vw}',
    '.ql-edbar button{border:0;border-radius:10px;padding:8px 14px;font:700 14px "Hind Siliguri",Manrope,sans-serif;cursor:pointer}',
    '.ql-edbar .sv{background:#E0B415;color:#1b1400}.ql-edbar .lg{background:#1f3a2c;color:#fff}.ql-edbar .ex{background:transparent;color:#ccc;border:1px solid #555}',
    '.ql-edbar .ct{color:#F2C832}',
    '.ql-editbtn{position:fixed;left:16px;bottom:16px;z-index:9997;background:#E0B415;color:#1b1400;border:0;border-radius:999px;padding:10px 16px;font:800 14px "Hind Siliguri",Manrope,sans-serif;box-shadow:0 12px 26px -10px rgba(0,0,0,.5);cursor:pointer}'
  ].join('');
  document.head.appendChild(css);

  /* ---------- two ways to send forms: online or WhatsApp ---------- */
  var waIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>';
  document.querySelectorAll('form[data-form]').forEach(function (f) {
    var sub = f.querySelector('button[type=submit]');
    if (!sub || f.querySelector('.b-wa')) return;
    var wrap = document.createElement('div');
    wrap.className = 'two-opt';
    sub.parentNode.insertBefore(wrap, sub);
    wrap.appendChild(sub);
    var or = document.createElement('span');
    or.className = 'or'; or.setAttribute('data-bn', 'অথবা'); or.dataset.en = 'or'; or.textContent = bn() ? 'অথবা' : 'or';
    var wa = document.createElement('button');
    wa.type = 'button'; wa.className = 'btn b-wa';
    wa.innerHTML = waIcon + '<span data-bn="WhatsApp-এ পাঠান">Send on WhatsApp</span>';
    var sp = wa.querySelector('span'); sp.dataset.en = 'Send on WhatsApp'; sp.textContent = bn() ? 'WhatsApp-এ পাঠান' : 'Send on WhatsApp';
    wrap.appendChild(or); wrap.appendChild(wa);
    wa.addEventListener('click', function () {
      try { if (typeof updTime === 'function') updTime(f); } catch (e) {}
      var bad = Array.prototype.slice.call(f.elements).find(function (el) { return el.willValidate && !el.checkValidity(); });
      var err = f.querySelector('.err');
      if (bad) {
        if (err) err.textContent = bad.type === 'tel' ? (bn() ? 'কান্ট্রি কোডসহ সঠিক WhatsApp নম্বর দিন।' : 'Please enter a valid WhatsApp number with country code.') : (bn() ? 'তারকা (*) চিহ্নিত সব ঘর পূরণ করুন।' : 'Please fill in all fields marked *.');
        bad.focus(); return;
      }
      if (err) err.textContent = '';
      var fd = new FormData(f), lines = [], data = { form: f.dataset.form, Language: curLang(), 'Sent via': 'WhatsApp' };
      fd.forEach(function (v, k) { if (String(v).trim()) { lines.push(k + ': ' + v); data[k] = v; } });
      var msg = (f.dataset.title || 'Qurani Life') + '\n\n' + lines.join('\n');
      window.open('https://wa.me/' + WA_NO + '?text=' + encodeURIComponent(msg), '_blank');
      if (API) post(data).catch(function () {});
      toast(bn() ? 'জাযাকাল্লাহু খাইরান! WhatsApp-এ বার্তাটি পাঠিয়ে দিন। আপনার তথ্য আমাদের কাছেও জমা হয়েছে।' : 'Jazakallahu khairan! Please press send in WhatsApp. Your details have also reached us.');
    });
  });

  /* ---------- home page edit mode (admin only) ---------- */
  var editing = false, bar = null, dirty = {};
  function getTok() { try { return localStorage.getItem('qlTok') || ''; } catch (e) { return ''; } }
  function setTok(t) { try { if (t) localStorage.setItem('qlTok', t); else localStorage.removeItem('qlTok'); } catch (e) {} }
  function canEdit(u) { return u && (u.role === 'superadmin' || (u.perms || []).indexOf('content') >= 0); }

  function capture() {
    var L = curLang();
    editable.forEach(function (el) {
      if (!el.classList.contains('dirty')) return;
      el.dataset[L] = clean(el.innerHTML);
      dirty[el.dataset.k] = el;
    });
  }
  function count() { var c = bar && bar.querySelector('.ct'); if (c) c.textContent = Object.keys(dirty).length + (bn() ? 'টি বদল' : ' changes'); }

  function startEdit() {
    editing = true;
    document.documentElement.classList.add('ql-editing');
    editable.forEach(function (el) {
      el.contentEditable = 'true';
      el.addEventListener('input', onInput);
    });
    bar = document.createElement('div');
    bar.className = 'ql-edbar';
    bar.innerHTML = '<span>✎ এডিট মোড: হলুদ দাগের লেখায় ক্লিক করে বদলান</span><span class="ct">0টি বদল</span><button class="lg" type="button">বাংলা / English</button><button class="sv" type="button">সেভ করুন</button><button class="ex" type="button">বের হন</button>';
    document.body.appendChild(bar);
    bar.querySelector('.lg').onclick = function () { capture(); document.getElementById('langBtn').click(); };
    bar.querySelector('.sv').onclick = save;
    bar.querySelector('.ex').onclick = function () {
      capture();
      if (Object.keys(dirty).length && !confirm('সেভ না করা বদলগুলো হারিয়ে যাবে। বের হবেন?')) return;
      location.hash = ''; location.reload();
    };
    toast('এডিট মোড চালু। লেখায় ক্লিক করে বদলান, তারপর "সেভ করুন" চাপুন।');
  }
  function onInput(e) { e.currentTarget.classList.add('dirty'); dirty[e.currentTarget.dataset.k] = e.currentTarget; count(); }
  function save() {
    capture();
    var items = Object.keys(dirty).map(function (k) { var el = dirty[k]; return { key: k, en: el.dataset.en, bn: el.dataset.bn }; });
    if (!items.length) { toast('কোনো বদল নেই।'); return; }
    var b = bar.querySelector('.sv'); b.disabled = true; b.textContent = 'সেভ হচ্ছে...';
    post({ action: 'saveContent', token: getTok(), items: JSON.stringify(items) }).then(function (r) {
      b.disabled = false; b.textContent = 'সেভ করুন';
      if (r.ok) { dirty = {}; editable.forEach(function (el) { el.classList.remove('dirty'); }); count(); toast('সেভ হয়েছে! এখন থেকে সবাই নতুন লেখা দেখবে।'); }
      else toast('সেভ হয়নি: ' + (r.error === 'login required' ? 'আবার লগইন করুন' : r.error === 'not allowed' ? 'এই কাজের অনুমতি নেই' : r.error), false);
    }).catch(function () { b.disabled = false; b.textContent = 'সেভ করুন'; toast('ইন্টারনেট সমস্যা, আবার চেষ্টা করুন।', false); });
  }
  document.addEventListener('click', function (e) {
    if (!editing) return;
    var a = e.target.closest('a,button');
    if (a && !a.closest('.ql-edbar') && a.querySelector && (a.matches('[data-k]') || a.querySelector('[data-k]') || a.closest('[data-k]'))) e.preventDefault();
  }, true);

  function tryEdit() {
    if (!API) { toast('Sheet-এর সংযোগ নেই।', false); return; }
    var t = getTok();
    var ask = function () {
      var u = prompt('Dashboard-এর username দিন'); if (!u) return;
      var p = prompt('পাসওয়ার্ড দিন'); if (!p) return;
      post({ action: 'login', username: u.trim(), password: p }).then(function (r) {
        if (!r.ok) { toast(r.error === 'locked' ? 'অনেকবার ভুল হয়েছে, পরে চেষ্টা করুন।' : 'Username বা পাসওয়ার্ড ভুল।', false); return; }
        setTok(r.token);
        if (canEdit(r.user)) startEdit(); else toast('লেখা বদলানোর অনুমতি আপনার নেই।', false);
      }).catch(function () { toast('ইন্টারনেট সমস্যা, আবার চেষ্টা করুন।', false); });
    };
    if (!t) return ask();
    post({ action: 'me', token: t }).then(function (r) {
      if (r.ok && canEdit(r.user)) startEdit();
      else if (r.ok) toast('লেখা বদলানোর অনুমতি আপনার নেই।', false);
      else { setTok(''); ask(); }
    }).catch(function () { toast('ইন্টারনেট সমস্যা, আবার চেষ্টা করুন।', false); });
  }
  if (location.hash === '#edit') setTimeout(tryEdit, 600);
  else if (getTok() && API) {
    post({ action: 'me', token: getTok() }).then(function (r) {
      if (!r.ok || !canEdit(r.user)) return;
      var eb = document.createElement('button');
      eb.className = 'ql-editbtn'; eb.type = 'button'; eb.textContent = '✎ পেজ এডিট করুন';
      eb.onclick = function () { eb.remove(); tryEdit(); };
      document.body.appendChild(eb);
    }).catch(function () {});
  }
})();
