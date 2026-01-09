import React, { useMemo, useState } from 'react';
import {
  Trash2,
  Plus,
  Save,
  DollarSign,
  User,
  Stethoscope,
  Calendar,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';

const ALORO_ORANGE = '#C9765E';
const ALORO_ORANGE_DARK = '#D66853';

const sanitizeNumber = (v: string) => v.replace(/[^0-9]/g, '');
const formatMoney = (v: string) => (v === '' ? '' : Number(v).toLocaleString());

const parseYm = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return { y, m };
};

const toYm = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

const addMonths = (ym: string, delta: number) => {
  const { y, m } = parseYm(ym);
  const idx = (y * 12 + (m - 1)) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return toYm(ny, nm);
};

/* ---------------- Improved Odometer ---------------- */
const Odometer = ({ value }: { value: string | number }) => {
  const str = String(value);
  const digitHeight = 48;
  const digitWidth = 22;

  return (
    <div className="flex items-center overflow-visible">
      {str.split('').map((char, i) => {
        if (isNaN(Number(char))) {
          return (
            <div
              key={i}
              className="mx-0 text-2xl font-semibold leading-none flex items-center"
            >
              {char}
            </div>
          );
        }

        return (
          <div
            key={i}
            className="relative overflow-hidden"
            style={{ height: digitHeight, width: digitWidth }}
          >
            <motion.div
              animate={{ y: -Number(char) * digitHeight }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="absolute top-0 left-0"
            >
              {Array.from({ length: 10 }).map((_, n) => (
                <div
                  key={n}
                  style={{ height: digitHeight }}
                  className="flex items-center justify-center text-3xl font-semibold leading-none"
                >
                  {n}
                </div>
              ))}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

type Row = {
  id: number;
  source: string;
  type: 'self' | 'doctor';
  referrals: string;
  production: string;
};

type MonthBucket = {
  id: number;
  month: string; // YYYY-MM
  rows: Row[];
};

export default function ReferralDashboard() {
  /* ---------------- Month-level State ---------------- */
  const [months, setMonths] = useState<MonthBucket[]>([
    {
      id: Date.now(),
      month: '2026-01',
      rows: [
        { id: 1, source: 'Yelp', type: 'self', referrals: '1', production: '51299' },
        { id: 2, source: 'Youtube', type: 'self', referrals: '1', production: '21291' },
      ],
    },
  ]);
  const [activeMonthId, setActiveMonthId] = useState<number>(() => months[0]?.id ?? Date.now());

  /* month picker modal */
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerStep, setPickerStep] = useState<'month' | 'year'>('month');
  const [tempMonth, setTempMonth] = useState<string | null>(null);

  /* confirmations */
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<number | null>(null);
  const [confirmDeleteMonthId, setConfirmDeleteMonthId] = useState<number | null>(null);

  const sortedMonths = useMemo(
    () => [...months].sort((a, b) => a.month.localeCompare(b.month)),
    [months]
  );

  const activeMonth = useMemo(() => {
    const found = months.find(m => m.id === activeMonthId);
    return found ?? sortedMonths[0];
  }, [months, activeMonthId, sortedMonths]);

  const rows = activeMonth?.rows ?? [];

  /* keep active id valid if month deleted */
  React.useEffect(() => {
    if (!activeMonth) return;
    if (!months.some(m => m.id === activeMonthId) && sortedMonths[0]) {
      setActiveMonthId(sortedMonths[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.length]);

  /* ---------------- Derived totals ---------------- */
  const totals = useMemo(() => {
    const selfReferrals = rows
      .filter(r => r.type === 'self')
      .reduce((s, r) => s + Number(r.referrals || 0), 0);
    const doctorReferrals = rows
      .filter(r => r.type === 'doctor')
      .reduce((s, r) => s + Number(r.referrals || 0), 0);
    const totalReferrals = selfReferrals + doctorReferrals;
    const productionTotal = rows.reduce((s, r) => s + Number(r.production || 0), 0);
    return { selfReferrals, doctorReferrals, totalReferrals, productionTotal };
  }, [rows]);

  /* ---------------- Month Handlers ---------------- */
  const updateActiveMonth = (patch: Partial<MonthBucket>) => {
    setMonths(prev => prev.map(m => (m.id === activeMonth.id ? { ...m, ...patch } : m)));
  };

  const addMonthBucket = () => {
    // next month from the latest month currently in state
    const latest = sortedMonths[sortedMonths.length - 1]?.month ?? activeMonth.month;
    let candidate = addMonths(latest, 1);

    // ensure unique month (skip forward if already exists)
    const existing = new Set(months.map(m => m.month));
    while (existing.has(candidate)) {
      candidate = addMonths(candidate, 1);
    }

    const newId = Date.now();
    setMonths(prev => [...prev, { id: newId, month: candidate, rows: [] }]);
    setActiveMonthId(newId);
  };

  const requestDeleteMonth = (id: number) => {
    setConfirmDeleteMonthId(id);
    setConfirmDeleteRowId(null);
  };

  const deleteMonth = (id: number) => {
    if (months.length === 1) {
      toast.error('At least one month is required');
      return;
    }

    const next = months.filter(m => m.id !== id);
    setMonths(next);
    setConfirmDeleteMonthId(null);

    // choose nearest sensible active month
    const nextSorted = [...next].sort((a, b) => a.month.localeCompare(b.month));
    setActiveMonthId(nextSorted[0].id);
  };

  /* ---------------- Row Handlers ---------------- */
  const updateMonthRows = (updater: (rows: Row[]) => Row[]) => {
    setMonths(prev =>
      prev.map(m => (m.id === activeMonth.id ? { ...m, rows: updater(m.rows) } : m))
    );
  };

  const addRow = () =>
    updateMonthRows(r => [...r, { id: Date.now(), source: '', type: 'self', referrals: '', production: '' }]);

  const updateRow = (id: number, field: keyof Row, value: string) =>
    updateMonthRows(r => r.map(row => (row.id === id ? { ...row, [field]: value } : row)));

  const increment = (row: Row, field: 'referrals' | 'production', delta: number) =>
    updateRow(row.id, field, String(Math.max(0, Number(row[field] || 0) + delta)));

  const requestDeleteRow = (id: number) => {
    setConfirmDeleteRowId(id);
    setConfirmDeleteMonthId(null);
  };

  const deleteRow = (id: number) => {
    updateMonthRows(r => r.filter(row => row.id !== id));
    setConfirmDeleteRowId(null);
  };

  const handleConfirm = () => {
    for (const r of rows) {
      if (!r.source || !r.referrals || !r.production) {
        toast.error('All fields are required before confirming');
        return;
      }
    }
    toast.success('Referral data validated successfully');
  };

  const openMonthPicker = () => {
    setShowMonthPicker(true);
    setPickerStep('month');
    setTempMonth(activeMonth.month.split('-')[1]);
  };

  const commitMonthChange = (ym: string) => {
    updateActiveMonth({ month: ym });
    setShowMonthPicker(false);
    setPickerStep('month');
    setTempMonth(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center font-sans">
      <div className="max-w-6xl w-full bg-white rounded-2xl border shadow-sm p-8">

        {/* Month Tabs (auto-sorted) */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {sortedMonths.map(m => {
            const isActive = m.id === activeMonth.id;
            return (
              <div key={m.id} className="relative">
                <motion.button
                  onClick={() => setActiveMonthId(m.id)}
                  className="px-4 py-2 rounded-full text-xs border pr-9"
                  style={{
                    backgroundColor: isActive ? ALORO_ORANGE : 'transparent',
                    color: isActive ? 'white' : undefined,
                  }}
                >
                  {new Date(m.month + '-01').toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}
                </motion.button>

                {/* delete icon per tab */}
                {sortedMonths.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      requestDeleteMonth(m.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.04)',
                      color: isActive ? 'white' : '#ef4444',
                    }}
                    title="Delete month"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                {/* confirm tooltip (month) */}
                <AnimatePresence>
                  {confirmDeleteMonthId === m.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      className="absolute left-1/2 -translate-x-1/2 top-12 bg-white border rounded-xl shadow-lg p-3 z-20 w-56"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="text-xs mb-2 text-gray-700">Delete this month?</div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => deleteMonth(m.id)}
                          className="text-xs px-3 py-1 rounded-lg text-white"
                          style={{ backgroundColor: ALORO_ORANGE_DARK }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteMonthId(null)}
                          className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Add month = next month after latest */}
          <button
            onClick={addMonthBucket}
            className="p-2 rounded-full border text-xs"
            title="Add month"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-6 mb-12 items-stretch">
          {/* Month card clickable */}
          <motion.div
            layout
            className="rounded-2xl border p-6 flex flex-col justify-center cursor-pointer"
            onClick={openMonthPicker}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase mb-3">
              <Calendar size={14} className="text-gray-400" /> Month
            </div>
            <div className="text-center text-xl font-semibold">
              {new Date(activeMonth.month + '-01').toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </motion.div>

          {[
            { label: 'Self Referrals', value: totals.selfReferrals, icon: User, tint: '#C9765E22' },
            { label: 'Doctor Referrals', value: totals.doctorReferrals, icon: Stethoscope, tint: '#C9765E11' },
            { label: 'Total Referrals', value: totals.totalReferrals, icon: User, tint: '#C9765E18' },
            { label: 'Production', value: totals.productionTotal.toLocaleString(), icon: DollarSign, tint: '#34D39922' },
          ].map((c, i) => (
            <motion.div
              key={i}
              layout
              className="rounded-2xl p-6 border flex flex-col justify-center"
              style={{ background: `linear-gradient(135deg, ${c.tint}, #ffffff)` }}
            >
              <div className="text-[11px] text-gray-400 uppercase text-center mb-2">{c.label}</div>
              <div className="flex items-center justify-center gap-3 scale-90">
                <c.icon size={22} className="text-gray-400" />
                <Odometer value={c.value} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Month-Year Selector Modal */}
        <AnimatePresence>
          {showMonthPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
              onClick={() => setShowMonthPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-96 shadow-xl relative"
              >
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="absolute right-3 top-3 p-1 rounded-lg hover:bg-gray-50"
                  aria-label="Close"
                >
                  <X size={16} className="text-gray-400" />
                </button>

                {pickerStep === 'month' && (
                  <>
                    <div className="text-sm font-semibold text-gray-500 mb-4 text-center">Select Month</div>
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = String(i + 1).padStart(2, '0');
                        const label = new Date(`2024-${m}-01`).toLocaleString(undefined, { month: 'short' });
                        const isSelected = m === tempMonth;
                        return (
                          <motion.button
                            key={m}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setTempMonth(m);
                              setPickerStep('year');
                            }}
                            className="rounded-xl py-2 text-sm border"
                            style={{
                              backgroundColor: isSelected ? 'rgba(201,118,94,0.12)' : undefined,
                            }}
                          >
                            {label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}

                {pickerStep === 'year' && (
                  <>
                    <div className="text-sm font-semibold text-gray-500 mb-2 text-center">Select Year</div>
                    <div className="text-xs text-gray-400 text-center mb-4">for {new Date(`2024-${tempMonth}-01`).toLocaleString(undefined, { month: 'long' })}</div>
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const y = new Date().getFullYear() - i;
                        const candidate = `${y}-${tempMonth}`;
                        const isActive = candidate === activeMonth.month;
                        return (
                          <motion.button
                            key={y}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => commitMonthChange(candidate)}
                            className="rounded-xl py-2 text-sm border"
                            style={{
                              backgroundColor: isActive ? ALORO_ORANGE : undefined,
                              color: isActive ? 'white' : undefined,
                            }}
                          >
                            {y}
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex justify-center mt-5">
                      <button
                        onClick={() => setPickerStep('month')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Back to months
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Header */}
        <div className="grid grid-cols-13 gap-4 mb-3 px-2 text-[11px] font-bold text-gray-400 uppercase">
          <div className="col-span-3">Source</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Referral Count</div>
          <div className="col-span-4">Production</div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        <AnimatePresence>
          {rows.map(row => (
            <motion.div
              key={row.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-13 gap-4 mb-4 items-center px-2"
            >
              <div className="col-span-3 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={row.source}
                  onChange={e => updateRow(row.id, 'source', e.target.value)}
                  className="pl-9 w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div className="col-span-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateRow(row.id, 'type', row.type === 'self' ? 'doctor' : 'self')}
                  className="w-full border rounded-xl px-3 py-3 flex items-center justify-between capitalize"
                  style={{ backgroundColor: row.type === 'self' ? '#C9765E11' : '#C9765E22' }}
                >
                  <span>{row.type}</span>
                  <RefreshCw size={14} className="text-gray-400" />
                </motion.button>
              </div>

              <div
                className="col-span-3 relative"
                style={{
                  backgroundColor: row.type === 'self' ? '#C9765E11' : '#C9765E22',
                  borderRadius: '0.75rem',
                }}
              >
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={row.referrals}
                  onChange={e => updateRow(row.id, 'referrals', sanitizeNumber(e.target.value))}
                  className="pl-9 pr-12 w-full border rounded-xl px-4 py-3 bg-transparent"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                  <button
                    onClick={() => increment(row, 'referrals', 1)}
                    className="p-0.5 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => increment(row, 'referrals', -1)}
                    className="p-0.5 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>

              <div
                className="col-span-4 relative"
                style={{
                  backgroundColor: row.type === 'self' ? '#C9765E11' : '#C9765E22',
                  borderRadius: '0.75rem',
                }}
              >
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={formatMoney(row.production)}
                  onChange={e => updateRow(row.id, 'production', sanitizeNumber(e.target.value))}
                  className="pl-9 pr-12 w-full border rounded-xl px-4 py-3 bg-transparent"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                  <button
                    onClick={() => increment(row, 'production', 1)}
                    className="p-0.5 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => increment(row, 'production', -1)}
                    className="p-0.5 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>

              <div className="col-span-1 flex justify-end relative">
                <button
                  onClick={() => requestDeleteRow(row.id)}
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: ALORO_ORANGE_DARK, color: 'white' }}
                >
                  <Trash2 size={18} />
                </button>

                <AnimatePresence>
                  {confirmDeleteRowId === row.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      className="absolute right-10 top-1/2 -translate-y-1/2 bg-white border rounded-xl shadow-lg p-3 z-10"
                    >
                      <div className="text-xs mb-2">Delete source?</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="text-xs px-3 py-1 rounded-lg text-white"
                          style={{ backgroundColor: ALORO_ORANGE_DARK }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteRowId(null)}
                          className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Source */}
        <div className="flex justify-end mt-2">
          <button
            onClick={addRow}
            className="flex items-center space-x-2 border rounded-full px-5 py-2 text-xs text-[#C9765E]"
          >
            <Plus size={16} /> <span>Add Source</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 mt-12">
          <button className="px-10 py-3 border rounded-full text-gray-500 text-xs">Close</button>
          <button
            onClick={handleConfirm}
            className="flex items-center space-x-2 px-8 py-3 rounded-full text-xs text-white"
            style={{ backgroundColor: ALORO_ORANGE }}
          >
            <Save size={18} /> <span>Confirm and Get Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
}
