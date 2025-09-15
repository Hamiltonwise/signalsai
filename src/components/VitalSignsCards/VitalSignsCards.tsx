import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Activity, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Awareness } from "./Awareness";
import { Research } from "./Research";
import { Consideration } from "./Consideration";
import { Decision } from "./Decision";

interface VitalSignsCardsProps {
  className?: string;
  selectedDomain: string;
}

const cards = [
  {
    id: "awareness",
    title: "Awareness",
    component: Awareness,
    description: "Search Performance & Visibility",
  },
  {
    id: "research",
    title: "Research",
    component: Research,
    description: "Website Analytics & Engagement",
  },
  {
    id: "consideration",
    title: "Consideration",
    component: Consideration,
    description: "Reviews & Reputation Management",
  },
  {
    id: "decision",
    title: "Decision",
    component: Decision,
    description: "User Experience & Conversion",
  },
];

export const VitalSignsCards: React.FC<VitalSignsCardsProps> = ({
  className = "",
  selectedDomain,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToCard = (index: number) => {
    const newDirection = index > activeIndex ? 1 : -1;
    setDirection(newDirection);
    setActiveIndex(index);
  };

  const paginate = (newDirection: number) => {
    const newIndex =
      newDirection > 0
        ? (activeIndex + 1) % cards.length
        : (activeIndex - 1 + cards.length) % cards.length;

    setDirection(newDirection);
    setActiveIndex(newIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        paginate(-1);
      } else if (event.key === "ArrowRight") {
        paginate(1);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [activeIndex]);

  const ActiveComponent = cards[activeIndex].component;

  // Animation variants for framer-motion
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div
      className={`bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm ${className}`}
    >
      {/* Header Section */}
      <div className="p-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Patient Journey Insights
              </h2>
              <p className="text-gray-600 flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span>
                  AI-powered practice analytics • {cards.length} stages
                </span>
              </p>
            </div>
          </div>

          {/* Card Navigation Indicators */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50 shadow-sm">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => goToCard(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === activeIndex
                      ? "bg-blue-500 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to ${card.title} stage`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{activeIndex + 1}</span> of{" "}
              {cards.length}
            </div>
          </div>
        </div>

        {/* Active Card Title and Description */}
        <div className="text-center mb-6">
          <motion.h3
            key={`title-${activeIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-semibold text-gray-800 mb-1"
          >
            {cards[activeIndex].title}
          </motion.h3>
          <motion.p
            key={`desc-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            {cards[activeIndex].description}
          </motion.p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="px-8 pb-8">
        <div className="relative overflow-hidden">
          {/* Navigation Buttons */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200/50 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110 group"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
          </button>

          <button
            onClick={() => paginate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200/50 flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110 group"
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
          </button>

          {/* Animated Card Container */}
          <div className="relative min-h-[600px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <ActiveComponent
                  className="w-full h-full"
                  selectedDomain={selectedDomain}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${((activeIndex + 1) / cards.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Card Navigation Pills */}
          <div className="flex justify-center mt-6 space-x-4">
            {cards.map((card, index) => (
              <motion.button
                key={card.id}
                onClick={() => goToCard(index)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  index === activeIndex
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white text-gray-600 border border-gray-300 hover:border-blue-300 hover:text-blue-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {card.title}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard Navigation Hint */}
      <div className="px-8 pb-4">
        <p className="text-xs text-center text-gray-500">
          Use arrow keys or click navigation buttons to explore different stages
        </p>
      </div>
    </div>
  );
};
