import { create } from 'zustand';
import { Exercise } from '../../../types';

export interface MediaSuggestion {
  id: string;
  url: string;
  type: 'image' | 'video' | 'guide' | 'cut';
  source: string;
  quality_score: number;
  metadata?: any;
  title?: string;
  description?: string;
}

interface MediaFinderState {
  isSearching: boolean;
  suggestions: {
    main_images: MediaSuggestion[];
    thumbnails: MediaSuggestion[];
    guides: MediaSuggestion[];
    biomechanics: MediaSuggestion[];
    videos: MediaSuggestion[];
  };
  selectedAssets: Partial<Exercise>;
  bulkQueue: Exercise[];
  isBulkProcessing: boolean;
  
  setSearching: (searching: boolean) => void;
  setSuggestions: (suggestions: any) => void;
  setSelectedAssets: (assets: Partial<Exercise>) => void;
  reset: () => void;
}

export const useMediaFinderStore = create<MediaFinderState>((set) => ({
  isSearching: false,
  suggestions: {
    main_images: [],
    thumbnails: [],
    guides: [],
    biomechanics: [],
    videos: [],
  },
  selectedAssets: {},
  bulkQueue: [],
  isBulkProcessing: false,

  setSearching: (searching) => set({ isSearching: searching }),
  setSuggestions: (suggestions) => set({ suggestions: { ...suggestions } }),
  setSelectedAssets: (assets) => set({ selectedAssets: assets }),
  reset: () => set({
    suggestions: {
      main_images: [],
      thumbnails: [],
      guides: [],
      biomechanics: [],
      videos: [],
    },
    selectedAssets: {},
    isSearching: false
  }),
}));
