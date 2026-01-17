import React from "react";
import { Check, HelpCircle, Info, Loader2 } from "lucide-react";
import type { AutomationStatusDetail, StepKey } from "../../api/pms";

/**
 * Client-facing step configuration
 * Maps backend steps to user-friendly labels
 */
interface ClientStep {
  id: string;
  label: string;
  description: string;
  backendSteps: StepKey[]; // Which backend steps this client step represents
}

const CLIENT_STEPS: ClientStep[] = [
  {
    id: "data_entry",
    label: "Enter your PMS Data",
    description: "Upload your PMS export file or enter data manually",
    backendSteps: ["file_upload"],
  },
  {
    id: "parsing",
    label: "Data Parsing",
    description: "Alloro is extracting and organizing your referral data",
    backendSteps: ["pms_parser"],
  },
  {
    id: "validation",
    label: "Validating your data",
    description: "Alloro is reviewing the parsed data for accuracy",
    backendSteps: ["admin_approval"],
  },
  {
    id: "confirmation",
    label: "Your confirmation",
    description: "Review and confirm your referral data before analysis",
    backendSteps: ["client_approval"],
  },
  {
    id: "agents",
    label: "Alloro Insights",
    description: "Alloro is analyzing your data to generate actionable insights",
    backendSteps: ["monthly_agents", "task_creation", "complete"],
  },
];

type StepState = "completed" | "current" | "pending";

function getStepState(
  clientStep: ClientStep,
  automationStatus: AutomationStatusDetail | null
): StepState {
  if (!automationStatus) {
    // No status yet - first step is current
    return clientStep.id === "data_entry" ? "current" : "pending";
  }

  const { currentStep, steps, status } = automationStatus;

  // Check if all backend steps for this client step are completed
  const allCompleted = clientStep.backendSteps.every((backendStep) => {
    const stepDetail = steps[backendStep];
    return (
      stepDetail?.status === "completed" || stepDetail?.status === "skipped"
    );
  });

  if (allCompleted) {
    return "completed";
  }

  // Check if any backend step is current (processing or awaiting approval)
  const isCurrent = clientStep.backendSteps.some((backendStep) => {
    // Check if this is the current step
    if (currentStep === backendStep) return true;

    // Check step status
    const stepDetail = steps[backendStep];
    return stepDetail?.status === "processing";
  });

  // Special case: awaiting_approval status
  if (status === "awaiting_approval") {
    if (currentStep === "admin_approval" && clientStep.id === "validation") {
      return "current";
    }
    if (currentStep === "client_approval" && clientStep.id === "confirmation") {
      return "current";
    }
  }

  if (isCurrent) {
    return "current";
  }

  return "pending";
}

/**
 * Check if any steps were skipped (indicates manual entry)
 */
function hasSkippedSteps(
  automationStatus: AutomationStatusDetail | null
): boolean {
  if (!automationStatus) return false;

  const { steps } = automationStatus;

  // Check if pms_parser, admin_approval, or client_approval were skipped
  return (
    steps.pms_parser?.status === "skipped" ||
    steps.admin_approval?.status === "skipped" ||
    steps.client_approval?.status === "skipped"
  );
}

interface ClientProgressTimelineProps {
  automationStatus: AutomationStatusDetail | null;
  className?: string;
  /** When true, all steps show as pending (not started state) */
  showNotStarted?: boolean;
  /** Callback when the "Your confirmation" step is clicked (only active when that step is current) */
  onConfirmationClick?: () => void;
}

export const ClientProgressTimeline: React.FC<ClientProgressTimelineProps> = ({
  automationStatus,
  className = "",
  showNotStarted = false,
  onConfirmationClick,
}) => {
  const isManualEntry = hasSkippedSteps(automationStatus);

  // For "not started" state, treat automationStatus as null to show all pending
  const effectiveStatus = showNotStarted ? null : automationStatus;

  // For "not started" state, all steps should be pending (greyed out)
  const getEffectiveState = (step: ClientStep): StepState => {
    if (showNotStarted) {
      return "pending";
    }
    return getStepState(step, automationStatus);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Horizontal Timeline */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200">
            <div
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{
                width: `${calculateProgressWidth(effectiveStatus)}%`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {CLIENT_STEPS.map((step) => {
              const state = getEffectiveState(step);
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / CLIENT_STEPS.length}%` }}
                >
                  {/* Step Circle */}
                  <div
                    className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${
                        state === "completed"
                          ? "bg-green-500 text-white"
                          : state === "current"
                          ? "bg-white border-2 border-alloro-orange"
                          : "bg-white border-2 border-slate-200"
                      }
                    `}
                  >
                    {state === "completed" ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : state === "current" ? (
                      <div className="relative">
                        <Loader2 className="w-4 h-4 text-alloro-orange animate-spin" />
                        {/* Pulse ring */}
                        <div className="absolute -inset-1 rounded-full bg-alloro-orange/20 animate-ping" />
                      </div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Step Label with Help Icon */}
                  <div className="mt-3 text-center px-1">
                    <div className="flex items-center justify-center gap-1 group relative">
                      <HelpCircle
                        className={`w-3 h-3 flex-shrink-0 ${
                          state === "completed"
                            ? "text-green-500"
                            : state === "current"
                            ? "text-alloro-orange"
                            : "text-slate-300"
                        }`}
                      />
                      {/* Make confirmation step clickable when current */}
                      {step.id === "confirmation" &&
                      state === "current" &&
                      onConfirmationClick ? (
                        <button
                          onClick={onConfirmationClick}
                          className="text-[10px] font-bold uppercase tracking-wider leading-tight text-alloro-orange underline underline-offset-2 hover:text-alloro-orange/80 transition-colors cursor-pointer"
                        >
                          {step.label}
                        </button>
                      ) : (
                        <span
                          className={`
                            text-[10px] font-bold uppercase tracking-wider leading-tight
                            ${
                              state === "completed"
                                ? "text-green-600"
                                : state === "current"
                                ? "text-alloro-navy"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {step.label}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {step.description}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="sm:hidden">
        <div className="relative pl-8">
          {/* Vertical Progress Line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200">
            <div
              className="w-full bg-green-500 transition-all duration-500 ease-out"
              style={{
                height: `${calculateProgressWidth(effectiveStatus)}%`,
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {CLIENT_STEPS.map((step) => {
              const state = getEffectiveState(step);
              return (
                <div key={step.id} className="relative flex items-center">
                  {/* Step Circle */}
                  <div
                    className={`
                      absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${
                        state === "completed"
                          ? "bg-green-500 text-white"
                          : state === "current"
                          ? "bg-white border-2 border-alloro-orange"
                          : "bg-white border-2 border-slate-200"
                      }
                    `}
                  >
                    {state === "completed" ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : state === "current" ? (
                      <Loader2 className="w-3 h-3 text-alloro-orange animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Step Label with Help Icon */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 group relative">
                      <HelpCircle
                        className={`w-3 h-3 flex-shrink-0 ${
                          state === "completed"
                            ? "text-green-500"
                            : state === "current"
                            ? "text-alloro-orange"
                            : "text-slate-300"
                        }`}
                      />
                      {/* Make confirmation step clickable when current */}
                      {step.id === "confirmation" &&
                      state === "current" &&
                      onConfirmationClick ? (
                        <button
                          onClick={onConfirmationClick}
                          className="text-xs font-bold uppercase tracking-wider text-alloro-orange underline underline-offset-2 hover:text-alloro-orange/80 transition-colors cursor-pointer"
                        >
                          {step.label}
                        </button>
                      ) : (
                        <span
                          className={`
                            text-xs font-bold uppercase tracking-wider
                            ${
                              state === "completed"
                                ? "text-green-600"
                                : state === "current"
                                ? "text-alloro-navy"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {step.label}
                        </span>
                      )}
                      {/* Tooltip */}
                      <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {step.description}
                        <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skipped steps info message for manual entries */}
      {isManualEntry && !showNotStarted && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>
            PMS file parsing, validation and admin confirmation are skipped for
            manual entries
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Calculate progress width as percentage based on completed steps
 * The line should stop at the center of the last completed step (not extend toward current)
 */
function calculateProgressWidth(
  automationStatus: AutomationStatusDetail | null
): number {
  if (!automationStatus) return 0;

  let completedCount = 0;
  for (const step of CLIENT_STEPS) {
    const state = getStepState(step, automationStatus);
    if (state === "completed") {
      completedCount++;
    } else {
      // Stop at the first non-completed step (don't add partial progress)
      break;
    }
  }

  // Calculate percentage (each step is 1/(n-1) of the line, since line goes between circles)
  // Line should end at the center of the last completed step
  const totalSegments = CLIENT_STEPS.length - 1;
  const progress = Math.min(completedCount / totalSegments, 1) * 100;

  return progress;
}

export default ClientProgressTimeline;
