import { useState } from 'react';
import type { ZusType } from '~/lib/tax-calculator';

export interface ConfigurationData {
  yearlyRevenueNetto: number;
  yearlyFixedCosts: number;
  vatPayer: boolean;
  vatRateMixed: number;
  zusType: ZusType;
  currentTaxationForm: string;
  selectedTaxYear: number; // Year for which tax configuration to use
}

interface ConfigurationFormProps {
  initialData?: Partial<ConfigurationData>;
  onSubmit: (data: ConfigurationData) => void;
  aiSuggestion?: {
    revenue: number;
    fixedCosts: number;
  };
}

export function ConfigurationForm({ initialData, onSubmit, aiSuggestion }: ConfigurationFormProps) {
  const [config, setConfig] = useState<ConfigurationData>({
    yearlyRevenueNetto: aiSuggestion?.revenue || initialData?.yearlyRevenueNetto || 180000,
    yearlyFixedCosts: aiSuggestion?.fixedCosts || initialData?.yearlyFixedCosts || 36000,
    vatPayer: initialData?.vatPayer ?? true,
    vatRateMixed: initialData?.vatRateMixed ?? 1.0,
    zusType: initialData?.zusType || 'maly_plus',
    currentTaxationForm: initialData?.currentTaxationForm || 'liniowy',
    selectedTaxYear: initialData?.selectedTaxYear || 2026,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  const monthlyRevenue = config.yearlyRevenueNetto / 12;
  const monthlyFixedCosts = config.yearlyFixedCosts / 12;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6">
      <h2 className="text-2xl font-bold">Konfiguracja na 2026 rok</h2>

      {aiSuggestion && (
        <div className="rounded-md bg-blue-950/50 border border-blue-800 p-4">
          <p className="text-sm text-blue-300">
            AI zasugerował wartości na podstawie Twojej historii InFakt. Możesz je dostosować poniżej.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Roczny przychód (netto)
          </label>
          <input
            type="number"
            value={config.yearlyRevenueNetto}
            onChange={(e) => setConfig({ ...config, yearlyRevenueNetto: Number(e.target.value) })}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-4 py-2 focus:border-blue-500 focus:outline-none"
            step="1000"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            ≈ {monthlyRevenue.toLocaleString('pl-PL')} PLN/miesiąc
          </p>
        </div>

        {/* Fixed Costs */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Roczne koszty stałe
          </label>
          <input
            type="number"
            value={config.yearlyFixedCosts}
            onChange={(e) => setConfig({ ...config, yearlyFixedCosts: Number(e.target.value) })}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-4 py-2 focus:border-blue-500 focus:outline-none"
            step="1000"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            ≈ {monthlyFixedCosts.toLocaleString('pl-PL')} PLN/miesiąc
          </p>
        </div>

        {/* VAT Payer */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Płatnik VAT
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={config.vatPayer === true}
                onChange={() => setConfig({ ...config, vatPayer: true })}
                className="mr-2"
              />
              Tak (płatnik VAT)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={config.vatPayer === false}
                onChange={() => setConfig({ ...config, vatPayer: false })}
                className="mr-2"
              />
              Nie
            </label>
          </div>
        </div>

        {/* VAT Deduction Rate */}
        {config.vatPayer && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Stopień odliczenia VAT
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.vatRateMixed}
              onChange={(e) => setConfig({ ...config, vatRateMixed: Number(e.target.value) })}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-400">
              {(config.vatRateMixed * 100).toFixed(0)}% do odliczenia
            </p>
          </div>
        )}

        {/* ZUS Type */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Typ ZUS
          </label>
          <select
            value={config.zusType}
            onChange={(e) => setConfig({ ...config, zusType: e.target.value as ZusType })}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="ulga_na_start">Ulga na start (0 zł - pierwsze 6 miesięcy)</option>
            <option value="preferencyjny">Preferencyjny ZUS (≈650 PLN/miesiąc)</option>
            <option value="maly_plus">Mały ZUS Plus (≈1 700 PLN/miesiąc)</option>
            <option value="duzy">Pełny ZUS (≈1 900 PLN/miesiąc)</option>
          </select>
        </div>

        {/* Current Taxation Form */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Obecna forma opodatkowania (dla referencji)
          </label>
          <select
            value={config.currentTaxationForm}
            onChange={(e) => setConfig({ ...config, currentTaxationForm: e.target.value })}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="liniowy">Podatek liniowy (19%)</option>
            <option value="skala">Skala podatkowa (progresywny)</option>
            <option value="ryczalt">Ryczałt</option>
          </select>
        </div>

        {/* Tax Year */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Rok podatkowy
          </label>
          <select
            value={config.selectedTaxYear}
            onChange={(e) => setConfig({ ...config, selectedTaxYear: Number(e.target.value) })}
            className="w-full rounded-md border border-gray-600 bg-gray-900 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Przejdź do inwestycji
        </button>
      </div>
    </form>
  );
}
