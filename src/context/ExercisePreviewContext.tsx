import React, { createContext, useContext, useState } from 'react';
import { playHapticFeedback } from '../services/athleteMemoryEngine';

interface ExercisePreview {
  name: string;
  image: string;
  muscleGroup?: string;
}

interface ExercisePreviewContextType {
  openExercisePreview: (name: string, image: string, muscleGroup?: string) => void;
  closeExercisePreview: () => void;
  previewExercise: ExercisePreview | null;
}

const ExercisePreviewContext = createContext<ExercisePreviewContextType | undefined>(undefined);

export const useExercisePreview = () => {
  const context = useContext(ExercisePreviewContext);
  if (!context) {
    return {
      openExercisePreview: () => {},
      closeExercisePreview: () => {},
      previewExercise: null,
    };
  }
  return context;
};

export const ExercisePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previewExercise, setPreviewExercise] = useState<ExercisePreview | null>(null);

  const openExercisePreview = (name: string, image: string, muscleGroup?: string) => {
    if (!image) return;
    setPreviewExercise({ name, image, muscleGroup });
    playHapticFeedback?.('light');
  };

  const closeExercisePreview = () => {
    setPreviewExercise(null);
    playHapticFeedback?.('light');
  };

  return (
    <ExercisePreviewContext.Provider value={{ openExercisePreview, closeExercisePreview, previewExercise }}>
      {children}
    </ExercisePreviewContext.Provider>
  );
};
