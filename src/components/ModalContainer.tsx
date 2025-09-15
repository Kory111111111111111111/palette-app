'use client';

import { useModalQueue } from '@/contexts/ModalQueueContext';
import { AnimatePresence, motion } from 'framer-motion';

export function ModalContainer() {
  const { state } = useModalQueue();

  if (!state.currentModal) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.currentModal.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="fixed inset-0 z-50"
      >
        {state.currentModal.component}
      </motion.div>
    </AnimatePresence>
  );
}
