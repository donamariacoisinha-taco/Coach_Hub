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
    
    // Normalize Unsplash URLs to fetch high resolution original imagery
    let processedImage = image;
    if (image.includes('unsplash.com')) {
      try {
        const urlObj = new URL(image);
        urlObj.searchParams.set('w', '1200');
        urlObj.searchParams.set('q', '90');
        urlObj.searchParams.delete('h');
        urlObj.searchParams.delete('fit');
        urlObj.searchParams.delete('crop');
        processedImage = urlObj.toString();
      } catch (e) {
        processedImage = image
          .replace(/w=\d+/, 'w=1200')
          .replace(/h=\d+/, 'w=1200')
          .replace(/&fit=crop/, '');
      }
    }

    setPreviewExercise({ name, image: processedImage, muscleGroup });
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
