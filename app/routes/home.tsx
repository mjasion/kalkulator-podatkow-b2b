import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Kalkulator Podatkowy B2B 2026" },
		{ name: "description", content: "Zoptymalizuj swoje podatki na 2026 rok z naszym kalkulatorem B2B" },
	];
}

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-950 text-white">
			<div className="mx-auto max-w-4xl px-4 py-16">
				<header className="text-center">
					<h1 className="text-5xl font-bold">Kalkulator Podatkowy B2B</h1>
					<p className="mt-4 text-xl text-gray-400">
						Zoptymalizuj swoją formę opodatkowania na 2026 rok
					</p>
				</header>

				<div className="mt-16 rounded-lg border border-gray-700 bg-gray-800/50 p-8">
					<h2 className="mb-4 text-2xl font-bold">Czym jest ten kalkulator?</h2>
					<p className="mb-6 text-gray-300">
						Kalkulator pomaga polskim jednoosobowym działalnościom gospodarczym (JDG) wybrać optymalną formę opodatkowania na rok 2026.
						Uwzględnia nowe limity amortyzacji samochodów obowiązujące od 1 stycznia 2026 roku.
					</p>

					<h3 className="mb-3 text-xl font-semibold">Limity amortyzacji samochodów 2026:</h3>
					<ul className="mb-6 space-y-2 text-gray-300">
						<li className="flex items-center">
							<span className="mr-2">🚗</span>
							<span><strong>Spalinowe/Hybryda standardowa:</strong> 100 000 PLN</span>
						</li>
						<li className="flex items-center">
							<span className="mr-2">⚡</span>
							<span><strong>Hybryda plug-in (Eco):</strong> 150 000 PLN</span>
						</li>
						<li className="flex items-center">
							<span className="mr-2">🔋</span>
							<span><strong>Elektryczne (BEV):</strong> 225 000 PLN</span>
						</li>
					</ul>

					<h3 className="mb-3 text-xl font-semibold">Funkcje:</h3>
					<ul className="mb-8 space-y-2 text-gray-300">
						<li>✅ Porównanie 3 form opodatkowania: Ryczałt, Liniowy 19%, Skala podatkowa</li>
						<li>✅ Symulacja zakupu samochodu z limitami 2026</li>
						<li>✅ Obliczenia leasing vs zakup gotówkowy</li>
						<li>✅ Uwzględnienie inwestycji w sprzęt</li>
						<li>✅ Obliczenia VAT i ZUS</li>
					</ul>

					<div className="text-center">
						<Link
							to="/simulator"
							className="inline-block rounded-md bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700"
						>
							Rozpocznij symulację podatkową →
						</Link>
					</div>
				</div>

				<footer className="mt-12 text-center text-sm text-gray-500">
					<p>
						Kalkulator dostarcza szacunków opartych na polskim prawie podatkowym 2026.
						Zawsze skonsultuj się z certyfikowanym księgowym w sprawie oficjalnych porad podatkowych.
					</p>
				</footer>
			</div>
		</div>
	);
}
