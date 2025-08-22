import React from "react";
import { VitalSignsCard } from "../components/dashboard/VitalSignsCard";
import { AIInsightsCard } from "../components/dashboard/AIInsightsCard";
import { KPIPillars } from "../components/dashboard/KPIPillars";
import { PatientGrowthChart } from "../components/dashboard/PatientGrowthChart";
import { NextBestAction } from "../components/dashboard/NextBestAction";

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, Dave</h1>
          <p className="text-gray-600">Your digital health at a glance</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium text-gray-900">2 minutes ago</p>
        </div>
      </div>

      {/* Vital Signs Score */}
      <VitalSignsCard />

      {/* Practice Growth Trends */}
      <PatientGrowthChart />

      {/* AI Insights and Next Best Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsightsCard />
        <NextBestAction />
      </div>

      {/* 4 Key Pillars */}
      <KPIPillars />
    </div>
  );
};
