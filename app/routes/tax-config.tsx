import { useState, useEffect } from 'react';
import type { Route } from './+types/tax-config';
import { HistorySidebar } from '~/components/history-sidebar';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Konfiguracja Składek - Kalkulator B2B' },
    { name: 'description', content: 'Konfiguruj parametry składek ZUS i zdrowotne na dany rok' },
  ];
}

interface TaxYearConfig {
  id: string;
  year: number;
  minimumWageGross: number;
  averageWagePrognosis: number;
  averageWageQ4PreviousYear: number;
  retirementRate: number;
  disabilityRate: number;
  accidentRate: number;
  sicknessRate: number;
  workFundRate: number;
  solidarityFundRate: number;
  healthInsuranceRateSkala: number;
  healthInsuranceRateLiniowy: number;
  healthInsuranceLimitLinear: number;
  createdAt: number;
  updatedAt: number;
}

export default function TaxConfigPage() {
  const [years, setYears] = useState<number[]>([2025, 2026, 2027, 2028]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [config, setConfig] = useState<TaxYearConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load config for selected year
  useEffect(() => {
    loadConfig(selectedYear);
  }, [selectedYear]);

  const loadConfig = async (year: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tax-config/${year}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        // Config doesn't exist yet, create default
        setConfig({
          id: '',
          year,
          minimumWageGross: year === 2026 ? 4626 : 4242,
          averageWagePrognosis: year === 2026 ? 7286 : 7000,
          averageWageQ4PreviousYear: year === 2026 ? 7000 : 6800,
          retirementRate: 0.1952,
          disabilityRate: 0.08,
          accidentRate: 0.0167,
          sicknessRate: 0.0245,
          workFundRate: 0.0245,
          solidarityFundRate: 0.0245,
          healthInsuranceRateSkala: 0.09,
          healthInsuranceRateLiniowy: 0.049,
          healthInsuranceLimitLinear: 11600,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Nie udało się załadować konfiguracji' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/tax-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: config.year,
          minimumWageGross: config.minimumWageGross,
          averageWagePrognosis: config.averageWagePrognosis,
          averageWageQ4PreviousYear: config.averageWageQ4PreviousYear,
          retirementRate: config.retirementRate,
          disabilityRate: config.disabilityRate,
          accidentRate: config.accidentRate,
          sicknessRate: config.sicknessRate,
          workFundRate: config.workFundRate,
          solidarityFundRate: config.solidarityFundRate,
          healthInsuranceRateSkala: config.healthInsuranceRateSkala,
          healthInsuranceRateLiniowy: config.healthInsuranceRateLiniowy,
          healthInsuranceLimitLinear: config.healthInsuranceLimitLinear,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Konfiguracja zapisana!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Błąd przy zapisywaniu' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Nie udało się zapisać konfiguracji' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof TaxYearConfig, value: any) => {
    if (config) {
      setConfig({
        ...config,
        [field]: field.includes('Rate') || field.includes('rate') ? parseFloat(value) : parseFloat(value),
      });
    }
  };

  const handleNewSimulation = () => {
    window.location.href = '/simulator';
  };

  const handleConfigureTaxRates = () => {
    // Stay on this page
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <p>Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <HistorySidebar
        currentScenarioId={null}
        onSelectScenario={handleNewSimulation}
        onNewSimulation={handleNewSimulation}
        onConfigureTaxRates={handleConfigureTaxRates}
      />

      {/* Main Content */}
      <div className="ml-80 flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold">Konfiguracja Składek</h1>
          <p className="mt-2 text-gray-400">Ustaw parametry składek ZUS i zdrowotne na dany rok</p>
        </header>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-950/30 border border-green-500 text-green-300'
                : 'bg-red-950/30 border border-red-500 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Year Selector */}
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">Wybierz rok</h2>
          <div className="flex flex-wrap gap-3">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`rounded-md px-6 py-2 font-semibold transition-colors ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-600 hover:bg-gray-800'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6">
          <h2 className="text-2xl font-bold">Parametry na rok {config.year}</h2>

          {/* Base Wages Section */}
          <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
            <h3 className="font-semibold text-blue-300">Wynagrodzenia Bazowe</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Minimalne wynagrodzenie (brutto)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.minimumWageGross}
                  onChange={(e) => handleChange('minimumWageGross', e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">PLN/miesiąc</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Prognozowane przeciętne wynagrodzenie</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.averageWagePrognosis}
                  onChange={(e) => handleChange('averageWagePrognosis', e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">PLN/miesiąc</p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Przeciętne wynagrodzenie (IV kwartał roku poprzedniego)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.averageWageQ4PreviousYear}
                  onChange={(e) => handleChange('averageWageQ4PreviousYear', e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">PLN/miesiąc</p>
              </div>
            </div>
          </div>

          {/* Social Security Rates */}
          <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
            <h3 className="font-semibold text-green-300">Składki Społeczne (ZUS)</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Emerytalne</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.retirementRate}
                    onChange={(e) => handleChange('retirementRate', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.retirementRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Rentowe</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.disabilityRate}
                    onChange={(e) => handleChange('disabilityRate', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.disabilityRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Wypadkowe</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.accidentRate}
                    onChange={(e) => handleChange('accidentRate', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.accidentRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Chorobowe</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.sicknessRate}
                    onChange={(e) => handleChange('sicknessRate', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.sicknessRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Fundusz Pracy</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.workFundRate}
                    onChange={(e) => handleChange('workFundRate', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.workFundRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Fundusz Solidarnościowy</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.solidarityFundRate}
                    onChange={(e) => handleChange('solidarityFundRate', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.solidarityFundRate * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Insurance Rates */}
          <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
            <h3 className="font-semibold text-orange-300">Składka Zdrowotna (NFZ)</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Skala podatkowa</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.healthInsuranceRateSkala}
                    onChange={(e) => handleChange('healthInsuranceRateSkala', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.healthInsuranceRateSkala * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Liniowy (19%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={config.healthInsuranceRateLiniowy}
                    onChange={(e) => handleChange('healthInsuranceRateLiniowy', e.target.value)}
                    className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-gray-500">{(config.healthInsuranceRateLiniowy * 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Limit odliczenia (Liniowy) - roczny</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.healthInsuranceLimitLinear}
                  onChange={(e) => handleChange('healthInsuranceLimitLinear', e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">PLN/rok</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
            <button
              onClick={() => loadConfig(selectedYear)}
              className="rounded-md border border-gray-600 px-6 py-2 font-semibold hover:bg-gray-800"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Zapisuję...' : 'Zapisz konfigurację'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="mb-2 font-semibold text-gray-300">ℹ️ Informacje</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>• Parametry są używane do obliczenia składek w symulatorze</li>
            <li>• Każdy rok może mieć inne wartości (np. inne wynagrodzenia minimalne)</li>
            <li>• Stawki są wyrażone jako ułamki dziesiętne (0.1952 = 19.52%)</li>
            <li>• Zmiana konfiguracji dotyczy nowych symulacji</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
