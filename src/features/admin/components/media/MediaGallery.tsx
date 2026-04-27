
import React from 'react';
import { motion } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Plus, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  caption?: string;
  type?: string;
}

interface Props {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  onUpload: (file: File) => Promise<string>;
  label: string;
}

export const MediaGallery: React.FC<Props> = ({ items, onChange, onUpload, label }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const url = await onUpload(file);
        const newItem: MediaItem = {
          id: `temp-${Date.now()}-${Math.random()}`,
          url,
          caption: ''
        };
        onChange([...items, newItem]);
      } catch (err) {
        console.error('Gallery upload failed:', err);
      }
    }
  };

  const removeItem = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(items.map(i => i.id === id ? { ...i, caption } : i));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
        >
          <Plus size={18} />
        </button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.map((item) => (
              <SortableItem 
                key={item.id} 
                item={item} 
                onRemove={() => removeItem(item.id)}
                onCaptionChange={(c) => updateCaption(item.id, c)}
              />
            ))}
            
            {items.length === 0 && (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 gap-3">
                <ImageIcon size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mídia adicionada</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

function SortableItem({ item, onRemove, onCaptionChange }: { 
  item: MediaItem, 
  onRemove: () => void,
  onCaptionChange: (caption: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 group transition-shadow ${isDragging ? 'shadow-2xl ring-2 ring-blue-500/20' : 'hover:shadow-md'}`}
    >
      <button {...attributes} {...listeners} className="p-2 text-slate-200 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors">
        <GripVertical size={20} />
      </button>

      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-50">
        <img src={item.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>

      <div className="flex-1">
        <input 
          type="text" 
          value={item.caption || ''} 
          onChange={e => onCaptionChange(e.target.value)}
          placeholder="Legenda ou título do passo..."
          className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
        />
      </div>

      <button 
        onClick={onRemove}
        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all opacity-20 group-hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
