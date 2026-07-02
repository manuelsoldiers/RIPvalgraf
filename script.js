/* =========================================================================
   RIPValGraf — clicker game commemorativo del sistema Val.Graf.
   Menu principale (schermata di login).
   Le dinamiche di gioco vere e proprie verranno aggiunte nei passaggi
   successivi; qui gestiamo solo il login e la scelta dell'username.
   ========================================================================= */

// Stato di sessione minimale (verrà esteso col gioco/leaderboard).
const session = {
  username: null,
};

// Passa da una schermata all'altra (login <-> gioco).
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.toggle("active", s.id === id);
  });
  window.scrollTo(0, 0);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");

  // La password è fissa e non modificabile: garantiamo il valore anche
  // se qualcuno tentasse di alterarlo dal DOM.
  const FIXED_PASSWORD = "01_07_2026";
  passwordInput.value = FIXED_PASSWORD;
  passwordInput.addEventListener("beforeinput", (e) => e.preventDefault());

  // Mostra/nascondi la password fissa (solo visivo).
  togglePassword.addEventListener("click", () => {
    const showing = passwordInput.type === "text";
    passwordInput.type = showing ? "password" : "text";
    togglePassword.setAttribute(
      "aria-label",
      showing ? "Mostra password" : "Nascondi password"
    );
  });

  // Login: l'utente inizia la sessione inserendo solo l'username.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    if (!name) {
      usernameInput.focus();
      return;
    }
    session.username = name;
    // Mostra il nome utente nella barra del gestionale e apre la schermata di gioco.
    document.getElementById("user-name").textContent = session.username;
    showScreen("screen-game");
  });

  usernameInput.focus();

  // ---- Schermata di gioco ----
  const startGameBtn = document.getElementById("start-game-btn");
  const pausaBtn = document.getElementById("pausa-btn");

  // "Da prendere in carico": avvia effettivamente il gioco.
  startGameBtn.addEventListener("click", () => {
    // TODO (passaggi successivi): avviare la vera dinamica di gioco
    // (comparsa delle richieste nella tabella, punteggio, ecc.).
    console.log("Avvio partita per:", session.username);
  });

  // "Pausa": metterà in pausa il gioco (menu di pausa nei passaggi successivi).
  pausaBtn.addEventListener("click", () => {
    // TODO (passaggi successivi): aprire il menu di pausa.
    console.log("Pausa richiesta");
  });
});
