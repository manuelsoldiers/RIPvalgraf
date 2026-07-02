/* =========================================================================
   RIPValGraf — clicker game commemorativo del sistema Val.Graf.
   Login + dinamica di gioco (prese in carico).
   ========================================================================= */

// ---- Stato di sessione / partita ----
const session = { username: null };

const game = {
  running: false,
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
};

// Dati sintetici di test.
const NOMI = ["Mario", "Giulia", "Antonio", "Francesca", "Giuseppe", "Anna",
  "Luca", "Maria", "Marco", "Sofia", "Andrea", "Chiara", "Paolo", "Elena",
  "Roberto", "Laura", "Salvatore", "Rita", "Vincenzo", "Teresa", "Angelo"];
const COGNOMI = ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano",
  "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca",
  "Costa", "Giordano", "Mancini", "Rizzo", "Lombardi", "Moretti", "Barbieri"];
const TIPI = ["OCC", "ADI"];
const NOTE = ["ciclo di fkt", "medicazioni LDD"];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
  });

  usernameInput.focus();

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
    const id = ++game.seq;

    const tr = document.createElement("tr");
    tr.dataset.id = id;
    tr.dataset.tipo = tipo;
    tr.innerHTML = `
      <td>${rndInt(100000, 200000)}</td>
      <td>${RULES.DATA_APERTURA}</td>
      <td>${rnd(NOMI)} ${rnd(COGNOMI)}</td>
      <td><span class="tipo-badge tipo-${tipo}">${tipo}</span></td>
      <td>${rnd(NOTE)}</td>
      <td><button type="button" class="btn-carico">PRENDI IN CARICO</button></td>
    `;
    tr.querySelector(".btn-carico").addEventListener("click", () =>
      takeCharge(tr, tipo)
    );
    rowsBody.appendChild(tr);
  }

  // Presa in carico: assegna i punti e rimuove la riga.
  function takeCharge(tr, tipo) {
    if (!game.running || tr.classList.contains("taken")) return;
    setScore(game.score + (RULES.POINTS[tipo] || 0));
    tr.classList.add("taken");
    tr.addEventListener("animationend", () => tr.remove(), { once: true });
  }

  // Pianifica la comparsa della prossima riga, accelerando col tempo.
  function scheduleNext(delay) {
    game.spawnTimer = setTimeout(() => {
      if (!game.running) return;
      spawnRow();
      game.spawned++;

      // Game over: più di MAX_ROWS richieste contemporaneamente a schermo.
      if (rowsOnScreen() > RULES.MAX_ROWS) {
        endGame();
        return;
      }

      const next = Math.max(
        RULES.MIN_INTERVAL,
        RULES.START_INTERVAL * Math.pow(RULES.SPEEDUP, game.spawned)
      );
      scheduleNext(next);
    }, delay);
  }

  function startGame() {
    if (game.running) return;
    game.running = true;
    game.score = 0;
    game.spawned = 0;
    game.seq = 0;
    rowsBody.innerHTML = "";
    scoreChip.hidden = false;
    setScore(0);

    // Animazione: il menu laterale scompare e la tabella si centra.
    appBody.classList.add("playing");

    // Dopo una breve latenza iniziano a comparire le richieste.
    scheduleNext(RULES.FIRST_DELAY);
  }

  function stopSpawning() {
    game.running = false;
    if (game.spawnTimer) {
      clearTimeout(game.spawnTimer);
      game.spawnTimer = null;
    }
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
    overlay.hidden = true;
    rowsBody.innerHTML = "";
    scoreChip.hidden = true;
    setScore(0);
    appBody.classList.remove("playing");
  }

  startGameBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    resetGame();
    // Riavvio immediato di una nuova partita.
    startGame();
  });

  pausaBtn.addEventListener("click", () => {
    // TODO (passaggi successivi): menu di pausa completo.
    console.log("Pausa richiesta");
  });
});
