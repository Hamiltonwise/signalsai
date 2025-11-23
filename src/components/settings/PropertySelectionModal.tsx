import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2 } from "lucide-react";

interface PropertyItem {
  id: string;
  name: string;
  account?: string; // For GA4
  permissionLevel?: string; // For GSC
  address?: string; // For GBP
  // Helper for GBP
  accountId?: string;
  locationId?: string;
}

interface PropertySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: PropertyItem[];
  onSelect: (item: PropertyItem) => void; // For single select
  onMultiSelect?: (items: PropertyItem[]) => void; // For multi select
  isLoading?: boolean; // Loading available items
  isSaving?: boolean; // Saving selection
  type: "ga4" | "gsc" | "gbp";
  initialSelections?: string[]; // IDs of currently connected properties
  multiSelect?: boolean;
}

export const PropertySelectionModal: React.FC<PropertySelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  onSelect,
  onMultiSelect,
  isLoading,
  isSaving,
  type,
  initialSelections = [],
  multiSelect = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sync initial selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelections);
    }
  }, [isOpen, initialSelections]);

  const handleItemClick = (item: PropertyItem) => {
    if (isSaving) return;

    if (multiSelect) {
      setSelectedIds((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
    } else {
      // Single select - just update state
      setSelectedIds([item.id]);
    }
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    
    if (multiSelect && onMultiSelect) {
      onMultiSelect(selectedItems);
    } else if (!multiSelect && onSelect && selectedItems.length > 0) {
      onSelect(selectedItems[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <p className="text-gray-500">No properties found.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Make sure you have access to the correct Google account.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        disabled={isSaving}
                        className={`w-full text-left p-4 rounded-xl transition-all group flex items-center justify-between border ${
                          isSelected
                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                            : "bg-white border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <div
                            className={`font-medium truncate ${
                              isSelected ? "text-blue-900" : "text-gray-900"
                            }`}
                          >
                            {item.name || item.id}
                          </div>
                          <div
                            className={`text-xs mt-0.5 truncate ${
                              isSelected ? "text-blue-600" : "text-gray-500"
                            }`}
                          >
                            {type === "ga4" && item.account}
                            {type === "gsc" && item.id}
                            {type === "gbp" && item.address}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isSaving && !multiSelect && isSelected ? (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300 group-hover:border-gray-400"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - Always show if items exist */}
            {items.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSaving || selectedIds.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Selection {multiSelect && `(${selectedIds.length})`}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
