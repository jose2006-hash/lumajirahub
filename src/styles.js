export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:       #0A0A0B;
    --ink-2:     #1C1C1E;
    --ink-3:     #2C2C2E;
    --ink-4:     #48484A;
    --mist:      #636366;
    --fog:       #AEAEB2;
    --snow:      #F2F2F7;
    --white:     #FFFFFF;
    --accent:    #FF6B35;
    --accent-2:  #FF8C5A;
    --accent-bg: rgba(255,107,53,0.08);
    --green:     #30D158;
    --blue:      #0A84FF;
    --purple:    #BF5AF2;
    --radius:    16px;
    --radius-sm: 10px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.08);
    --shadow:    0 4px 16px rgba(0,0,0,.2), 0 1px 4px rgba(0,0,0,.12);
    --shadow-lg: 0 16px 48px rgba(0,0,0,.32), 0 4px 16px rgba(0,0,0,.16);
    --spring:    cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease:      cubic-bezier(0.4, 0, 0.2, 1);
    --font:      'DM Sans', system-ui, sans-serif;
    --font-display: 'DM Serif Display', Georgia, serif;
  }

  html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; scroll-behavior: smooth; }
  body { background: var(--ink); color: var(--white); font-family: var(--font); font-size: 15px; line-height: 1.5; }
  .root { min-height: 100vh; }

  /* ── TYPOGRAPHY ── */
  .t-display { font-family: var(--font-display); font-weight: 400; line-height: 1.05; letter-spacing: -.02em; }
  .t-title   { font-size: clamp(32px, 5vw, 64px); }
  .t-label   { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--mist); }

  /* ── NAV ── */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 52px;
    background: rgba(10,10,11,0.8); backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: sticky; top: 0; z-index: 100;
    transition: background .3s var(--ease);
  }
  .nav-logo { font-family: var(--font-display); font-size: 18px; color: var(--accent); letter-spacing: -.02em; }
  .nav-logo span { color: var(--ink-4); font-family: var(--font); font-weight: 300; font-size: 16px; }

  /* ── BUTTONS — física, peso, confirmación táctil ── */
  .btn-primary {
    background: var(--accent); color: var(--white); border: none;
    border-radius: var(--radius-sm); padding: 11px 22px;
    font-family: var(--font); font-weight: 600; font-size: 14px;
    cursor: pointer; transition: all .18s var(--ease);
    box-shadow: 0 2px 8px rgba(255,107,53,.3), inset 0 1px 0 rgba(255,255,255,.15);
    position: relative; overflow: hidden;
  }
  .btn-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,.08) 0%,transparent 50%); pointer-events:none; }
  .btn-primary:hover  { background: var(--accent-2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,107,53,.4); }
  .btn-primary:active { transform: scale(.97) translateY(0); box-shadow: 0 1px 4px rgba(255,107,53,.3); }
  .btn-primary:disabled { opacity: .4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: transparent; color: var(--fog); border: 1px solid var(--ink-3);
    border-radius: var(--radius-sm); padding: 11px 22px;
    font-family: var(--font); font-weight: 500; font-size: 14px;
    cursor: pointer; transition: all .18s var(--ease);
  }
  .btn-ghost:hover { border-color: var(--ink-4); color: var(--white); background: rgba(255,255,255,.04); }
  .btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 8px; }

  .btn-danger  { background: rgba(255,69,58,.12); color: #FF453A; border: 1px solid rgba(255,69,58,.25); border-radius: 8px; padding: 7px 14px; font-family: var(--font); font-weight: 600; font-size: 12px; cursor: pointer; transition: all .15s; }
  .btn-success { background: rgba(48,209,88,.12); color: var(--green); border: 1px solid rgba(48,209,88,.25); border-radius: 8px; padding: 7px 14px; font-family: var(--font); font-weight: 600; font-size: 12px; cursor: pointer; transition: all .15s; }
  .btn-install { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-family: var(--font); font-weight: 600; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all .15s; box-shadow: 0 2px 10px rgba(255,107,53,.3); }
  .btn-install:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(255,107,53,.4); }

  /* ── INPUTS ── */
  .input {
    background: var(--ink-2); border: 1px solid var(--ink-3);
    border-radius: var(--radius-sm); padding: 11px 14px;
    color: var(--white); font-family: var(--font); font-size: 15px; width: 100%;
    outline: none; transition: all .2s var(--ease);
    box-shadow: inset 0 1px 3px rgba(0,0,0,.2);
  }
  .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,53,.15), inset 0 1px 3px rgba(0,0,0,.2); }
  .input::placeholder { color: var(--ink-4); }
  textarea.input { resize: vertical; line-height: 1.55; }
  .label { font-size: 11px; font-weight: 600; color: var(--mist); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 7px; display: block; }

  /* ── CARDS ── */
  .card { background: var(--ink-2); border: 1px solid var(--ink-3); border-radius: var(--radius); }
  .card-hover { transition: border-color .2s, transform .2s var(--spring), box-shadow .2s; cursor: pointer; }
  .card-hover:hover { border-color: rgba(255,107,53,.4); transform: translateY(-3px); box-shadow: var(--shadow); }

  /* ── LAYOUT ── */
  .page      { max-width: 920px;  margin: 0 auto; padding: 36px 24px; }
  .page-wide { max-width: 1120px; margin: 0 auto; padding: 36px 24px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
  @media(max-width:700px) { .grid-2, .grid-4 { grid-template-columns: 1fr; } }

  /* ── SECTION ── */
  .section-title { font-family: var(--font-display); font-size: 26px; color: var(--white); letter-spacing: -.01em; }
  .section-sub   { font-size: 14px; color: var(--mist); margin-top: 5px; }
  .hero-title    { font-family: var(--font-display); font-size: clamp(36px, 6vw, 72px); line-height: 1.05; letter-spacing: -.03em; }

  /* ── BADGES ── */
  .badge         { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-open    { background: rgba(48,209,88,.1);  color: var(--green); }
  .badge-closed  { background: rgba(99,99,102,.12); color: var(--fog); }
  .badge-pending { background: rgba(255,107,53,.1); color: var(--accent); }
  .badge-blue    { background: rgba(10,132,255,.1); color: var(--blue); }
  .tag { font-size: 11px; background: var(--ink-3); color: var(--fog); padding: 3px 9px; border-radius: 6px; white-space: nowrap; }

  /* ── CHAT BUBBLES ── */
  .bubble-me  {
    background: var(--accent); color: #fff;
    border-radius: 20px 20px 5px 20px; padding: 11px 15px;
    max-width: 75%; align-self: flex-end;
    font-size: 15px; line-height: 1.5; white-space: pre-wrap;
    box-shadow: 0 2px 12px rgba(255,107,53,.25);
    animation: bubbleIn .25s var(--spring) both;
  }
  .bubble-bot {
    background: var(--ink-2); color: var(--white);
    border-radius: 20px 20px 20px 5px; padding: 11px 15px;
    max-width: 75%; align-self: flex-start;
    font-size: 15px; line-height: 1.5; white-space: pre-wrap;
    border: 1px solid var(--ink-3);
    animation: bubbleIn .25s var(--spring) both;
  }
  @keyframes bubbleIn { from { opacity:0; transform:scale(.92) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }

  /* ── TABS ── */
  .tab { padding: 7px 16px; font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all .15s; color: var(--mist); background: transparent; border: none; font-family: var(--font); }
  .tab.active { background: var(--ink-3); color: var(--white); }

  /* ── TABLES ── */
  .scroll-x { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 16px; color: var(--mist); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--ink-3); }
  td { padding: 13px 16px; border-bottom: 1px solid var(--ink-2); color: var(--fog); vertical-align: middle; }
  tr:hover td { background: rgba(255,255,255,.02); }
  hr { border: none; border-top: 1px solid var(--ink-3); margin: 20px 0; }

  /* ── SPINNER ── */
  .spinner { width: 18px; height: 18px; border: 2px solid var(--ink-3); border-top-color: var(--accent); border-radius: 50%; animation: spin .65s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── TOAST ── */
  .toast { position: fixed; top: 18px; right: 18px; z-index: 9999; background: var(--ink-2); border: 1px solid var(--ink-3); border-radius: 14px; padding: 13px 20px; font-size: 14px; font-weight: 600; max-width: 340px; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-lg); animation: toastIn .3s var(--spring); pointer-events: none; }
  .toast.ok  { border-color: rgba(48,209,88,.3);  color: var(--green); }
  .toast.err { border-color: rgba(255,69,58,.3);  color: #FF453A; }
  @keyframes toastIn { from { opacity:0; transform: translateX(20px) scale(.95); } to { opacity:1; transform: none; } }

  /* ── MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(12px); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn .2s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* ── ALERTS ── */
  .alert-warn { background: rgba(255,107,53,.08); border: 1px solid rgba(255,107,53,.2); border-radius: 12px; padding: 14px 18px; color: var(--accent-2); font-size: 14px; }
  .alert-ok   { background: rgba(48,209,88,.08);  border: 1px solid rgba(48,209,88,.2);  border-radius: 12px; padding: 14px 18px; color: var(--green); font-size: 14px; }

  /* ── STEP INDICATOR ── */
  .step { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .step-dot { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .step-dot.done   { background: var(--accent); color: #fff; }
  .step-dot.active { background: var(--ink-3); border: 2px solid var(--accent); color: var(--accent); }
  .step-dot.todo   { background: var(--ink-2); border: 1px solid var(--ink-3); color: var(--ink-4); }

  /* ── PASSWORD BOX ── */
  .pw-box { background: var(--ink-2); border: 2px dashed var(--accent); border-radius: 12px; padding: 20px 24px; font-family: monospace; font-size: 22px; font-weight: 700; color: var(--accent); letter-spacing: .14em; text-align: center; cursor: pointer; user-select: all; transition: background .15s; }
  .pw-box:hover { background: rgba(255,107,53,.05); }

  /* ── LOADING ── */
  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--ink); flex-direction: column; gap: 18px; }

  /* ── DOT BACKGROUND ── */
  .dot-bg { background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px); background-size: 28px 28px; }

  /* ── PWA INSTALL BANNER ── */
  .install-banner { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 900; background: var(--ink-2); border: 1px solid var(--accent); border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-lg), 0 0 40px rgba(255,107,53,.15); animation: slideUp .4s var(--spring); max-width: 440px; width: calc(100% - 40px); }
  @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(24px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
  .install-banner-close { background: none; border: none; color: var(--ink-4); cursor: pointer; font-size: 18px; padding: 4px; line-height: 1; flex-shrink: 0; transition: color .15s; }
  .install-banner-close:hover { color: var(--fog); }

  /* ── TYPING DOTS ── */
  @keyframes typingDot { 0%,100% { transform:translateY(0); opacity:.4; } 50% { transform:translateY(-4px); opacity:1; } }

  /* ── MATERIAL CARDS ── */
  .mat-card { background: var(--ink-2); border: 1px solid var(--ink-3); border-radius: 14px; padding: 14px; cursor: pointer; transition: all .2s var(--spring); }
  .mat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  .mat-card:active { transform: scale(.97); }

  /* ── CHIP ── */
  .chip { background: var(--ink-2); border: 1px solid var(--ink-3); border-radius: 20px; padding: 7px 14px; font-size: 13px; font-weight: 500; color: var(--fog); cursor: pointer; transition: all .15s var(--ease); white-space: nowrap; font-family: var(--font); }
  .chip:hover { border-color: var(--accent); color: var(--white); background: var(--accent-bg); }
  .chip:active { transform: scale(.95); }

  /* ── FOCUS MODE — interfaz que desaparece ── */
  .focus-field { background: transparent; border: none; border-bottom: 2px solid var(--ink-3); border-radius: 0; padding: 12px 4px; color: var(--white); font-family: var(--font-display); font-size: 22px; font-weight: 400; width: 100%; outline: none; transition: border-color .3s; }
  .focus-field:focus { border-bottom-color: var(--accent); }
  .focus-field::placeholder { color: var(--ink-4); }
`;