export function randomInt(limit) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 2 ** 32) {
    throw new RangeError("Limite casuale non valido");
  }

  const bytes = new Uint32Array(1);
  const ceiling = 2 ** 32 - (2 ** 32 % limit);
  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0] >= ceiling);
  return bytes[0] % limit;
}

const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export const rouletteBets = {
  red: { label: "Rosso", test: number => redNumbers.has(number), payout: 2 },
  black: { label: "Nero", test: number => number > 0 && !redNumbers.has(number), payout: 2 },
  even: { label: "Pari", test: number => number > 0 && number % 2 === 0, payout: 2 },
  odd: { label: "Dispari", test: number => number % 2 === 1, payout: 2 },
  low: { label: "1–18", test: number => number > 0 && number <= 18, payout: 2 },
  high: { label: "19–36", test: number => number >= 19, payout: 2 },
  first: { label: "Prima dozzina", test: number => number > 0 && number <= 12, payout: 3 },
  second: { label: "Seconda dozzina", test: number => number >= 13 && number <= 24, payout: 3 },
  third: { label: "Terza dozzina", test: number => number >= 25, payout: 3 },
  exact: { label: "Numero secco", test: (number, target) => number === target, payout: 36 },
};

export function rouletteResult(number, bet, target) {
  const rule = rouletteBets[bet];
  const color = number === 0 ? "green" : redNumbers.has(number) ? "red" : "black";
  return { number, color, multiplier: rule.test(number, target) ? rule.payout : 0 };
}

export const symbols = ["🍒", "🍋", "🔔", "★", "💎", "7"];
export const slotTriple = [10, 14, 18, 24, 34, 66];

export const jackpotTriple = [7, 10, 14, 19, 23, 100];

export function slotResult(reels, triples = slotTriple) {
  if (reels.every(symbol => symbol === reels[0])) return triples[reels[0]];
  return reels.filter(symbol => symbol === 5).length === 2 ? 2 : 0;
}

export const suits = ["♠", "♥", "♣", "♦"];
export const ranks = ["", "", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function deck() {
  const cards = suits.flatMap((_, suit) => ranks.slice(2).map((_, index) => ({ suit, rank: index + 2 })));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function blackjackTotal(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += card.rank === 14 ? 11 : Math.min(card.rank, 10);
    if (card.rank === 14) aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function blackjackResult(player, dealer) {
  const playerTotal = blackjackTotal(player);
  const dealerTotal = blackjackTotal(dealer);
  const playerNatural = player.length === 2 && playerTotal === 21;
  const dealerNatural = dealer.length === 2 && dealerTotal === 21;
  if (playerNatural && dealerNatural) return { multiplier: 1, label: "Doppio blackjack" };
  if (playerNatural) return { multiplier: 2.5, label: "Blackjack" };
  if (dealerNatural) return { multiplier: 0, label: "Blackjack del banco" };
  if (playerTotal > 21) return { multiplier: 0, label: "Hai sballato" };
  if (dealerTotal > 21) return { multiplier: 2, label: "Il banco ha sballato" };
  if (playerTotal === dealerTotal) return { multiplier: 1, label: "Parità" };
  return playerTotal > dealerTotal
    ? { multiplier: 2, label: "Hai battuto il banco" }
    : { multiplier: 0, label: "Vince il banco" };
}

export const pokerPaytable = [
  ["Scala reale", 250], ["Scala colore", 50], ["Poker", 25], ["Full", 9],
  ["Colore", 6], ["Scala", 4], ["Tris", 3], ["Doppia coppia", 2], ["Coppia di jack o superiore", 1],
];

export function pokerResult(hand) {
  const sorted = hand.map(card => card.rank).sort((a, b) => a - b);
  const counts = new Map();
  for (const rank of sorted) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const flush = hand.every(card => card.suit === hand[0].suit);
  const straight = counts.size === 5 && (sorted[4] - sorted[0] === 4 || sorted.join() === "2,3,4,5,14");

  if (straight && flush) return pokerPaytable[sorted[0] === 10 ? 0 : 1];
  if (groups[0] === 4) return pokerPaytable[2];
  if (groups[0] === 3 && groups[1] === 2) return pokerPaytable[3];
  if (flush) return pokerPaytable[4];
  if (straight) return pokerPaytable[5];
  if (groups[0] === 3) return pokerPaytable[6];
  if (groups[0] === 2 && groups[1] === 2) return pokerPaytable[7];
  if ([...counts].some(([rank, count]) => rank >= 11 && count === 2)) return pokerPaytable[8];
  return ["Nessuna combinazione pagante", 0];
}

const baccaratValue = card => card.rank === 14 ? 1 : card.rank >= 10 ? 0 : card.rank;
export const baccaratTotal = hand => hand.reduce((total, card) => total + baccaratValue(card), 0) % 10;

export function baccaratDeal(cards) {
  const player = [cards.pop(), cards.pop()];
  const dealer = [cards.pop(), cards.pop()];
  const initialPlayer = baccaratTotal(player);
  const initialDealer = baccaratTotal(dealer);

  if (initialPlayer < 8 && initialDealer < 8) {
    if (initialPlayer <= 5) player.push(cards.pop());
    const third = player[2] ? baccaratValue(player[2]) : null;
    const draws = third === null
      ? initialDealer <= 5
      : initialDealer <= 2 || (initialDealer === 3 && third !== 8)
        || (initialDealer === 4 && third >= 2 && third <= 7)
        || (initialDealer === 5 && third >= 4 && third <= 7)
        || (initialDealer === 6 && [6, 7].includes(third));
    if (draws) dealer.push(cards.pop());
  }
  const delta = baccaratTotal(player) - baccaratTotal(dealer);
  return { player, dealer, winner: delta === 0 ? "tie" : delta > 0 ? "player" : "dealer" };
}

export function baccaratPayout(winner, bet) {
  if (winner === bet) return { tie: 9, player: 2, dealer: 1.95 }[winner];
  return winner === "tie" ? 1 : 0;
}
