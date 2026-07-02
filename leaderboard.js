/* =========================================================================
   RIPValGraf — Predisposizione LEADERBOARD (classifica cloud).
   Per ora NON invia nulla: è uno stub pronto per essere collegato a
   Supabase in un secondo momento. Quando avremo il progetto Supabase
   basterà valorizzare `config.url` / `config.anonKey` e implementare
   le chiamate (via supabase-js o REST) nei punti marcati con TODO.
   ========================================================================= */

const Leaderboard = {
  // Da compilare quando il progetto Supabase sarà pronto.
  config: {
    url: "",       // es. "https://xxxx.supabase.co"
    anonKey: "",   // chiave pubblica anon
    table: "scores",
  },

  isConfigured() {
    return Boolean(this.config.url && this.config.anonKey);
  },

  /**
   * Registra un punteggio di fine partita.
   * @param {string} username
   * @param {number} score
   * @returns {Promise<{ok:boolean, reason?:string}>}
   */
  async submitScore(username, score) {
    if (!this.isConfigured()) {
      console.info(
        "[leaderboard] Supabase non ancora configurato: punteggio non inviato.",
        { username, score }
      );
      return { ok: false, reason: "not-configured" };
    }
    // TODO (Supabase): inserire il record, ad esempio
    //   await fetch(`${this.config.url}/rest/v1/${this.config.table}`, {
    //     method: "POST",
    //     headers: {
    //       apikey: this.config.anonKey,
    //       Authorization: `Bearer ${this.config.anonKey}`,
    //       "Content-Type": "application/json",
    //       Prefer: "return=minimal",
    //     },
    //     body: JSON.stringify({ username, score }),
    //   });
    return { ok: true };
  },

  /**
   * Restituisce i migliori punteggi (per la futura schermata classifica).
   * @param {number} limit
   * @returns {Promise<Array<{username:string, score:number}>>}
   */
  async top(limit = 10) {
    if (!this.isConfigured()) return [];
    // TODO (Supabase): SELECT username, score ORDER BY score DESC LIMIT limit
    return [];
  },
};
