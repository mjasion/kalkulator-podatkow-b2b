import { useState } from 'react';
import type { EngineType, FinancingMethod, UsageType } from '~/lib/tax-calculator';

export interface CarInvestmentData {
  name: string;
  carPriceNetto: number;
  engineType: EngineType;
  financingMethod: FinancingMethod;
  usageType: UsageType;
  leasingInitialPaymentPercent?: number;
  leasingMonths?: number;
  leasingBuyoutPercent?: number;
  monthOfPurchase: number;
}

interface CarInvestmentFormProps {
  onSubmit: (data: CarInvestmentData) => void;
  onCancel: () => void;
}

const ENGINE_TYPE_LIMITS = {
  combustion: 100_000,
  hybrid_plugin: 150_000,
  electric: 225_000,
};

export function CarInvestmentForm({ onSubmit, onCancel }: CarInvestmentFormProps) {
  const [car, setCar] = useState<CarInvestmentData>({
    name: '',
    carPriceNetto: 120_000,
    engineType: 'combustion',
    financingMethod: 'leasing',
    usageType: 'mixed',
    leasingInitialPaymentPercent: 10,
    leasingMonths: 48,
    leasingBuyoutPercent: 1,
    monthOfPurchase: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(car);
  };

  const limit = ENGINE_TYPE_LIMITS[car.engineType];
  const exceedsLimit = car.carPriceNetto > limit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-6">
        <h2 className="mb-6 text-2xl font-bold">Dodaj inwestycję samochodową na 2026</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Car Name */}
          <div>
            <label className="mb-2 block text-sm font-medium">Nazwa/Model samochodu</label>
            <input
              type="text"
              value={car.name}
              onChange={(e) => setCar({ ...car, name: e.target.value })}
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="np. Tesla Model 3, BMW X5"
              required
            />
          </div>

          {/* Engine Type */}
          <div>
            <label className="mb-2 block text-sm font-medium">Typ napędu (limity 2026)</label>
            <div className="space-y-2">
              <label className="flex items-center rounded-md border border-gray-700 p-3 hover:bg-gray-800">
                <input
                  type="radio"
                  checked={car.engineType === 'combustion'}
                  onChange={() => setCar({ ...car, engineType: 'combustion' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Spalinowy/Hybryda standardowa</div>
                  <div className="text-xs text-gray-400">Limit odliczenia: 100 000 PLN</div>
                </div>
              </label>
              <label className="flex items-center rounded-md border border-gray-700 p-3 hover:bg-gray-800">
                <input
                  type="radio"
                  checked={car.engineType === 'hybrid_plugin'}
                  onChange={() => setCar({ ...car, engineType: 'hybrid_plugin' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Hybryda plug-in (Eco)</div>
                  <div className="text-xs text-gray-400">Limit odliczenia: 150 000 PLN</div>
                </div>
              </label>
              <label className="flex items-center rounded-md border border-gray-700 p-3 hover:bg-gray-800">
                <input
                  type="radio"
                  checked={car.engineType === 'electric'}
                  onChange={() => setCar({ ...car, engineType: 'electric' })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Elektryczny (BEV)</div>
                  <div className="text-xs text-gray-400">Limit odliczenia: 225 000 PLN</div>
                </div>
              </label>
            </div>
          </div>

          {/* Car Price */}
          <div>
            <label className="mb-2 block text-sm font-medium">Cena samochodu (netto)</label>
            <input
              type="number"
              value={car.carPriceNetto}
              onChange={(e) => setCar({ ...car, carPriceNetto: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
              step="1000"
              required
            />
            {exceedsLimit && (
              <p className="mt-1 text-sm text-yellow-400">
                ⚠️ Cena przekracza limit {limit.toLocaleString('pl-PL')} PLN. Tylko {((limit / car.carPriceNetto) * 100).toFixed(0)}% będzie podlegało odliczeniu.
              </p>
            )}
          </div>

          {/* Financing Method */}
          <div>
            <label className="mb-2 block text-sm font-medium">Sposób finansowania</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={car.financingMethod === 'leasing'}
                  onChange={() => setCar({ ...car, financingMethod: 'leasing' })}
                  className="mr-2"
                />
                Leasing
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={car.financingMethod === 'cash'}
                  onChange={() => setCar({ ...car, financingMethod: 'cash' })}
                  className="mr-2"
                />
                Zakup gotówkowy
              </label>
            </div>
          </div>

          {/* Leasing Parameters */}
          {car.financingMethod === 'leasing' && (
            <div className="space-y-4 rounded-md border border-blue-700 bg-blue-950/20 p-4">
              <h3 className="font-semibold">Szczegóły leasingu</h3>

              <div>
                <label className="mb-2 block text-sm font-medium">Wpłata własna (%)</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={car.leasingInitialPaymentPercent}
                  onChange={(e) => setCar({ ...car, leasingInitialPaymentPercent: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {car.leasingInitialPaymentPercent}% = {((car.carPriceNetto * (car.leasingInitialPaymentPercent || 0)) / 100).toLocaleString('pl-PL')} PLN
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Okres leasingu (miesiące)</label>
                <select
                  value={car.leasingMonths}
                  onChange={(e) => setCar({ ...car, leasingMonths: Number(e.target.value) })}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="24">24 miesiące (2 lata)</option>
                  <option value="36">36 miesięcy (3 lata)</option>
                  <option value="48">48 miesięcy (4 lata)</option>
                  <option value="60">60 miesięcy (5 lat)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Wykup (%)</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={car.leasingBuyoutPercent}
                  onChange={(e) => setCar({ ...car, leasingBuyoutPercent: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {car.leasingBuyoutPercent}% = {((car.carPriceNetto * (car.leasingBuyoutPercent || 0)) / 100).toLocaleString('pl-PL')} PLN
                </p>
              </div>
            </div>
          )}

          {/* Usage Type */}
          <div>
            <label className="mb-2 block text-sm font-medium">Wykorzystanie samochodu</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={car.usageType === 'mixed'}
                  onChange={() => setCar({ ...car, usageType: 'mixed' })}
                  className="mr-2"
                />
                Mieszane (Służbowo + Prywatnie) - 50% VAT
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={car.usageType === 'full_business'}
                  onChange={() => setCar({ ...car, usageType: 'full_business' })}
                  className="mr-2"
                />
                100% Służbowo - 100% VAT
              </label>
            </div>
          </div>

          {/* Month of Purchase */}
          <div>
            <label className="mb-2 block text-sm font-medium">Miesiąc zakupu (2026)</label>
            <select
              value={car.monthOfPurchase}
              onChange={(e) => setCar({ ...car, monthOfPurchase: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2026, month - 1).toLocaleString('pl', { month: 'long' })} (Miesiąc {month})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-600 px-6 py-2 font-semibold hover:bg-gray-800"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Dodaj samochód
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
