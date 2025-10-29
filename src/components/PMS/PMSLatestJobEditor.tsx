import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Plus, Save, Trash2, X } from "lucide-react";

import { updatePmsJobResponse } from "../../api/pms";

interface SourceEntryForm {
  name: string;
  referrals: number;
  production: number;
}

interface MonthEntryForm {
  month: string;
  self_referrals: number;
  doctor_referrals: number;
  total_referrals: number;
  production_total: number;
  sources: SourceEntryForm[];
}

interface PMSLatestJobEditorProps {
  isOpen: boolean;
  jobId: number;
  initialData: unknown;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  const parsed = Number((value ?? 0) as any);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normaliseMonthEntries = (raw: unknown): MonthEntryForm[] => {
  let dataArray: unknown = raw;

  // Handle new canonical structure with monthly_rollup
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const container = raw as Record<string, unknown>;

    // Check for monthly_rollup (canonical format)
    if (Array.isArray(container.monthly_rollup)) {
      dataArray = container.monthly_rollup;
    }
    // Fallback to report_data (legacy format)
    else if (Array.isArray(container.report_data)) {
      dataArray = container.report_data;
    }
  }

  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray.map((entry) => {
    const monthEntry = typeof entry === "object" && entry !== null ? entry : {};
    const sourcesRaw = Array.isArray((monthEntry as any).sources)
      ? ((monthEntry as any).sources as unknown[])
      : [];

    const sources: SourceEntryForm[] = sourcesRaw.map((source) => {
      const src = typeof source === "object" && source !== null ? source : {};
      return {
        name: String((src as any).name ?? ""),
        referrals: toNumber((src as any).referrals),
        production: toNumber((src as any).production),
      };
    });

    return {
      month: String((monthEntry as any).month ?? ""),
      self_referrals: toNumber((monthEntry as any).self_referrals),
      doctor_referrals: toNumber((monthEntry as any).doctor_referrals),
      total_referrals: toNumber((monthEntry as any).total_referrals),
      production_total: toNumber((monthEntry as any).production_total),
      sources,
    };
  });
};

export const PMSLatestJobEditor: React.FC<PMSLatestJobEditorProps> = ({
  isOpen,
  jobId,
  initialData,
  onClose,
  onSaved,
}) => {
  const initialFormState = useMemo(
    () => normaliseMonthEntries(initialData),
    [initialData]
  );

  const [formData, setFormData] = useState<MonthEntryForm[]>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(normaliseMonthEntries(initialData));
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleMonthFieldChange = (
    index: number,
    field: keyof Omit<MonthEntryForm, "sources">,
    value: string
  ) => {
    setFormData((prev) => {
      const next = [...prev];
      const month = { ...next[index] };
      if (field === "month") {
        month.month = value;
      } else {
        month[field] = toNumber(value);
      }
      next[index] = month;
      return next;
    });
  };

  const handleSourceFieldChange = (
    monthIndex: number,
    sourceIndex: number,
    field: keyof SourceEntryForm,
    value: string
  ) => {
    setFormData((prev) => {
      const next = [...prev];
      const month = { ...next[monthIndex] };
      const sources = [...month.sources];
      const source = { ...sources[sourceIndex] };
      if (field === "name") {
        source.name = value;
      } else {
        source[field] = toNumber(value);
      }
      sources[sourceIndex] = source;
      month.sources = sources;
      next[monthIndex] = month;
      return next;
    });
  };

  const handleAddSource = (monthIndex: number) => {
    setFormData((prev) => {
      const next = [...prev];
      const month = { ...next[monthIndex] };
      const sources = [...month.sources];
      sources.push({ name: "", referrals: 0, production: 0 });
      month.sources = sources;
      next[monthIndex] = month;
      return next;
    });
  };

  const handleRemoveSource = (monthIndex: number, sourceIndex: number) => {
    setFormData((prev) => {
      const next = [...prev];
      const month = { ...next[monthIndex] };
      const sources = [...month.sources];
      sources.splice(sourceIndex, 1);
      month.sources = sources;
      next[monthIndex] = month;
      return next;
    });
  };

  const handleSave = async () => {
    if (!jobId) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = JSON.stringify(formData, null, 2);
      const response = await updatePmsJobResponse(jobId, payload);

      if (!response?.success) {
        throw new Error(
          response?.error || response?.message || "Failed to update PMS data"
        );
      }

      await onSaved();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while saving.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Review Latest PMS Data
                </h2>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Job #{jobId}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {formData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  No PMS records were found in the latest job.
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.map((monthEntry, monthIndex) => (
                    <div
                      key={`${monthEntry.month}-${monthIndex}`}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Month
                          </label>
                          <input
                            value={monthEntry.month}
                            onChange={(event) =>
                              handleMonthFieldChange(
                                monthIndex,
                                "month",
                                event.target.value
                              )
                            }
                            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {(
                            [
                              ["Self referrals", "self_referrals"],
                              ["Doctor referrals", "doctor_referrals"],
                              ["Total referrals", "total_referrals"],
                              ["Production total", "production_total"],
                            ] as const
                          ).map(([label, field]) => (
                            <div key={field} className="flex flex-col">
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {label}
                              </label>
                              <input
                                type="number"
                                value={monthEntry[field]}
                                onChange={(event) =>
                                  handleMonthFieldChange(
                                    monthIndex,
                                    field,
                                    event.target.value
                                  )
                                }
                                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2 text-left">Source</th>
                              <th className="px-3 py-2 text-left">Referrals</th>
                              <th className="px-3 py-2 text-left">
                                Production
                              </th>
                              <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {monthEntry.sources.map((source, sourceIndex) => (
                              <tr key={`${source.name}-${sourceIndex}`}>
                                <td className="px-3 py-2">
                                  <input
                                    value={source.name}
                                    onChange={(event) =>
                                      handleSourceFieldChange(
                                        monthIndex,
                                        sourceIndex,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={source.referrals}
                                    onChange={(event) =>
                                      handleSourceFieldChange(
                                        monthIndex,
                                        sourceIndex,
                                        "referrals",
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={source.production}
                                    onChange={(event) =>
                                      handleSourceFieldChange(
                                        monthIndex,
                                        sourceIndex,
                                        "production",
                                        event.target.value
                                      )
                                    }
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSource(
                                        monthIndex,
                                        sourceIndex
                                      )
                                    }
                                    className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 p-2 text-red-600 transition hover:border-red-200 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleAddSource(monthIndex)}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add source
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <div className="text-xs text-gray-500">
                {error && (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !jobId}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-xs font-semibold uppercase text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
