/* =========================================================================
   <doc-slot> — user-fillable document (PDF/file) placeholder.
   Mirrors image-slot's sidecar-persistence pattern so a dropped file
   survives reloads, share links and downloaded zips.

   Drag a file (PDF, DOC, etc.) onto it, or click to browse. The file is
   stored as a data URL in .doc-slots.state.json via window.omelette.writeFile
   (host-allowlisted to *.state.json basenames). Outside the runtime it is
   read-only and just renders whatever's already saved.

   Attributes:
     id           Persistence key. REQUIRED to survive reload.
     label        Small kicker above the title (e.g. "CV", "Certificate").
     title        Main caption shown in the card.
     accept       Comma MIME/extension list (default: pdf + common docs/images).
     placeholder  Empty-state hint (default: "Drop a PDF or click to browse").
   ========================================================================= */
(() => {
  const STATE_FILE = '.doc-slots.state.json';
  // ~8MB cap on a single file's encoded size — keeps the sidecar sane.
  const MAX_BYTES = 8 * 1024 * 1024;
  const DEFAULT_ACCEPT =
    'application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*';

  const subs = new Set();
  let slots = {};
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;

  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j === 'object') {
          const merged = Object.assign({}, j, slots);
          for (const id of tombstones) delete merged[id];
          slots = merged;
        }
        tombstones.clear();
      })
      .catch(() => {})
      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
    return loadP;
  }

  let saving = false, saveDirty = false;
  function save() {
    if (saving) { saveDirty = true; return; }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
      .catch(() => {})
      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
  }

  function getSlot(id) { return id ? (slots[id] || null) : null; }
  function setSlot(id, val) {
    if (!id) return;
    if (val) { slots[id] = val; tombstones.delete(id); }
    else { delete slots[id]; if (!loaded) tombstones.add(id); }
    subs.forEach((fn) => fn());
    if (loaded) save(); else load().then(save);
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(file);
    });
  }

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1024 / 1024).toFixed(1) + ' MB';
  }
  function extOf(name) {
    const m = /\.([a-z0-9]+)$/i.exec(name || '');
    return m ? m[1].toUpperCase() : 'FILE';
  }

  const css =
    ':host{display:block;position:relative;font-family:"IBM Plex Mono",ui-monospace,monospace}' +
    '.card{position:relative;display:flex;flex-direction:column;gap:14px;min-height:200px;' +
    '  padding:22px 20px;background:var(--paper,#f6f4ee);border:1px solid var(--line,#d8d3c8);' +
    '  cursor:pointer;transition:background .4s ease,border-color .3s ease,transform .5s cubic-bezier(.16,1,.3,1)}' +
    '.card:hover{background:var(--paper-2,#efece4)}' +
    ':host([data-over]) .card{border-color:var(--accent,#2f57c9);background:rgba(47,87,201,.06)}' +
    '.kick{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent,#2f57c9)}' +
    '.ttl{font-family:"Space Grotesk",sans-serif;font-weight:500;font-size:19px;letter-spacing:-.01em;' +
    '  color:var(--ink,#16171b);line-height:1.15;margin-top:-4px}' +
    '.body{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px}' +
    '.glyph{width:46px;height:58px;position:relative;flex:0 0 auto}' +
    '.glyph svg{width:100%;height:100%;display:block}' +
    '.meta{flex:1;min-width:0}' +
    '.fname{font-family:"Space Grotesk",sans-serif;font-size:14px;color:var(--ink,#16171b);' +
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.hint{font-size:11px;color:var(--muted,#8c8a82);line-height:1.5}' +
    '.sub{font-size:11px;color:var(--muted,#8c8a82);margin-top:3px}' +
    '.acts{display:flex;gap:8px;opacity:0;transform:translateY(4px);transition:opacity .3s,transform .3s}' +
    ':host([data-filled]:hover) .acts{opacity:1;transform:none}' +
    '.acts a,.acts button{font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.06em;' +
    '  text-transform:uppercase;color:var(--ink,#16171b);background:transparent;border:1px solid var(--line-2,#c9c3b6);' +
    '  border-radius:3px;padding:5px 9px;cursor:pointer;text-decoration:none;transition:all .25s}' +
    '.acts a:hover{background:var(--accent,#2f57c9);border-color:var(--accent,#2f57c9);color:var(--paper,#f6f4ee)}' +
    '.acts button:hover{border-color:var(--ink,#16171b)}' +
    '.ring{position:absolute;inset:6px;border:1.5px dashed var(--line-2,#c9c3b6);pointer-events:none;' +
    '  opacity:0;transition:opacity .3s}' +
    ':host([data-over]) .ring{opacity:1;border-color:var(--accent,#2f57c9)}' +
    '.err{color:#b3261e;font-size:11px;margin-top:4px}';

  function fileGlyph(ext, filled) {
    const stroke = filled ? 'var(--accent,#2f57c9)' : 'var(--muted,#8c8a82)';
    return (
      '<svg viewBox="0 0 46 58" fill="none" stroke="' + stroke + '" stroke-width="1.4">' +
      '<path d="M7 2 H30 L39 11 V56 H7 Z" stroke-linejoin="round"/>' +
      '<path d="M30 2 V11 H39"/>' +
      (filled
        ? '<text x="23" y="40" text-anchor="middle" font-family="IBM Plex Mono,monospace" ' +
          'font-size="9" fill="' + stroke + '" stroke="none">' + ext.slice(0, 4) + '</text>'
        : '<line x1="13" y1="24" x2="33" y2="24"/><line x1="13" y1="31" x2="33" y2="31"/>' +
          '<line x1="13" y1="38" x2="27" y2="38"/>') +
      '</svg>'
    );
  }

  // Convert a data: URL to a Blob so it can be opened in a new tab. Browsers
  // (Edge/Chrome) block top-level navigation to data: URLs — "This page has
  // been blocked" — so we open a blob: URL instead, which is allowed.
  function dataURLToBlob(dataurl) {
    const comma = dataurl.indexOf(',');
    const header = dataurl.slice(0, comma);
    const body = dataurl.slice(comma + 1);
    const mime = (/data:([^;]+)/.exec(header) || [, 'application/octet-stream'])[1];
    let bytes;
    if (/;base64/i.test(header)) {
      const bin = atob(body);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      const dec = decodeURIComponent(body);
      bytes = new Uint8Array(dec.length);
      for (let i = 0; i < dec.length; i++) bytes[i] = dec.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  class DocSlot extends HTMLElement {
    static get observedAttributes() { return ['label', 'title', 'placeholder', 'id']; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' + css + '</style>' +
        '<div class="card" part="card">' +
        '  <div class="kick"></div><div class="ttl"></div>' +
        '  <div class="ring"></div>' +
        '  <div class="body">' +
        '    <div class="glyph"></div>' +
        '    <div class="meta"><div class="fname"></div><div class="sub"></div>' +
        '      <div class="acts"><a class="open" target="_blank" rel="noopener">Open</a>' +
        '        <a class="dl">Download</a><button class="rm">Remove</button></div></div>' +
        '  </div>' +
        '</div>' +
        '<input type="file" hidden>';
      this._card = root.querySelector('.card');
      this._kick = root.querySelector('.kick');
      this._ttl = root.querySelector('.ttl');
      this._glyph = root.querySelector('.glyph');
      this._fname = root.querySelector('.fname');
      this._sub = root.querySelector('.sub');
      this._acts = root.querySelector('.acts');
      this._open = root.querySelector('.open');
      this._dl = root.querySelector('.dl');
      this._rm = root.querySelector('.rm');
      this._input = root.querySelector('input');
      this._depth = 0;
      this._subFn = () => this._render();

      this._card.addEventListener('click', (e) => {
        const t = e.target;
        if (t.closest('.acts')) return; // let action buttons act
        this._input.click();
      });
      this._rm.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.id) setSlot(this.id, null); else { this._local = null; this._render(); }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
    }
    connectedCallback() {
      this._input.setAttribute('accept', this.getAttribute('accept') || DEFAULT_ACCEPT);
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.addEventListener(t, this));
      subs.add(this._subFn);
      load();
      this._render();
    }
    disconnectedCallback() {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.removeEventListener(t, this));
      subs.delete(this._subFn);
      if (this._blobURL) { URL.revokeObjectURL(this._blobURL); this._blobURL = null; }
    }
    attributeChangedCallback() { if (this.shadowRoot) this._render(); }

    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault(); e.stopPropagation();
        this._depth = 0; this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      this._setError(null);
      if (file.size > MAX_BYTES) {
        this._setError('File is over ' + fmtSize(MAX_BYTES) + '. Compress it and try again.');
        return;
      }
      try {
        const url = await readAsDataURL(file);
        const val = { u: url, n: file.name, sz: file.size, t: file.type };
        if (this.id) setSlot(this.id, val); else { this._local = val; this._render(); }
      } catch (err) {
        this._setError('Could not read that file.');
        console.warn('<doc-slot> ingest failed:', err);
      }
    }

    _setError(msg) {
      let e = this.shadowRoot.querySelector('.err');
      if (!msg) { if (e) e.remove(); return; }
      if (!e) { e = document.createElement('div'); e.className = 'err'; this._card.appendChild(e); }
      e.textContent = msg;
      setTimeout(() => { if (e && e.textContent === msg) e.remove(); }, 4000);
    }

    _render() {
      const editable = !!(window.omelette && window.omelette.writeFile);
      this._kick.textContent = this.getAttribute('label') || 'Document';
      this._ttl.textContent = this.getAttribute('title') || 'Untitled';
      const stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u) {
        const ext = extOf(stored.n);
        this.setAttribute('data-filled', '');
        this._glyph.innerHTML = fileGlyph(ext, true);
        this._fname.textContent = stored.n || 'document';
        this._sub.textContent = ext + ' · ' + fmtSize(stored.sz || 0);
        // Use a blob: URL for Open/Download. Browsers (Edge/Chrome) block
        // navigating a tab to a data: URL, so a native anchor click on the
        // stored data: URL fails. A blob: URL opens reliably and is not
        // popup-blocked because the click is a real user navigation.
        if (this._blobURL) { URL.revokeObjectURL(this._blobURL); this._blobURL = null; }
        let href = stored.u;
        if (/^data:/.test(stored.u)) {
          try { this._blobURL = URL.createObjectURL(dataURLToBlob(stored.u)); href = this._blobURL; }
          catch (err) { console.warn('<doc-slot> blob convert failed:', err); }
        }
        this._open.href = href;
        this._open.target = '_blank';
        this._open.rel = 'noopener';
        this._dl.href = href;
        this._dl.setAttribute('download', stored.n || 'document');
        this._acts.style.display = editable ? '' : '';
        this._rm.style.display = editable ? '' : 'none';
      } else {
        this.removeAttribute('data-filled');
        this._glyph.innerHTML = fileGlyph('', false);
        this._fname.textContent = '';
        this._sub.textContent = editable
          ? (this.getAttribute('placeholder') || 'Drop a PDF or click to browse')
          : 'No file attached';
      }
    }
  }

  if (!customElements.get('doc-slot')) customElements.define('doc-slot', DocSlot);
})();
