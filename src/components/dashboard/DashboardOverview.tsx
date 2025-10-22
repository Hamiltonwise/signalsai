import {
  ArrowUpRight,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-normal text-gray-900">Hi Dr. Smith 👋</h1>
        <p className="text-base text-gray-600">
          Your practice runs itself. Focus on patients.
        </p>
      </div>

      {/* Top Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fresh Insight Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                18% more new patients booked after recall push
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              The practice saw an 18% increase in new patient bookings compared
              to the prior 30-day period, driven by a targeted doctor-led recall
              campaign completed recently. This is confirmed by PMS booking data
              corroborated with Alloro task logs.
            </p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-blue-700 font-medium">
                Updated 2 hours ago
              </span>
              <span className="text-xs text-blue-600">
                Source: GBP, GA4, GSC
              </span>
            </div>
          </div>
        </div>

        {/* PMS Upload Data Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Latest Practice Data
                <span className="ml-2 text-sm font-normal text-pink-600">
                  PMS UPLOAD DATA
                </span>
              </h3>
              <p className="text-sm text-gray-600">
                Monthly summary from your practice management system
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">
                Monthly Summary - January 15, 2025
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-gray-900">
                      1,547
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      +8%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Total Patients</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-gray-900">
                      89
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      +12%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">New Patients</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-gray-900">
                      $157K
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      +15%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Revenue</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-gray-900">
                      234
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      +6%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Appointments</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-purple-600">
                Next upload scheduled for February 15, 2025
              </span>
              <button className="text-xs text-purple-700 font-medium hover:underline flex items-center gap-1">
                Upload new data
              </button>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium py-2.5 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
              Open Full Summary Report
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Journey Health Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Patient Journey Health
          </h2>
          <span className="text-sm text-green-600 font-medium">
            All sections trending positively
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Awareness */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">+8%</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Growing
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Awareness
            </h3>
            <p className="text-xs text-gray-600">How patients discover you</p>
          </div>

          {/* Research */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">-3%</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Declining
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Research
            </h3>
            <p className="text-xs text-gray-600">
              Website engagement & content
            </p>
          </div>

          {/* Consideration */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">+15%</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Growing
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Consideration
            </h3>
            <p className="text-xs text-gray-600">Reviews & local reputation</p>
          </div>

          {/* Decision */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">-8%</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Declining
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Decision
            </h3>
            <p className="text-xs text-gray-600">Booking & conversion</p>
          </div>

          {/* Loyalty */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">+5%</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded">
                Growing
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Loyalty
            </h3>
            <p className="text-xs text-gray-600">Retention & referrals</p>
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Monthly Summary — January 2025
            </h2>
            <p className="text-sm text-gray-600">
              15-second snapshot of key changes
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Generated on</p>
            <p className="text-sm font-medium text-purple-600">
              January 15, 2025
            </p>
          </div>
        </div>

        {/* Wins Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Wins:</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">12% more new patients</span>{" "}
                after improving Google rating to 4.9 stars ✅
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">
                  Social media referrals up 22%
                </span>{" "}
                thanks to consistent posting schedule ✅
              </p>
            </div>
          </div>
        </div>

        {/* Risks Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-sm">!</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Risks:</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Friend referrals dipped 3%; recommend implementing referral
                incentive program
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-sm">→</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Next Steps:
            </h3>
          </div>
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Implement friend incentive program
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Keep up your social media, New Patient referrals from social
                media your consistency is paying off
              </p>
            </div>
          </div>
        </div>

        {/* Attribution Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              <span className="font-medium">Attribution:</span>
              <span className="ml-2">Mixed — Doctor + HW Team</span>
            </div>
            <div>
              <span className="font-medium">Citations:</span>
              <span className="ml-2">
                PMS, Google Business Profile, HW logs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
