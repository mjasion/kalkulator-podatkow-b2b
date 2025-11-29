import { useState, useEffect } from 'react';
import type { Investment as DbInvestment } from '~/db/schema';

interface ScenarioSummary {
  id: string;
  createdAt: Date;
  vatPayer: boolean;
  zusType: string;
  investmentCount: number;
  investments: DbInvestment[];
}

interface HistorySidebarProps {
  currentScenarioId: string | null;
  onSelectScenario: (scenarioId: string) => void;
  onNewSimulation: () => void;
  onConfigureTaxRates?: () => void;
}

export function HistorySidebar({ currentScenarioId, onSelectScenario, onNewSimulation, onConfigureTaxRates }: HistorySidebarProps) {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch('/api/simulations');
        const data = (await response.json()) as any;
        setScenarios(data || []);
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pl-PL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getZusLabel = (zusType: string) => {
    const labels: Record<string, string> = {
      ulga_na_start: 'Ulga na start',
      preferencyjny: 'ZUS Pref.',
      maly_plus: 'Mały ZUS+',
      duzy: 'Pełny ZUS',
    };
    return labels[zusType] || zusType;
  };

  const getTotalInvestmentValue = (scenario: ScenarioSummary) => {
    return scenario.investments.reduce((sum, inv) => sum + inv.costNetto, 0);
  };

  const copyToClipboard = (scenarioId: string, includeResults: boolean = true) => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('scenario', scenarioId);
    if (includeResults) {
      params.set('calculate', '1');
    }
    const shareLink = `${baseUrl}/simulator?${params.toString()}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopiedId(scenarioId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className={`fixed left-0 top-0 h-screen flex flex-col border-r border-gray-700 bg-gray-900 transition-all ${isExpanded ? 'w-80' : 'w-16'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        {isExpanded && <h2 className="text-lg font-bold">Historia</h2>}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded p-1 hover:bg-gray-800"
          title={isExpanded ? 'Zwiń' : 'Rozwiń'}
        >
          {isExpanded ? '←' : '→'}
        </button>
      </div>

      {/* New Simulation Button */}
      <div className="p-3">
        <button
          onClick={onNewSimulation}
          className={`w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 ${!isExpanded && 'px-2'}`}
        >
          {isExpanded ? '+ Nowa' : '+'}
        </button>
      </div>

      {/* Scenarios List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">Ładowanie...</div>
        ) : scenarios.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">Brak historii</div>
        ) : (
          <div className="space-y-2 p-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`group rounded-md border border-gray-700 p-3 transition-colors ${
                  currentScenarioId === scenario.id
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'hover:bg-gray-800'
                }`}
              >
                <button
                  onClick={() => onSelectScenario(scenario.id)}
                  className="w-full text-left text-sm"
                >
                  {isExpanded ? (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">{formatDate(scenario.createdAt)}</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded bg-gray-700 px-2 py-0.5 text-xs">
                          {getZusLabel(scenario.zusType)}
                        </span>
                        {scenario.vatPayer && (
                          <span className="inline-block rounded bg-gray-700 px-2 py-0.5 text-xs">VAT</span>
                        )}
                      </div>
                      {scenario.investmentCount > 0 && (
                        <div className="text-xs text-green-400">
                          {scenario.investmentCount} inwest. • {getTotalInvestmentValue(scenario).toLocaleString('pl-PL')} PLN
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-center">{scenario.investmentCount}</div>
                  )}
                </button>

                {isExpanded && (
                  <button
                    onClick={() => copyToClipboard(scenario.id)}
                    className="mt-2 w-full rounded bg-gray-700 px-2 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                    title={scenario.id}
                  >
                    {copiedId === scenario.id ? '✓ Skopiowano!' : '📋 Kopiuj link'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Configure Tax Rates Button */}
      <div className="border-t border-gray-700 p-3">
        <button
          onClick={onConfigureTaxRates}
          className={`w-full rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 transition-colors text-sm ${!isExpanded && 'px-2 py-1 text-xs'}`}
          title="Konfiguruj składki i stawki podatkowe"
        >
          {isExpanded ? '⚙️ Składki' : '⚙️'}
        </button>
        {isExpanded && (
          <p className="mt-2 text-xs text-gray-500">Konfiguruj stawki podatkowe i składki na dany rok</p>
        )}
      </div>
    </div>
  );
}
