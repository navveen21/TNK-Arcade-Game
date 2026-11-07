/**
 * ============================================================================
 * TNK Cyber Neon Ludo Engine (games/ludo.js)
 * ============================================================================
 * CODE-LEVEL OVERVIEW:
 * 1. MAIN_CIRCUIT: 52-step perimeter coordinate path shared by all 4 players.
 * 2. SAFE_INDICES: Star-marked indices on MAIN_CIRCUIT where pawns cannot be captured.
 * 3. PLAYERS: Configuration for Red (0), Green (1), Yellow (2), and Blue (3),
 *    including yard starting slots, entry track index, and 6-step home path.
 * 4. init(): Configures the Arena UI for Ludo, injects the 2P/3P/4P buttons
 *    with `data-mode` attributes, and reveals the handy Dice Control Docks.
 * 5. setMode(mode): Highlights the selected player count button ('2p', '3p', '4p')
 *    using `btn.dataset.mode === mode` and sets `activePlayerIds`.
 * 6. startOnBoard(): Hides `#boardStartOverlay` so the board and dice are unlocked.
 * 7. rollDice(): Generates a 1-6 roll, updates all handy dice displays (top bar,
 *    sidebar dock, and center hub), and checks for legal pawn moves.
 * 8. choosePawnMove(tok): Animates step-by-step pawn hopping, checks for opponent
 *    captures on non-safe tiles, and triggers win celebration when all 4 reach home.
 */

const LudoGame = (function() {

  // --------------------------------------------------------------------------
  // 1. 52-TILE MAIN PERIMETER TRACK (0 to 51)
  // --------------------------------------------------------------------------
  const MAIN_CIRCUIT = [
    {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
    {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
    {r: 0, c: 7}, {r: 0, c: 8},
    {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
    {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
    {r: 7, c: 14}, {r: 8, c: 14},
    {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
    {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
    {r: 14, c: 7}, {r: 14, c: 6},
    {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
    {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
    {r: 7, c: 0}, {r: 6, c: 0}
  ];

  // Global track indices that act as Safe Zones (Start squares + Star squares)
  const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

  // --------------------------------------------------------------------------
  // 2. PLAYER DEFINITIONS (Yards, Start Offsets & Home Paths)
  // --------------------------------------------------------------------------
  const PLAYERS = [
    {
      id: 0, colorKey: 'red', name: 'Player 1', tag: 'Neon Red',
      borderHex: '#ff2a5f', glow: 'rgba(255,42,95,0.55)', bgPawn: 'pawn-red',
      startTrackIdx: 0,
      yardSlots: [{r: 2, c: 2}, {r: 2, c: 3}, {r: 3, c: 2}, {r: 3, c: 3}],
      homePath: [{r: 7, c: 1}, {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5}, {r: 7, c: 6}]
    },
    {
      id: 1, colorKey: 'green', name: 'Player 2', tag: 'Neon Green',
      borderHex: '#00ff88', glow: 'rgba(0,255,136,0.55)', bgPawn: 'pawn-green',
      startTrackIdx: 13,
      yardSlots: [{r: 2, c: 11}, {r: 2, c: 12}, {r: 3, c: 11}, {r: 3, c: 12}],
      homePath: [{r: 1, c: 7}, {r: 2, c: 7}, {r: 3, c: 7}, {r: 4, c: 7}, {r: 5, c: 7}, {r: 6, c: 7}]
    },
    {
      id: 2, colorKey: 'yellow', name: 'Player 3', tag: 'Neon Yellow',
      borderHex: '#ffd000', glow: 'rgba(255,208,0,0.55)', bgPawn: 'pawn-yellow',
      startTrackIdx: 26,
      yardSlots: [{r: 11, c: 11}, {r: 11, c: 12}, {r: 12, c: 11}, {r: 12, c: 12}],
      homePath: [{r: 7, c: 13}, {r: 7, c: 12}, {r: 7, c: 11}, {r: 7, c: 10}, {r: 7, c: 9}, {r: 7, c: 8}]
    },
    {
      id: 3, colorKey: 'blue', name: 'Player 4', tag: 'Neon Cyan',
      borderHex: '#00e5ff', glow: 'rgba(0,229,255,0.55)', bgPawn: 'pawn-blue',
      startTrackIdx: 39,
      yardSlots: [{r: 11, c: 2}, {r: 11, c: 3}, {r: 12, c: 2}, {r: 12, c: 3}],
      homePath: [{r: 13, c: 7}, {r: 12, c: 7}, {r: 11, c: 7}, {r: 10, c: 7}, {r: 9, c: 7}, {r: 8, c: 7}]
    }
  ];

  // --------------------------------------------------------------------------
  // 3. STATE VARIABLES
  // --------------------------------------------------------------------------
  let currentMode = '2p';                 // Active player count mode: '2p', '3p', or '4p'
  let isVsComputer = false;               // True if playing against Bot AI
  let activePlayerIds = [0, 2];           // Default 2P uses opposite corners: Red (0) & Yellow (2)
  let playerRoles = { 0: 'human', 1: 'human', 2: 'human', 3: 'human' };

  let currentTurnIdx = 0;                 // Index inside `activePlayerIds`
  let currentDiceValue = 1;               // Last rolled dice number (1-6)
  let isDiceRolled = false;               // True when dice has been rolled and awaiting pawn selection
  let isRolling = false;                  // True during dice roll animation
  let isAnimating = false;                // True while pawn is hopping step-by-step
  let consecutiveSixes = 0;               // Tracks 3-sixes turn-forfeit rule
  let validPawnMoves = [];                // Array of pawn objects that can legally move on current roll
  let matchOver = false;                  // True when a player gets all 4 pawns to step 57
  let gameStartedOnBoard = false;         // True after user clicks 'Start Game on Board'

  let stats = { captures: 0, sixes: 0, moves: 0 };
  let tokens = [];

  // --------------------------------------------------------------------------
  // 4. INITIALIZATION & MODE SELECTION (FIX #1: HIGHLIGHT SELECTED PLAYER COUNT)
  // --------------------------------------------------------------------------
  function init() {
    document.getElementById("arenaGameTitle").textContent = "Cyber Neon Ludo";
    document.getElementById("gridSizeSelector").style.display = "flex";
    document.getElementById("neonGridContainer").style.display = "none";
    document.getElementById("boardSvg").style.display = "none";
    document.getElementById("p2ActionSection").style.display = "none";
    document.getElementById("ludoStageWrapper").style.display = "flex";

    // Show handy dice docks in the header and sidebar so user never scrolls
    const headerDice = document.getElementById("headerLudoDiceBar");
    if (headerDice) headerDice.style.display = "flex";
    const sideDice = document.getElementById("sidebarLudoDiceCard");
    if (sideDice) sideDice.style.display = "block";

    // Hide countdown timer box (Ludo uses dice turns)
    const timerBox = document.getElementById("arenaTimerBox");
    if (timerBox) timerBox.style.display = "none";

    // Build 2P / 3P / 4P selector buttons with explicit `data-mode` attributes
    // so button highlighting works reliably on click
    const selector = document.getElementById("gridSizeSelector");
    selector.innerHTML = `
      <button class="size-btn" data-mode="2p" onclick="LudoGame.setMode('2p')">2 Players</button>
      <button class="size-btn" data-mode="3p" onclick="LudoGame.setMode('3p')">3 Players</button>
      <button class="size-btn" data-mode="4p" onclick="LudoGame.setMode('4p')">4 Players</button>
    `;

    // Apply current mode and highlight its button
    setMode(currentMode);
  }

  /**
   * FIX #1: Switches between '2p', '3p', and '4p' and highlights the active button
   * using `btn.dataset.mode === mode` (fixes the old string comparison bug).
   */
  function setMode(mode) {
    currentMode = mode;

    // Highlight the clicked player-count button
    document.querySelectorAll("#gridSizeSelector .size-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    // Assign active corners based on player count
    if (mode === '2p') activePlayerIds = [0, 2];          // Red vs Yellow (Opposite corners)
    else if (mode === '3p') activePlayerIds = [0, 1, 2];  // Red, Green, Yellow
    else if (mode === '4p') activePlayerIds = [0, 1, 2, 3]; // All 4 corners

    setAiMode(isVsComputer);
    reset();
  }

  /**
   * Configures Human vs Bot AI roles for active players
   */
  function setAiMode(aiEnabled) {
    isVsComputer = aiEnabled;
    activePlayerIds.forEach((pid, idx) => {
      playerRoles[pid] = (isVsComputer && idx > 0) ? 'bot' : 'human';
    });

    const p1RoleEl = document.getElementById("badgeP1Role");
    const p2RoleEl = document.getElementById("badgeP2Role");
    if (p1RoleEl) p1RoleEl.textContent = "Neon Red (P1)";
    if (p2RoleEl) {
      if (isVsComputer) {
        p2RoleEl.textContent = currentMode === '2p' ? "Bot AI (Yellow)" : `${activePlayerIds.length - 1} Bot AIs`;
      } else {
        p2RoleEl.textContent = currentMode === '2p' ? "Neon Yellow (P2)" : `${activePlayerIds.length} Players Active`;
      }
    }
  }

  /**
   * Unlocks the board when the player clicks '▶ Start Game on Board'
   */
  function startOnBoard() {
    gameStartedOnBoard = true;
    const overlay = document.getElementById("boardStartOverlay");
    if (overlay) overlay.style.display = "none";
    playTone(523, 'triangle', 0.2);
    updateUI();
  }

  /**
   * Resets tokens, statistics, and dice state for a fresh Ludo match
   */
  function reset() {
    matchOver = false;
    currentTurnIdx = 0;
    isDiceRolled = false;
    isRolling = false;
    isAnimating = false;
    consecutiveSixes = 0;
    validPawnMoves = [];
    gameStartedOnBoard = false;
    stats = { captures: 0, sixes: 0, moves: 0 };

    const overlay = document.getElementById("boardStartOverlay");
    if (overlay) {
      overlay.style.display = "flex";
      document.getElementById("overlayTitle").textContent = `Cyber Ludo (${currentMode.toUpperCase()}) Ready`;
    }

    initTokens();
    renderBoard();
    renderTokens();
    syncDiceDisplays('🎲 Ready');
    updateUI();
  }

  /**
   * Updates all handy dice displays (Board Header, Sidebar Dock, and In-Stage Bar)
   * so the player can roll and view results without scrolling.
   */
  function syncDiceDisplays(text) {
    ['diceResultNumber', 'headerDiceResult', 'sidebarDiceResult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
  }

  // --------------------------------------------------------------------------
  // 5. TOKEN DATA INITIALIZATION & COORDINATE LOOKUP
  // --------------------------------------------------------------------------
  function initTokens() {
    tokens = [];
    for (let p = 0; p < 4; p++) {
      tokens[p] = [];
      for (let t = 0; t < 4; t++) {
        tokens[p][t] = { id: t, player: p, status: 'yard', stepCount: 0 };
      }
    }
  }

  function getTokenCoord(tok) {
    const p = PLAYERS[tok.player];
    if (tok.status === 'yard') return p.yardSlots[tok.id];
    if (tok.status === 'finished') return { r: 7, c: 7 };
    if (tok.status === 'homepath') return p.homePath[tok.stepCount - 52];
    const circuitIdx = (p.startTrackIdx + (tok.stepCount - 1)) % 52;
    return MAIN_CIRCUIT[circuitIdx];
  }

  // --------------------------------------------------------------------------
  // 6. RENDER 15x15 LUDO GRID & PAWNS
  // --------------------------------------------------------------------------
  function renderBoard() {
    const board = document.getElementById('board-grid');
    if (!board) return;
    board.innerHTML = '';

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const cell = document.createElement('div');
        cell.id = `ludo-cell-${r}-${c}`;
        cell.className = 'grid-cell';

        if (r < 6 && c < 6) cell.classList.add('yard-red');
        else if (r < 6 && c >= 9) cell.classList.add('yard-green');
        else if (r >= 9 && c < 6) cell.classList.add('yard-cyan');
        else if (r >= 9 && c >= 9) cell.classList.add('yard-yellow');
        else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          cell.classList.add('center-hub');
          // Center cell (7,7) acts as an on-board quick dice button too!
          if (r === 7 && c === 7) {
            cell.innerHTML = '<span style="font-size:15px; cursor:pointer;" title="Click to Roll Dice">🎲</span>';
            cell.style.cursor = 'pointer';
            cell.onclick = () => rollDice();
          }
        }
        else if (r === 7 && c >= 1 && c <= 5) cell.classList.add('path-red');
        else if (c === 7 && r >= 1 && r <= 5) cell.classList.add('path-green');
        else if (r === 7 && c >= 9 && c <= 13) cell.classList.add('path-yellow');
        else if (c === 7 && r >= 9 && r <= 13) cell.classList.add('path-cyan');
        else if (r === 6 && c === 1) { cell.classList.add('start-red'); cell.innerHTML = '★'; }
        else if (r === 1 && c === 8) { cell.classList.add('start-green'); cell.innerHTML = '★'; }
        else if (r === 8 && c === 13) { cell.classList.add('start-yellow'); cell.innerHTML = '★'; }
        else if (r === 13 && c === 6) { cell.classList.add('start-cyan'); cell.innerHTML = '★'; }
        else if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
          cell.classList.add('star-safe'); cell.innerHTML = '★';
        } else {
          cell.classList.add('track-default');
        }
        board.appendChild(cell);
      }
    }
  }

  function renderTokens(movingTok = null) {
    document.querySelectorAll('.pawn-slot').forEach(e => e.remove());

    const coordMap = {};
    for (let p of activePlayerIds) {
      for (let t = 0; t < 4; t++) {
        const tok = tokens[p][t];
        const coord = getTokenCoord(tok);
        const key = `${coord.r}-${coord.c}`;
        if (!coordMap[key]) coordMap[key] = [];
        coordMap[key].push(tok);
      }
    }

    for (let key in coordMap) {
      const list = coordMap[key];
      const [r, c] = key.split('-').map(Number);
      const cell = document.getElementById(`ludo-cell-${r}-${c}`);
      if (!cell) continue;

      const count = list.length;
      list.forEach((tok, idx) => {
        const slot = document.createElement('div');
        slot.className = 'pawn-slot';
        const pawn = document.createElement('div');
        const isPlayable = validPawnMoves.includes(tok);
        const isCurrentMoving = movingTok === tok;

        pawn.className = `pawn ${PLAYERS[tok.player].bgPawn} ${isPlayable ? 'interactive' : ''} ${isCurrentMoving ? 'pawn-hopping' : ''}`;
        pawn.style.boxShadow = `0 0 10px ${PLAYERS[tok.player].glow}`;

        if (count === 1) {
          pawn.style.width = '76%'; pawn.style.height = '76%';
        } else {
          pawn.style.width = '48%'; pawn.style.height = '48%';
          const tr = ['translate(-22%, -22%)', 'translate(22%, -22%)', 'translate(-22%, 22%)', 'translate(22%, 22%)'];
          pawn.style.transform = tr[idx % 4];
        }

        if (isPlayable) {
          pawn.onclick = (e) => {
            e.stopPropagation();
            choosePawnMove(tok);
          };
          // Also allow clicking the parent cell so small pawns are easy to tap
          slot.onclick = (e) => {
            e.stopPropagation();
            choosePawnMove(tok);
          };
        }

        slot.appendChild(pawn);
        cell.appendChild(slot);
      });
    }

    updateUI();
  }

  // --------------------------------------------------------------------------
  // 7. DICE ROLLING & TURN EVALUATION
  // --------------------------------------------------------------------------
  function rollDice() {
    // If user clicks Roll Dice before clicking Start Game overlay, auto-unlock the board!
    if (!gameStartedOnBoard) {
      startOnBoard();
    }
    if (matchOver || isRolling || isDiceRolled || isAnimating) return;

    isRolling = true;
    playTone(380, 'square', 0.08);
    syncDiceDisplays('🎲 ...');

    const diceVal = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => {
      isRolling = false;
      currentDiceValue = diceVal;
      isDiceRolled = true;
      syncDiceDisplays(`🎲 ${diceVal}`);
      afterRoll(diceVal);
    }, 380);
  }

  function afterRoll(val) {
    const curPlayer = activePlayerIds[currentTurnIdx];

    if (val === 6) {
      stats.sixes++;
      consecutiveSixes++;
      if (consecutiveSixes === 3) {
        consecutiveSixes = 0;
        finishTurn(false);
        return;
      }
    } else {
      consecutiveSixes = 0;
    }

    validPawnMoves = getPlayerMoves(curPlayer, val);

    if (validPawnMoves.length === 0) {
      setTimeout(() => finishTurn(val === 6), 650);
    } else if (validPawnMoves.length === 1 && playerRoles[curPlayer] === 'human') {
      renderTokens();
      setTimeout(() => choosePawnMove(validPawnMoves[0]), 260);
    } else {
      renderTokens();
      if (playerRoles[curPlayer] === 'bot') {
        setTimeout(() => runBotDecision(validPawnMoves), 450);
      }
    }
  }

  function getPlayerMoves(pIdx, roll) {
    const moves = [];
    for (let t = 0; t < 4; t++) {
      const tok = tokens[pIdx][t];
      if (tok.status === 'finished') continue;
      if (tok.status === 'yard') {
        if (roll === 6) moves.push(tok);
      } else {
        if (tok.stepCount + roll <= 57) moves.push(tok);
      }
    }
    return moves;
  }

  function runBotDecision(availableMoves) {
    if (availableMoves.length === 0) return;
    let best = availableMoves[0];
    let bestScore = -999;
    for (let tok of availableMoves) {
      let score = 0;
      const targetStep = tok.status === 'yard' ? 1 : tok.stepCount + currentDiceValue;
      if (targetStep === 57) score += 100;
      if (tok.status === 'yard') score += 60;
      score += tok.stepCount;
      if (score > bestScore) {
        bestScore = score;
        best = tok;
      }
    }
    choosePawnMove(best);
  }

  // --------------------------------------------------------------------------
  // 8. PAWN MOVEMENT, CAPTURES & VICTORY CHECK
  // --------------------------------------------------------------------------
  async function choosePawnMove(tok) {
    if (isAnimating) return;
    isAnimating = true;
    validPawnMoves = [];
    stats.moves++;

    const roll = currentDiceValue;
    if (tok.status === 'yard') {
      tok.status = 'track';
      tok.stepCount = 1;
      playTone(520, 'triangle', 0.08);
      renderTokens(tok);
      await new Promise(r => setTimeout(r, 200));
    } else {
      for (let i = 1; i <= roll; i++) {
        tok.stepCount++;
        if (tok.stepCount > 51 && tok.stepCount < 57) tok.status = 'homepath';
        else if (tok.stepCount === 57) tok.status = 'finished';
        else tok.status = 'track';
        playTone(580, 'triangle', 0.04);
        renderTokens(tok);
        await new Promise(r => setTimeout(r, 140));
      }
    }

    let extraTurn = false;
    if (tok.status === 'finished') {
      playTone(880, 'triangle', 0.2);
      extraTurn = true;
    } else if (tok.status === 'track') {
      const pIdx = tok.player;
      const circuitIdx = (PLAYERS[pIdx].startTrackIdx + (tok.stepCount - 1)) % 52;
      const isSafe = SAFE_INDICES.includes(circuitIdx);

      if (!isSafe) {
        for (let opp of activePlayerIds) {
          if (opp === pIdx) continue;
          for (let t = 0; t < 4; t++) {
            const oppTok = tokens[opp][t];
            if (oppTok.status === 'track') {
              const oppCIdx = (PLAYERS[opp].startTrackIdx + (oppTok.stepCount - 1)) % 52;
              if (oppCIdx === circuitIdx) {
                oppTok.status = 'yard';
                oppTok.stepCount = 0;
                stats.captures++;
                extraTurn = true;
                playTone(220, 'sawtooth', 0.2);
              }
            }
          }
        }
      }
    }

    if (tokens[tok.player].every(t => t.status === 'finished')) {
      matchOver = true;
      isAnimating = false;
      const wName = tok.player === 0 ? player1Name : (playerRoles[tok.player] === 'bot' ? `Bot (${PLAYERS[tok.player].tag})` : PLAYERS[tok.player].name);
      triggerWinCelebration(wName, 'All 4 tokens conquered the Home Triangle!');
      return;
    }

    isAnimating = false;
    finishTurn(roll === 6 || extraTurn);
  }

  function finishTurn(hasExtraRoll) {
    isDiceRolled = false;
    validPawnMoves = [];
    renderTokens();

    if (!hasExtraRoll) {
      consecutiveSixes = 0;
      currentTurnIdx = (currentTurnIdx + 1) % activePlayerIds.length;
    }

    updateUI();

    const cur = activePlayerIds[currentTurnIdx];
    if (playerRoles[cur] === 'bot' && !matchOver) {
      setTimeout(() => rollDice(), 600);
    }
  }

  // --------------------------------------------------------------------------
  // 9. UI & TURN INDICATOR UPDATES
  // --------------------------------------------------------------------------
  function updateUI() {
    const curPlayer = activePlayerIds[currentTurnIdx];
    const p = PLAYERS[curPlayer];
    const turnBadge = document.getElementById("turnBadge");
    const turnText = document.getElementById("turnText");

    const displayName = curPlayer === 0 ? player1Name : (playerRoles[curPlayer] === 'bot' ? `Bot (${p.tag})` : (curPlayer === 2 && currentMode === '2p' ? player2Name : p.name));

    if (turnBadge && turnText) {
      turnBadge.className = `turn-pill ${curPlayer === 0 ? 'turn-p1' : 'turn-p2'}`;
      turnBadge.style.borderColor = p.borderHex;
      turnBadge.style.color = p.borderHex;
      turnText.textContent = `Turn: ${displayName} (${p.tag})`;
    }

    const sideTurnLabel = document.getElementById("sidebarLudoTurnName");
    if (sideTurnLabel) {
      sideTurnLabel.textContent = `${displayName} (${p.tag})`;
      sideTurnLabel.style.color = p.borderHex;
    }

    document.getElementById("statBox1Label").textContent = "Captures";
    document.getElementById("statBox1Val").textContent = stats.captures;
    document.getElementById("statBox2Label").textContent = "Sixes Rolled";
    document.getElementById("statBox2Val").textContent = stats.sixes;
    document.getElementById("statBox3Label").textContent = "Players Mode";
    document.getElementById("statBox3Val").textContent = currentMode.toUpperCase();
    document.getElementById("moveCountVal").textContent = stats.moves;

    const prompt = document.getElementById("statusPrompt");
    if (!gameStartedOnBoard) {
      prompt.textContent = "Click 'Start Game on Board' or 'Roll Dice'";
    } else {
      prompt.textContent = isDiceRolled ? "Select glowing token to move" : `${displayName}: Tap Roll Dice`;
    }
  }

  function pauseTimer() {}

  return { init, reset, setMode, setAiMode, rollDice, startOnBoard, pauseTimer };
})();
