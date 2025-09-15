import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { useMonday } from "../../hooks/useMonday";
import { useAuth } from "../../hooks/useAuth";

interface SubmitTicketProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const SubmitTicket: React.FC<SubmitTicketProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { createTask } = useMonday();
  const { selectedDomain } = useAuth();

  const [content, setContent] = useState("");
  const [type, setType] = useState<"ai" | "custom">("ai");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Disable parent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--scrollbar-width, 0px)";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Animation variants for full-screen slide-left
  const slideVariants = {
    hidden: {
      x: "100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: "100%",
      opacity: 0,
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDomain?.domain || !content.trim()) {
      setSubmitError("Please enter task details");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createTask({
        domain: selectedDomain.domain,
        content: content.trim(),
        type,
      });

      // Reset form
      setContent("");
      setType("ai");

      // Notify parent and close
      onSubmit();
    } catch (error) {
      setSubmitError("Failed to create task. Please try again.");
      console.error("Submit ticket error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent("");
      setType("ai");
      setSubmitError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClose}
          />

          {/* Full-Screen Modal Content */}
          <motion.div
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Submit a Ticket
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedDomain?.displayName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <form
                onSubmit={handleSubmit}
                className="space-y-6 max-w-2xl mx-auto"
              >
                {/* Task Description */}
                <div>
                  <label
                    htmlFor="task-content"
                    className="block text-sm font-medium text-gray-700 mb-3"
                  >
                    Task Description *
                  </label>
                  <textarea
                    id="task-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe what you need help with..."
                    disabled={isSubmitting}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none text-base"
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">
                      Be as specific as possible to help us assist you better
                    </p>
                    <span className="text-sm text-gray-400">
                      {content.length}/1000
                    </span>
                  </div>
                </div>

                {/* Error Display */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </motion.div>
                )}

                {/* Form Actions */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-base font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
