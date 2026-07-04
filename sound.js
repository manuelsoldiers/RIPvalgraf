/* =========================================================================
   RIPValGraf — Motore audio (Web Audio API, suoni sintetizzati).
   Nessun file esterno: tutti i suoni sono generati a runtime, quindi
   funziona offline e rispetta la CSP. Stato on/off persistito in
   localStorage e condiviso da tutti i pulsanti .audio-toggle.
   ========================================================================= */

const Sound = {
  enabled: true,
  ctx: null,
  master: null,
  musicTimer: null,
  musicStep: 0,
  STORAGE_KEY: "ripvalgraf_sound",

  init() {
    try {
      const v = localStorage.getItem(this.STORAGE_KEY);
      if (v !== null) this.enabled = v === "1";
    } catch (e) {}
    this._updateButtons();
  },

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  },

  setEnabled(on) {
    this.enabled = !!on;
    try {
      localStorage.setItem(this.STORAGE_KEY, this.enabled ? "1" : "0");
    } catch (e) {}
    if (!this.enabled) this.stopMusic();
    this._updateButtons();
  },

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.play("toggle"); // feedback solo quando si riattiva
  },

  isEnabled() {
    return this.enabled;
  },

  _updateButtons() {
    document.querySelectorAll(".audio-toggle").forEach((btn) => {
      btn.classList.toggle("off", !this.enabled);
      btn.textContent = this.enabled ? "🔊" : "🔇";
      btn.setAttribute(
        "aria-label",
        this.enabled ? "Disattiva audio" : "Attiva audio"
      );
      btn.title = this.enabled ? "Audio attivo" : "Audio disattivato";
    });
  },

  // ---- primitive di sintesi ----
  _tone(o) {
    const {
      freq = 440, dur = 0.15, type = "sine", gain = 0.2,
      when = 0, glideTo = null, attack = 0.005, release = 0.08,
    } = o;
    const ctx = this.ctx, t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  },

  _noise(o) {
    const { dur = 0.3, gain = 0.3, when = 0, lpFrom = 4000, lpTo = 200 } = o;
    const ctx = this.ctx, t0 = ctx.currentTime + when;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(lpFrom, t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(50, lpTo), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  },

  _seq(notes, base) {
    notes.forEach((nn) => this._tone(Object.assign({}, base, nn)));
  },

  // ---- effetti ----
  play(name) {
    if (!this.enabled) return;
    if (!this._ensure()) return;
    switch (name) {
      case "click":
        this._tone({ freq: 520, dur: 0.05, type: "triangle", gain: 0.11 });
        break;
      case "toggle":
        this._tone({ freq: 480, dur: 0.07, type: "square", gain: 0.12 });
        break;
      case "accedi":
        this._tone({ freq: 523, dur: 0.1, type: "triangle", gain: 0.16 });
        this._tone({ freq: 784, dur: 0.14, type: "triangle", gain: 0.16, when: 0.09 });
        break;
      case "start":
        this._seq(
          [{ freq: 523, when: 0 }, { freq: 659, when: 0.09 }, { freq: 784, when: 0.18 }],
          { dur: 0.12, type: "triangle", gain: 0.15 }
        );
        break;
      case "spawn":
        this._tone({ freq: 880, dur: 0.04, type: "sine", gain: 0.045 });
        break;
      case "po":
        this._tone({ freq: 660, dur: 0.08, type: "triangle", gain: 0.14 });
        this._tone({ freq: 990, dur: 0.09, type: "triangle", gain: 0.12, when: 0.06 });
        break;
      case "adi":
        this._seq(
          [{ freq: 784, when: 0 }, { freq: 1046, when: 0.05 }, { freq: 1318, when: 0.1 }],
          { dur: 0.08, type: "triangle", gain: 0.13 }
        );
        break;
      case "slow":
        this._tone({ freq: 600, dur: 0.5, type: "sawtooth", gain: 0.13, glideTo: 170 });
        break;
      case "freeze":
        this._seq(
          [{ freq: 1200, when: 0 }, { freq: 1600, when: 0.05 }, { freq: 2000, when: 0.1 }, { freq: 2500, when: 0.15 }],
          { dur: 0.18, type: "sine", gain: 0.08 }
        );
        break;
      case "clear":
        this._noise({ dur: 0.4, gain: 0.3, lpFrom: 5000, lpTo: 140 });
        this._tone({ freq: 95, dur: 0.35, type: "sine", gain: 0.25, glideTo: 40 });
        break;
      case "uvm":
        this._seq(
          [{ freq: 440, when: 0 }, { freq: 640, when: 0.14 }, { freq: 440, when: 0.28 }, { freq: 640, when: 0.42 }],
          { dur: 0.13, type: "square", gain: 0.12 }
        );
        break;
      case "win":
        this._seq(
          [{ freq: 523, when: 0 }, { freq: 659, when: 0.1 }, { freq: 784, when: 0.2 }, { freq: 1046, when: 0.3 }],
          { dur: 0.14, type: "triangle", gain: 0.16 }
        );
        break;
      case "fail":
        this._seq(
          [{ freq: 330, when: 0 }, { freq: 300, when: 0.14 }, { freq: 262, when: 0.28 }, { freq: 196, when: 0.42 }],
          { dur: 0.2, type: "sawtooth", gain: 0.12 }
        );
        break;
      case "gameover":
        this._seq(
          [{ freq: 440, when: 0 }, { freq: 392, when: 0.22 }, { freq: 330, when: 0.44 }, { freq: 262, when: 0.66 }],
          { dur: 0.35, type: "triangle", gain: 0.16 }
        );
        break;
    }
  },

  // ---- musica di sottofondo (leggera, durante la partita) ----
  startMusic() {
    if (!this.enabled) return;
    if (!this._ensure()) return;
    if (this.musicTimer) return;
    const scale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63]; // Do Mi Sol Do Sol Mi
    this.musicStep = 0;
    const step = () => {
      if (!this.enabled) {
        this.stopMusic();
        return;
      }
      const f = scale[this.musicStep % scale.length];
      this._tone({ freq: f, dur: 0.28, type: "sine", gain: 0.045, attack: 0.02, release: 0.2 });
      if (this.musicStep % 3 === 0)
        this._tone({ freq: f / 2, dur: 0.4, type: "triangle", gain: 0.035 });
      this.musicStep++;
    };
    step();
    this.musicTimer = setInterval(step, 380);
  },

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  },
};
