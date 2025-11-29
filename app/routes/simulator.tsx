import { useState, useEffect } from 'react';
import type { Route } from './+types/simulator';
import { ConfigurationForm, type ConfigurationData } from '~/components/configuration-form';
import { CarInvestmentForm, type CarInvestmentData } from '~/components/car-investment-form';
import { EquipmentInvestmentForm, type EquipmentInvestmentData } from '~/components/equipment-investment-form';
import { TaxComparisonChart, TaxDetailCard } from '~/components/tax-comparison-chart';
import { HistorySidebar } from '~/components/history-sidebar';
import type { TaxResult } from '~/lib/tax-calculator';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Symulator Podatkowy 2026 - Kalkulator B2B' },
    { name: 'description', content: 'Zoptymalizuj swoje podatki na 2026 rok' },
  ];
}

type Step = 'config' | 'investments' | 'results';

interface Investment {
  id: string;
  type: 'car' | 'equipment';
  name: string;
  data: CarInvestmentData | EquipmentInvestmentData;
}

export default function Simulator() {
  const [step, setStep] = useState<Step>('config');
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigurationData | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [results, setResults] = useState<{ ryczalt: TaxResult; liniowy: TaxResult; skala: TaxResult } | null>(null);
  const [showCarForm, setShowCarForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load scenario from URL params or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioFromUrl = params.get('scenario');
    const autoCalc = params.has('calculate');

    if (scenarioFromUrl) {
      loadScenario(scenarioFromUrl, autoCalc);
    } else {
      const lastScenarioId = localStorage.getItem('lastScenarioId');
      if (lastScenarioId) {
        loadScenario(lastScenarioId);
      }
    }
  }, []);

  const loadScenario = async (id: string, autoCalculate = false) => {
    try {
      const response = await fetch(`/api/simulation/${id}`);
      const data = (await response.json()) as any;

      if (data.scenario) {
        setScenarioId(id);
        localStorage.setItem('lastScenarioId', id);

        // Reconstruct config from scenario
        const reconstructedConfig: ConfigurationData = {
          yearlyRevenueNetto: data.scenario.yearlyRevenueNetto || 0,
          yearlyFixedCosts: data.scenario.yearlyFixedCosts || 0,
          vatPayer: data.scenario.vatPayer,
          vatRateMixed: data.scenario.vatRateMixed,
          zusType: data.scenario.zusType,
          currentTaxationForm: data.scenario.currentTaxationForm,
        };
        setConfig(reconstructedConfig);

        // Load investments
        const reconstructedInvestments: Investment[] = data.investments.map((inv: any) => ({
          id: inv.id,
          type: inv.type.startsWith('car') ? 'car' : 'equipment',
          name: inv.name,
          data: inv,
        }));
        setInvestments(reconstructedInvestments);

        if (autoCalculate && reconstructedConfig.yearlyRevenueNetto > 0) {
          // Automatically calculate results if revenue is set
          setStep('results');
          setTimeout(() => handleCalculateWithConfig(reconstructedConfig), 100);
        } else {
          setStep('investments');
        }
      }
    } catch (error) {
      console.error('Failed to load scenario:', error);
      alert('Nie udało się załadować scenariusza.');
    }
  };

  const handleNewSimulation = () => {
    setStep('config');
    setScenarioId(null);
    setConfig(null);
    setInvestments([]);
    setResults(null);
    localStorage.removeItem('lastScenarioId');
  };

  const handleConfigureTaxRates = () => {
    window.location.href = '/tax-config';
  };

  const handleConfigSubmit = async (configData: ConfigurationData) => {
    // Create scenario in D1
    try {
      const response = await fetch('/api/simulation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vatPayer: configData.vatPayer,
          vatRateMixed: configData.vatRateMixed,
          zusType: configData.zusType,
          currentTaxationForm: configData.currentTaxationForm,
          yearlyRevenueNetto: configData.yearlyRevenueNetto,
          yearlyFixedCosts: configData.yearlyFixedCosts,
        }),
      });

      const data = (await response.json()) as any;
      setScenarioId(data.id);
      setConfig(configData);
      localStorage.setItem('lastScenarioId', data.id);
      setStep('investments');
    } catch (error) {
      console.error('Failed to create scenario:', error);
      alert('Nie udało się utworzyć scenariusza. Spróbuj ponownie.');
    }
  };

  const handleAddCar = async (carData: CarInvestmentData) => {
    if (!scenarioId) return;

    try {
      const response = await fetch(`/api/simulation/${scenarioId}/investment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: carData.name,
          costNetto: carData.carPriceNetto,
          monthOfPurchase: carData.monthOfPurchase,
          type: carData.financingMethod === 'leasing' ? 'car_leasing' : 'car_cash',
          carDetails: carData,
        }),
      });

      const data = (await response.json()) as any;
      setInvestments([...investments, { id: data.id, type: 'car', name: carData.name, data: carData }]);
      setShowCarForm(false);
    } catch (error) {
      console.error('Failed to add car:', error);
      alert('Nie udało się dodać samochodu. Spróbuj ponownie.');
    }
  };

  const handleAddEquipment = async (equipmentData: EquipmentInvestmentData) => {
    if (!scenarioId) return;

    try {
      const response = await fetch(`/api/simulation/${scenarioId}/investment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: equipmentData.name,
          costNetto: equipmentData.costNetto,
          monthOfPurchase: equipmentData.monthOfPurchase,
          type: 'equipment',
        }),
      });

      const data = (await response.json()) as any;
      setInvestments([...investments, { id: data.id, type: 'equipment', name: equipmentData.name, data: equipmentData }]);
      setShowEquipmentForm(false);
    } catch (error) {
      console.error('Failed to add equipment:', error);
      alert('Nie udało się dodać sprzętu. Spróbuj ponownie.');
    }
  };

  const handleCalculateWithConfig = async (configData: ConfigurationData) => {
    if (!scenarioId) return;

    setIsCalculating(true);
    try {
      const response = await fetch(`/api/simulation/${scenarioId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearlyRevenueNetto: configData.yearlyRevenueNetto,
          yearlyFixedCosts: configData.yearlyFixedCosts,
          selectedTaxYear: configData.selectedTaxYear,
        }),
      });

      const data = (await response.json()) as any;
      setResults(data);
    } catch (error) {
      console.error('Failed to calculate:', error);
      alert('Nie udało się obliczyć podatków. Spróbuj ponownie.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculate = async () => {
    if (!scenarioId || !config) return;

    setIsCalculating(true);
    try {
      const response = await fetch(`/api/simulation/${scenarioId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearlyRevenueNetto: config.yearlyRevenueNetto,
          yearlyFixedCosts: config.yearlyFixedCosts,
        }),
      });

      const data = (await response.json()) as any;
      setResults(data);
      setStep('results');
    } catch (error) {
      console.error('Failed to calculate:', error);
      alert('Nie udało się obliczyć podatków. Spróbuj ponownie.');
    } finally {
      setIsCalculating(false);
    }
  };

  const removeInvestment = (id: string) => {
    setInvestments(investments.filter((inv) => inv.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <HistorySidebar
        currentScenarioId={scenarioId}
        onSelectScenario={loadScenario}
        onNewSimulation={handleNewSimulation}
        onConfigureTaxRates={handleConfigureTaxRates}
      />

      {/* Main Content */}
      <div className="ml-80 flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold">Optymalizator Podatkowy B2B 2026</h1>
            <p className="mt-2 text-gray-400">
              Oblicz i porównaj formy opodatkowania dla swojej działalności gospodarczej (JDG)
            </p>
          </header>

        {/* Progress Indicator */}
        <div className="mb-8 flex gap-4">
          <div className={`flex-1 rounded-md p-3 text-center ${step === 'config' ? 'bg-blue-600' : 'bg-gray-800'}`}>
            1. Konfiguracja
          </div>
          <div className={`flex-1 rounded-md p-3 text-center ${step === 'investments' ? 'bg-blue-600' : 'bg-gray-800'}`}>
            2. Inwestycje
          </div>
          <div className={`flex-1 rounded-md p-3 text-center ${step === 'results' ? 'bg-blue-600' : 'bg-gray-800'}`}>
            3. Wyniki
          </div>
        </div>

        {/* Configuration Step */}
        {step === 'config' && (
          <div>
            <ConfigurationForm onSubmit={handleConfigSubmit} />
          </div>
        )}

        {/* Investments Step */}
        {step === 'investments' && config && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <h2 className="mb-4 text-2xl font-bold">Planowane inwestycje na 2026</h2>
              <p className="mb-6 text-gray-400">
                Dodaj samochody, sprzęt lub inne inwestycje kapitałowe. Wpłyną one na Twoje obliczenia podatkowe.
              </p>

              {/* Investment List */}
              {investments.length > 0 && (
                <div className="mb-6 space-y-3">
                  {investments.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-md border border-gray-600 bg-gray-900 p-4">
                      <div>
                        <div className="font-semibold">{inv.name}</div>
                        <div className="text-sm text-gray-400">
                          {inv.type === 'car' ? (
                            <>
                              Samochód - {(inv.data as CarInvestmentData).engineType.replace('_', ' ')} | {(inv.data as CarInvestmentData).financingMethod === 'leasing' ? 'Leasing' : 'Gotówka'}
                            </>
                          ) : (
                            <>Sprzęt - {(inv.data as EquipmentInvestmentData).costNetto.toLocaleString('pl-PL')} PLN</>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeInvestment(inv.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Usuń
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Investment Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCarForm(true)}
                  className="rounded-md border border-blue-600 px-6 py-3 font-semibold text-blue-400 hover:bg-blue-950/50"
                >
                  + Dodaj samochód (limity 2026)
                </button>
                <button
                  onClick={() => setShowEquipmentForm(true)}
                  className="rounded-md border border-green-600 px-6 py-3 font-semibold text-green-400 hover:bg-green-950/50"
                >
                  + Dodaj sprzęt
                </button>
              </div>

              {/* Calculate Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="rounded-md bg-green-600 px-8 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isCalculating ? 'Obliczam...' : 'Oblicz podatki'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && results && config && (
          <div className="space-y-8">
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <h2 className="mb-6 text-3xl font-bold">Wyniki porównania podatkowego 2026</h2>

              {/* Chart */}
              <TaxComparisonChart results={results} />

              {/* Detailed Cards */}
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <TaxDetailCard
                  title="Ryczałt"
                  result={results.ryczalt}
                  isRecommended={results.ryczalt.netCashInHand === Math.max(results.ryczalt.netCashInHand, results.liniowy.netCashInHand, results.skala.netCashInHand)}
                />
                <TaxDetailCard
                  title="Podatek Liniowy 19%"
                  result={results.liniowy}
                  isRecommended={results.liniowy.netCashInHand === Math.max(results.ryczalt.netCashInHand, results.liniowy.netCashInHand, results.skala.netCashInHand)}
                />
                <TaxDetailCard
                  title="Skala Podatkowa"
                  result={results.skala}
                  isRecommended={results.skala.netCashInHand === Math.max(results.ryczalt.netCashInHand, results.liniowy.netCashInHand, results.skala.netCashInHand)}
                />
              </div>

              {/* Configuration Summary */}
              <div className="mt-8 rounded-md bg-gray-900/50 p-4">
                <h3 className="mb-2 font-semibold">Podsumowanie konfiguracji</h3>
                <div className="grid gap-2 text-sm text-gray-400 md:grid-cols-2">
                  <div>Roczny przychód: {config.yearlyRevenueNetto.toLocaleString('pl-PL')} PLN</div>
                  <div>Koszty stałe: {config.yearlyFixedCosts.toLocaleString('pl-PL')} PLN</div>
                  <div>Typ ZUS: {config.zusType}</div>
                  <div>Płatnik VAT: {config.vatPayer ? 'Tak' : 'Nie'}</div>
                  <div>Inwestycje: {investments.length}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('investments')}
                  className="rounded-md border border-gray-600 px-6 py-2 font-semibold hover:bg-gray-800"
                >
                  ← Modyfikuj inwestycje
                </button>
                <button
                  onClick={() => {
                    setStep('config');
                    setScenarioId(null);
                    setConfig(null);
                    setInvestments([]);
                    setResults(null);
                  }}
                  className="rounded-md border border-gray-600 px-6 py-2 font-semibold hover:bg-gray-800"
                >
                  Nowa symulacja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCarForm && (
          <CarInvestmentForm
            onSubmit={handleAddCar}
            onCancel={() => setShowCarForm(false)}
          />
        )}

        {showEquipmentForm && (
          <EquipmentInvestmentForm
            onSubmit={handleAddEquipment}
            onCancel={() => setShowEquipmentForm(false)}
          />
        )}
        </div>
      </div>
    </div>
  );
}
