export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090B; color: #FAFAFA; font-family: 'Plus Jakarta Sans', sans-serif; }
  .root { min-height: 100vh; background: #09090B; }
  .dot-bg { background-image: radial-gradient(#27272A 1px, transparent 1px); background-size: 26px 26px; }

  .nav { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:56px; background:rgba(9,9,11,0.85); backdrop-filter:blur(12px); border-bottom:1px solid #18181B; position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#F97316; letter-spacing:-.02em; }
  .nav-logo span { color:#52525B; font-weight:400; }

  .card { background:#18181B; border:1px solid #27272A; border-radius:12px; }
  .card-hover { transition:border-color .2s,transform .2s,box-shadow .2s; cursor:pointer; }
  .card-hover:hover { border-color:#F97316; transform:translateY(-2px); box-shadow:0 8px 32px rgba(249,115,22,.12); }

  .btn-primary { background:#F97316; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:13px; cursor:pointer; transition:background .15s,transform .1s; }
  .btn-primary:hover { background:#EA6906; }
  .btn-primary:active { transform:scale(.97); }
  .btn-primary:disabled { opacity:.45; cursor:not-allowed; }
  .btn-ghost { background:transparent; color:#A1A1AA; border:1px solid #27272A; border-radius:8px; padding:10px 20px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; font-size:13px; cursor:pointer; transition:all .15s; }
  .btn-ghost:hover { border-color:#52525B; color:#FAFAFA; }
  .btn-sm { padding:6px 14px; font-size:12px; border-radius:7px; }
  .btn-danger  { background:#7f1d1d; color:#fca5a5; border:1px solid #991b1b; border-radius:8px; padding:7px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:12px; cursor:pointer; }
  .btn-danger:hover { background:#991b1b; }
  .btn-success { background:#052e16; color:#4ade80; border:1px solid #14532d; border-radius:8px; padding:7px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; font-size:12px; cursor:pointer; }
  .btn-success:hover { background:#14532d; }
  .btn-install { background: linear-gradient(135deg,#F97316,#EA6906); color:#fff; border:none; border-radius:8px; padding:7px 14px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:opacity .15s,transform .1s; box-shadow:0 2px 12px rgba(249,115,22,.35); }
  .btn-install:hover { opacity:.9; transform:translateY(-1px); }
  .btn-install:active { transform:scale(.97); }

  .input { background:#0F0F11; border:1px solid #27272A; border-radius:8px; padding:10px 14px; color:#FAFAFA; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; width:100%; outline:none; transition:border-color .2s; }
  .input:focus { border-color:#F97316; }
  .input::placeholder { color:#3F3F46; }
  textarea.input { resize:vertical; line-height:1.5; }
  .label { font-size:11px; font-weight:700; color:#71717A; text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; display:block; }

  .page { max-width:960px; margin:0 auto; padding:32px 24px; }
  .page-wide { max-width:1160px; margin:0 auto; padding:32px 24px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  @media(max-width:700px) { .grid-2,.grid-4 { grid-template-columns:1fr; } }

  .hero-title { font-family:'Syne',sans-serif; font-size:clamp(34px,5vw,60px); font-weight:800; line-height:1.05; letter-spacing:-.03em; }
  .section-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:700; letter-spacing:-.02em; }
  .section-sub { font-size:13px; color:#71717A; margin-top:4px; }

  .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .badge-open    { background:#052e16; color:#4ade80; }
  .badge-closed  { background:#1c1917; color:#a8a29e; }
  .badge-pending { background:#1c0a00; color:#fb923c; }
  .badge-blue    { background:#0c1a3a; color:#93c5fd; }
  .tag { font-size:11px; background:#27272A; color:#A1A1AA; padding:3px 8px; border-radius:5px; white-space:nowrap; }

  .bubble-me  { background:#F97316; color:#fff;    border-radius:18px 18px 4px 18px;  padding:10px 14px; max-width:78%; align-self:flex-end;   font-size:14px; line-height:1.45; white-space:pre-wrap; }
  .bubble-bot { background:#27272A; color:#FAFAFA; border-radius:18px 18px 18px 4px;  padding:10px 14px; max-width:78%; align-self:flex-start; font-size:14px; line-height:1.45; white-space:pre-wrap; }

  .tab { padding:7px 16px; font-size:13px; font-weight:600; border-radius:7px; cursor:pointer; transition:all .15s; color:#71717A; background:transparent; border:none; font-family:'Plus Jakarta Sans',sans-serif; }
  .tab.active { background:#27272A; color:#FAFAFA; }

  .scroll-x { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; padding:10px 16px; color:#52525B; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; border-bottom:1px solid #27272A; }
  td { padding:13px 16px; border-bottom:1px solid #18181B; color:#D4D4D8; vertical-align:middle; }
  tr:hover td { background:#18181B; }
  hr { border:none; border-top:1px solid #27272A; margin:20px 0; }

  .spinner { width:18px; height:18px; border:2px solid #3F3F46; border-top-color:#F97316; border-radius:50%; animation:spin .65s linear infinite; display:inline-block; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .toast { position:fixed; top:18px; right:18px; z-index:9999; background:#18181B; border:1px solid #27272A; border-radius:10px; padding:12px 18px; font-size:13px; font-weight:600; max-width:340px; display:flex; align-items:center; gap:10px; box-shadow:0 12px 40px rgba(0,0,0,.6); animation:slideIn .25s ease; pointer-events:none; }
  .toast.ok  { border-color:#14532d; color:#86efac; }
  .toast.err { border-color:#7f1d1d; color:#fca5a5; }
  @keyframes slideIn { from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)} }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.82); z-index:500; display:flex; align-items:center; justify-content:center; padding:24px; }
  .alert-warn { background:#1c0a00; border:1px solid #7c2d12; border-radius:10px; padding:14px 18px; color:#fb923c; font-size:13px; }
  .alert-ok   { background:#052e16; border:1px solid #14532d; border-radius:10px; padding:14px 18px; color:#4ade80; font-size:13px; }

  .step { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .step-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
  .step-dot.done   { background:#F97316; color:#fff; }
  .step-dot.active { background:#27272A; border:2px solid #F97316; color:#F97316; }
  .step-dot.todo   { background:#18181B; border:1px solid #27272A; color:#52525B; }

  .pw-box { background:#0F0F11; border:2px dashed #F97316; border-radius:10px; padding:20px 24px; font-family:monospace; font-size:24px; font-weight:800; color:#F97316; letter-spacing:.14em; text-align:center; cursor:pointer; user-select:all; transition:background .15s; margin:0 auto; }
  .pw-box:hover { background:#150900; }

  .loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#09090B; flex-direction:column; gap:16px; }

  /* PWA Install Banner */
  .install-banner { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:900; background:#18181B; border:1px solid #F97316; border-radius:14px; padding:14px 20px; display:flex; align-items:center; gap:14px; box-shadow:0 8px 40px rgba(249,115,22,.25); animation:slideUp .35s ease; max-width:440px; width:calc(100% - 40px); }
  @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
  .install-banner-icon { font-size:26px; flex-shrink:0; }
  .install-banner-text { flex:1; }
  .install-banner-title { font-weight:800; font-size:14px; color:#FAFAFA; margin-bottom:2px; }
  .install-banner-sub { font-size:12px; color:#71717A; }
  .install-banner-close { background:none; border:none; color:#52525B; cursor:pointer; font-size:18px; padding:4px; line-height:1; flex-shrink:0; }
  .install-banner-close:hover { color:#A1A1AA; }
`;
