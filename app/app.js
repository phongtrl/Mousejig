'use strict';

const home = document.querySelector('#home');
const session = document.querySelector('#session');
const settings = document.querySelector('#settings');
const guide = document.querySelector('#guide');
const notice = document.querySelector('#notice');
const clock = document.querySelector('#clock');
const burstMs = 960;
const testMs = 8000;
let active = null;
let frame = 0;
let timeout = 0;
let wakeLock = null;
let sessionNumber = 0;

function keepAwake(enabled) {
  if (window.MousejigPower) {
    window.MousejigPower.keepAwake(enabled);
  } else if (window.webkit?.messageHandlers?.power) {
    window.webkit.messageHandlers.power.postMessage(enabled);
  } else if (enabled && navigator.wakeLock) {
    const id = sessionNumber;
    navigator.wakeLock.request('screen').then(lock => {
      if (active && id === sessionNumber) wakeLock = lock;
      else lock.release().catch(() => {});
    }).catch(() => {});
  } else if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('mousejig-settings') || '{}');
    for (const input of settings.querySelectorAll('input')) {
      if (saved[input.name] === input.value) input.checked = true;
    }
  } catch { /* Storage is optional. The controls have built-in defaults. */ }
}
settings.addEventListener('change', () => {
  try {
    localStorage.setItem('mousejig-settings', JSON.stringify({
      interval: settings.elements.interval.value,
      duration: settings.elements.duration.value
    }));
  } catch { /* The session can still run without saved settings. */ }
});

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return (minutes >= 60 ? Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0') : minutes) +
    ':' + String(seconds % 60).padStart(2, '0');
}

function stop(message) {
  if (!active) return;
  const trigger = active.trigger;
  active = null;
  cancelAnimationFrame(frame);
  clearTimeout(timeout);
  keepAwake(false);
  session.hidden = true;
  home.hidden = false;
  notice.textContent = message;
  pad.drawPreview();
  trigger.focus();
}

function render() {
  const now = performance.now();
  const elapsed = now - active.start;
  if (elapsed >= active.duration) {
    stop(active.test ? 'Test finished. If the PC pointer moved, your mouse can use the pad.' : 'Session complete.');
    return;
  }
  const phase = elapsed % active.interval;
  const timed = Number.isFinite(active.duration);
  const clockText = timed ? formatTime(Math.ceil((active.duration - elapsed) / 1000) * 1000) + ' left' : formatTime(elapsed) + ' elapsed';
  if (clock.textContent !== clockText) clock.textContent = clockText;
  if (phase < burstMs) {
    pad.drawSurface(phase / burstMs);
    active.moving = true;
    frame = requestAnimationFrame(render);
  } else {
    if (active.moving) pad.drawSurface(0);
    active.moving = false;
    // Between bursts wake only for a timer tick, a new burst, or the end.
    timeout = setTimeout(render, Math.max(1, Math.min(1000 - elapsed % 1000, active.interval - phase, active.duration - elapsed)));
  }
}

function start(test, trigger) {
  if (active) return;
  const minutes = Number(settings.elements.duration.value);
  const seconds = Number(settings.elements.interval.value);
  active = {
    start: performance.now(), interval: test ? 2000 : seconds * 1000,
    duration: test ? testMs : (minutes ? minutes * 60000 : Infinity),
    moving: true, test, trigger
  };
  sessionNumber++;
  notice.textContent = '';
  document.querySelector('#sessionLabel').textContent = test ? 'Sensor test' : 'Jiggling';
  document.querySelector('#cadence').textContent = test ? 'Watch your PC pointer for small movements.' : 'One nudge every ' + seconds + ' seconds';
  document.querySelector('#stopLabel').textContent = test ? 'End test' : 'Stop jiggling';
  home.hidden = true;
  session.hidden = false;
  window.scrollTo(0, 0);
  document.querySelector('#activeTitle').focus();
  keepAwake(true);
  render();
}

function suspend() { stop('Session ended when Mousejig left the foreground.'); }
function back() {
  if (guide.open) { guide.close(); return true; }
  if (active) { stop(active.test ? 'Test ended.' : 'Session stopped.'); return true; }
  return false;
}
window.mousejig = { suspend, back };
settings.addEventListener('submit', event => {
  event.preventDefault();
  start(false, settings.querySelector('[type=submit]'));
});
document.querySelector('#test').addEventListener('click', event => start(true, event.currentTarget));
document.querySelector('#stop').addEventListener('click', back);
document.querySelector('#guideButton').addEventListener('click', () => guide.showModal());
document.querySelector('#closeGuide').addEventListener('click', () => guide.close());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) back();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('pagehide', suspend);
window.addEventListener('resize', () => active ? pad.drawSurface(0) : pad.drawPreview());
loadSettings();
pad.drawPreview();

if (window.isSecureContext && /^https?:$/.test(location.protocol) && !window.MousejigPower && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
