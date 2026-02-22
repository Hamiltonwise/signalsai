import { useState, useEffect } from "react";
import { ChevronDown, MapPin, Phone, Star, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminLocation } from "../../api/admin-organizations";

interface OrgLocationSelectorProps {
  locations: AdminLocation[];
  selectedLocation: AdminLocation | null;
  onSelect: (location: AdminLocation) => void;
}

export function OrgLocationSelector({
  locations,
  selectedLocation,
  onSelect,
}: OrgLocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (locations.length === 1 && !selectedLocation) {
      onSelect(locations[0]);
    }
  }, [locations, selectedLocation, onSelect]);

  if (locations.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">No locations found for this organization</p>
      </div>
    );
  }

  const getMetadata = (location: AdminLocation) => {
    const prop = location.googleProperties?.[0];
    const meta = prop?.metadata as Record<string, any> || {};
    return {
      address: meta.address || "—",
      phone: meta.phone || "—",
      rating: meta.rating ? Number(meta.rating).toFixed(1) : "—",
      placeId: meta.placeId || "—",
      locationId: prop?.external_id || "—",
    };
  };

  const metadata = selectedLocation ? getMetadata(selectedLocation) : null;

  return (
    <div className="space-y-4">
      {/* Location Selector (only show if multi-location) */}
      {locations.length > 1 && (
        <div className="relative">
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-alloro-orange/30 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="h-5 w-5 text-alloro-orange shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {selectedLocation?.name || "Select location"}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 z-10 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
              >
                <div className="max-h-48 overflow-y-auto">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => {
                        onSelect(location);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-alloro-orange/5 transition-colors ${
                        selectedLocation?.id === location.id
                          ? "bg-alloro-orange/10 border-l-2 border-l-alloro-orange"
                          : ""
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {location.name}
                      </div>
                      {location.is_primary && (
                        <div className="text-xs text-alloro-orange font-medium">
                          Primary Location
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Location Metadata Card */}
      {selectedLocation && metadata && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {selectedLocation.name}
              </h3>
              {selectedLocation.is_primary && (
                <p className="text-xs text-alloro-orange font-medium mt-1">
                  Primary Location
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            {/* Address */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Address
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {metadata.address}
              </p>
            </div>

            {/* Phone */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Phone
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {metadata.phone}
              </p>
            </div>

            {/* Rating */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 flex items-center gap-1.5">
                <Star className="h-3 w-3" /> Rating
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {metadata.rating}
              </p>
            </div>

            {/* Location ID */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Location ID
              </p>
              <p className="text-sm text-gray-900 font-mono font-medium">
                {metadata.locationId}
              </p>
            </div>

            {/* Google Place ID */}
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1 flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" /> Google Place ID
              </p>
              <p className="text-sm text-gray-900 font-mono font-medium break-all">
                {metadata.placeId}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
