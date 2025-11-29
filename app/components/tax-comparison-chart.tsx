import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TaxResult } from '~/lib/tax-calculator';

interface TaxComparisonChartProps {
  results: {
    ryczalt: TaxResult;
    liniowy: TaxResult;
    skala: TaxResult;
  };
}

export function TaxComparisonChart({ results }: TaxComparisonChartProps) {
  const data = [
    {
      name: 'Ryczałt',
      'Gotówka netto': Math.round(results.ryczalt.netCashInHand),
      'Podatek dochodowy': Math.round(results.ryczalt.incomeTax),
      'NFZ (składka zdrowotna)': Math.round(results.ryczalt.healthInsurance),
      'ZUS': Math.round(results.ryczalt.zusTotal),
    },
    {
      name: 'Liniowy 19%',
      'Gotówka netto': Math.round(results.liniowy.netCashInHand),
      'Podatek dochodowy': Math.round(results.liniowy.incomeTax),
      'NFZ (składka zdrowotna)': Math.round(results.liniowy.healthInsurance),
      'ZUS': Math.round(results.liniowy.zusTotal),
    },
    {
      name: 'Skala podatkowa',
      'Gotówka netto': Math.round(results.skala.netCashInHand),
      'Podatek dochodowy': Math.round(results.skala.incomeTax),
      'NFZ (składka zdrowotna)': Math.round(results.skala.healthInsurance),
      'ZUS': Math.round(results.skala.zusTotal),
    },
  ];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-700" />
          <XAxis dataKey="name" className="text-sm" />
          <YAxis className="text-sm" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
            }}
            formatter={(value) => `${Number(value).toLocaleString('pl-PL')} PLN`}
          />
          <Legend />
          <Bar dataKey="Gotówka netto" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Podatek dochodowy" fill="#ef4444" radius={[8, 8, 0, 0]} />
          <Bar dataKey="NFZ (składka zdrowotna)" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          <Bar dataKey="ZUS" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TaxDetailCardProps {
  title: string;
  result: TaxResult;
  isRecommended?: boolean;
}

export function TaxDetailCard({ title, result, isRecommended }: TaxDetailCardProps) {
  return (
    <div className={`rounded-lg border p-6 ${isRecommended ? 'border-green-500 bg-green-950/20' : 'border-gray-700 bg-gray-800/50'}`}>
      {isRecommended && (
        <div className="mb-2 inline-block rounded bg-green-500 px-2 py-1 text-xs font-semibold text-white">
          Rekomendowana
        </div>
      )}
      <h3 className="mb-4 text-xl font-bold">{title}</h3>

      <div className="space-y-3">
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Przychód brutto:</span>
          <span className="font-semibold">{result.grossRevenue.toLocaleString('pl-PL')} PLN</span>
        </div>

        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Koszty ogółem:</span>
          <span className="font-semibold">{result.totalCosts.toLocaleString('pl-PL')} PLN</span>
        </div>

        {result.breakdown.carDepreciationDeduction > 0 && (
          <div className="flex justify-between pl-4 text-sm">
            <span className="text-gray-500">└ Amortyzacja samochodu:</span>
            <span>{result.breakdown.carDepreciationDeduction.toLocaleString('pl-PL')} PLN</span>
          </div>
        )}

        {result.breakdown.equipmentDepreciationDeduction > 0 && (
          <div className="flex justify-between pl-4 text-sm">
            <span className="text-gray-500">└ Amortyzacja sprzętu:</span>
            <span>{result.breakdown.equipmentDepreciationDeduction.toLocaleString('pl-PL')} PLN</span>
          </div>
        )}

        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">Podatek dochodowy:</span>
          <span className="font-semibold text-red-400">-{result.incomeTax.toLocaleString('pl-PL')} PLN</span>
        </div>

        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">NFZ (składka zdrowotna):</span>
          <span className="font-semibold text-orange-400">-{result.healthInsurance.toLocaleString('pl-PL')} PLN</span>
        </div>

        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-400">ZUS (ubezpieczenie społeczne):</span>
          <span className="font-semibold text-purple-400">-{result.zusTotal.toLocaleString('pl-PL')} PLN</span>
        </div>

        {result.breakdown.vatBenefit > 0 && (
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-400">Korzyść VAT:</span>
            <span className="font-semibold text-green-400">+{result.breakdown.vatBenefit.toLocaleString('pl-PL')} PLN</span>
          </div>
        )}

        <div className="mt-4 flex justify-between border-t-2 border-green-500 pt-3">
          <span className="text-lg font-bold">Gotówka netto do wypłaty:</span>
          <span className="text-2xl font-bold text-green-400">{result.netCashInHand.toLocaleString('pl-PL')} PLN</span>
        </div>
      </div>
    </div>
  );
}
