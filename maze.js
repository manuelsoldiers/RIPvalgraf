/* =========================================================================
   RIPValGraf — Minigioco UVM PRIORITARIA.
   Labirinto 2D generato casualmente (strada di campagna): l'utente trascina
   l'auto fino alla casa del paziente entro un tempo limite.
   Modulo autonomo: nessun accoppiamento col gioco. Espone runUvmMinigame().
   ========================================================================= */

// Auto di servizio (vista laterale, bianca con croce ASL) — sprite trascinabile.
const CAR_SVG = `
  <svg viewBox="0 0 64 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="33" cy="30" rx="27" ry="3" fill="rgba(0,0,0,.18)"/>
    <path d="M4 23 Q4 15 13 14 L21 8 Q25 6 35 6 L45 7 Q53 9 58 15 L60 17 Q62 18 62 21 L62 24 Q62 26 60 26 L6 26 Q4 26 4 24 Z"
          fill="#ffffff" stroke="#c4c9d0" stroke-width="1.2"/>
    <path d="M22 12 L33 10 L33 15 L21 15 Z" fill="#3a434f"/>
    <path d="M36 10 L44 11 Q50 12 53 15 L36 15 Z" fill="#3a434f"/>
    <g transform="translate(29,18)">
      <rect x="-1.6" y="-4.2" width="3.2" height="8.4" fill="#2e2e8f"/>
      <rect x="-4.2" y="-1.6" width="8.4" height="3.2" fill="#e2231a"/>
    </g>
    <circle cx="18" cy="27" r="5.4" fill="#161616"/><circle cx="18" cy="27" r="2.1" fill="#8a8f96"/>
    <circle cx="48" cy="27" r="5.4" fill="#161616"/><circle cx="48" cy="27" r="2.1" fill="#8a8f96"/>
  </svg>`;

const HOUSE_SVG = `
  <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="20,3 38,19 2,19" fill="#c0392b"/>
    <rect x="7" y="19" width="26" height="18" fill="#efe0bd" stroke="#b7a06d" stroke-width="1"/>
    <rect x="16" y="26" width="8" height="11" fill="#7a5230"/>
    <rect x="10" y="22" width="6" height="6" fill="#8fc0e8"/>
    <rect x="24" y="22" width="6" height="6" fill="#8fc0e8"/>
  </svg>`;

// Genera un labirinto perfetto (DFS backtracking).
function generateMaze(cols, rows) {
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c, v: false, walls: { t: true, r: true, b: true, l: true },
    }))
  );
  const opp = { t: "b", r: "l", b: "t", l: "r" };
  const stack = [];
  let cur = cells[0][0];
  cur.v = true;
  stack.push(cur);
  while (stack.length) {
    cur = stack[stack.length - 1];
    const { r, c } = cur;
    const opts = [];
    if (r > 0 && !cells[r - 1][c].v) opts.push(["t", cells[r - 1][c]]);
    if (c < cols - 1 && !cells[r][c + 1].v) opts.push(["r", cells[r][c + 1]]);
    if (r < rows - 1 && !cells[r + 1][c].v) opts.push(["b", cells[r + 1][c]]);
    if (c > 0 && !cells[r][c - 1].v) opts.push(["l", cells[r][c - 1]]);
    if (!opts.length) { stack.pop(); continue; }
    const [dir, next] = opts[Math.floor(Math.random() * opts.length)];
    cur.walls[dir] = false;
    next.walls[opp[dir]] = false;
    next.v = true;
    stack.push(next);
  }
  return cells;
}

/**
 * Avvia il minigioco nel container indicato.
 * @param {HTMLElement} container
 * @param {{durationMs:number, onSuccess:Function, onFail:Function}} opts
 * @returns {{destroy:Function}}
 */
function runUvmMinigame(container, opts) {
  const COLS = 6, ROWS = 6, CS = 52;   // dimensioni labirinto
  const RW = Math.round(CS * 0.56);    // larghezza strada
  const W = COLS * CS, H = ROWS * CS;
  const maze = generateMaze(COLS, ROWS);

  container.innerHTML = "";
  container.style.width = W + "px";
  container.style.height = H + "px";

  // Barra tempo (inserita PRIMA del labirinto, così non sfasa il canvas)
  const timeWrap = document.createElement("div");
  timeWrap.className = "uvm-timebar";
  timeWrap.style.width = W + "px";
  const timeFill = document.createElement("div");
  timeWrap.appendChild(timeFill);
  container.parentNode.insertBefore(timeWrap, container);

  // Canvas: campi + strade
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  canvas.className = "uvm-canvas";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  drawMaze();

  const cellCenter = (r, c) => ({ x: c * CS + CS / 2, y: r * CS + CS / 2 });
  const connected = (r1, c1, r2, c2) => {
    if (r2 === r1 && c2 === c1 + 1) return !maze[r1][c1].walls.r;
    if (r2 === r1 && c2 === c1 - 1) return !maze[r1][c1].walls.l;
    if (c2 === c1 && r2 === r1 + 1) return !maze[r1][c1].walls.b;
    if (c2 === c1 && r2 === r1 - 1) return !maze[r1][c1].walls.t;
    return false;
  };

  // Casa (arrivo) in basso a destra
  const house = document.createElement("div");
  house.className = "uvm-house";
  house.innerHTML = HOUSE_SVG;
  const hc = cellCenter(ROWS - 1, COLS - 1);
  house.style.left = hc.x + "px";
  house.style.top = hc.y + "px";
  container.appendChild(house);

  // Auto (partenza) in alto a sinistra
  let cr = 0, cc = 0, facing = 1;
  const car = document.createElement("div");
  car.className = "uvm-car";
  car.innerHTML = CAR_SVG;
  container.appendChild(car);
  renderCar();

  let finished = false;
  let dragging = false;

  function renderCar() {
    const p = cellCenter(cr, cc);
    car.style.transform =
      `translate(-50%,-50%) translate(${p.x}px, ${p.y}px) scaleX(${facing})`;
  }

  function drawMaze() {
    // Campi
    ctx.fillStyle = "#86b24a";
    ctx.fillRect(0, 0, W, H);
    // Texture leggera dei campi
    ctx.fillStyle = "rgba(120,160,70,0.45)";
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * W, y = Math.random() * H, rr = 3 + Math.random() * 5;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    }
    // Strade (bordo + sterrato)
    const drawRoad = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    };
    const segs = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = c * CS + CS / 2, cy = r * CS + CS / 2;
        segs.push([cx - RW / 2, cy - RW / 2, RW, RW]);
        if (!maze[r][c].walls.r) segs.push([cx - RW / 2, cy - RW / 2, CS, RW]);
        if (!maze[r][c].walls.b) segs.push([cx - RW / 2, cy - RW / 2, RW, CS]);
      }
    }
    // bordo strada (marrone) poi sterrato (chiaro)
    segs.forEach((s) => drawRoad(s[0] - 2, s[1] - 2, s[2] + 4, s[3] + 4, "#9c7f4f"));
    segs.forEach((s) => drawRoad(s[0], s[1], s[2], s[3], "#d8bd86"));
  }

  // Muove l'auto verso il puntatore lungo i corridoi aperti.
  function stepToward(px, py) {
    let steps = 0;
    while (steps < 5 && !finished) {
      const ctr = cellCenter(cr, cc);
      const dx = px - ctr.x, dy = py - ctr.y;
      if (Math.abs(dx) < CS * 0.3 && Math.abs(dy) < CS * 0.3) break;
      const order = Math.abs(dx) >= Math.abs(dy) ? ["x", "y"] : ["y", "x"];
      let moved = false;
      for (const ax of order) {
        if (ax === "x") {
          if (dx > 0 && cc < COLS - 1 && connected(cr, cc, cr, cc + 1)) { cc++; facing = 1; moved = true; break; }
          if (dx < 0 && cc > 0 && connected(cr, cc, cr, cc - 1)) { cc--; facing = -1; moved = true; break; }
        } else {
          if (dy > 0 && cr < ROWS - 1 && connected(cr, cc, cr + 1, cc)) { cr++; moved = true; break; }
          if (dy < 0 && cr > 0 && connected(cr, cc, cr - 1, cc)) { cr--; moved = true; break; }
        }
      }
      if (!moved) break;
      steps++;
      renderCar();
      if (cr === ROWS - 1 && cc === COLS - 1) { finish(true); return; }
    }
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  const onDown = (e) => { dragging = true; car.classList.add("grab"); const p = pointerPos(e); stepToward(p.x, p.y); e.preventDefault(); };
  const onMove = (e) => { if (!dragging || finished) return; const p = pointerPos(e); stepToward(p.x, p.y); e.preventDefault(); };
  const onUp = () => { dragging = false; car.classList.remove("grab"); };

  container.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);

  // Timer
  requestAnimationFrame(() => { timeFill.style.transition = `width ${opts.durationMs}ms linear`; timeFill.style.width = "0%"; });
  const timer = setTimeout(() => finish(false), opts.durationMs);

  function finish(success) {
    if (finished) return;
    finished = true;
    cleanup();
    if (success) opts.onSuccess(); else opts.onFail();
  }
  function cleanup() {
    clearTimeout(timer);
    container.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (timeWrap.parentNode) timeWrap.remove();
  }

  return { destroy: () => { finished = true; cleanup(); } };
}
