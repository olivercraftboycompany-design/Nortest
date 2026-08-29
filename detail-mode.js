/* ==========================================================================
   DETAIL MODE — settings hook
   Load this AFTER script.js. Adds a checkbox into the existing Settings
   modal (function openSettingsModal in script.js) without modifying that
   file. Persists the choice using the app's own IndexedDB meta store so it
   survives reloads, the same way accent color / background do.
   ========================================================================== */
(function(){
  'use strict';

  // Stored under its OWN meta key ('detailModePref'), not inside the app's
  // 'app' meta record — that record gets fully overwritten on every
  // saveMeta() call from script.js with a fixed field list, which would
  // silently wipe an extra field added here. A separate key avoids that.
  var META_KEY = 'detailModePref';

  function isOn(){
    return document.body.classList.contains('detail-mode');
  }

  function setDetailMode(on){
    document.body.classList.toggle('detail-mode', !!on);
    if(typeof idbPut === 'function'){
      idbPut('meta', {key:META_KEY, on:!!on}).catch(function(){});
    }
  }

  async function restoreDetailMode(){
    if(typeof idbGet !== 'function') return;
    try{
      var row = await idbGet('meta', META_KEY);
      if(row && row.on) document.body.classList.add('detail-mode');
    }catch(e){}
  }

  // Inject the toggle row into the Settings modal every time it opens.
  // We don't touch openSettingsModal itself — instead we watch for the
  // settings modal appearing in the DOM and append our row into it.
  function injectToggleIfPresent(){
    var card = document.querySelector('#settings-backdrop .modal-card');
    if(!card || document.getElementById('detail-mode-row')) return;

    var row = document.createElement('div');
    row.id = 'detail-mode-row';
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 16px;padding:11px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);';
    row.innerHTML =
      '<div>' +
        '<div style="font-size:13.5px;font-weight:600;">Detail Mode</div>' +
        '<div style="font-size:11px;opacity:.6;margin-top:1px;">A touch more texture and depth in the UI</div>' +
      '</div>' +
      '<label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;">' +
        '<input type="checkbox" id="detail-mode-toggle" style="opacity:0;width:0;height:0;">' +
        '<span id="detail-mode-track" style="position:absolute;inset:0;border-radius:999px;background:rgba(255,255,255,.18);transition:.15s;"></span>' +
        '<span id="detail-mode-thumb" style="position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.4);transition:.15s;"></span>' +
      '</label>';

    // Insert right after the "Appearance" section (before the "Background"
    // section header) so it reads as part of appearance settings. Falls
    // back to prepending into the card if that anchor isn't found.
    var bgHeader = Array.from(card.querySelectorAll('.modal-sub')).find(function(el){
      return /background/i.test(el.textContent);
    });
    if(bgHeader){
      bgHeader.parentNode.insertBefore(row, bgHeader);
    } else {
      card.insertBefore(row, card.firstChild.nextSibling);
    }

    var checkbox = document.getElementById('detail-mode-toggle');
    var track = document.getElementById('detail-mode-track');
    var thumb = document.getElementById('detail-mode-thumb');

    function paint(on){
      track.style.background = on ? 'rgba(var(--accent-rgb),.55)' : 'rgba(255,255,255,.18)';
      thumb.style.transform = on ? 'translateX(18px)' : 'translateX(0)';
    }

    checkbox.checked = isOn();
    paint(checkbox.checked);

    checkbox.addEventListener('change', function(){
      setDetailMode(checkbox.checked);
      paint(checkbox.checked);
      if(typeof showToast === 'function'){
        showToast(checkbox.checked ? 'Detail Mode on' : 'Detail Mode off');
      }
    });
  }

  // The settings modal is rendered fresh into #modal-root each time it
  // opens, so watch for that node's contents changing rather than hooking
  // the click handler directly (keeps this file fully independent of
  // script.js's internals).
  var modalRoot = document.getElementById('modal-root');
  if(modalRoot){
    var observer = new MutationObserver(function(){ injectToggleIfPresent(); });
    observer.observe(modalRoot, { childList:true, subtree:true });
  }

  // Restore saved preference on load. The app's own init() runs its DB load
  // asynchronously too, so a short delay avoids a race on first paint.
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(restoreDetailMode, 300); });
  } else {
    setTimeout(restoreDetailMode, 300);
  }

})();
