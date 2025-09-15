'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Journey stages
export type JourneyStage = 'exploring' | 'creating' | 'refining' | 'exporting';

// Journey state
interface JourneyState {
  currentStage: JourneyStage;
  previousStage: JourneyStage | null;
  hasCompletedOnboarding: boolean;
  featureUnlocks: {
    harmonySuggestions: boolean;
    comparisonMode: boolean;
    advancedSettings: boolean;
    screenshotAnalysis: boolean;
  };
  userActions: {
    generationsCount: number;
    savedPalettesCount: number;
    usedHarmonySuggestions: boolean;
    usedComparisonMode: boolean;
  };
}

// Counter types (only number fields)
type CounterKeys = 'generationsCount' | 'savedPalettesCount';

// Journey actions
type JourneyAction =
  | { type: 'SET_STAGE'; stage: JourneyStage }
  | { type: 'ADVANCE_STAGE' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'UNLOCK_FEATURE'; feature: keyof JourneyState['featureUnlocks'] }
  | { type: 'RECORD_ACTION'; action: keyof JourneyState['userActions'] }
  | { type: 'INCREMENT_COUNTER'; counter: CounterKeys };

// Initial state
const initialState: JourneyState = {
  currentStage: 'exploring',
  previousStage: null,
  hasCompletedOnboarding: false,
  featureUnlocks: {
    harmonySuggestions: false,
    comparisonMode: false,
    advancedSettings: false,
    screenshotAnalysis: false,
  },
  userActions: {
    generationsCount: 0,
    savedPalettesCount: 0,
    usedHarmonySuggestions: false,
    usedComparisonMode: false,
  },
};

// Journey reducer
function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case 'SET_STAGE':
      return {
        ...state,
        previousStage: state.currentStage,
        currentStage: action.stage,
      };

    case 'ADVANCE_STAGE':
      const stageOrder: JourneyStage[] = ['exploring', 'creating', 'refining', 'exporting'];
      const currentIndex = stageOrder.indexOf(state.currentStage);
      const nextIndex = Math.min(currentIndex + 1, stageOrder.length - 1);
      const nextStage = stageOrder[nextIndex];

      return {
        ...state,
        previousStage: state.currentStage,
        currentStage: nextStage,
      };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        hasCompletedOnboarding: true,
      };

    case 'UNLOCK_FEATURE':
      return {
        ...state,
        featureUnlocks: {
          ...state.featureUnlocks,
          [action.feature]: true,
        },
      };

    case 'RECORD_ACTION':
      return {
        ...state,
        userActions: {
          ...state.userActions,
          [action.action]: true,
        },
      };

    case 'INCREMENT_COUNTER':
      return {
        ...state,
        userActions: {
          ...state.userActions,
          [action.counter]: state.userActions[action.counter] + 1,
        },
      };

    default:
      return state;
  }
}

// Context type
interface UserJourneyContextType {
  state: JourneyState;
  setStage: (stage: JourneyStage) => void;
  advanceStage: () => void;
  completeOnboarding: () => void;
  unlockFeature: (feature: keyof JourneyState['featureUnlocks']) => void;
  recordAction: (action: keyof JourneyState['userActions']) => void;
  incrementCounter: (counter: CounterKeys) => void;
  isFeatureUnlocked: (feature: keyof JourneyState['featureUnlocks']) => boolean;
  shouldShowAdvancedFeatures: () => boolean;
}

// Create context
const UserJourneyContext = createContext<UserJourneyContextType | undefined>(undefined);

// Provider component
interface UserJourneyProviderProps {
  children: ReactNode;
}

export function UserJourneyProvider({ children }: UserJourneyProviderProps) {
  const [state, dispatch] = useReducer(journeyReducer, initialState);

  const contextValue: UserJourneyContextType = {
    state,
    setStage: (stage) => dispatch({ type: 'SET_STAGE', stage }),
    advanceStage: () => dispatch({ type: 'ADVANCE_STAGE' }),
    completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
    unlockFeature: (feature) => dispatch({ type: 'UNLOCK_FEATURE', feature }),
    recordAction: (action) => dispatch({ type: 'RECORD_ACTION', action }),
    incrementCounter: (counter) => dispatch({ type: 'INCREMENT_COUNTER', counter }),
    isFeatureUnlocked: (feature) => state.featureUnlocks[feature],
    shouldShowAdvancedFeatures: () => {
      // Show advanced features if user has completed onboarding OR has significant usage
      return state.hasCompletedOnboarding ||
             state.userActions.generationsCount >= 3 ||
             state.userActions.savedPalettesCount >= 2;
    },
  };

  return (
    <UserJourneyContext.Provider value={contextValue}>
      {children}
    </UserJourneyContext.Provider>
  );
}

// Hook to use the context
export function useUserJourney() {
  const context = useContext(UserJourneyContext);
  if (context === undefined) {
    throw new Error('useUserJourney must be used within a UserJourneyProvider');
  }
  return context;
}

// Helper hooks for common operations
export function useJourneyStage() {
  const { state, setStage } = useUserJourney();
  return { currentStage: state.currentStage, setStage };
}

export function useFeatureUnlocks() {
  const { isFeatureUnlocked, unlockFeature } = useUserJourney();
  return { isFeatureUnlocked, unlockFeature };
}
