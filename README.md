# casinoonline

## Aurora Casino

Sala giochi dimostrativa in italiano. Ogni browser parte con 1.000 crediti virtuali senza valore monetario. Il sito include roulette europea, blackjack, baccarat, video poker, Lucky 7 e Aurora Jackpot.

Il saldo, il nickname, i preferiti, la partita in corso e la cronologia vengono salvati nel browser. Le regole e i pagamenti sono visibili dentro ogni gioco. I tavoli usano un banco automatico.

### Avvio in locale

Dalla cartella del repository, avvia il server statico:

```sh
python3 -m http.server 8000
```

Apri [http://localhost:8000](http://localhost:8000) nel browser.

### GitHub Pages

Per pubblicare attraverso GitHub Pages, scegli **Settings → Pages → Deploy from a branch**, seleziona il ramo **main** e la cartella **/ (root)**, poi salva. Il repository contiene tutti i file necessari per il sito statico.
