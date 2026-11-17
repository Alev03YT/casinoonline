import {
  baccaratDeal, baccaratPayout, baccaratTotal, blackjackResult, blackjackTotal,
  deck, jackpotTriple, pokerPaytable, pokerResult, randomInt, ranks, rouletteBets,
  rouletteResult, slotResult, slotTriple, suits, symbols,
} from "./games.js";

const games = [
  { id: "roulette", name: "Roulette Europea", kind: "Tavolo simulato", category: "tables", table: true },
  { id: "blackjack", name: "Blackjack", kind: "Tavolo simulato", category: "tables", table: true },
  { id: "slots", name: "Lucky 7", kind: "Slot classica", category: "slots" },
  { id: "poker", name: "Video Poker", kind: "Jacks or Better", category: "tables" },
  { id: "baccarat", name: "Baccarat", kind: "Tavolo simulato", category: "tables", table: true, recent: true },
  { id: "jackpot", name: "Aurora Jackpot", kind: "Slot con premio fisso", category: "slots", jackpot: true, recent: true },
];
const titles = {
  all: ["Giochi in evidenza", "Scopri le slot e i tavoli della lobby demo."],
  slots: ["Slot", "Slot a tre rulli con tabelle dei pagamenti consultabili."],
  tables: ["Giochi da casinò", "Roulette, blackjack, baccarat e video poker."],
  live: ["Tavoli simulati", "Gioca contro il banco automatico."],
  new: ["Nuovi giochi", "Gli ultimi titoli aggiunti alla lobby."],
  jackpot: ["Jackpot demo", "Premi fissi in crediti virtuali."],
  favorites: ["Preferiti", "Ritrova i giochi che hai salvato."],
  recent: ["Giocati di recente", "Riprendi dai giochi delle tue ultime partite."],
};

const slides = [
  { title: ["La tua sala giochi", "con 1.000 crediti"], caption: "Prova slot e tavoli con crediti virtuali.", action: "Esplora i giochi", view: "all" },
  { title: ["I classici", "del casinò"], caption: "Roulette europea, blackjack e baccarat.", action: "Vedi i tavoli", view: "live" },
  { title: ["Gira i rulli", "della sala slot"], caption: "Scopri Lucky 7 e Aurora Jackpot.", action: "Vedi le slot", view: "slots" },
];

const key = "aurora-casino-demo-v1";
const startingCredits = 1000;
const maxBet = 10000;
const format = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2, useGrouping: "always" });
const dateFormat = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" });
const number = value => format.format(value);
const roundCredits = value => Math.round(value * 100) / 100;
const getGame = id => games.find(game => game.id === id);
const $ = selector => document.querySelector(selector);
const dialog = $("#dialog");
const content = $("#dialogContent");
const search = $("#search");
const betLabels = { player: "Giocatore", dealer: "Banco", tie: "Parità" };
const newState = () => ({ name: "", balance: startingCredits, favorites: [], history: [], round: null, count: 0, totalBet: 0, totalPaid: 0 });

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (!saved || !Number.isFinite(saved.balance) || saved.balance < 0) return newState();
    return { ...newState(), ...saved };
  } catch {
    return newState();
  }
}

let state = loadState();
let activeView = "all";
let currentSlide = 0;
let activePanel = null;
let playedResult = null;
let toastTimer;

function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    toast("Il browser consente il salvataggio solo per questa sessione.");
  }
  renderHeader();
}

function toast(message) {
  $("#toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("#toast").textContent = ""; }, 3000);
}

function esc(text) {
  const element = document.createElement("span");
  element.textContent = String(text);
  return element.innerHTML.replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function renderHeader() {
  $("#balance").textContent = number(state.balance);
  $("#initial").textContent = Array.from(state.name.trim())[0]?.toLocaleUpperCase("it") ?? "O";
}

function gameCard(game) {
  const favorite = state.favorites.includes(game.id);
  const favoriteAction = favorite ? "Togli dai preferiti" : "Aggiungi ai preferiti";
  return `<article class="game-card">
    <button class="card-cover art-${game.id}" data-game="${game.id}" aria-label="Gioca a ${game.name}"><span aria-hidden="true">${game.name}</span></button>
    <button class="favorite" data-favorite="${game.id}" aria-pressed="${favorite}" aria-label="${favoriteAction} ${game.name}">${favorite ? "♥" : "♡"}</button>
    <div class="card-body"><div><h3 class="visually-hidden">${game.name}</h3><p>${game.kind}</p></div>
      <button class="card-play" data-game="${game.id}" aria-label="Apri ${game.name}"><span class="play-triangle" aria-hidden="true"></span></button>
    </div>
  </article>`;
}

function matchesView(game) {
  if (activeView === "all") return true;
  if (activeView === "favorites") return state.favorites.includes(game.id);
  if (activeView === "recent") return state.history.some(entry => entry.game === game.id);
  if (activeView === "live") return game.table;
  if (activeView === "new") return game.recent;
  if (activeView === "jackpot") return game.jackpot;
  return game.category === activeView;
}

function renderCatalog() {
  const query = search.value.trim().toLocaleLowerCase("it");
  const [title, subtitle] = titles[activeView];
  $("#catalogTitle").textContent = title;
  $("#catalogSubtitle").textContent = subtitle;
  let matches = games.filter(game => matchesView(game) && (game.name + " " + game.kind).toLocaleLowerCase("it").includes(query));
  if (activeView === "recent") {
    const order = [...new Set(state.history.map(entry => entry.game))];
    matches = matches.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
  let emptyText = "Nessun gioco corrisponde alla ricerca.";
  if (!query && activeView === "favorites") emptyText = "Tocca il cuore sulla scheda di un gioco per salvarlo.";
  if (!query && activeView === "recent") emptyText = "I giochi compariranno qui dopo la prima partita completata.";
  $("#cards").innerHTML = matches.length ? matches.map(gameCard).join("") : `<p class="empty">${emptyText}</p>`;
  const showTables = activeView === "all" && !query;
  $("#lobbyTables").hidden = !showTables;
  if (showTables) $("#tableCards").innerHTML = games.filter(game => game.table).map(gameCard).join("");
  for (const button of document.querySelectorAll(".nav [data-view]")) {
    button.setAttribute("aria-current", String(button.dataset.view === activeView));
  }
  for (const button of document.querySelectorAll(".filters [data-view], .lobby-tabs [data-view]")) {
    button.setAttribute("aria-pressed", String(button.dataset.view === activeView));
  }
}

function selectSlide(index) {
  currentSlide = index;
  const slide = slides[index];
  $("#heroTitle").replaceChildren(slide.title[0], document.createElement("br"), slide.title[1]);
  $("#heroCaption").textContent = slide.caption;
  $("#heroAction").textContent = slide.action;
  $("#hero").dataset.slide = String(index);
  for (const button of document.querySelectorAll("[data-slide]")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.slide) === index));
  }
}

function closeMenu() {
  $("#sidebar").classList.remove("open");
  $("#menu").setAttribute("aria-expanded", "false");
  $("#menu").setAttribute("aria-label", "Apri menu");
}

function scrollCatalog() {
  $("#catalogTitle").focus({ preventScroll: true });
  $("#catalog").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function selectView(view) {
  activeView = view;
  search.value = "";
  renderCatalog();
  closeMenu();
  if (view !== "all") scrollCatalog();
  else window.scrollTo({ top: 0, behavior: "instant" });
}

function show(title, kicker, markup) {
  $("#dialogTitle").textContent = title;
  $("#dialogKicker").textContent = kicker;
  content.innerHTML = markup;
  if (!dialog.open) dialog.showModal();
}

function settle(game, bet, payout) {
  const paid = roundCredits(payout);
  state.balance = roundCredits(state.balance + paid);
  state.count++;
  state.totalBet += bet;
  state.totalPaid = roundCredits(state.totalPaid + paid);
  state.history.unshift({ game, bet, paid, date: Date.now() });
  state.history.length = Math.min(state.history.length, 100);
  state.round = null;
  save();
  if (activeView === "recent") renderCatalog();
  return paid;
}

function gameStatus(message, style = "") {
  const status = $("#gameStatus");
  status.textContent = message;
  status.className = "status " + style;
}

function displayResult(label, bet, paid) {
  const net = roundCredits(paid - bet);
  const delta = net === 0 ? "Puntata restituita" : `${net > 0 ? "+" : "−"}${number(Math.abs(net))} crediti netti`;
  gameStatus(label + " · " + delta, net > 0 ? "win" : "");
}

function readBet(form) {
  const bet = Number(form.elements.bet.value);
  if (!Number.isInteger(bet) || bet < 1 || bet > maxBet) {
    gameStatus("Inserisci una puntata intera da 1 a " + number(maxBet) + " crediti.", "error");
    return null;
  }
  if (bet > state.balance) {
    gameStatus("Crediti insufficienti. Puoi ripristinare il saldo dal portafoglio demo.", "error");
    return null;
  }
  return bet;
}

function stakeField(bet = 10) {
  return `<label class="field">Puntata <input name="bet" type="number" min="1" max="${maxBet}" step="1" value="${bet}" required inputmode="numeric"></label>`;
}

function option(value, label, selected) {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`;
}

function cardsMarkup(cards, hideLast = false) {
  return cards.map((card, i) => {
    if (hideLast && i === cards.length - 1) return '<span class="playing-card back" aria-label="Carta coperta">✦</span>';
    const color = [1, 3].includes(card.suit) ? " red" : "";
    return `<span class="playing-card${color}">${ranks[card.rank]}<span>${suits[card.suit]}</span></span>`;
  }).join("");
}

function stage(markup, className = "") {
  return `<div class="game-stage ${className}">${markup}</div>`;
}

function gameForm(fields, action) {
  return `<form class="game-form" id="gameForm">${fields}<button class="primary" type="submit">${action}</button></form>`;
}

function rules(markup) {
  return `<details class="rules"><summary>Regole e pagamenti</summary>${markup}</details>`;
}

function resultFor(id) {
  return playedResult?.id === id ? playedResult : null;
}

function rouletteView() {
  const result = resultFor("roulette");
  const betType = result?.pick ?? "red";
  const fields = stakeField(result?.bet) + `<label class="field">Tipo di giocata
    <select name="pick">${Object.entries(rouletteBets).map(([id, rule]) => option(id, rule.label, betType)).join("")}</select></label>
    <label class="field" id="numberField" ${betType === "exact" ? "" : "hidden"}>Numero
      <select name="target">${Array.from({ length: 37 }, (_, i) => option(i, i, result?.target ?? 0)).join("")}</select></label>`;
  return stage(`<div class="roulette-result ${result?.color ?? ""}"><span>${result?.number ?? "–"}</span></div>`)
    + gameForm(fields, "Gira la ruota")
    + rules("<p>Un solo zero, numeri da 0 a 36. Colori, pari/dispari e metà del tavolo pagano 2×. Le dozzine pagano 3× e il numero secco 36×. Lo zero vince solo se puntato come numero secco. I pagamenti includono la puntata.</p>");
}

function slotsView(id) {
  const result = resultFor(id);
  const isJackpot = id === "jackpot";
  const reels = result?.reels ?? [0, 4, 5];
  const payout = isJackpot ? jackpotTriple : slotTriple;
  return stage(`<div class="reels" aria-label="Rulli">${reels.map(reel => `<span>${symbols[reel]}</span>`).join("")}</div>`, "slot-stage")
    + gameForm(stakeField(result?.bet), "Gira i rulli")
    + rules(`<p>Tre rulli indipendenti e una linea di pagamento. Esattamente due 7 pagano 2×.</p>
      <p>Tris: ${symbols.map((symbol, i) => symbol + " " + payout[i] + "×").join(" · ")}. I pagamenti includono la puntata.</p>`);
}

function blackjackView() {
  const round = state.round?.id === "blackjack" ? state.round : null;
  const result = resultFor("blackjack");
  const hand = round ?? result;
  const display = hand ? `<div class="hand-layout">
    <div><p>Banco${round ? "" : " · " + blackjackTotal(hand.dealer)}</p><div class="card-row">${cardsMarkup(hand.dealer, !!round)}</div></div>
    <div><p>Tu · ${blackjackTotal(hand.player)}</p><div class="card-row">${cardsMarkup(hand.player)}</div></div></div>`
    : '<div class="card-row"><span class="playing-card back">✦</span><span class="playing-card back">✦</span></div>';
  const controls = round
    ? `<div class="game-form"><button class="primary" data-action="hit">Carta</button><button class="secondary" data-action="stand">Stai</button>
      <button class="secondary" data-action="double" ${round.player.length === 2 && state.balance >= round.bet ? "" : "disabled"}>Raddoppia</button></div>`
    : gameForm(stakeField(result?.bet), "Distribuisci");
  return stage(display, "felt") + controls
    + rules("<p>Il banco si ferma a 17, anche con asso contato come 11. Blackjack naturale paga 3 a 2. Una vittoria normale paga 1 a 1. La parità restituisce la puntata. Raddoppia sulle prime due carte per riceverne una sola in più. Split e assicurazione sono assenti in questa variante.</p>");
}

function pokerView() {
  const round = state.round?.id === "poker" ? state.round : null;
  const result = resultFor("poker");
  const hand = round ?? result;
  const display = hand ? `<div class="card-row">${hand.player.map((card, i) => round
    ? `<button class="hold-choice" data-hold="${i}" aria-label="Tieni ${ranks[card.rank]}${suits[card.suit]}" aria-pressed="${round.held[i]}">${cardsMarkup([card])}<span>${round.held[i] ? "Tenuta" : "Tieni"}</span></button>`
    : cardsMarkup([card])).join("")}</div>`
    : '<div class="card-row">' + '<span class="playing-card back">✦</span>'.repeat(5) + '</div>';
  const controls = round
    ? '<div class="game-form"><button class="primary" data-action="draw">Sostituisci le altre carte</button></div>'
    : gameForm(stakeField(result?.bet), "Distribuisci");
  return stage(display, "poker-stage") + controls
    + rules(`<p>Scegli le carte da tenere e sostituisci le altre una sola volta. I moltiplicatori indicano il pagamento totale.</p>
      <p>${pokerPaytable.map(([handName, multiplier]) => handName + " " + multiplier + "×").join(" · ")}.</p>`);
}

function baccaratView() {
  const result = resultFor("baccarat");
  const display = result ? `<div class="hand-layout"><div><p>Giocatore · ${baccaratTotal(result.player)}</p>
    <div class="card-row">${cardsMarkup(result.player)}</div></div><div><p>Banco · ${baccaratTotal(result.dealer)}</p>
    <div class="card-row">${cardsMarkup(result.dealer)}</div></div></div>`
    : '<div class="card-row"><span class="playing-card back">✦</span><span class="playing-card back">✦</span></div>';
  const fields = stakeField(result?.bet) + `<label class="field">Punta su<select name="pick">
    ${Object.entries(betLabels).map(([value, label]) => option(value, label, result?.pick ?? "player")).join("")}</select></label>`;
  return stage(display, "felt") + gameForm(fields, "Distribuisci")
    + rules("<p>Vince il totale più vicino a 9. Le figure e il 10 valgono zero, l’asso vale uno e conta solo l’ultima cifra della somma. Il banco gestisce automaticamente l’eventuale terza carta.</p><p>Giocatore: 2×. Banco: 1,95×. Parità: 9×. Se esce parità, le puntate su Giocatore e Banco vengono restituite.</p>");
}

function renderGame(id) {
  const game = getGame(id);
  const view = { roulette: rouletteView, slots: slotsView, jackpot: slotsView, blackjack: blackjackView, poker: pokerView, baccarat: baccaratView };
  activePanel = id;
  const gameMarkup = view[id](id);
  const gameMain = gameMarkup.replace('<details class="rules">', '<p id="gameStatus" class="status" role="status" aria-live="polite"></p><details class="rules">');
  show(game.name, "PARTITA DEMO", `<p class="balance-label">Saldo disponibile <strong>${number(state.balance)} crediti</strong></p>${gameMain}`);
  const result = resultFor(id);
  if (result) {
    displayResult(result.label, result.bet, result.paid);
    if (["roulette", "slots", "jackpot"].includes(id)) $(".game-stage").classList.add("just-played");
  }
  if (state.round?.id === id && !result) gameStatus(`Partita in corso · ${number(state.round.bet)} crediti in gioco`);
}

function openGame(id) {
  if (state.round && state.round.id !== id) {
    renderGame(state.round.id);
    gameStatus("Completa questa partita prima di aprire un altro gioco.", "error");
    return;
  }
  playedResult = null;
  renderGame(id);
}

function startSingle(id, bet, form) {
  let result;
  let multiplier;
  if (id === "roulette") {
    const pick = form.elements.pick.value;
    const target = Number(form.elements.target.value);
    const roll = rouletteResult(randomInt(37), pick, target);
    multiplier = roll.multiplier;
    const colors = { red: "Rosso", black: "Nero", green: "Verde" };
    result = { ...roll, pick, target, label: roll.number + " " + colors[roll.color] };
  } else if (id === "baccarat") {
    const pick = form.elements.pick.value;
    const hand = baccaratDeal(deck());
    multiplier = baccaratPayout(hand.winner, pick);
    result = { ...hand, pick, label: hand.winner === "tie" ? "Parità" : "Vince " + (hand.winner === "player" ? "il giocatore" : "il banco") };
  } else {
    const reels = Array.from({ length: 3 }, () => randomInt(symbols.length));
    multiplier = slotResult(reels, id === "jackpot" ? jackpotTriple : slotTriple);
    const isJackpot = id === "jackpot" && multiplier === jackpotTriple[5];
    result = { reels, label: isJackpot ? "Jackpot demo" : multiplier ? "Combinazione vincente" : "Nessuna combinazione vincente" };
  }
  state.balance = roundCredits(state.balance - bet);
  const paid = settle(id, bet, bet * multiplier);
  playedResult = { ...result, id, bet, paid };
  renderGame(id);
}

function finishBlackjack(round) {
  const { multiplier, label } = blackjackResult(round.player, round.dealer);
  const paid = settle(round.id, round.bet, round.bet * multiplier);
  playedResult = { ...round, label, paid };
  renderGame(round.id);
}

function standBlackjack(round) {
  if (blackjackTotal(round.player) <= 21) {
    while (blackjackTotal(round.dealer) < 17) round.dealer.push(round.cards.pop());
  }
  finishBlackjack(round);
}

function startRound(id, bet) {
  const cards = deck();
  state.balance = roundCredits(state.balance - bet);
  playedResult = null;
  if (id === "poker") {
    const player = Array.from({ length: 5 }, () => cards.pop());
    state.round = { id, bet, cards, player, held: Array(5).fill(false) };
  } else {
    const player = [cards.pop()];
    const dealer = [cards.pop()];
    player.push(cards.pop());
    dealer.push(cards.pop());
    state.round = { id, bet, cards, player, dealer };
    if (blackjackTotal(player) === 21 || blackjackTotal(dealer) === 21) {
      finishBlackjack(state.round);
      return;
    }
  }
  save();
  renderGame(id);
}

function makeMove(action) {
  const round = state.round;
  if (!round || round.id !== activePanel) return;
  if (round.id === "poker" && action === "draw") {
    round.player = round.player.map((card, index) => round.held[index] ? card : round.cards.pop());
    const [label, multiplier] = pokerResult(round.player);
    const paid = settle("poker", round.bet, round.bet * multiplier);
    playedResult = { ...round, label, paid };
    renderGame(round.id);
  }
  if (round.id !== "blackjack") return;
  if (action === "stand") standBlackjack(round);
  if (action === "hit") {
    round.player.push(round.cards.pop());
    if (blackjackTotal(round.player) >= 21) standBlackjack(round);
    else {
      save();
      renderGame(round.id);
    }
  }
  if (action === "double" && round.player.length === 2 && state.balance >= round.bet) {
    state.balance = roundCredits(state.balance - round.bet);
    round.bet *= 2;
    round.player.push(round.cards.pop());
    standBlackjack(round);
  }
}

function openPanel(panel) {
  activePanel = panel;
  closeMenu();
  const kicker = "IL TUO SPAZIO DEMO";
  if (panel === "wallet") {
    const currentRound = state.round ? '<p class="panel-text">Completa la partita in corso per ripristinare il saldo.</p>' : "";
    show("Portafoglio", kicker, `<div class="wallet-summary"><small>Saldo disponibile</small><strong>${number(state.balance)} crediti</strong></div>
      <p class="panel-text">Il saldo demo parte da 1.000 crediti virtuali e viene salvato su questo browser.</p>${currentRound}
      <button class="secondary" data-action="reset" ${state.round ? "disabled" : ""}>Ripristina a 1.000 crediti</button>`);
  }
  if (panel === "profile") {
    show("Profilo demo", kicker, `<p class="panel-text">Scegli il nome che vuoi mostrare su questo dispositivo.</p>
      <form class="game-form" id="profileForm"><label class="field">Nickname
      <input name="nickname" maxlength="24" value="${esc(state.name)}" placeholder="Ospite" autocomplete="off"></label>
      <button class="primary" type="submit">Salva</button></form>`);
  }
  if (panel === "history") {
    const rows = state.history.map(entry => {
      const net = roundCredits(entry.paid - entry.bet);
      const cssClass = net > 0 ? "positive" : net < 0 ? "negative" : "";
      return `<tr><td>${dateFormat.format(entry.date)}</td><td>${getGame(entry.game)?.name ?? "Gioco"}</td>
        <td>${number(entry.bet)}</td><td class="${cssClass}">${net > 0 ? "+" : ""}${number(net)}</td></tr>`;
    }).join("");
    show("Cronologia", kicker, `<dl class="stats"><div><dt>Partite</dt><dd>${number(state.count)}</dd></div>
      <div><dt>Crediti puntati</dt><dd>${number(state.totalBet)}</dd></div><div><dt>Crediti restituiti</dt><dd>${number(state.totalPaid)}</dd></div></dl>
      ${rows ? `<div class="table-wrap"><table class="history-table"><thead><tr><th>Quando</th><th>Gioco</th><th>Puntata</th><th>Netto</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : '<p class="panel-text">Qui compariranno le partite completate.</p>'}`);
  }
  if (panel === "info") {
    show("Guida demo", "AURORA CASINO", '<ul class="info-list"><li>Inizia con 1.000 crediti virtuali. Puoi ripristinarli dal portafoglio.</li><li>Apri un gioco per consultare regole e tabella dei pagamenti.</li><li>Il browser salva il saldo, le preferenze e le ultime 100 partite.</li><li>I crediti virtuali non possono essere acquistati, trasferiti o convertiti in denaro.</li></ul>');
  }
}

document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const { action, view, game, favorite, hold, panel, slide } = button.dataset;
  if (button.id === "menu") {
    const open = $("#sidebar").classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
  }
  if (button.id === "explore") {
    const view = slides[currentSlide].view;
    if (view === "all") {
      selectView("all");
      scrollCatalog();
    } else selectView(view);
  }
  if (slide !== undefined) selectSlide(Number(slide));
  if (button.id === "closeDialog") dialog.close();
  if (view) selectView(view);
  if (game) openGame(game);
  if (panel) openPanel(panel);
  if (favorite) {
    const previousGrid = button.closest(".cards").id;
    state.favorites = state.favorites.includes(favorite)
      ? state.favorites.filter(id => id !== favorite)
      : [...state.favorites, favorite];
    save();
    renderCatalog();
    const replacement = document.querySelector(`#${previousGrid} [data-favorite="${favorite}"]`);
    (replacement ?? $("#catalogTitle")).focus({ preventScroll: true });
  }
  if (hold !== undefined && state.round?.id === "poker") {
    const index = Number(hold);
    const held = !state.round.held[index];
    state.round.held[index] = held;
    save();
    button.setAttribute("aria-pressed", String(held));
    button.lastElementChild.textContent = held ? "Tenuta" : "Tieni";
  }
  if (action === "reset" && !state.round) {
    activePanel = "wallet";
    show("Ripristina i crediti", "PORTAFOGLIO DEMO", '<p class="panel-text">Il saldo attuale verrà sostituito da 1.000 crediti virtuali. La cronologia rimane disponibile.</p><div class="layout-row"><button class="secondary" data-panel="wallet">Annulla</button><button class="primary" data-action="confirmReset">Ripristina saldo</button></div>');
  } else if (action === "confirmReset" && !state.round) {
    state.balance = startingCredits;
    save();
    openPanel("wallet");
  } else if (action) {
    makeMove(action);
  }
});

content.addEventListener("change", event => {
  if (event.target.name === "pick" && activePanel === "roulette") {
    $("#numberField").hidden = event.target.value !== "exact";
  }
});

document.addEventListener("submit", event => {
  const form = event.target;
  event.preventDefault();
  if (form.id === "searchForm") scrollCatalog();
  if (form.id === "profileForm") {
    state.name = form.elements.nickname.value.trim();
    save();
    dialog.close();
    toast("Profilo demo salvato.");
  }
  if (form.id !== "gameForm" || state.round) return;
  const bet = readBet(form);
  if (bet === null) return;
  if (activePanel === "poker" || activePanel === "blackjack") startRound(activePanel, bet);
  else startSingle(activePanel, bet, form);
});

search.addEventListener("input", () => {
  if (search.value.trim()) activeView = "all";
  renderCatalog();
  if (search.value.trim()) $("#catalog").scrollIntoView({ behavior: "instant", block: "start" });
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !dialog.open && !event.target.matches("input, select, textarea, [contenteditable]")) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === "Escape" && !dialog.open) closeMenu();
});
dialog.addEventListener("click", event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
dialog.addEventListener("close", () => { activePanel = null; });
window.addEventListener("storage", event => {
  if (event.key !== key) return;
  state = loadState();
  renderHeader();
  renderCatalog();
  if (!dialog.open) return;
  if (getGame(activePanel)) {
    playedResult = null;
    if (state.round && state.round.id !== activePanel) dialog.close();
    else renderGame(activePanel);
  } else if (["wallet", "history"].includes(activePanel)) openPanel(activePanel);
});

renderHeader();
renderCatalog();
