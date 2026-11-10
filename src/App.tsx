import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Calculator,
  TrendingDown,
  Clock,
  Info,
  DollarSign,
} from 'lucide-react';

// ИСПРАВЛЕНИЕ: Компонент вынесен из App на верхний уровень файла.
// Теперь React не будет пересоздавать его при каждом изменении цифры,
// фокус сохранится, и клавиатура на Android больше не будет пропадать.
const InputField = ({
  label,
  value,
  onChange,
  type = 'number',
  suffix = '',
  step = '1',
}) => (
  <div className="relative mb-4">
    <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">
      {label}
    </label>
    <div className="relative flex items-center">
      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
        step={step}
        className="block w-full px-4 py-3 bg-slate-100 border-b-2 border-transparent focus:bg-slate-50 focus:border-indigo-600 focus:outline-none rounded-t-lg transition-colors text-slate-800 text-lg font-medium"
      />
      {suffix && (
        <span className="absolute right-4 text-slate-400 font-medium">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default function App() {
  // Состояние (данные формы)
  const [propertyValue, setPropertyValue] = useState(200000);
  const [downPayment, setDownPayment] = useState(40000);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTerm, setLoanTerm] = useState(20);
  const [extraPayment, setExtraPayment] = useState(2000);

  // Форматирование чисел в вид 100 000
  const formatCurrency = (val) => Math.round(val).toLocaleString('ru-RU');

  // Вычисления
  const calculation = useMemo(() => {
    const P = propertyValue - downPayment; // Сумма кредита
    const r = interestRate / 100 / 12; // Месячная ставка
    const n = loanTerm * 12; // Количество месяцев

    // Стандартный платеж
    const M =
      P > 0 && r > 0 && n > 0
        ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : 0;

    let stdBalance = P;
    let earlyBalance = P;

    let totalStdInterest = 0;
    let totalEarlyInterest = 0;

    let earlyMonthsCount = 0;

    const chartData = [];

    for (let i = 0; i <= n; i++) {
      // Добавляем точку на график каждый год (каждые 12 месяцев) или в самом конце
      if (i % 12 === 0 || i === n || stdBalance <= 0) {
        chartData.push({
          year: Math.floor(i / 12),
          Standard: Math.max(0, stdBalance),
          Early: Math.max(0, earlyBalance),
        });
      }

      if (i === n) break; // Конец срока

      // Стандартный сценарий
      if (stdBalance > 0) {
        const curStdInt = stdBalance * r;
        totalStdInterest += curStdInt;
        stdBalance -= M - curStdInt;
      }

      // Сценарий с досрочным погашением
      if (earlyBalance > 0) {
        const curEarlyInt = earlyBalance * r;
        totalEarlyInterest += curEarlyInt;

        let payment = M + Number(extraPayment);
        // Если остаток меньше платежа
        if (earlyBalance + curEarlyInt < payment) {
          payment = earlyBalance + curEarlyInt;
        }

        earlyBalance -= payment - curEarlyInt;
        earlyMonthsCount++;
      }
    }

    const savedInterest = totalStdInterest - totalEarlyInterest;
    const savedMonths = n - earlyMonthsCount;

    return {
      loanAmount: P,
      monthlyPayment: M,
      totalStdInterest,
      totalEarlyInterest,
      savedInterest,
      earlyMonthsCount,
      savedMonths,
      chartData,
    };
  }, [propertyValue, downPayment, interestRate, loanTerm, extraPayment]);

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans text-slate-800">
      {/* App Bar / Header */}
      <header className="bg-indigo-600 text-white shadow-md px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-indigo-100" />
          <h1 className="text-xl font-semibold tracking-tight">
            Ипотека & Досрочка
          </h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* Карточка ввода данных */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200/60">
          <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-500" />
            Параметры кредита
          </h2>

          <div className="grid grid-cols-1 gap-1">
            <InputField
              label="Стоимость жилья"
              value={propertyValue}
              onChange={setPropertyValue}
              suffix="₼"
            />
            <InputField
              label="Первоначальный взнос"
              value={downPayment}
              onChange={setDownPayment}
              suffix="₼"
            />

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Ставка"
                value={interestRate}
                onChange={setInterestRate}
                step="0.1"
                suffix="%"
              />
              <InputField
                label="Срок"
                value={loanTerm}
                onChange={setLoanTerm}
                suffix="лет"
              />
            </div>

            <div className="mt-2 pt-4 border-t border-slate-100">
              <InputField
                label="Ежемесячный доп. платеж"
                value={extraPayment}
                onChange={setExtraPayment}
                suffix="₼"
              />
              <p className="text-xs text-slate-400 -mt-2 ml-1 leading-tight">
                Сумма, которую вы будете платить сверх обязательного платежа.
              </p>
            </div>
          </div>
        </div>

        {/* Карточка результатов */}
        <div className="bg-indigo-600 rounded-2xl shadow-md p-5 text-white">
          <div className="text-indigo-100 text-sm mb-1 font-medium">
            Обязательный платеж
          </div>
          <div className="text-4xl font-bold mb-4 tracking-tight">
            {formatCurrency(calculation.monthlyPayment)}{' '}
            <span className="text-2xl font-normal text-indigo-300">₼/мес</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-indigo-500/50 pt-4">
            <div>
              <div className="text-indigo-200 text-xs mb-1">Сумма кредита</div>
              <div className="font-semibold text-lg">
                {formatCurrency(calculation.loanAmount)} ₼
              </div>
            </div>
            <div>
              <div className="text-indigo-200 text-xs mb-1">
                Переплата (без досрочки)
              </div>
              <div className="font-semibold text-lg">
                {formatCurrency(calculation.totalStdInterest)} ₼
              </div>
            </div>
          </div>
        </div>

        {/* Карточка экономии (показывается только если есть доп платеж) */}
        {extraPayment > 0 && calculation.savedMonths > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-emerald-800 font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Эффект досрочного погашения
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">
                    Сэкономлено на процентах
                  </span>
                </div>
                <div className="font-bold text-emerald-600">
                  {formatCurrency(calculation.savedInterest)} ₼
                </div>
              </div>

              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">
                    Срок кредита сокращен на
                  </span>
                </div>
                <div className="font-bold text-emerald-600">
                  {Math.floor(calculation.savedMonths / 12)} лет{' '}
                  {calculation.savedMonths % 12} мес.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* График */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200/60 mt-4">
          <h2 className="text-lg font-semibold mb-4 text-slate-700">
            График погашения долга
          </h2>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={calculation.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val} г.`}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => [`${formatCurrency(value)} ₼`]}
                  labelFormatter={(label) => `Год: ${label}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
                />
                <Line
                  name="Стандартно"
                  type="monotone"
                  dataKey="Standard"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                />
                {extraPayment > 0 && (
                  <Line
                    name="С досрочным"
                    type="monotone"
                    dataKey="Early"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
