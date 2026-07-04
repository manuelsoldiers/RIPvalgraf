/* =========================================================================
   RIPValGraf — LEADERBOARD su Supabase.
   Tabella public.leaderboard: mantiene (via trigger) solo i 10 punteggi
   piu' alti. Lettura e inserimento anonimi (chiave pubblica).
   ========================================================================= */

const Leaderboard = {
  config: {
    url: "https://gearmowckdvqkmmcusqd.supabase.co",
    anonKey: "sb_publishable_gyDocBZbYFpUgRfTdBRN_Q_VcB6zf8r",
    table: "leaderboard",
  },

  isConfigured() {
    return Boolean(this.config.url && this.config.anonKey);
  },

  _headers(extra) {
    return Object.assign(
      {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${this.config.anonKey}`,
      },
      extra || {}
    );
  },

  /**
   * Registra un punteggio di fine partita.
   * @param {string} name
   * @param {number} score
   * @returns {Promise<{ok:boolean, status?:number, reason?:string}>}
   */
  async submitScore(name, score) {
    if (!this.isConfigured()) return { ok: false, reason: "not-configured" };
    const payload = {
      name: String(name || "").trim().slice(0, 24),
      score: Math.max(0, Math.floor(Number(score) || 0)),
    };
    if (!payload.name) return { ok: false, reason: "empty-name" };
    try {
      const res = await fetch(`${this.config.url}/rest/v1/${this.config.table}`, {
        method: "POST",
        headers: this._headers({
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        }),
        body: JSON.stringify(payload),
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      console.warn("[leaderboard] invio punteggio fallito:", e);
      return { ok: false, reason: "network" };
    }
  },

  /**
   * Restituisce i migliori punteggi (max 10), ordinati per punteggio.
   * @param {number} limit
   * @returns {Promise<Array<{name:string, score:number}>>}
   */
  async top(limit = 10) {
    if (!this.isConfigured()) return [];
    try {
      const url =
        `${this.config.url}/rest/v1/${this.config.table}` +
        `?select=name,score&order=score.desc,created_at.asc&limit=${limit}`;
      const res = await fetch(url, { headers: this._headers() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("[leaderboard] lettura classifica fallita:", e);
      return [];
    }
  },
};
