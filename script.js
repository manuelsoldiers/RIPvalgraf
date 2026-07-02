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
    // TODO (passaggi successivi): passare alla schermata di gioco
    // e registrare l'username nella leaderboard cloud.
    console.log("Sessione avviata per:", session.username);
    alert(`Benvenuto/a, ${session.username}! (Il gioco arriverà a breve.)`);
  });

  usernameInput.focus();
});
