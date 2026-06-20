import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WA_NUMBER = "252656042512";
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamu Alaikum! I'm interested in Al Bayaan AI Academy.")}`;

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm font-medium px-4 py-2 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 whitespace-nowrap"
          >
            Chat on WhatsApp
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-2xl"
        style={{ backgroundColor: "#25D366" }}
      >
        <WhatsAppIcon />
        <span
          className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-white"
          style={{ backgroundColor: "#4ade80" }}
        />
      </motion.a>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="white"
      className="w-7 h-7"
    >
      <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.36.627 4.667 1.813 6.693L2.667 29.333l6.853-1.787A13.267 13.267 0 0 0 16.003 29.333c7.36 0 13.33-5.973 13.33-13.333s-5.97-13.333-13.33-13.333zm0 24c-1.96 0-3.88-.52-5.547-1.493l-.4-.24-4.067 1.067 1.08-3.96-.26-.413A10.64 10.64 0 0 1 5.333 16c0-5.88 4.787-10.667 10.667-10.667S26.667 10.12 26.667 16 21.883 26.667 16.003 26.667zm5.813-7.987c-.32-.16-1.88-.933-2.173-1.04-.293-.107-.507-.16-.72.16-.213.32-.827 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.347-.493-2.56-1.573-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.144-.144.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.987-2.373-.253-.613-.507-.533-.72-.547-.187-.013-.4-.013-.613-.013-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.253 3.44 5.467 4.827.76.333 1.36.533 1.827.68.76.24 1.453.207 2 .127.613-.093 1.88-.773 2.147-1.52.267-.747.267-1.387.187-1.52-.08-.133-.293-.213-.613-.373z" />
    </svg>
  );
}
