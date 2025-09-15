import React, { useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useMonday } from "../../hooks/useMonday";
import { useAuth } from "../../hooks/useAuth";

interface AddCommentProps {
  taskId: string;
}

export const AddComment: React.FC<AddCommentProps> = ({ taskId }) => {
  const { addTaskComment, commentsError } = useMonday();
  const { selectedDomain } = useAuth();

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      setSubmitError("Please enter a comment");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!selectedDomain?.domain) {
        setSubmitError("No domain selected. Please select a domain.");
        return;
      }

      await addTaskComment({
        taskId,
        comment: comment.trim(),
        domain: selectedDomain.domain,
      });

      // Clear the comment input on success
      setComment("");
    } catch (error) {
      setSubmitError("Failed to add comment. Please try again.");
      console.error("Add comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Comment Input */}
        <div>
          <label
            htmlFor="new-comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Add Comment
          </label>
          <div className="relative">
            <textarea
              id="new-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your comment here..."
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none pr-12"
              maxLength={1000}
            />

            {/* Character Count */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {comment.length}/1000
            </div>
          </div>

          {/* Helper Text */}
          <p className="mt-1 text-xs text-gray-500">
            Press Cmd+Enter to send quickly
          </p>
        </div>

        {/* Error Display */}
        {(submitError || commentsError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">
              {submitError || commentsError}
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Comment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
