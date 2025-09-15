'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Modal types
export type ModalType =
  | 'settings'
  | 'analysis'
  | 'save'
  | 'export'
  | 'comparison-selector'
  | 'screenshot-analysis'
  | 'help'
  | 'onboarding';

// Modal queue item
interface ModalQueueItem {
  id: string;
  type: ModalType;
  priority: number; // Higher numbers = higher priority
  component: ReactNode;
  onClose?: () => void;
}

// Modal state
interface ModalState {
  currentModal: ModalQueueItem | null;
  queue: ModalQueueItem[];
  isTransitioning: boolean;
}

// Context type
interface ModalQueueContextType {
  state: ModalState;
  openModal: (type: ModalType, component: ReactNode, onClose?: () => void) => string;
  closeModal: (id: string) => void;
  closeCurrentModal: () => void;
  clearQueue: () => void;
  isModalOpen: (type: ModalType) => boolean;
  getCurrentModalType: () => ModalType | null;
}

// Priority mapping for modal types
const MODAL_PRIORITIES: Record<ModalType, number> = {
  onboarding: 100, // Highest priority - always show first
  analysis: 90,    // Important for user workflow
  save: 80,        // Core functionality
  export: 70,      // Core functionality
  'comparison-selector': 60,  // Advanced feature
  'screenshot-analysis': 50,  // Advanced feature
  settings: 40,    // Configuration
  help: 30,        // Support
};

// Create context
const ModalQueueContext = createContext<ModalQueueContextType | undefined>(undefined);

// Provider component
interface ModalQueueProviderProps {
  children: ReactNode;
}

export function ModalQueueProvider({ children }: ModalQueueProviderProps) {
  const [state, setState] = useState<ModalState>({
    currentModal: null,
    queue: [],
    isTransitioning: false,
  });

  const openModal = useCallback((type: ModalType, component: ReactNode, onClose?: () => void): string => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const modalItem: ModalQueueItem = {
      id,
      type,
      priority: MODAL_PRIORITIES[type],
      component,
      onClose,
    };

    setState(prevState => {
      const newQueue = [...prevState.queue, modalItem].sort((a, b) => b.priority - a.priority);

      // If no current modal, show this one immediately
      if (!prevState.currentModal) {
        return {
          ...prevState,
          currentModal: modalItem,
          queue: newQueue.filter(item => item.id !== id),
        };
      }

      // If higher priority than current modal, replace it and add current to queue
      if (modalItem.priority > prevState.currentModal.priority) {
        const updatedQueue = [prevState.currentModal, ...newQueue.filter(item => item.id !== id)];
        return {
          ...prevState,
          currentModal: modalItem,
          queue: updatedQueue,
        };
      }

      // Otherwise, just add to queue
      return {
        ...prevState,
        queue: newQueue,
      };
    });

    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setState(prevState => {
      // Call onClose callback if it exists
      const modalToClose = prevState.currentModal?.id === id ? prevState.currentModal : prevState.queue.find(item => item.id === id);
      if (modalToClose?.onClose) {
        modalToClose.onClose();
      }

      // If closing current modal, show next in queue
      if (prevState.currentModal?.id === id) {
        const nextModal = prevState.queue[0] || null;
        const remainingQueue = prevState.queue.slice(1);

        return {
          ...prevState,
          currentModal: nextModal,
          queue: remainingQueue,
          isTransitioning: true,
        };
      }

      // Otherwise, just remove from queue
      return {
        ...prevState,
        queue: prevState.queue.filter(item => item.id !== id),
      };
    });

    // Reset transitioning state after animation
    setTimeout(() => {
      setState(prevState => ({ ...prevState, isTransitioning: false }));
    }, 300);
  }, []);

  const closeCurrentModal = useCallback(() => {
    if (state.currentModal) {
      closeModal(state.currentModal.id);
    }
  }, [state.currentModal, closeModal]);

  const clearQueue = useCallback(() => {
    setState(prevState => {
      // Call onClose callbacks for all modals
      [...(prevState.currentModal ? [prevState.currentModal] : []), ...prevState.queue].forEach(modal => {
        if (modal.onClose) {
          modal.onClose();
        }
      });

      return {
        currentModal: null,
        queue: [],
        isTransitioning: false,
      };
    });
  }, []);

  const isModalOpen = useCallback((type: ModalType): boolean => {
    return (state.currentModal?.type === type) || state.queue.some(item => item.type === type);
  }, [state.currentModal, state.queue]);

  const getCurrentModalType = useCallback((): ModalType | null => {
    return state.currentModal?.type || null;
  }, [state.currentModal]);

  const contextValue: ModalQueueContextType = {
    state,
    openModal,
    closeModal,
    closeCurrentModal,
    clearQueue,
    isModalOpen,
    getCurrentModalType,
  };

  return (
    <ModalQueueContext.Provider value={contextValue}>
      {children}
    </ModalQueueContext.Provider>
  );
}

// Hook to use the context
export function useModalQueue() {
  const context = useContext(ModalQueueContext);
  if (context === undefined) {
    throw new Error('useModalQueue must be used within a ModalQueueProvider');
  }
  return context;
}

// Helper hook for common modal operations
export function useModal(type: ModalType) {
  const { openModal, closeModal, isModalOpen } = useModalQueue();

  const open = useCallback((component: ReactNode, onClose?: () => void) => {
    return openModal(type, component, onClose);
  }, [openModal, type]);

  const close = useCallback((id?: string) => {
    if (id) {
      closeModal(id);
    }
  }, [closeModal]);

  const isOpen = isModalOpen(type);

  return { open, close, isOpen };
}
