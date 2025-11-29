# Optymalizator Podatkowy B2B 2026

Narzędzie do optymalizacji podatków dla polskich jednoosobowych działalności gospodarczych (JDG), zbudowane na Cloudflare Workers. Pomaga przedsiębiorcom wybrać najlepszą formę opodatkowania na 2026 rok, biorąc pod uwagę nowe limity amortyzacji samochodów.

## Przegląd

Aplikacja pomaga polskim przedsiębiorcom optymalizować podatki poprzez:
- **Porównanie 3 form opodatkowania**: Ryczałt, Podatek liniowy (19%) i Skala podatkowa (progresywna)
- **Symulacja zakupów samochodów na 2026 r.** z nowymi limami amortyzacji
- **Obliczanie scenariuszy** leasing vs zakup gotówkowy ze szczegółowymi rozbiciami
- **Inwestycje w sprzęt** takie jak laptopy i hardware
- **Analiza wspierana AI** danych z systemu InFakt (opcjonalnie)

### Limity amortyzacji samochodów 2026

Aplikacja wdrożyła drastycznie obniżone limity obowiązujące od 1 stycznia 2026:
- **Spalinowe/Hybryda standardowa**: limit 100 000 PLN
- **Hybryda plug-in (Eco)**: limit 150 000 PLN
- **Elektryczne (BEV)**: limit 225 000 PLN

## Stos Technologiczny

- ⚡ **Cloudflare Workers** - Wdrażanie serverless na krawędzi
- 🔁 **Hono** - Lekki framework backendowy
- 🧭 **React Router v7** - Routing z obsługą SSR
- 🎨 **Tailwind CSS** - Stylowanie z priorytetem trybu ciemnego
- 🗄️ **Cloudflare D1** - Baza danych SQLite dla scenariuszy
- 🤖 **Vercel AI SDK** - Analiza danych z InFaktu
- 🔧 **Drizzle ORM** - Bezpieczny dostęp do bazy danych
- 📊 **Recharts** - Wizualizacje porównań podatków

## Rozpoczęcie Pracy

### Wymagania

- Node.js 18+ i pnpm
- Konto Cloudflare (do wdrażania)
- Klucz API OpenAI (opcjonalnie, do analizy InFaktu)

### Instalacja

```bash
# Zainstaluj zależności
pnpm install

# Wygeneruj typy Cloudflare
pnpm cf-typegen

# Uruchom serwer deweloperski
pnpm dev
```

### Konfiguracja

1. **Ustawienie bazy danych**: Baza danych D1 jest już utworzona i skonfigurowana
2. **Klucz API OpenAI** (opcjonalnie): Ustaw dla analityki InFaktu wspomaganej AI
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

### Rozwój

```bash
pnpm dev          # Uruchom lokalny serwer deweloperski
pnpm build        # Zbuduj do produkcji
pnpm typecheck    # Uruchom kontrolę TypeScript
pnpm deploy       # Wdróż na Cloudflare Workers
```

## Struktura Projektu

```
app/
├── components/          # Komponenty React
│   ├── car-investment-form.tsx
│   ├── equipment-investment-form.tsx
│   ├── configuration-form.tsx
│   └── tax-comparison-chart.tsx
├── db/                  # Schemat i klient Drizzle ORM
│   ├── schema.ts
│   └── client.ts
├── lib/                 # Logika biznesowa
│   ├── tax-calculator.ts    # Podstawowe obliczenia podatków polskich
│   └── infakt-tool.ts       # Narzędzie AI SDK dla API InFaktu
├── routes/              # Strony React Router
│   ├── home.tsx
│   └── simulator.tsx
└── routes.ts

workers/
└── app.ts              # Backend Hono + trasy API

schema.sql              # Schemat bazy danych D1
```

## Punkty Końcowe API

- `POST /api/simulation/create` - Utwórz nową symulację
- `GET /api/simulation/:id` - Pobierz symulację
- `POST /api/simulation/:id/investment` - Dodaj samochód/sprzęt
- `POST /api/simulation/:id/calculate` - Oblicz podatki
- `POST /api/ai/analyze-infakt` - Analiza AI (wymaga klucza OpenAI)

## Zaimplementowane Funkcje Kluczowe

### Silnik Obliczania Podatków
- ✅ **Ścisłe obliczenia TypeScript** - Bez AI/LLM dla matematyki podatkowej
- ✅ **Zgodność z polskim prawem podatkowym 2026** - Aktualne przepisy
- ✅ **Trzy formy opodatkowania**: Ryczałt, Liniowy 19%, Skala progresywna
- ✅ **Obliczenia ZUS** - Wszystkie 4 typy (Ulga na Start, Preferencyjny, Mały Plus, Pełny)
- ✅ **Ubezpieczenie zdrowotne** - Różne stawki dla każdej formy opodatkowania

### Symulator Inwestycji Samochodowych
- ✅ **Limity amortyzacji 2026** - Specyficzne dla typu silnika (100k/150k/225k PLN)
- ✅ **Leasing vs gotówka** - Porównanie obok siebie
- ✅ **Proporcjonalne odliczenia** - Gdy cena przekracza limity
- ✅ **Obsługa VAT** - Mieszana (50%) vs pełna biznesowa (100%)
- ✅ **Amortyzacja miesięczna** - Obliczona na podstawie miesiąca zakupu

### Zarządzanie Danymi
- ✅ **Baza danych Cloudflare D1** - Przechowywanie scenariuszy
- ✅ **Drizzle ORM** - Zapytania bezpieczne dla typów
- ✅ **Scenariusze oparte na UUID** - Możliwe do udostępnienia symulacje
- ✅ **RESTful API** - Czyste punkty końcowe Hono

### Doświadczenie Użytkownika
- ✅ **Interfejs trybu ciemnego** - Stylowanie Tailwind CSS
- ✅ **Interaktywne formularze** - Walidacja w czasie rzeczywistym
- ✅ **Wizualne porównania** - Wykresy słupkowe Recharts
- ✅ **Szczegółowe rozbicia** - Karty dla każdej formy opodatkowania
- ✅ **Przepływ krok po kroku** - Konfiguracja → Inwestycje → Wyniki

## Zastrzeżenie

**Ten kalkulator zapewnia szacunki na podstawie polskiego prawa podatkowego 2026.** Zawsze konsultuj się z certyfikowanym księgowym (biegłym rewidentem) w sprawie oficjalnych porad podatkowych. Obliczenia są uproszczone i mogą nie uwzględniać wszystkich przypadków szczegółowych lub wariantów regionalnych.

## Licencja

Szczegóły znajdują się w pliku LICENSE (GNU AGPL v3).

## Zasoby

- 📘 [TASK.md](./TASK.md) - Kompletna specyfikacja projektu
- 📘 [CLAUDE.md](./CLAUDE.md) - Przewodnik dla programistów dla tej bazy kodu
- 🧩 [Dokumentacja Hono](https://hono.dev/)
- 🔀 [React Router v7](https://reactrouter.com/)
- ⚡ [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- 🗄️ [Cloudflare D1](https://developers.cloudflare.com/d1/)
- 🤖 [Vercel AI SDK](https://sdk.vercel.ai/)
