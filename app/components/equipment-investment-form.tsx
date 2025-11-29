import { useState } from 'react';

export interface EquipmentInvestmentData {
  name: string;
  costNetto: number;
  monthOfPurchase: number;
}

interface EquipmentInvestmentFormProps {
  onSubmit: (data: EquipmentInvestmentData) => void;
  onCancel: () => void;
}

export function EquipmentInvestmentForm({ onSubmit, onCancel }: EquipmentInvestmentFormProps) {
  const [equipment, setEquipment] = useState<EquipmentInvestmentData>({
    name: '',
    costNetto: 10_000,
    monthOfPurchase: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(equipment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
        <h2 className="mb-6 text-2xl font-bold">Dodaj inwestycję w sprzęt</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Equipment Name */}
          <div>
            <label className="mb-2 block text-sm font-medium">Nazwa sprzętu</label>
            <input
              type="text"
              value={equipment.name}
              onChange={(e) => setEquipment({ ...equipment, name: e.target.value })}
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="np. MacBook Pro, Meble biurowe"
              required
            />
          </div>

          {/* Cost */}
          <div>
            <label className="mb-2 block text-sm font-medium">Koszt (netto)</label>
            <input
              type="number"
              value={equipment.costNetto}
              onChange={(e) => setEquipment({ ...equipment, costNetto: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-4 py-2 focus:border-blue-500 focus:outline-none"
              step="100"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Sprzęt IT - amortyzacja: ~30% w pierwszym roku
            </p>
          </div>

          {/* Month of Purchase */}
          <div>
            <label className="mb-2 block text-sm font-medium">Miesiąc zakupu (2026)</label>
            <select
              value={equipment.monthOfPurchase}
              onChange={(e) => setEquipment({ ...equipment, monthOfPurchase: Number(e.target.value) })}
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
              Dodaj sprzęt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
