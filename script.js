/* =========================================================================
   RIPValGraf — clicker game commemorativo del sistema Val.Graf.
   Login + dinamica di gioco (prese in carico).
   ========================================================================= */

// ---- Stato di sessione / partita ----
const session = { username: null };

const game = {
  running: false,
  paused: false,
  score: 0,
  spawned: 0,       // quante righe sono comparse (per accelerare la difficoltà)
  spawnTimer: null, // handle del timer di comparsa
  seq: 0,           // id progressivo delle righe
};

// Regole di gioco (facili da ritoccare in seguito).
const RULES = {
  DATA_APERTURA: "01/07/2026",
  MAX_ROWS: 10,          // > 10 richieste a schermo => game over
  FIRST_DELAY: 2500,     // latenza prima della prima riga
  START_INTERVAL: 2200,  // intervallo iniziale tra le righe
  MIN_INTERVAL: 650,     // intervallo minimo (massima difficoltà)
  SPEEDUP: 0.94,         // fattore di accelerazione per ogni riga comparsa
  POINTS: { OCC: 1, ADI: 2 },
  // Soglie di difficoltà in base al livello raggiunto:
  //  - livelli 1-15  => facile (verde)
  //  - livelli 16-30 => intermedio (giallo)
  //  - livelli 31+   => difficile (rosso)
  EASY_MAX_LEVEL: 15,
  MEDIUM_MAX_LEVEL: 30,
};

// Dati sintetici di test.
const NOMI = ["Mario", "Giulia", "Antonio", "Francesca", "Giuseppe", "Anna",
  "Luca", "Maria", "Marco", "Sofia", "Andrea", "Chiara", "Paolo", "Elena",
  "Roberto", "Laura", "Salvatore", "Rita", "Vincenzo", "Teresa", "Angelo"];
const COGNOMI = ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano",
  "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca",
  "Costa", "Giordano", "Mancini", "Rizzo", "Lombardi", "Moretti", "Barbieri"];
const TIPI = ["OCC", "ADI"];
// Le "Note PA" e le loro macro-categorie sono in notes.js (NOTES_DB / pickNota).

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/* -------------------------------------------------------------------------
   Icona "medicazione" (Betadine + garze) per le prese in carico
   di categoria Prestazioni Infermieristiche.
   ------------------------------------------------------------------------- */
const ICON_MEDICAZIONE = `
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- pila di garze -->
    <g>
      <rect x="33" y="29" width="26" height="26" rx="2.5" fill="#ffffff" stroke="#d3d9df" stroke-width="1.4"/>
      <line x1="33" y1="36"  x2="59" y2="36"  stroke="#e7ebef" stroke-width="1.2"/>
      <line x1="33" y1="42"  x2="59" y2="42"  stroke="#e7ebef" stroke-width="1.2"/>
      <line x1="33" y1="48"  x2="59" y2="48"  stroke="#e7ebef" stroke-width="1.2"/>
      <path d="M33 31 L59 31" stroke="#c7ced5" stroke-width="1.2"/>
    </g>
    <!-- flacone Betadine -->
    <g>
      <!-- tappo nero -->
      <rect x="15" y="5"  width="11" height="9" rx="1.6" fill="#1b1b1b"/>
      <rect x="13" y="12" width="15" height="6" rx="1.8" fill="#2c2c2c"/>
      <!-- corpo giallo -->
      <rect x="13" y="17" width="15" height="38" rx="3" fill="#f4c400"/>
      <!-- etichetta bianca -->
      <rect x="13" y="41" width="15" height="12" fill="#ffffff"/>
      <rect x="15" y="44" width="11" height="2.2" rx="1" fill="#bdbdbd"/>
      <rect x="15" y="48" width="8"  height="2.2" rx="1" fill="#d0d0d0"/>
      <!-- barretta scritta "Betadine" -->
      <rect x="15" y="25" width="11" height="3.4" rx="1" fill="#1b1b1b"/>
      <rect x="15" y="31" width="9"  height="2.2" rx="1" fill="#7a5c00"/>
    </g>
  </svg>`;

// Icone attualmente in volo (per poterle rimuovere a fine/reset partita).
const flyingIcons = new Set();

// Fa "volare" un'icona a partire dall'elemento cliccato: velocità costante,
// direzione casuale, rimbalzi sui bordi, pop-out dopo 10 secondi.
function spawnFlyingIcon(originEl) {
  const SIZE = 60;
  const SPEED = 190; // px/s, costante
  const LIFETIME = 10000; // ms prima del pop-out

  const el = document.createElement("div");
  el.className = "flying-icon";
  el.innerHTML = `<div class="flying-icon-inner">${ICON_MEDICAZIONE}</div>`;
  document.body.appendChild(el);

  const r = originEl.getBoundingClientRect();
  let x = r.left + r.width / 2 - SIZE / 2;
  let y = r.top + r.height / 2 - SIZE / 2;

  const angle = Math.random() * Math.PI * 2;
  let vx = Math.cos(angle) * SPEED;
  let vy = Math.sin(angle) * SPEED;
  let rot = 0;

  let last = performance.now();
  let rafId = 0;
  let alive = true;

  function frame(now) {
    if (!alive) return;
    const dt = Math.min((now - last) / 1000, 0.05); // clamp per stabilità
    last = now;
    x += vx * dt;
    y += vy * dt;
    const maxX = window.innerWidth - SIZE;
    const maxY = window.innerHeight - SIZE;
    if (x < 0) { x = 0; vx = -vx; } else if (x > maxX) { x = maxX; vx = -vx; }
    if (y < 0) { y = 0; vy = -vy; } else if (y > maxY) { y = maxY; vy = -vy; }
    rot += 45 * dt; // lenta rotazione per un tocco vivace
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `rotate(${rot}deg)`;
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  const rec = {
    stop() {
      alive = false;
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      el.remove();
      flyingIcons.delete(rec);
    },
  };

  const timer = setTimeout(() => {
    const inner = el.querySelector(".flying-icon-inner");
    inner.classList.add("pop-out");
    inner.addEventListener("animationend", () => rec.stop(), { once: true });
  }, LIFETIME);

  flyingIcons.add(rec);
}

// Rimuove immediatamente tutte le icone in volo (reset / fine partita).
function clearFlyingIcons() {
  flyingIcons.forEach((rec) => rec.stop());
  flyingIcons.clear();
}

// ---- Navigazione tra schermate ----
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.toggle("active", s.id === id);
  });
  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------- LOGIN -------------------------
  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");

  const FIXED_PASSWORD = "01_07_2026";
  passwordInput.value = FIXED_PASSWORD;
  passwordInput.addEventListener("beforeinput", (e) => e.preventDefault());

  togglePassword.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    togglePassword.setAttribute(
      "aria-label",
      showing ? "Mostra password" : "Nascondi password"
    );
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (!name) {
      usernameInput.focus();
      return;
    }
    session.username = name;
    document.getElementById("user-name").textContent = session.username;
    showScreen("screen-game");
    setBadgeClickable(true); // stato pre-partita: si può tornare all'accesso
  });

  usernameInput.focus();

  // ---- Easter egg: "Ho dimenticato la password" -> assistenza SIAT ----
  const forgotLink = document.getElementById("forgot-link");
  const siatOverlay = document.getElementById("siat-overlay");
  const siatStep1 = document.getElementById("siat-step-1");
  const siatStep2 = document.getElementById("siat-step-2");
  const siatAskBtn = document.getElementById("siat-ask-btn");
  const siatClose = document.getElementById("siat-close");

  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    siatStep1.hidden = false;
    siatStep2.hidden = true;
    siatOverlay.hidden = false;
  });
  siatAskBtn.addEventListener("click", () => {
    // Parte l'attesa infinita: unica via d'uscita è la X.
    siatStep1.hidden = true;
    siatStep2.hidden = false;
  });
  siatClose.addEventListener("click", () => {
    siatOverlay.hidden = true;
  });

  // ------------------------- GIOCO -------------------------
  const appBody = document.querySelector(".app-body");
  const startGameBtn = document.getElementById("start-game-btn");
  const pausaBtn = document.getElementById("pausa-btn");
  const rowsBody = document.getElementById("cad-rows");
  const scoreChip = document.getElementById("score-chip");
  const scoreEl = document.getElementById("score");
  const overlay = document.getElementById("gameover-overlay");
  const finalScoreEl = document.getElementById("final-score");
  const restartBtn = document.getElementById("restart-btn");
  const pauseOverlay = document.getElementById("pause-overlay");
  const resumeBtn = document.getElementById("resume-btn");
  const toMenuBtn = document.getElementById("tomenu-btn");
  const diffLevelEl = document.getElementById("diff-level");
  const userBadge = document.getElementById("user-badge");
  const logoutOverlay = document.getElementById("logout-overlay");
  const logoutConfirmBtn = document.getElementById("logout-confirm-btn");
  const logoutCancelBtn = document.getElementById("logout-cancel-btn");

  // Il badge utente è cliccabile solo prima dell'avvio della partita.
  function setBadgeClickable(on) {
    userBadge.classList.toggle("clickable", on);
  }

  // Aggiorna il punteggio a schermo con un piccolo effetto.
  function setScore(value) {
    game.score = value;
    scoreEl.textContent = value;
    scoreChip.classList.remove("bump");
    void scoreChip.offsetWidth; // forza il restart dell'animazione
    scoreChip.classList.add("bump");
  }

  // Numero di richieste attualmente a schermo (escluse quelle in uscita).
  function rowsOnScreen() {
    return rowsBody.querySelectorAll("tr:not(.taken)").length;
  }

  // Crea e inserisce una nuova riga-richiesta.
  function spawnRow() {
    const tipo = rnd(TIPI);
    const nota = pickNota(); // { categoria, testo } dal database Note PA
    const id = ++game.seq;

    const tr = document.createElement("tr");
    tr.dataset.id = id;
    tr.dataset.tipo = tipo;
    tr.dataset.notaCategoria = nota.categoria; // per la futura animazione per categoria
    tr.innerHTML = `
      <td>${rndInt(100000, 200000)}</td>
      <td>${RULES.DATA_APERTURA}</td>
      <td>${rnd(NOMI)} ${rnd(COGNOMI)}</td>
      <td><span class="tipo-badge tipo-${tipo}">${tipo}</span></td>
      <td>${nota.testo}</td>
      <td><button type="button" class="btn-carico">PRENDI IN CARICO</button></td>
    `;
    tr.querySelector(".btn-carico").addEventListener("click", () =>
      takeCharge(tr, tipo)
    );
    rowsBody.appendChild(tr);
  }

  // Presa in carico: assegna i punti e rimuove la riga.
  function takeCharge(tr, tipo) {
    if (!game.running || game.paused || tr.classList.contains("taken")) return;
    setScore(game.score + (RULES.POINTS[tipo] || 0));
    // Prestazioni Infermieristiche: parte l'icona "medicazione" volante.
    if (tr.dataset.notaCategoria === "infermieristica") {
      const btn = tr.querySelector(".btn-carico");
      if (btn) spawnFlyingIcon(btn);
    }
    tr.classList.add("taken");
    tr.addEventListener("animationend", () => tr.remove(), { once: true });
  }

  // Intervallo corrente in base al livello di difficoltà raggiunto.
  function nextDelay() {
    return Math.max(
      RULES.MIN_INTERVAL,
      RULES.START_INTERVAL * Math.pow(RULES.SPEEDUP, game.spawned)
    );
  }

  // Aggiorna il numero di livello e il colore in base al livello raggiunto.
  function updateDifficulty() {
    const level = game.spawned + 1; // parte da 1 e cresce con la velocità
    diffLevelEl.textContent = level;

    let cls = "diff-hard";
    if (level <= RULES.EASY_MAX_LEVEL) cls = "diff-easy";
    else if (level <= RULES.MEDIUM_MAX_LEVEL) cls = "diff-medium";
    diffLevelEl.classList.remove("diff-easy", "diff-medium", "diff-hard");
    diffLevelEl.classList.add(cls);
  }

  // Pianifica la comparsa della prossima riga, accelerando col tempo.
  function scheduleNext(delay) {
    game.spawnTimer = setTimeout(() => {
      if (!game.running || game.paused) return;
      spawnRow();
      game.spawned++;
      updateDifficulty();

      // Game over: più di MAX_ROWS richieste contemporaneamente a schermo.
      if (rowsOnScreen() > RULES.MAX_ROWS) {
        endGame();
        return;
      }

      scheduleNext(nextDelay());
    }, delay);
  }

  function startGame() {
    if (game.running) return;
    game.running = true;
    game.paused = false;
    game.score = 0;
    game.spawned = 0;
    game.seq = 0;
    rowsBody.innerHTML = "";
    scoreChip.hidden = false;
    setScore(0);
    updateDifficulty(); // livello iniziale
    pausaBtn.disabled = false; // la pausa è attivabile solo a partita in corso
    setBadgeClickable(false); // durante la partita il badge non è cliccabile

    // Animazione: il menu laterale scompare e la tabella si centra.
    appBody.classList.add("playing");

    // Dopo una breve latenza iniziano a comparire le richieste.
    scheduleNext(RULES.FIRST_DELAY);
  }

  function stopSpawning() {
    game.running = false;
    game.paused = false;
    if (game.spawnTimer) {
      clearTimeout(game.spawnTimer);
      game.spawnTimer = null;
    }
  }

  // ---- Pausa ----
  function pauseGame() {
    if (!game.running || game.paused) return;
    game.paused = true;
    if (game.spawnTimer) {
      clearTimeout(game.spawnTimer);
      game.spawnTimer = null;
    }
    pauseOverlay.hidden = false;
  }

  function resumeGame() {
    if (!game.paused) return;
    game.paused = false;
    pauseOverlay.hidden = true;
    // Riprende dallo stesso livello di difficoltà (game.spawned invariato).
    scheduleNext(nextDelay());
  }

  // Torna alla schermata iniziale del gestionale (tasto "Da prendere in carico").
  function backToMenu() {
    pauseOverlay.hidden = true;
    resetGame();
  }

  // Torna alla schermata di accesso (login), annullando la sessione corrente.
  function backToLogin() {
    logoutOverlay.hidden = true;
    resetGame();
    session.username = null;
    usernameInput.value = "";
    showScreen("screen-login");
    usernameInput.focus();
  }

  async function endGame() {
    stopSpawning();
    finalScoreEl.textContent = game.score;
    overlay.hidden = false;
    // Predisposizione leaderboard (per ora non invia: Supabase non configurato).
    Leaderboard.submitScore(session.username, game.score);
  }

  // Ritorna allo stato iniziale della schermata di gioco (menu visibile).
  function resetGame() {
    stopSpawning();
    clearFlyingIcons();
    overlay.hidden = true;
    rowsBody.innerHTML = "";
    scoreChip.hidden = true;
    setScore(0);
    game.spawned = 0;
    updateDifficulty(); // riporta l'indicatore al livello 1 (verde)
    pausaBtn.disabled = true;
    setBadgeClickable(true); // di nuovo in stato pre-partita
    appBody.classList.remove("playing");
  }

  // La pausa parte disattivata: si abilita solo quando la partita è in corso.
  pausaBtn.disabled = true;

  startGameBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    resetGame();
    startGame(); // riavvio immediato di una nuova partita
  });

  pausaBtn.addEventListener("click", pauseGame);
  resumeBtn.addEventListener("click", resumeGame);
  toMenuBtn.addEventListener("click", backToMenu);

  // Click sul badge utente (solo in stato pre-partita): chiede conferma.
  userBadge.addEventListener("click", () => {
    if (!userBadge.classList.contains("clickable")) return;
    logoutOverlay.hidden = false;
  });
  logoutConfirmBtn.addEventListener("click", backToLogin);
  logoutCancelBtn.addEventListener("click", () => {
    logoutOverlay.hidden = true;
  });
});
