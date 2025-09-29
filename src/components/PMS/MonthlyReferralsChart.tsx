import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, TrendingDown } from "lucide-react";

interface MonthlyData {
  month: string;
  selfReferrals: number;
  doctorReferrals: number;
  total?: number;
  totalReferrals?: number;
  productionTotal?: number;
}

interface MonthlyReferralsChartProps {
  data?: MonthlyData[];
  periodLabel?: string;
}

export const MonthlyReferralsChart: React.FC<MonthlyReferralsChartProps> = ({
  data = [
    { month: "Jan", selfReferrals: 30, doctorReferrals: 42, total: 180 },
    { month: "Feb", selfReferrals: 48, doctorReferrals: 66, total: 180 },
    { month: "Mar", selfReferrals: 48, doctorReferrals: 48, total: 180 },
    { month: "Apr", selfReferrals: 48, doctorReferrals: 24, total: 180 },
    { month: "May", selfReferrals: 36, doctorReferrals: 36, total: 180 },
    { month: "Jun", selfReferrals: 10, doctorReferrals: 12, total: 100 },
  ],
  periodLabel = `Practice Management System • ${new Date().getFullYear()}`,
}) => {
  const normalizedData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        total:
          item.total ??
          item.totalReferrals ??
          item.selfReferrals + item.doctorReferrals,
      })),
    [data]
  );

  const totals = normalizedData.reduce(
    (acc, item) => ({
      self: acc.self + item.selfReferrals,
      doctor: acc.doctor + item.doctorReferrals,
      total: acc.total + (item.total ?? 0),
    }),
    { self: 0, doctor: 0, total: 0 }
  );

  const maxValue = normalizedData.length
    ? Math.max(...normalizedData.map((item) => item.total ?? 0), 0)
    : 0;

  const latestTotal =
    normalizedData[normalizedData.length - 1]?.total ?? 0;
  const previousTotal =
    normalizedData[normalizedData.length - 2]?.total ?? 0;

  const changePercent =
    previousTotal > 0
      ? Number((((latestTotal - previousTotal) / previousTotal) * 100).toFixed(1))
      : 0;

  const changeIsPositive = changePercent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Monthly Patient Referrals
            </h3>
            <p className="text-sm text-gray-600">{periodLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(totals.total).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Referral Events</div>
          <div
            className={`flex items-center gap-1 text-sm mt-1 ${
              changeIsPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingDown
              className={`w-4 h-4 ${changeIsPositive ? "rotate-180 transform" : ""}`}
            />
            {changePercent}% vs prev month
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span className="text-sm text-gray-700">
            Self-Referrals ({Math.round(totals.self)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span className="text-sm text-gray-700">
            Doctor Referrals ({Math.round(totals.doctor)})
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {normalizedData.map((item, index) => (
          <motion.div
            key={item.month}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 w-16">
                {item.month}
              </span>
              <div className="flex-1 mx-4 space-y-1">
                {/* Self-referrals bar */}
                <div className="relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        maxValue > 0
                          ? Math.min(
                              ((item.selfReferrals ?? 0) / maxValue) * 100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                    transition={{
                      delay: index * 0.1 + 0.2,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    className="h-6 bg-blue-500 rounded-sm flex items-center justify-center relative overflow-hidden"
                  >
                    <span className="text-xs font-medium text-white z-10">
                      {Math.round(item.selfReferrals)}
                    </span>
                  </motion.div>
                </div>
                {/* Doctor referrals bar */}
                <div className="relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        maxValue > 0
                          ? Math.min(
                              ((item.doctorReferrals ?? 0) / maxValue) * 100,
                              100
                            )
                          : 0
                      }%`,
                    }}
                    transition={{
                      delay: index * 0.1 + 0.4,
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    className="h-6 bg-green-500 rounded-sm flex items-center justify-center relative overflow-hidden"
                  >
                    <span className="text-xs font-medium text-white z-10">
                      {Math.round(item.doctorReferrals)}
                    </span>
                  </motion.div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600 w-24">
                <div>Self: {Math.round(item.selfReferrals)}</div>
                <div>Dr: {Math.round(item.doctorReferrals)}</div>
                <div className="font-medium">
                  Total: {Math.round(item.total ?? 0)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
