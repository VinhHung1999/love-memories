import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Camera, Utensils, Sparkles, ChefHat, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const actions = [
  { to: '/photobooth', icon: Sparkles, label: 'Photo Booth', bg: 'bg-gradient-to-r from-primary to-secondary' },
  { to: '/what-to-eat', icon: UtensilsCrossed, label: 'What to Eat', bg: 'bg-gradient-to-r from-secondary to-accent' },
  { to: '/foodspots?new=1', icon: Utensils, label: 'Food Spot', bg: 'bg-secondary' },
  { to: '/recipes?new=1', icon: ChefHat, label: 'Recipe', bg: 'bg-accent' },
  { to: '/moments?new=1', icon: Camera, label: 'Moment', bg: 'bg-primary' },
];

export default function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop — closes menu on tap outside */}
      {open && (
        <div
          className="fixed inset-0 z-[54]"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className="fixed right-4 md:right-8 z-[55] flex flex-col items-end gap-3"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence>
          {open && actions.map((action, i) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.85 }}
              transition={{ duration: 0.18, delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                {action.label}
              </span>
              <Link
                to={action.to}
                onClick={() => setOpen(false)}
                className={`w-11 h-11 rounded-full ${action.bg} text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform`}
              >
                <action.icon className="w-5 h-5" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main FAB button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className="w-6 h-6" />
          </motion.div>
        </button>
      </div>
    </>
  );
}
