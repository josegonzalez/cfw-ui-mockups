/*
 * nav.js - focus navigation and simulated button input for CFW mockups.
 *
 * Focusable items are elements with class "nav-item". Group them with a
 * [data-nav-group] container. Configure the group with:
 *   data-nav-dir="vertical" | "horizontal" | "grid"   (default: vertical)
 *   data-nav-cols="N"                                  (required for grid)
 *   data-nav-wrap                                      (wrap at the ends)
 *   data-back="<url>"                                  (B button destination)
 *
 * An item may carry data-href="<url>"; the A button follows it. Otherwise the A
 * button dispatches a native click on the focused item.
 *
 * Any element with data-btn="up|down|left|right|a|b|x|y|start|select|l|r|menu"
 * is clickable and fires the same action as the matching key.
 *
 * Key map:
 *   arrows -> D-pad   Z -> A   X / Backspace -> B   A -> X   S -> Y
 *   Enter -> Start    Right Shift -> Select   Q -> L   W -> R   Esc -> Menu
 *
 * Screens can react to any button by listening for the "cfw-button" event:
 *   document.addEventListener('cfw-button', e => e.detail.button === 'start' && ...);
 */
(function () {
  'use strict';

  function init() {
    var group =
      document.querySelector('[data-nav-group]') ||
      (document.querySelector('.nav-item') ? document.body : null);
    if (!group) {
      wireButtons(null);
      return;
    }

    var dir = group.getAttribute('data-nav-dir') || 'vertical';
    var cols = parseInt(group.getAttribute('data-nav-cols') || '0', 10);
    var wrap = group.hasAttribute('data-nav-wrap');
    var back = group.getAttribute('data-back');

    var items = Array.prototype.slice.call(group.querySelectorAll('.nav-item'));
    var index = Math.max(0, items.findIndex(function (el) {
      return el.classList.contains('is-focused');
    }));
    if (items.length) setFocus(index);

    function setFocus(i) {
      if (!items.length) return;
      index = i;
      items.forEach(function (el, j) {
        el.classList.toggle('is-focused', j === index);
      });
      var el = items[index];
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function move(step) {
      if (!items.length) return;
      var next = index + step;
      if (next < 0 || next >= items.length) {
        if (!wrap) return;
        next = (next + items.length) % items.length;
      }
      setFocus(next);
    }

    function handle(button) {
      flash(button);
      switch (button) {
        case 'up':
          move(dir === 'grid' ? -cols : dir === 'horizontal' ? 0 : -1);
          break;
        case 'down':
          move(dir === 'grid' ? cols : dir === 'horizontal' ? 0 : 1);
          break;
        case 'left':
          move(dir === 'vertical' ? 0 : -1);
          break;
        case 'right':
          move(dir === 'vertical' ? 0 : 1);
          break;
        case 'a':
          activate();
          break;
        case 'b':
          if (back) window.location.href = back;
          break;
      }
      document.dispatchEvent(new CustomEvent('cfw-button', {
        detail: { button: button, index: index, item: items[index] || null }
      }));
    }

    function activate() {
      var el = items[index];
      if (!el) return;
      var href = el.getAttribute('data-href');
      if (href) {
        window.location.href = href;
      } else {
        el.click();
      }
    }

    window.cfwNav = { setFocus: setFocus, handle: handle, get index() { return index; } };
    wireKeys(handle);
    wireButtons(handle);
  }

  function wireKeys(handle) {
    var KEYS = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      z: 'a', Z: 'a', x: 'b', X: 'b', Backspace: 'b',
      a: 'x', A: 'x', s: 'y', S: 'y',
      Enter: 'start', q: 'l', Q: 'l', w: 'r', W: 'r', Escape: 'menu'
    };
    document.addEventListener('keydown', function (e) {
      var button = e.code === 'ShiftRight' ? 'select' : KEYS[e.key];
      if (!button) return;
      e.preventDefault();
      handle(button);
    });
  }

  function wireButtons(handle) {
    document.querySelectorAll('[data-btn]').forEach(function (el) {
      el.addEventListener('click', function () {
        var button = el.getAttribute('data-btn');
        if (handle) handle(button);
        else flash(button);
      });
    });
  }

  function flash(button) {
    document.querySelectorAll('[data-btn="' + button + '"]').forEach(function (el) {
      el.classList.add('is-pressed');
      setTimeout(function () { el.classList.remove('is-pressed'); }, 120);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
