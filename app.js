/* ============================================================
   A Very Official Saturday — interactive date-plan builder
   ============================================================ */

const stage = document.getElementById("stage");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");

const state = {
  name: "",
  lunch: null,
  drink: null,
  dessert: null,
  cafe: null,
  shop: null,
  pace: null,
  photos: null,
};

/* ---------- background floating emojis ---------- */
(function makeFloaties() {
  const host = document.querySelector(".floaties");
  const emojis = ["🥐", "☕", "🍵", "🌸", "📚", "🥖", "🧋", "🍰", "✨", "🐈"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.textContent = emojis[i % emojis.length];
    s.style.left = Math.random() * 96 + "vw";
    s.style.animationDuration = 14 + Math.random() * 18 + "s";
    s.style.animationDelay = -Math.random() * 20 + "s";
    s.style.fontSize = 16 + Math.random() * 18 + "px";
    host.appendChild(s);
  }
})();

/* ---------- helpers ---------- */
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function show(html, { progress = null } = {}) {
  // Swap synchronously so callers can attach handlers right away;
  // the new card animates in via the cardIn keyframe.
  stage.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (progress) {
    progressWrap.hidden = false;
    progressLabel.textContent = progress.label;
    progressFill.style.width = progress.pct + "%";
  } else {
    progressWrap.hidden = true;
  }
}

function encodeState(s) {
  const json = JSON.stringify(s);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeState(str) {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch (e) {
    return null;
  }
}

/* ============================================================
   VENUE INTEL — everything you'd normally stalk before going
   (researched July 2026 — hours can shift, Maps has live info)
   ============================================================ */
const VENUES = {
  madameyen: {
    emoji: "🥖",
    name: "Madame Yen (CBD)",
    tag: "Viet street food • bánh mì HQ",
    address: "Shop C, 399 Lonsdale St (enter via Hardware Lane)",
    hours: "Open Saturdays — all-day service (brunch → dinner)",
    known: "Proper Vietnamese street food: <strong>bánh mì</strong>, phở, spring rolls. Little sister of the Chapel St institution rated <strong>4.8★ by 1,300+ reviewers</strong>.",
    reviews: [
      "“The bánh mì was <b>crunchy, fresh, and delicious</b>.”",
      "“Great vegetarian and vegan options too” — so everyone eats well.",
    ],
    maps: "https://www.google.com/maps/search/?api=1&query=Madame+Yen+399+Lonsdale+St+Melbourne",
  },
  littlerogue: {
    emoji: "🍵",
    name: "Little Rogue",
    tag: "hole-in-the-wall • matcha royalty",
    address: "12 Drewery Lane — look for the bright blue door",
    hours: "Saturday: ~8:30 am – 5 pm",
    known: "The <strong>matcha latte</strong> people cross town for, seriously smooth coffee, and pastries from <strong>Bakemono Bakers</strong> (the yuzu almond croissant has a fan club).",
    reviews: [
      "“Once you've tried their matcha latte, you'll be <b>planning your next visit before you leave</b>.” — Urban List",
      "“Must-have matcha latte” — DanielFoodDiary, who flew in from Singapore for it.",
    ],
    maps: "https://www.google.com/maps/search/?api=1&query=Little+Rogue+12+Drewery+Lane+Melbourne",
    site: { label: "Instagram 📷", url: "https://www.instagram.com/littleroguemelbourne/" },
  },
  matchakobo: {
    emoji: "🫖",
    name: "Matcha Kōbō",
    tag: "stone-milled matcha temple",
    address: "258 Lonsdale St — right on our walking route",
    hours: "Open daily, late on weekends (Fri till 9 pm)",
    known: "Four <strong>$20,000 Japanese stone mills</strong> — the only ones in Australia — grinding Uji (Kyoto) matcha in-house. The <strong>triple matcha tart</strong> is by an ex-Zumbo pastry chef.",
    reviews: [
      "“Each drink takes <b>two to three minutes to prepare</b>, the traditional way.” — Broadsheet",
      "One mill takes 24 hours to grind a single kilo of matcha. Commitment.",
    ],
    maps: "https://www.google.com/maps/search/?api=1&query=Matcha+Kobo+258+Lonsdale+St+Melbourne",
  },
  hflowers: {
    emoji: "🌸",
    name: "H Flowers",
    tag: "blooms & pretty things",
    address: "Melbourne Central, Shop GD014A, 211 La Trobe St",
    hours: "Saturday: 10 am – 7 pm",
    known: "<strong>Fresh and dried blooms</strong>, artistic arrangements and unique little gifts, right inside Melbourne Central.",
    reviews: [
      "“<b>Premium blooms and artistic design</b> in the city's most iconic hub.”",
      "Dried arrangements = flowers that never die. Peak practicality.",
    ],
    maps: "https://www.google.com/maps/search/?api=1&query=H+Flowers+Melbourne+Central",
    site: { label: "Website 🔗", url: "https://hflowers.com.au/" },
  },
  meeq: {
    emoji: "🧸",
    name: "MeeQ",
    tag: "plushie wonderland",
    address: "Emporium Melbourne, Level 3 (near Myer) — 2 min from Melbourne Central",
    hours: "Saturday: 10 am – 7 pm",
    known: "<strong>Australia's biggest Jellycat stockist</strong> — plus Miffy, Sanrio and Studio Ghibli. Free gift wrapping, maximum cuteness per square metre.",
    reviews: [
      "“A <b>very cute store</b>” — TikTok, repeatedly, with millions of views.",
      "Warning from the community: nobody leaves without emotionally bonding with at least one plushie.",
    ],
    maps: "https://www.google.com/maps/search/?api=1&query=MeeQ+Emporium+Melbourne",
    site: { label: "Website 🔗", url: "https://meeq.com.au/" },
  },
};

function openVenue(key) {
  const v = VENUES[key];
  if (!v) return;
  closeVenue();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "venueModal";
  overlay.innerHTML = `
    <div class="venue-card" role="dialog" aria-label="${esc(v.name)} info">
      <div class="vc-head">
        <div class="vc-emoji">${v.emoji}</div>
        <div>
          <h3>${v.name}</h3>
          <div class="vc-tag">${v.tag}</div>
        </div>
        <button class="vc-close" aria-label="close">✕</button>
      </div>
      <div class="vc-section">
        <div class="vc-label">The vitals</div>
        <div class="vc-fact"><span>📍</span><span><b>${v.address}</b></span></div>
        <div class="vc-fact"><span>🕐</span><span>${v.hours}</span></div>
      </div>
      <div class="vc-section">
        <div class="vc-label">Known for</div>
        <div class="vc-known">${v.known}</div>
      </div>
      <div class="vc-section">
        <div class="vc-label">The reviews are in</div>
        ${v.reviews.map((r) => `<div class="vc-review">${r}</div>`).join("")}
      </div>
      <div class="vc-actions">
        <a class="btn green" href="${v.maps}" target="_blank" rel="noopener">Open in Google Maps 🗺️</a>
        ${v.site ? `<a class="btn ghost" href="${v.site.url}" target="_blank" rel="noopener">${v.site.label}</a>` : ""}
      </div>
      <div class="vc-disclaimer">hours researched in advance like a responsible adult — but tap Maps for the live ones</div>
    </div>
  `;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeVenue(); });
  overlay.querySelector(".vc-close").onclick = closeVenue;
  document.body.appendChild(overlay);
}
function closeVenue() {
  const m = document.getElementById("venueModal");
  if (m) m.remove();
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVenue(); });

function intelChips(keys, label = "🔍 the intel:") {
  if (!keys || !keys.length) return "";
  return `<div class="intel-row">${keys.map((k) =>
    `<button class="intel-chip" data-venue="${k}">${label} ${VENUES[k].emoji} ${VENUES[k].name}</button>`
  ).join("")}</div>`;
}
function bindIntelChips(root = stage) {
  root.querySelectorAll(".intel-chip").forEach((c) => {
    c.onclick = (e) => { e.stopPropagation(); openVenue(c.dataset.venue); };
  });
}

const QUESTION_COUNT = 7;
function qProgress(n) {
  return {
    label: `Question ${n} of ${QUESTION_COUNT} — no wrong answers (mostly)`,
    pct: Math.round((n / (QUESTION_COUNT + 1)) * 100),
  };
}

/* ============================================================
   STEP 0 — intro + name
   ============================================================ */
function stepIntro() {
  show(`
    <div class="card" style="text-align:center">
      <span class="kicker">you've been recruited for something important</span>
      <h1><span class="wiggle">📋</span> Operation:<br>Best Saturday Ever</h1>
      <p class="sub">I may or may not have mapped out a whole Saturday around the city.<br>
      <strong>The catch:</strong> you're in charge of every decision.<br>
      Seven questions. Extremely low stakes. Some memes.</p>
      <div class="name-row">
        <input id="nameInput" class="name-input" type="text" maxlength="20"
               placeholder="Your name (for the official paperwork)" autocomplete="off" />
      </div>
      <p class="tiny-note" style="margin-bottom:20px">* leaving it blank is allowed but the itinerary will address you as "Mystery Guest"</p>
      <button class="btn big" id="startBtn">Begin the paperwork ✍️</button>
    </div>
  `);
  document.getElementById("startBtn").onclick = () => {
    state.name = document.getElementById("nameInput").value.trim();
    stepFree();
  };
  document.getElementById("nameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("startBtn").click();
  });
}

/* ============================================================
   STEP 1 — the runaway "No" button
   ============================================================ */
function stepFree() {
  const who = state.name ? esc(state.name) : "you";
  show(`
    <div class="card" style="text-align:center">
      <span class="kicker">question 0 — a formality, really</span>
      <h2>So… is ${who} free this Saturday? 👀</h2>
      <p class="sub">Please answer honestly. The buttons are completely fair and balanced.</p>
      <div class="yesno">
        <button class="btn big green" id="yesBtn">Yes 😌</button>
        <button class="btn big ghost" id="noBtn">No</button>
      </div>
      <p class="tiny-note" id="noToast" style="margin-top:18px;min-height:20px"></p>
    </div>
  `);

  document.getElementById("yesBtn").onclick = () => {
    burstMini();
    memeYes();
  };

  const noBtn = document.getElementById("noBtn");
  const toast = document.getElementById("noToast");
  const quips = [
    "nice try 😌", "the button has trust issues", "it's shy",
    "hmm, weird — it moved", "physics, probably", "just say yes, it's easier",
  ];
  let attempts = 0;
  const flee = () => {
    attempts++;
    if (attempts > 6) {
      noBtn.textContent = "Okay fine, YES 🥹";
      noBtn.className = "btn big green";
      noBtn.onclick = () => { burstMini(); memeYes(); };
      toast.textContent = "the button gave up. it happens.";
      return;
    }
    noBtn.classList.add("fleeing");
    const pad = 90;
    const x = pad + Math.random() * (window.innerWidth - pad * 2 - 100);
    const y = pad + Math.random() * (window.innerHeight - pad * 2 - 60);
    noBtn.style.left = x + "px";
    noBtn.style.top = y + "px";
    noBtn.style.transform = `scale(${Math.max(0.45, 1 - attempts * 0.1)})`;
    toast.textContent = quips[(attempts - 1) % quips.length];
  };
  noBtn.addEventListener("pointerenter", flee);
  noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); flee(); }, { passive: false });
  noBtn.addEventListener("click", flee);
}

/* ============================================================
   Question renderer
   ============================================================ */
function question({ n, kicker, title, sub, options, key, next, venues }) {
  const opts = options.map((o, i) => `
    <button class="opt" data-i="${i}">
      <span class="emo">${o.emo}</span>
      <span>${o.label}${o.note ? `<small>${o.note}</small>` : ""}</span>
    </button>
  `).join("");
  show(`
    <div class="card">
      <span class="kicker">${kicker}</span>
      <h2>${title}</h2>
      ${sub ? `<p class="sub" style="margin-bottom:10px">${sub}</p>` : ""}
      ${venues ? `<div style="margin-bottom:18px">${intelChips(venues)}</div>` : ""}
      <div class="options">${opts}</div>
    </div>
  `, { progress: qProgress(n) });
  stage.querySelectorAll(".opt").forEach((btn) => {
    btn.onclick = () => {
      state[key] = options[+btn.dataset.i].value;
      next();
    };
  });
  bindIntelChips();
}

/* ---------- meme interstitial ---------- */
function memeCard({ caption, img, labels = [], btnText = "lol ok, continue →", next }) {
  const labelHtml = labels.map(
    (l) => `<span class="meme-label ${l.cls}" ${l.style ? `style="${l.style}"` : ""}>${l.text}</span>`
  ).join("");
  show(`
    <div class="card meme-card">
      <p class="meme-top-caption">${caption}</p>
      <div class="meme-frame">
        <img src="${img}" alt="meme" />
        ${labelHtml}
      </div>
      <button class="btn" id="memeNext">${btnText}</button>
    </div>
  `);
  document.getElementById("memeNext").onclick = next;
}

/* ============================================================
   THE QUESTIONS
   ============================================================ */
function memeYes() {
  memeCard({
    caption: "Me, toasting to your excellent decision-making:",
    img: "assets/memes/leo-cheers.jpg",
    btnText: "let's plan this thing \u2192",
    next: stepLunch,
  });
}

function stepLunch() {
  question({
    n: 1,
    kicker: "12:00 pm — first stop",
    title: "Lunch at Madame Yen 🥖",
    sub: "Vietnamese spot in the CBD. The bánh mì has a reputation. What's the move?",
    key: "lunch",
    next: memeLunch,
    venues: ["madameyen"],
    options: [
      { emo: "🥖", value: "banhmi", label: "Bánh mì, obviously", note: "the people's choice" },
      { emo: "🍜", value: "browse", label: "I'll browse the whole menu first", note: "a scholar. respect." },
      { emo: "🎲", value: "surprise", label: "Surprise me — you order", note: "bold. dangerously bold." },
    ],
  });
}

function memeLunch() {
  const bottom = {
    banhmi: "Bánh mì with elite company",
    browse: "Watching you study the menu like it's finals week",
    surprise: "Being trusted with the order (huge honor)",
  }[state.lunch];
  memeCard({
    caption: "Accurate representation of my food standards:",
    img: "assets/memes/drake.jpg",
    labels: [
      { cls: "drake-top", text: "A fancy restaurant where the portion is 3 molecules" },
      { cls: "drake-bottom", text: bottom },
    ],
    next: stepCafe,
  });
}

function stepCafe() {
  question({
    n: 2,
    kicker: "1:30 pm — the coffee stop",
    title: "Pick our café — one only ☝️",
    sub: "Two legendary contenders, one afternoon. This is the big one — stalk the intel before you commit:",
    key: "cafe",
    next: memeCafe,
    venues: ["littlerogue", "matchakobo"],
    options: [
      { emo: "🍵", value: "littlerogue", label: "Little Rogue", note: "hidden laneway, blue door, THE matcha latte" },
      { emo: "🫖", value: "matchakobo", label: "Matcha Kōbō", note: "$20k stone mills, Japanese desserts" },
    ],
  });
}

function memeCafe() {
  const cafeName = VENUES[state.cafe].name;
  memeCard({
    caption: `Us, walking to ${cafeName} in Melbourne July, pretending winter isn't real:`,
    img: "assets/memes/this-is-fine.jpg",
    btnText: "it's called ambiance ❄️ →",
    next: stepDrink,
  });
}

function stepDrink() {
  const isKobo = state.cafe === "matchakobo";
  question({
    n: 3,
    kicker: `1:30 pm — ${VENUES[state.cafe].name}`,
    title: "Pick your potion ☕",
    sub: isKobo
      ? "Stone-milled Uji matcha territory. Choose your ceremony."
      : "Hidden little café down a laneway. Allegedly great matcha. Choose wisely.",
    key: "drink",
    next: memeDrink,
    venues: [state.cafe],
    options: isKobo
      ? [
          { emo: "🍵", value: "matcha", label: "Ceremonial matcha", note: "stone-milled while we watch" },
          { emo: "🍂", value: "hojicha", label: "Hojicha", note: "roasty. cozy. allegedly life-changing." },
          { emo: "🍋", value: "yuzu", label: "Matcha yuzu soda", note: "fizzy, zesty, extremely you" },
          { emo: "🎰", value: "surprise", label: "Staff's choice roulette", note: "we live dangerously" },
        ]
      : [
          { emo: "🍵", value: "matcha", label: "Matcha", note: "green. serene. supreme." },
          { emo: "☕", value: "coffee", label: "Coffee", note: "classic. dependable. caffeinated." },
          { emo: "🍫", value: "choc", label: "Hot chocolate", note: "cozy maximalist" },
          { emo: "🎰", value: "surprise", label: "Barista's choice roulette", note: "we live dangerously" },
        ],
  });
}

function memeDrink() {
  if (state.drink === "surprise") {
    memeCard({
      caption: "The barista, realizing they've been given full creative control:",
      img: "assets/memes/pikachu.jpg",
      btnText: "bold. respect. →",
      next: stepDessert,
    });
    return;
  }
  const drinkName = { matcha: "matcha", coffee: "coffee", choc: "hot choc", hojicha: "hojicha", yuzu: "the matcha yuzu soda" }[state.drink];
  memeCard({
    caption: `Me, watching you order ${drinkName}:`,
    img: "assets/memes/pigeon.jpg",
    labels: [
      { cls: "", style: "left:10%;right:10%;bottom:4%;text-align:center", text: "is this… elite taste? 💚" },
    ],
    next: stepDessert,
  });
}

function stepDessert() {
  const isKobo = state.cafe === "matchakobo";
  question({
    n: 4,
    kicker: `still at ${VENUES[state.cafe].name} — critical question`,
    title: "Official dessert policy 🍰",
    sub: isKobo
      ? "For context: the triple matcha tart here was made by an ex-Zumbo pastry chef. No pressure."
      : "For context: the pastries here come from Bakemono Bakers. No pressure.",
    key: "dessert",
    next: memeDessert,
    options: [
      { emo: "🍰", value: "yes", label: "Yes. Obviously. Next question.", note: "correct answer" },
      { emo: "🥄", value: "share", label: "\"We can share one\"", note: "famous last words" },
      { emo: "😇", value: "steal", label: "None for me… I'll just have some of yours", note: "I see you. I KNOW you." },
    ],
  });
}

function memeDessert() {
  if (state.dessert === "share") {
    memeCard({
      caption: "Me, pretending to believe \"we can share one\":",
      img: "assets/memes/monkey-puppet.jpg",
      btnText: "suuure we can \ud83d\udc40 \u2192",
      next: stepShop,
    });
    return;
  }
  if (state.dessert === "steal") {
    memeCard({
      caption: "Me, presenting you with a formal ultimatum:",
      img: "assets/memes/uno.jpg",
      labels: [
        { cls: "", style: "left:5%;top:12%;width:35%;text-align:center;transform:rotate(-6deg)", text: "Order your OWN dessert or draw 25" },
        { cls: "", style: "right:6%;top:44%;width:26%;text-align:center", text: "you" },
      ],
      btnText: "draw the cards then \u2192",
      next: stepShop,
    });
    return;
  }
  memeCard({
    caption: "The itinerary when we order dessert AND a second dessert:",
    img: "assets/memes/yelling-cat.jpg",
    next: stepShop,
  });
}

function stepShop() {
  question({
    n: 5,
    kicker: "3:00 pm — Melbourne Central",
    title: "The shopping round 🛒",
    sub: "Two contenders. You're the tiebreaker.",
    key: "shop",
    next: memeShop,
    venues: ["hflowers", "meeq"],
    options: [
      { emo: "🌸", value: "hflower", label: "Hflower", note: "I'll carry the bags" },
      { emo: "🧸", value: "meeq", label: "Meeq", note: "cute things inspection" },
      { emo: "💪", value: "both", label: "Both. Drag me to both.", note: "maximum damage" },
      { emo: "🍵", value: "skip", label: "Skip it — more café/wander time", note: "a minimalist icon" },
    ],
  });
}

function memeShop() {
  const left = {
    hflower: "Us walking into Hflower",
    meeq: "Us walking into Meeq",
    both: "Us hitting BOTH stores",
    skip: "Us skipping the mall like intellectuals",
  }[state.shop];
  const right = {
    hflower: "The flowers competing for your attention",
    meeq: "The plushies begging to be adopted",
    both: "The plushies begging to be adopted",
    skip: "The mall, missing us",
  }[state.shop];
  memeCard({
    caption: "Saturday, 3:00 pm, colorized:",
    img: "assets/memes/buff-doge.png",
    labels: [
      { cls: "doge-left", text: left },
      { cls: "doge-right", text: right },
    ],
    next: stepPace,
  });
}

function stepPace() {
  question({
    n: 6,
    kicker: "logistics, but make it fun",
    title: "Official walking pace agreement 🚶",
    key: "pace",
    next: memePace,
    options: [
      { emo: "🐌", value: "stroll", label: "Slow stroll — we're vibing, not commuting" },
      { emo: "🚶", value: "normal", label: "Normal human pace", note: "reasonable. sustainable." },
      { emo: "🏃", value: "fast", label: "I walk fast. Keep up.", note: "noted. training begins tonight." },
    ],
  });
}

function memePace() {
  const caption = {
    stroll: "The Official Slow Stroll Treaty, signed this Saturday:",
    normal: "The Normal Human Pace Accords, hereby ratified:",
    fast: "The Speedwalk Act of 2026, reluctantly signed by me:",
  }[state.pace];
  memeCard({
    caption,
    img: "assets/memes/handshake.jpg",
    labels: [
      { cls: "", style: "left:5%;top:60%;width:26%;text-align:center", text: "me" },
      { cls: "", style: "right:5%;top:60%;width:26%;text-align:center", text: "you" },
    ],
    btnText: "it's official \ud83e\udd1d \u2192",
    next: stepPhotos,
  });
}

function stepPhotos() {
  question({
    n: 7,
    kicker: "last one, I promise",
    title: "Photo policy 📸",
    key: "photos",
    next: memePhotos,
    options: [
      { emo: "📸", value: "lots", label: "Document EVERYTHING", note: "the bánh mì gets a photoshoot too" },
      { emo: "🤳", value: "few", label: "A few cute ones", note: "quality over quantity" },
      { emo: "🎥", value: "photographer", label: "You take the photos, I pose", note: "personal photographer: hired" },
    ],
  });
}

function memePhotos() {
  if (state.photos === "lots") {
    memeCard({
      caption: "Me, at every single stop on Saturday:",
      img: "assets/memes/bernie.jpg",
      labels: [
        { cls: "", style: "left:14%;right:14%;bottom:1.5%;text-align:center", text: "\u2026for one more photo \ud83d\udcf8" },
      ],
      btnText: "the archive must grow →",
      next: memeDisclaimer,
    });
    return;
  }
  if (state.photos === "photographer") {
    memeCard({
      caption: "Your personal photographer, reporting for duty:",
      img: "assets/memes/bernie.jpg",
      labels: [
        { cls: "", style: "left:14%;right:14%;bottom:1.5%;text-align:center", text: "\u2026you to hold the pose \ud83d\udcf8" },
      ],
      btnText: "say cheese 📸 →",
      next: memeDisclaimer,
    });
    return;
  }
  memeCard({
    caption: "Me on Saturday:",
    img: "assets/memes/two-buttons.jpg",
    labels: [
      { cls: "", style: "left:6%;top:8%;width:34%;transform:rotate(-7deg);text-align:center", text: "Look cool & mysterious" },
      { cls: "", style: "left:46%;top:4%;width:32%;transform:rotate(-4deg);text-align:center", text: "Laugh at literally everything you say" },
    ],
    btnText: "we both know which one →",
    next: memeDisclaimer,
  });
}

function memeDisclaimer() {
  memeCard({
    caption: "One last legal disclaimer before your itinerary is issued:",
    img: "assets/memes/distracted.jpg",
    labels: [
      { cls: "", style: "left:6%;top:56%;width:32%;text-align:center", text: "whatever YOU feel like doing" },
      { cls: "", style: "left:44%;top:42%;width:22%;text-align:center", text: "me" },
      { cls: "", style: "right:3%;top:56%;width:24%;text-align:center", text: "the itinerary I spent hours on" },
    ],
    btnText: "generate my itinerary 🎟️",
    next: stepLoading,
  });
}

/* ============================================================
   Fake loading → results
   ============================================================ */
function stepLoading() {
  const msgs = [
    "Consulting the matcha gods… 🍵",
    "Bribing Melbourne's weather… 🌤️",
    "Reserving the good table… 🪑",
    "Adding extra dessert, just in case… 🍰",
    "Printing your VIP ticket… 🎟️",
  ];
  show(`
    <div class="card loader-card">
      <span class="loader-emoji">🥐</span>
      <div class="loader-msg" id="loaderMsg">${msgs[0]}</div>
    </div>
  `);
  let i = 0;
  const el = () => document.getElementById("loaderMsg");
  const timer = setInterval(() => {
    i++;
    if (i >= msgs.length) {
      clearInterval(timer);
      stepResults();
      return;
    }
    if (el()) el().textContent = msgs[i];
  }, 850);
}

/* ---------- copy lines derived from choices ---------- */
function planLines(s) {
  return {
    lunch: {
      banhmi: "Bánh mì o'clock. Allegedly the best in the CBD — big claim. We'll be the judges.",
      browse: "Full menu-browsing rights granted. Take your time — the noodles aren't going anywhere.",
      surprise: "You chose chaos: I'm ordering for you. Your trust will be rewarded. Probably.",
    }[s.lunch] || "Lunch happens. It will be delicious.",
    drink: (s.cafe === "matchakobo"
      ? {
          matcha: "Ceremonial stone-milled matcha from Uji, Kyoto — prepared the traditional way while we watch.",
          hojicha: "Hojicha for you — roasty, cozy, allegedly life-changing.",
          yuzu: "The matcha yuzu soda — fizzy, zesty, an inspired decision.",
          surprise: "Staff's-choice roulette. Living dangerously. I admire it.",
        }
      : {
          matcha: "One matcha for the matcha connoisseur 💚 — scientifically proven elite choice.",
          coffee: "Coffee for you. Little Rogue takes it very seriously; we shall verify.",
          choc: "Hot chocolate — the coziest possible decision. Deeply respected.",
          surprise: "Barista's-choice roulette. Living dangerously. I admire it.",
        })[s.drink] || "A warm beverage will occur.",
    dessert: {
      yes: "Dessert: confirmed. No further questions, your honor.",
      share: "\"We can share one.\" Famous last words — I'm ordering two anyway.",
      steal: "You'll \"just have a bite\" of mine. I've made peace with it. (Ordering extra.)",
    }[s.dessert] || "",
    shop: {
      hflower: "Hflower first. Take all the time you want — I'm a certified professional bag-holder.",
      meeq: "Meeq first. Warning: I will have strong opinions about cute stationery.",
      both: "BOTH stores. Maximum browsing. We're doing the full tour, no shortcuts.",
      skip: "Mall: skipped. More café + wandering time instead. Honestly? Elite choice.",
    }[s.shop] || "",
    pace: {
      stroll: "Official pace: slow stroll. We're vibing, not commuting.",
      normal: "Official pace: normal human. Reasonable. Sustainable.",
      fast: "Official pace: speedwalk. I have begun training to keep up.",
    }[s.pace] || "",
    photos: {
      lots: "Photo policy: document EVERYTHING. The food gets a photoshoot too.",
      few: "Photo policy: a few cute ones. No paparazzi behavior.",
      photographer: "Photo policy: you shoot, I pose. Personal photographer mode unlocked.",
    }[s.photos] || "",
  };
}

function timelineData(s) {
  const L = planLines(s);
  const cafe = VENUES[s.cafe] || VENUES.littlerogue;
  const cafeKey = VENUES[s.cafe] ? s.cafe : "littlerogue";
  const items = [
    { time: "11:45", title: "The Grand Meetup 🤝", text: "Madame Yen, CBD. I'll be the one casually standing there pretending I didn't arrive 15 minutes early.", venues: ["madameyen"] },
    { time: "12:00", title: "Lunch — Madame Yen 🥖", text: L.lunch, venues: ["madameyen"] },
    { time: "1:15", title: "The Scenic Commute 🚶", text: `A slow, zero-rush walk over to ${cafe.name} — it's only a few minutes away, but we're taking the scenic route.`, venues: [] },
    { time: "1:30", title: `${cafe.name} ${cafe.emoji}`, text: L.drink + " " + L.dessert + " No side quests, no rushing — this is the main event, and we linger as long as we like.", venues: [cafeKey] },
  ];
  if (s.shop === "skip") {
    items.push({ time: "3:00", title: "Bonus round 🍵", text: L.shop, venues: [] });
  } else {
    const shopVenues = s.shop === "hflower" ? ["hflowers"] : s.shop === "meeq" ? ["meeq"] : ["hflowers", "meeq"];
    items.push({ time: "3:00", title: "Melbourne Central 🛍️", text: L.shop, venues: shopVenues });
  }
  items.push({ time: "4:00", title: "The \"I Guess We Should Go\" Part 🌇", text: "Where we admit that was actually a great day. I'll point you toward your tram like a true local guide.", venues: [] });
  return items;
}

/* ============================================================
   RESULTS
   ============================================================ */
function stepResults() {
  const s = state;
  const name = s.name ? esc(s.name) : "Mystery Guest";
  const L = planLines(s);
  const items = timelineData(s);

  // Put the encoded plan in the URL so refresh/QR keeps it
  const encoded = encodeState(s);
  const url = location.origin + location.pathname + "?d=" + encoded;
  history.replaceState(null, "", "?d=" + encoded);

  const tl = items.map((it, i) => `
    <div class="tl-item" style="animation-delay:${0.15 + i * 0.12}s">
      <span class="tl-time">${it.time}</span>
      <div class="tl-body">
        <h3>${it.title}</h3>
        <p>${it.text}</p>
        ${it.venues && it.venues.length ? intelChips(it.venues, "📍") : ""}
      </div>
    </div>
  `).join("");

  show(`
    <div class="card">
      <div class="result-header">
        <div class="stamp">✦ Approved — Admit Two ✦</div>
        <h2>${name}'s Officially Perfect Saturday</h2>
        <p class="sub" style="margin-bottom:0">Melbourne CBD Edition • custom-built by you, executed by me</p>
      </div>

      <div class="timeline">${tl}</div>

      <div class="qr-box">
        <h3>Your ticket 🎟️</h3>
        <p>Scan with your phone to open this exact plan anywhere — then hit the button to download the official PDF.</p>
        <div id="qrcode"></div>
      </div>

      <div class="actions">
        <button class="btn green big" id="pdfBtn">Download the official PDF 📄</button>
        <button class="btn ghost" id="shareBtn">Share 🔗</button>
        <button class="btn ghost" id="copyBtn">Copy link</button>
      </div>

      <div class="meme-frame" style="max-width:300px;margin-top:26px">
        <img src="assets/memes/success-kid.jpg" alt="success" />
      </div>
      <p class="meme-top-caption" style="text-align:center;margin-top:10px">Saturday plan: successfully customized ✅</p>

      <p class="meme-top-caption" style="text-align:center;margin-top:24px">Us at every party from now on:</p>
      <div class="meme-frame" style="max-width:340px">
        <img src="assets/memes/they-dont-know.png" alt="they don't know" />
        <span class="meme-label" style="right:3%;top:4%;width:56%;text-align:center">they don't know we're about to have the best Saturday ever</span>
      </div>

      <p class="footer-note">P.S. — the schedule is 100% flexible. You're the boss of this itinerary. See you Saturday 😊</p>
      <div style="text-align:center;margin-top:14px">
        <button class="btn ghost" id="redoBtn" style="font-size:14px;padding:10px 18px">↺ start over</button>
      </div>
    </div>
  `);

  // QR code
  new QRCode(document.getElementById("qrcode"), {
    text: url,
    width: 150,
    height: 150,
    colorDark: "#3c2f2f",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });

  // Confetti celebration
  celebrate();
  bindIntelChips();

  document.getElementById("pdfBtn").onclick = () => downloadPdf(s, url);
  document.getElementById("copyBtn").onclick = async (e) => {
    try {
      await navigator.clipboard.writeText(url);
      e.target.textContent = "Copied! ✅";
      setTimeout(() => (e.target.textContent = "Copy link"), 1800);
    } catch { prompt("Copy this link:", url); }
  };
  const shareBtn = document.getElementById("shareBtn");
  if (navigator.share) {
    shareBtn.onclick = () => navigator.share({
      title: "Our Officially Perfect Saturday 🎟️",
      text: "I customized our Saturday. It's official now.",
      url,
    }).catch(() => {});
  } else {
    shareBtn.style.display = "none";
  }
  document.getElementById("redoBtn").onclick = () => {
    history.replaceState(null, "", location.pathname);
    Object.keys(state).forEach((k) => (state[k] = k === "name" ? "" : null));
    stepIntro();
  };
}

/* ---------- confetti ---------- */
const confettiCanvas = document.getElementById("confetti-canvas");
const myConfetti = window.confetti && confetti.create(confettiCanvas, { resize: true, useWorker: true });

function burstMini() {
  if (!myConfetti) return;
  myConfetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ["#ff6b6b", "#ffd166", "#7bc47f"] });
}

function celebrate() {
  if (!myConfetti) return;
  const colors = ["#ff6b6b", "#ffd166", "#7bc47f", "#8ecae6", "#cdb4db"];
  myConfetti({ particleCount: 120, spread: 100, origin: { y: 0.6 }, colors });
  setTimeout(() => myConfetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors }), 350);
  setTimeout(() => myConfetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors }), 600);
}

/* ============================================================
   PDF GENERATION
   ============================================================ */
// Renders a QR for arbitrary text and returns it as a data URL
function makeQrDataUrl(text, size) {
  const tmp = document.createElement("div");
  tmp.style.cssText = "position:absolute;left:-30000px;top:0";
  document.body.appendChild(tmp);
  new QRCode(tmp, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
  const canvas = tmp.querySelector("canvas");
  const data = canvas ? canvas.toDataURL("image/png") : null;
  tmp.remove();
  return data;
}

const stripTags = (h) => h.replace(/<[^>]+>/g, "");

function buildPdfHtml(s, url) {
  const name = s.name ? esc(s.name) : "Mystery Guest";
  const L = planLines(s);
  const items = timelineData(s);
  const rowColors = ["#ff6b6b", "#7bc47f", "#f4a261", "#8ecae6", "#cdb4db", "#e76f51", "#2a9d8f"];

  const rows = items.map((it, i) => `
    <div style="display:flex;gap:12px;padding:7px 0;border-bottom:2px dashed #f0e2d3;">
      <div style="flex-shrink:0;width:56px;text-align:center;background:${rowColors[i % rowColors.length]};color:#ffffff;font-family:'Fredoka',sans-serif;font-weight:600;font-size:11.5px;border-radius:9px;padding:5px 3px;height:fit-content;">${it.time}</div>
      <div>
        <div style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:13px;color:#3c2f2f;">${it.title}</div>
        <div style="font-size:10.5px;color:#7a6a63;line-height:1.4;margin-top:1px;">${it.text}</div>
      </div>
    </div>
  `).join("");

  // main QR: reopen-the-plan link (uses the deployed domain automatically)
  const qrImg = document.querySelector("#qrcode img");
  const qrSrc = qrImg ? qrImg.src : makeQrDataUrl(url, 148);

  // venue field guide: only the stops in her plan
  const planKeys = ["madameyen"];
  if (VENUES[s.cafe]) planKeys.push(s.cafe);
  if (s.shop === "hflower") planKeys.push("hflowers");
  else if (s.shop === "meeq") planKeys.push("meeq");
  else if (s.shop === "both") planKeys.push("hflowers", "meeq");

  const venueCards = planKeys.map((k) => VENUES[k]).map((v) => {
    const qr = makeQrDataUrl(v.maps, 120);
    return `
    <div style="background:#ffffff;border:2px solid #f0e2d3;border-radius:13px;padding:10px 12px;display:flex;gap:10px;">
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:12.5px;color:#3c2f2f;">${v.emoji} ${v.name} <span style="font-family:'Caveat',cursive;font-size:13.5px;color:#e05252;font-weight:400;">— ${v.tag}</span></div>
        <div style="font-size:9.5px;color:#3c2f2f;font-weight:800;line-height:1.35;margin-top:4px;">📍 ${v.address}</div>
        <div style="font-size:9.5px;color:#7a6a63;line-height:1.35;margin-top:2px;">🕐 ${v.hours}</div>
        <div style="font-size:9px;color:#a08f83;font-style:italic;line-height:1.35;margin-top:4px;">${stripTags(v.reviews[0])}</div>
      </div>
      ${qr ? `<div style="flex-shrink:0;text-align:center;"><img src="${qr}" style="width:58px;height:58px;border:2px solid #f0e2d3;border-radius:7px;background:#fff;padding:2px;" /><div style="font-size:7.5px;color:#a99a90;margin-top:2px;">directions</div></div>` : ""}
    </div>`;
  }).join("");

  return `
  <div style="width:794px;height:1122px;background:#fff7ee;font-family:'Nunito',sans-serif;color:#3c2f2f;position:relative;overflow:hidden;">
    <!-- header -->
    <div style="background:#ff6b6b;background:linear-gradient(115deg,#ff6b6b 0%,#f4845f 55%,#ffd166 100%);padding:22px 40px 18px;position:relative;">
      <div style="font-family:'Caveat',cursive;font-size:20px;color:#fff7ee;">a very official document ✦ do not lose</div>
      <div style="font-family:'Fredoka',sans-serif;font-weight:700;font-size:30px;color:#ffffff;line-height:1.08;margin-top:1px;">OFFICIAL SATURDAY ITINERARY 🎟️</div>
      <div style="margin-top:7px;font-weight:800;font-size:12px;color:#fff3e2;">issued to: <span style="background:#ffffff;color:#e05252;border-radius:7px;padding:1px 9px;">${name}</span>
      &nbsp;•&nbsp; Melbourne CBD &nbsp;•&nbsp; one (1) excellent Saturday</div>
      <div style="position:absolute;top:20px;right:36px;border:3px dashed #ffffff;color:#ffffff;font-family:'Fredoka',sans-serif;font-weight:600;font-size:11.5px;letter-spacing:2px;padding:7px 11px;border-radius:9px;transform:rotate(6deg);">ADMIT TWO</div>
    </div>

    <!-- timeline -->
    <div style="padding:12px 40px 0;">
      ${rows}
    </div>

    <!-- agreements + terms -->
    <div style="display:flex;gap:12px;margin:12px 40px 0;">
      <div style="flex:1;background:#ffffff;border:2px solid #f0e2d3;border-radius:12px;padding:9px 13px;">
        <div style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:10.5px;color:#e05252;letter-spacing:1px;margin-bottom:4px;">☑ OFFICIAL AGREEMENTS</div>
        <div style="font-size:9.5px;color:#7a6a63;line-height:1.45;">• ${L.pace}<br>• ${L.photos}</div>
      </div>
      <div style="flex:1;background:#ffffff;border:2px solid #f0e2d3;border-radius:12px;padding:9px 13px;">
        <div style="font-family:'Fredoka',sans-serif;font-weight:600;font-size:10.5px;color:#5da861;letter-spacing:1px;margin-bottom:4px;">§ TERMS &amp; CONDITIONS</div>
        <div style="font-size:9.5px;color:#7a6a63;line-height:1.45;">1. Laughing at my jokes: encouraged, not mandatory. 2. Itinerary fully flexible — boss's orders (that's you). 3. Rain plan: more café time. 4. Ticket is 1 of 1. Non-refundable. Extremely exclusive.</div>
      </div>
    </div>

    <!-- field guide -->
    <div style="margin:14px 40px 0;">
      <div style="font-family:'Fredoka',sans-serif;font-weight:700;font-size:14px;color:#3c2f2f;margin-bottom:7px;">THE FIELD GUIDE 🗺️ <span style="font-family:'Nunito',sans-serif;font-weight:800;font-size:9.5px;color:#a99a90;">— every stop pre-stalked: addresses, hours &amp; scannable directions</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${venueCards}
      </div>
    </div>

    <!-- footer -->
    <div style="position:absolute;left:40px;right:40px;bottom:20px;display:flex;align-items:center;justify-content:space-between;border-top:3px dashed #e8d5c2;padding-top:10px;">
      <div>
        <div style="font-family:'Caveat',cursive;font-size:23px;color:#e05252;">See you Saturday 😊</div>
        <div style="font-size:9px;color:#a99a90;margin-top:1px;">Certified by the Department of Excellent Saturdays • ref no. 001-BESTDAY<br>Hours researched like a responsible adult — scan a venue QR for live info. All stops are a ~5-min walk apart.</div>
      </div>
      ${qrSrc ? `<div style="flex-shrink:0;text-align:center;"><img src="${qrSrc}" style="width:64px;height:64px;border:2px solid #f0e2d3;border-radius:8px;background:#fff;padding:3px;" /><div style="font-size:8px;color:#a99a90;margin-top:2px;">scan to reopen your plan</div></div>` : ""}
    </div>
  </div>`;
}

function downloadPdf(s, url) {
  const btn = document.getElementById("pdfBtn");
  const original = btn.textContent;
  btn.textContent = "Printing your ticket… 🖨️";
  btn.disabled = true;

  const page = document.getElementById("pdf-page");
  page.innerHTML = buildPdfHtml(s, url);

  const fname = (s.name ? s.name.replace(/[^\w\-]+/g, "-") + "s" : "Our") + "-Official-Saturday.pdf";

  // html2canvas (bundled in html2pdf 0.10) mis-offsets the capture by the
  // page's scroll position, producing a blank/cropped PDF when the user has
  // scrolled down (the download button is always below the fold). Pin the
  // scroll to 0 during capture and restore it afterwards.
  const sx = window.scrollX, sy = window.scrollY;
  window.scrollTo(0, 0);
  const restoreScroll = () => window.scrollTo(sx, sy);

  html2pdf()
    .set({
      margin: 0,
      filename: fname,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff7ee",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(page)
    .save()
    .then(() => {
      restoreScroll();
      btn.textContent = "Downloaded! Check your files 📂";
      burstMini();
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
    })
    .catch((err) => {
      restoreScroll();
      console.error("PDF error:", err);
      btn.textContent = "Hmm, try again? 🔁";
      btn.disabled = false;
    });
}

/* ============================================================
   BOOT — deep link straight to results if ?d= present
   ============================================================ */
(function boot() {
  const params = new URLSearchParams(location.search);
  const d = params.get("d");
  if (d) {
    const restored = decodeState(d);
    if (restored && restored.lunch) {
      Object.assign(state, restored);
      stepResults();
      return;
    }
  }
  stepIntro();
})();
