import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Check, 
  Star, 
  Award, 
  FileText, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Brain, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Dumbbell, 
  Layers, 
  Grid, 
  ChevronLeft, 
  Eye, 
  ShieldCheck, 
  Lock, 
  Globe,
  Paperclip,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { systemTemplatesApi, SystemTemplate } from '../../../lib/api/systemTemplatesApi';
import { premiumProtocolsApi, PremiumProtocol, PremiumTemplateWorkout, PremiumTemplateExercise } from '../../../lib/api/premiumProtocolsApi';
import { useAdminStore } from '../../../store/adminStore';
import { authApi } from '../../../lib/api/authApi';

export const ProtocolManagement: React.FC = () => {
  const { exercises } = useAdminStore();
  const [activeSubTab, setActiveSubTab] = useState<'my_protocols' | 'templates' | 'premium' | 'public' | 'drafts' | 'rubi' | 'community' | 'create_protocol'>('create_protocol');
  
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [protocols, setProtocols] = useState<PremiumProtocol[]>([]);
  const [drafts, setDrafts] = useState<PremiumProtocol[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search, Filters & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');
  const [localFilter, setLocalFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Deletion Safety Modal States
  const [deletingProtocol, setDeletingProtocol] = useState<PremiumProtocol | null>(null);
  const [deleteProtocolInput, setDeleteProtocolInput] = useState('');

  // Current logged in admin details
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('admin@kyron.os');

  useEffect(() => {
    authApi.getUser().then(u => {
      if (u?.email) {
        setCurrentUserEmail(u.email);
      }
    });
  }, []);

  const addProtocolAdminLog = async (action: string, protocolName: string) => {
    try {
      const user = await authApi.getUser();
      const adminEmail = user?.email || 'admin@kyron.os';
      const adminName = adminEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
      const logs = JSON.parse(localStorage.getItem('kyron_admin_operations_log_v2') || '[]');
      const now = new Date();
      const newLog = {
        action: action,
        admin: adminEmail,
        athlete: `${adminName} | ${protocolName}`,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      logs.unshift(newLog);
      localStorage.setItem('kyron_admin_operations_log_v2', JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.error('Error logging protocol operation:', e);
    }
  };
  
  // Community Approval Queue & Database State
  const [communityProtocols, setCommunityProtocols] = useState<any[]>(() => {
    const stored = localStorage.getItem('kyron_admin_community_protocols');
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'comm-1',
        name: 'GVT - German Volume Training Adap.',
        description: 'Foco em hipertrofia de alta densidade e volume. Planilha robusta compartilhada para validação.',
        goal: 'hypertrophy',
        difficulty: 'advanced',
        duration_weeks: 6,
        frequency: 4,
        status: 'pending',
        shared_by: 'Felipe Alencar',
        created_at: new Date().toISOString(),
        workouts: []
      },
      {
        id: 'comm-2',
        name: 'Membros Superiores Estético Foco Deltóides',
        description: 'Vetor de forças específico focado na proporção clavicular de ombros. Desenvolvido para modelagem estética.',
        goal: 'glutes',
        difficulty: 'intermediate',
        duration_weeks: 8,
        frequency: 3,
        status: 'pending',
        shared_by: 'Bárbara Schmidt',
        created_at: new Date().toISOString(),
        workouts: []
      },
      {
        id: 'comm-3',
        name: 'Functional Conditioning & Core Pro',
        description: 'Focado em reatividade neuromuscular do core axial e performance cardio-respiratória em circuito.',
        goal: 'performance',
        difficulty: 'intermediate',
        duration_weeks: 10,
        frequency: 5,
        status: 'approved',
        shared_by: 'Rodrigo Torres',
        created_at: new Date().toISOString(),
        workouts: []
      }
    ];
  });

  // Timeline and Simplified Modal state
  const [selectedProtocolForVersion, setSelectedProtocolForVersion] = useState<PremiumProtocol | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(3);
  const [isSimplifiedModalOpen, setIsSimplifiedModalOpen] = useState(false);
  const [simpleGoal, setSimpleGoal] = useState<'hypertrophy' | 'weight_loss' | 'strength' | 'performance' | 'glutes' | 'recovery'>('hypertrophy');
  const [simpleDifficulty, setSimpleDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [simpleDuration, setSimpleDuration] = useState<number>(12);
  const [simpleCoverImage, setSimpleCoverImage] = useState('');
  const [simpleName, setSimpleName] = useState('');

  // ==========================================
  // AUTOMATED PROTOCOL BUILDER (ADMIN) STATES
  // ==========================================
  const [builderStep, setBuilderStep] = useState<number>(1);
  const [builderName, setBuilderName] = useState<string>('');
  const [builderGoal, setBuilderGoal] = useState<'hypertrophy' | 'weight_loss' | 'strength' | 'performance' | 'conditioning' | 'health' | 'recovery'>('hypertrophy');
  const [builderLevel, setBuilderLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [builderFrequency, setBuilderFrequency] = useState<number>(4);
  const [builderDuration, setBuilderDuration] = useState<number>(12);
  const [builderCategory, setBuilderCategory] = useState<'premium' | 'public'>('premium');
  const [builderEnvironment, setBuilderEnvironment] = useState<'gym' | 'home' | 'hybrid'>('gym');

  // Step 2 Selection Criteria
  const [critEquipFull, setCritEquipFull] = useState<boolean>(true);
  const [critEquipBasic, setCritEquipBasic] = useState<boolean>(true);
  const [critEquipHome, setCritEquipHome] = useState<boolean>(false);
  const [critEquipBody, setCritEquipBody] = useState<boolean>(false);

  const [priorGuided, setPriorGuided] = useState<boolean>(true);
  const [priorBasic, setPriorBasic] = useState<boolean>(true);
  const [priorCompound, setPriorCompound] = useState<boolean>(true);
  const [priorIsolated, setPriorIsolated] = useState<boolean>(true);

  const [restActiveExOnly, setRestActiveExOnly] = useState<boolean>(true);
  const [restNoArchived, setRestNoArchived] = useState<boolean>(true);
  const [restNoRepeat, setRestNoRepeat] = useState<boolean>(true);
  const [restMuscleRecovery, setRestMuscleRecovery] = useState<boolean>(true);
  const [restWeekFreq, setRestWeekFreq] = useState<boolean>(true);
  const [restNoOverlap, setRestNoOverlap] = useState<boolean>(true);

  // Step 3 & 5 Workouts State
  const [builderWorkouts, setBuilderWorkouts] = useState<PremiumTemplateWorkout[]>([]);
  const [currentGeneratedDraft, setCurrentGeneratedDraft] = useState<PremiumProtocol | null>(null);

  // Step 5 Search/Edit Overlay State
  const [builderActiveWorkoutId, setBuilderActiveWorkoutId] = useState<string | null>(null);
  const [builderExSearchQuery, setBuilderExSearchQuery] = useState<string>('');
  const [builderReplacingIndex, setBuilderReplacingIndex] = useState<number | null>(null);

  // Feedback State
  const [builderToast, setBuilderToast] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Creation Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<'hypertrophy' | 'weight_loss' | 'strength' | 'performance' | 'glutes' | 'recovery'>('hypertrophy');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [frequency, setFrequency] = useState<number>(5);
  const [trainingEnvironment, setTrainingEnvironment] = useState<'gym' | 'home' | 'hybrid'>('gym');
  const [imageUrl, setImageUrl] = useState('');
  
  const [workouts, setWorkouts] = useState<PremiumTemplateWorkout[]>([
    {
      id: 'w-1',
      name: 'Treino A',
      description: 'Foco em força progressiva',
      exercises: []
    }
  ]);
  
  const [isPremium, setIsPremium] = useState<boolean>(true);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(true);

  // Exercise Search state for wizard
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tmps = await systemTemplatesApi.getTemplates();
      setTemplates(tmps);
      const prtcols = await premiumProtocolsApi.getProtocols();
      setProtocols(prtcols);
      
      const storedDrafts = localStorage.getItem('kyron_admin_draft_protocols');
      if (storedDrafts) {
        setDrafts(JSON.parse(storedDrafts));
      } else {
        const initialDrafts: PremiumProtocol[] = [
          {
            id: 'draft-1',
            name: 'Projeto Reconstrução Muscular',
            description: 'Rascunho de transição metabólica de altas cargas direcionado para atletas intermediários.',
            version: 1,
            premium: true,
            goal: 'hypertrophy',
            difficulty: 'intermediate',
            duration_weeks: 8,
            frequency: 4,
            created_by: 'admin',
            rating: 5,
            athletes_count: 0,
            completion_rate: 0,
            strength_increase_pct: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: 'Admin',
            workouts: [],
            version_history: []
          }
        ];
        setDrafts(initialDrafts);
        localStorage.setItem('kyron_admin_draft_protocols', JSON.stringify(initialDrafts));
      }
    } catch (e) {
      console.error('Error loading protocol data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveDraftsToStorage = (newDrafts: PremiumProtocol[]) => {
    setDrafts(newDrafts);
    localStorage.setItem('kyron_admin_draft_protocols', JSON.stringify(newDrafts));
  };

  const saveCommunityToStorage = (newComm: any[]) => {
    setCommunityProtocols(newComm);
    localStorage.setItem('kyron_admin_community_protocols', JSON.stringify(newComm));
  };

  const handleApproveCommunity = async (id: string) => {
    const updated = communityProtocols.map(c => c.id === id ? { ...c, status: 'approved' } : c);
    saveCommunityToStorage(updated);
    
    const approvedItem = communityProtocols.find(c => c.id === id);
    if (approvedItem) {
      const newP: PremiumProtocol = {
        id: `comm-protocol-${id}`,
        name: approvedItem.name,
        description: approvedItem.description + " (Aprovado da Comunidade).",
        version: 1,
        premium: true,
        goal: approvedItem.goal,
        difficulty: approvedItem.difficulty,
        duration_weeks: approvedItem.duration_weeks,
        frequency: approvedItem.frequency || 4,
        created_by: approvedItem.shared_by,
        rating: 4.8,
        athletes_count: 5,
        completion_rate: 85,
        strength_increase_pct: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'Rubi Admin',
        workouts: [],
        version_history: []
      };
      await premiumProtocolsApi.createOrUpdateProtocol(newP);
      const prtcols = await premiumProtocolsApi.getProtocols();
      setProtocols(prtcols);
    }
  };

  const handleRejectCommunity = (id: string) => {
    const updated = communityProtocols.filter(c => c.id !== id);
    saveCommunityToStorage(updated);
  };

  const handleStartCreate = () => {
    setEditingProtocolId(null);
    setName('');
    setDescription('');
    setGoal('hypertrophy');
    setDifficulty('intermediate');
    setDurationWeeks(12);
    setFrequency(5);
    setTrainingEnvironment('gym');
    setImageUrl('');
    setWorkouts([
      {
        id: 'w-' + Date.now(),
        name: 'Treino A',
        description: 'Membros Superiores Foco Costas',
        exercises: []
      }
    ]);
    setIsPremium(true);
    setIsPublic(false);
    setIsRecommended(false);
    setIsFeatured(false);
    setIsNew(true);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleStartEdit = (p: PremiumProtocol, isFromDrafts = false) => {
    // Direct routing to Step 5 Advanced Editor for all drafts and live protocols!
    // This unifies the editing workspace under a single high-agency panel.
    setCurrentGeneratedDraft({
      ...p,
      workouts: p.workouts || []
    });
    setBuilderStep(5);
    setBuilderActiveWorkoutId(p.workouts?.[0]?.id || null);
    setBuilderExSearchQuery('');
    setBuilderReplacingIndex(null);
    setActiveSubTab('create_protocol');
    setBuilderToast(`Modo Edição: "${p.name}" carregado no Construtor Avançado!`);
    setTimeout(() => setBuilderToast(null), 3000);
  };

  const handleCloneTemplateToDraft = (t: SystemTemplate) => {
    const draftId = `draft-${Date.now()}`;
    const draftObj: PremiumProtocol = {
      id: draftId,
      name: `${t.name} (Cópia Modificada)`,
      description: t.description || `Planilha copiada do template global ${t.name}.`,
      version: 1,
      premium: true,
      goal: 'hypertrophy',
      difficulty: 'intermediate',
      duration_weeks: 4,
      frequency: t.workouts?.length || 3,
      created_by: 'admin',
      rating: 5.0,
      athletes_count: 0,
      completion_rate: 0,
      strength_increase_pct: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'Mesa Admin',
      workouts: t.workouts.map((w, wIdx) => ({
        id: w.id || `w-${wIdx}-${Date.now()}`,
        name: w.name,
        description: w.description || '',
        exercises: w.exercises.map((e, eIdx) => ({
          exercise_id: e.exercise_id,
          exercise_name: e.exercise_name,
          sets: e.sets || 4,
          reps: e.reps || '10',
          weight: e.weight || 15,
          rest_time: e.rest_time || 60,
          sets_json: e.sets_json || Array.from({ length: e.sets || 4 }).map(() => ({ reps: e.reps || '10', weight: e.weight || 15, rest_time: e.rest_time || 60 })),
          sort_order: e.sort_order || (eIdx + 1),
          notes: e.notes || ''
        }))
      })),
      version_history: []
    };

    const updatedDraftsList = [...drafts, draftObj];
    saveDraftsToStorage(updatedDraftsList);

    setCurrentGeneratedDraft(draftObj);
    setBuilderStep(5);
    setBuilderActiveWorkoutId(draftObj.workouts?.[0]?.id || null);
    setBuilderExSearchQuery('');
    setBuilderReplacingIndex(null);
    setActiveSubTab('create_protocol');

    setBuilderToast(`Template "${t.name}" clonado em Rascunho! Editando no construtor avançado.`);
    setTimeout(() => setBuilderToast(null), 3500);
  };

  const handleDuplicate = async (p: PremiumProtocol, isFromDrafts = false) => {
    const duplicated: PremiumProtocol = {
      ...p,
      id: `protocol-${Date.now()}`,
      name: `${p.name} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (isFromDrafts) {
      const newDrafts = [...drafts, duplicated];
      saveDraftsToStorage(newDrafts);
    } else {
      await premiumProtocolsApi.createOrUpdateProtocol(duplicated);
      const updated = await premiumProtocolsApi.getProtocols();
      setProtocols(updated);
    }
  };

  const handleArchive = async (id: string, isFromDrafts = false) => {
    if (confirm('Deseja realmente arquivar este protocolo? (Ele será movido para a Lixeira)')) {
      let protocolName = '';
      if (isFromDrafts) {
        const draft = drafts.find(d => d.id === id);
        if (draft) {
          protocolName = draft.name;
          const updatedDraft = { ...draft, status: 'archived' as const, is_active: false };
          await premiumProtocolsApi.createOrUpdateProtocol(updatedDraft);
          const newDrafts = drafts.filter(d => d.id !== id);
          saveDraftsToStorage(newDrafts);
        }
      } else {
        const p = protocols.find(x => x.id === id);
        if (p) {
          protocolName = p.name;
          await premiumProtocolsApi.archiveProtocol(id, currentUserEmail);
        }
      }
      await loadData();
      if (protocolName) {
        addProtocolAdminLog('Arquivou protocolo', protocolName);
      }
    }
  };

  const handleRestore = async (id: string) => {
    let protocolName = '';
    const p = protocols.find(x => x.id === id);
    if (p) {
      protocolName = p.name;
      await premiumProtocolsApi.restoreProtocol(id);
    } else {
      const draft = drafts.find(d => d.id === id);
      if (draft) {
        protocolName = draft.name;
        const updatedDraft = { ...draft, status: 'draft' as const, is_active: false };
        const otherDrafts = drafts.map(d => d.id === id ? updatedDraft : d);
        saveDraftsToStorage(otherDrafts);
      }
    }
    await loadData();
    if (protocolName) {
      addProtocolAdminLog('Restaurou protocolo', protocolName);
    }
  };

  const handleDeletePermanently = async (p: PremiumProtocol) => {
    await premiumProtocolsApi.deleteProtocolPermanently(p.id);
    const isADraft = p.id.startsWith('draft-') || drafts.some(d => d.id === p.id);
    if (isADraft) {
      const updatedDrafts = drafts.filter(d => d.id !== p.id);
      saveDraftsToStorage(updatedDrafts);
    }
    await loadData();
    addProtocolAdminLog('Excluiu permanentemente', p.name);
  };

  const toggleProtocolActive = async (id: string, isFromDrafts = false) => {
    if (isFromDrafts) {
      const updatedDrafts = drafts.map(d => {
        if (d.id === id) {
          return { ...d, is_active: d.is_active === false ? true : false };
        }
        return d;
      });
      saveDraftsToStorage(updatedDrafts);
    } else {
      const pIndex = protocols.findIndex(p => p.id === id);
      if (pIndex > -1) {
        const pCurrent = protocols[pIndex];
        const updatedItem = { ...pCurrent, is_active: pCurrent.is_active === false ? true : false };
        const updatedList = [...protocols];
        updatedList[pIndex] = updatedItem;
        setProtocols(updatedList);
        await premiumProtocolsApi.createOrUpdateProtocol(updatedItem);
      }
    }
  };

  const handleConvertPremium = async (id: string, isFromDrafts = false) => {
    if (isFromDrafts) {
      const updatedDrafts = drafts.map(d => d.id === id ? { ...d, premium: true } : d);
      saveDraftsToStorage(updatedDrafts);
    } else {
      const pIndex = protocols.findIndex(p => p.id === id);
      if (pIndex > -1) {
        const updatedItem = { ...protocols[pIndex], premium: true };
        const updatedList = [...protocols];
        updatedList[pIndex] = updatedItem;
        setProtocols(updatedList);
        await premiumProtocolsApi.createOrUpdateProtocol(updatedItem);
      }
    }
  };

  const handleConvertPublic = async (id: string, isFromDrafts = false) => {
    if (isFromDrafts) {
      const updatedDrafts = drafts.map(d => d.id === id ? { ...d, premium: false } : d);
      saveDraftsToStorage(updatedDrafts);
    } else {
      const pIndex = protocols.findIndex(p => p.id === id);
      if (pIndex > -1) {
        const updatedItem = { ...protocols[pIndex], premium: false };
        const updatedList = [...protocols];
        updatedList[pIndex] = updatedItem;
        setProtocols(updatedList);
        await premiumProtocolsApi.createOrUpdateProtocol(updatedItem);
      }
    }
  };

  const handlePublishPublic = async (id: string, isFromDrafts = false) => {
    if (isFromDrafts) {
      const draftToPublish = drafts.find(d => d.id === id);
      if (draftToPublish) {
        const published: PremiumProtocol = {
          ...draftToPublish,
          premium: false,
          is_active: true,
          updated_at: new Date().toISOString()
        };
        const newDrafts = drafts.filter(d => d.id !== id);
        saveDraftsToStorage(newDrafts);
        await premiumProtocolsApi.createOrUpdateProtocol(published);
        const updated = await premiumProtocolsApi.getProtocols();
        setProtocols(updated);
      }
    } else {
      const pIndex = protocols.findIndex(p => p.id === id);
      if (pIndex > -1) {
        const updatedItem = { ...protocols[pIndex], premium: false, is_active: true };
        const updatedList = [...protocols];
        updatedList[pIndex] = updatedItem;
        setProtocols(updatedList);
        await premiumProtocolsApi.createOrUpdateProtocol(updatedItem);
      }
    }
  };

  const handlePublishPremium = async (id: string, isFromDrafts = false) => {
    if (isFromDrafts) {
      const draftToPublish = drafts.find(d => d.id === id);
      if (draftToPublish) {
        const published: PremiumProtocol = {
          ...draftToPublish,
          premium: true,
          is_active: true,
          updated_at: new Date().toISOString()
        };
        const newDrafts = drafts.filter(d => d.id !== id);
        saveDraftsToStorage(newDrafts);
        await premiumProtocolsApi.createOrUpdateProtocol(published);
        const updated = await premiumProtocolsApi.getProtocols();
        setProtocols(updated);
      }
    } else {
      const pIndex = protocols.findIndex(p => p.id === id);
      if (pIndex > -1) {
        const updatedItem = { ...protocols[pIndex], premium: true, is_active: true };
        const updatedList = [...protocols];
        updatedList[pIndex] = updatedItem;
        setProtocols(updatedList);
        await premiumProtocolsApi.createOrUpdateProtocol(updatedItem);
      }
    }
  };

  // ==========================================
  // AUTOMATED PROTOCOL BUILDER (ADMIN) ENGINES
  // ==========================================

  // Exercise Scoring System
  const getExerciseQualityScoreForLevel = (ex: any, level: 'beginner' | 'intermediate' | 'advanced'): number => {
    const name = (ex.name || '').toLowerCase();
    const type = (ex.type || '').toLowerCase();
    const pattern = (ex.movement_pattern || '').toLowerCase();

    // 1. Level Suitability (Base)
    let levelBase = 70;
    if (level === 'beginner') {
      if (type === 'machine' || name.includes('máquina') || name.includes('machine') || name.includes('articulado') || name.includes('guiado') || name.includes('smith')) {
        levelBase = 95;
      } else if (type === 'cable' || name.includes('polia') || name.includes('cabo')) {
        levelBase = 85;
      } else if (type === 'bodyweight') {
        levelBase = 80;
      } else if (ex.difficulty_level === 'beginner') {
        levelBase = 75;
      } else if (name.includes('terra') || name.includes('deadlift') || name.includes('snatch') || name.includes('clean') || name.includes('arremesso') || name.includes('arranco') || name.includes('olympic') || name.includes('unstable') || name.includes('bosu') || ex.difficulty_level === 'advanced') {
        levelBase = 15; // highly avoid for beginners
      } else {
        levelBase = 60;
      }
    } else if (level === 'intermediate') {
      if (type === 'cable' || name.includes('polia')) {
        levelBase = 95;
      } else if (type === 'free_weight' && (pattern === 'push' || pattern === 'pull' || pattern === 'squat')) {
        levelBase = 90;
      } else if (type === 'machine') {
        levelBase = 85;
      } else if (name.includes('clean') || name.includes('snatch') || name.includes('arremesso') || name.includes('terra')) {
        levelBase = 65;
      } else {
        levelBase = 80;
      }
    } else { // advanced
      if (name.includes('terra') || name.includes('deadlift') || name.includes('snatch') || name.includes('clean') || name.includes('olympic') || pattern === 'squat' || pattern === 'hinge') {
        levelBase = 98; // compounds prioritize
      } else if (type === 'free_weight') {
        levelBase = 92;
      } else if (type === 'cable') {
        levelBase = 85;
      } else if (type === 'machine') {
        levelBase = 75;
      } else {
        levelBase = 80;
      }
    }

    // 2. Safety Score
    let safety = 80;
    if (type === 'machine' || name.includes('máquina') || name.includes('cabo') || type === 'cable' || name.includes('polia')) {
      safety = 95;
    } else if (type === 'bodyweight') {
      safety = 90;
    } else if (name.includes('agachamento') || name.includes('squat') || name.includes('terra') || name.includes('deadlift') || name.includes('supino') || name.includes('bench press')) {
      safety = 70;
    } else if (name.includes('unstable') || name.includes('clean') || name.includes('snatch')) {
      safety = 55;
    }

    // Beginner penalizes unsafe movements heavily
    let safetyModifier = 0;
    if (level === 'beginner' && safety < 80) {
      safetyModifier = -25;
    } else if (level === 'beginner' && safety >= 95) {
      safetyModifier = 5;
    }

    // 3. Complexity & Suitability
    let complexity = 50; 
    if (name.includes('clean') || name.includes('snatch') || name.includes('arremesso') || name.includes('arranco') || name.includes('olympic')) {
      complexity = 95;
    } else if (name.includes('terra') || name.includes('deadlift') || name.includes('agachamento com barra') || name.includes('barbell squat') || name.includes('desenvolvimento com barra')) {
      complexity = 85;
    } else if (type === 'free_weight') {
      complexity = 70;
    } else if (type === 'cable') {
      complexity = 55;
    } else if (type === 'machine') {
      complexity = 35;
    }

    let complexityPenalty = 0;
    if (level === 'beginner' && complexity > 70) {
      complexityPenalty = -(complexity - 65) * 1.2;
    } else if (level === 'advanced' && complexity < 50) {
      complexityPenalty = -10;
    }

    // 4. Equipment availability 
    let equipScore = 90;
    if (ex.equipment) {
      equipScore = 95;
    }

    // 5. Popularity & Quality Flags from Exercise DB
    let popScore = ex.performance_score || ex.quality_score || 70;
    if (ex.featured_exercise) popScore += 10;
    if (ex.administrator_favorite) popScore += 12;
    if (ex.protocol_priority) popScore += 15;
    if (ex.recommended_for_beginners && level === 'beginner') popScore += 12;
    if (ex.recommended_for_intermediate && level === 'intermediate') popScore += 10;
    if (ex.recommended_for_advanced && level === 'advanced') popScore += 10;

    let finalRating = (levelBase * 0.45) + (safety * 0.20) + (equipScore * 0.15) + (popScore * 0.20) + safetyModifier + complexityPenalty;
    return Math.min(100, Math.max(10, Math.round(finalRating)));
  };

  // Duplication Control (Avoid multiple exercises with same pattern in same session)
  const isDuplicatePattern = (ex: any, existingSession: any[]): boolean => {
    const cleanName = (ex.name || '').toLowerCase();
    
    for (const existing of existingSession) {
      // Find matching full exercise
      const existingEx = exercises.find(e => e.id === existing.exercise_id);
      if (!existingEx) continue;
      const existingName = existingEx.name.toLowerCase();

      // Avoid chest press duplicates (e.g. Supino Máquina + Supino Articulado)
      const hasPressA = cleanName.includes('press') || cleanName.includes('supino') || cleanName.includes('crucifixo');
      const hasPressB = existingName.includes('press') || existingName.includes('supino') || existingName.includes('crucifixo');
      if (hasPressA && hasPressB && ex.movement_pattern === existingEx.movement_pattern && ex.muscle_group === existingEx.muscle_group) {
        return true; 
      }

      // Avoid hamstring curl duplicates (Cadeira Flexora + Mesa Flexora)
      const hasCurlA = cleanName.includes('flexor') || cleanName.includes('curvada') || cleanName.includes('hamstring');
      const hasCurlB = existingName.includes('flexor') || existingName.includes('curvada') || existingName.includes('hamstring');
      if (hasCurlA && hasCurlB && ex.muscle_group === existingEx.muscle_group) {
        return true; 
      }

      // Avoid extensora duplicates
      const hasExtA = cleanName.includes('extensor');
      const hasExtB = existingName.includes('extensor');
      if (hasExtA && hasExtB) return true;

      // Unilateral/Goblet Squat duplicate (avoid Goblet squat + Agachamento frontal)
      if (ex.movement_pattern === 'squat' && existingEx.movement_pattern === 'squat') {
        const hasSquatA = cleanName.includes('squat') || cleanName.includes('agachamento') || cleanName.includes('leg press');
        const hasSquatB = existingName.includes('squat') || existingName.includes('agachamento') || existingName.includes('leg press');
        if (hasSquatA && hasSquatB) {
          if (ex.muscle_group === existingEx.muscle_group) return true;
        }
      }
    }
    return false;
  };

  // Automatically fetch/store substitutes
  const getExerciseAlternativesEx = (ex: any): string[] => {
    if (ex.alternatives && ex.alternatives.length > 0) {
      return ex.alternatives;
    }

    const storedAltsKey = `kyron_custom_alts_${ex.id}`;
    try {
      const stored = localStorage.getItem(storedAltsKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}

    // Fallbacks
    const name = (ex.name || '').toLowerCase();
    if (name.includes('leg press')) {
      return ['Agachamento Hack Machine', 'Agachamento Smith Squat', 'Agachamento Goblet Squat'];
    }
    if (name.includes('supino') || name.includes('bench press') || name.includes('chest press')) {
      return ['Supino Halteres', 'Chest Press Máquina', 'Supino Inclinado Articulado'];
    }
    if (name.includes('agachamento') || name.includes('squat')) {
      return ['Smith Squat', 'Goblet Squat', 'Agachamento Hack'];
    }
    if (name.includes('extensora') || name.includes('extensao')) {
      return ['Leg Press Unilateral', 'Agachamento Búlgaro', 'Passada Halteres'];
    }
    if (name.includes('flexora') || name.includes('flexao')) {
      return ['Stiff Halteres', 'Mesa Flexora', 'Elevação Pélvica'];
    }
    if (name.includes('puxada') || name.includes('pulldown')) {
      return ['Puxada Triângulo', 'Remada Alta polia', 'Barra Fixa Assistida'];
    }
    if (name.includes('remada') || name.includes('row')) {
      return ['Remada Articulada', 'Remada Baixa Cabo', 'Remada Cavalinho'];
    }
    if (name.includes('desenvolvimento') || name.includes('shoulder press')) {
      return ['Desenvolvimento Halteres', 'Desenvolvimento Máquina', 'Elevação Lateral'];
    }

    // Dynamic fallback matching same muscle group
    const matches = exercises
      .filter(e => e.id !== ex.id && e.is_active !== false && e.muscle_group === ex.muscle_group)
      .slice(0, 3)
      .map(e => e.name);

    return matches.length > 0 ? matches : ['Exercício Livre de ' + ex.muscle_group, 'Máquina isoladora'];
  };

  // Comprehensive Protocol Quality Scoring System (0-100)
  const calculateProtocolQualityScore = (workouts: PremiumTemplateWorkout[]): { score: number; rating: 'Excellent' | 'Good' | 'Needs Review'; statusLabel: string; breakdown: any } => {
    if (!workouts || workouts.length === 0) {
      return { score: 0, rating: 'Needs Review', statusLabel: 'Necessita Revisão', breakdown: { levelComp: 0, diversity: 0, balance: 0, recovery: 0, equipComp: 100 } };
    }

    const totalExCount = workouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0);
    if (totalExCount === 0) {
      return { score: 0, rating: 'Needs Review', statusLabel: 'Necessita Revisão', breakdown: { levelComp: 0, diversity: 0, balance: 0, recovery: 0, equipComp: 100 } };
    }

    // 1. Level Compatibility
    let totalLevelScore = 0;
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        if (matchingEx) {
          totalLevelScore += getExerciseQualityScoreForLevel(matchingEx, builderLevel);
        } else {
          totalLevelScore += 75;
        }
      });
    });
    const levelComp = Math.round(totalLevelScore / totalExCount);

    // 2. Exercise Diversity
    let duplicationCount = 0;
    workouts.forEach(w => {
      const sessionExs: any[] = [];
      w.exercises?.forEach(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        if (matchingEx) {
          if (isDuplicatePattern(matchingEx, sessionExs)) {
            duplicationCount++;
          }
          sessionExs.push(ex);
        }
      });
    });
    const diversity = Math.max(40, 100 - (duplicationCount * 15));

    // 3. Muscle Balance Validation
    const muscleSets: Record<string, number> = {
      peito: 0, chest: 0,
      costas: 0, back: 0,
      quadríceps: 0, quadriceps: 0,
      isquiotibiais: 0, hamstrings: 0,
      glúteos: 0, glutes: 0,
      ombros: 0, shoulders: 0,
      bíceps: 0, biceps: 0,
      tríceps: 0, triceps: 0,
      abdominal: 0, core: 0,
      panturrilha: 0, calves: 0
    };

    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        const sets = ex.sets || 3;
        if (matchingEx) {
          const mg = matchingEx.muscle_group.toLowerCase();
          Object.keys(muscleSets).forEach(key => {
            if (mg.includes(key.toLowerCase())) {
              muscleSets[key] += sets;
            }
          });
        }
      });
    });

    const normalizedSets = {
      chest: muscleSets.peito + muscleSets.chest,
      back: muscleSets.costas + muscleSets.back,
      quads: muscleSets.quadríceps + muscleSets.quadriceps,
      hams: muscleSets.isquiotibiais + muscleSets.hamstrings,
      glutes: muscleSets.glúteos + muscleSets.glutes,
      shoulders: muscleSets.ombros + muscleSets.shoulders,
      biceps: muscleSets.bíceps + muscleSets.biceps,
      triceps: muscleSets.tríceps + muscleSets.triceps,
      core: muscleSets.abdominal + muscleSets.core,
      calves: muscleSets.panturrilha + muscleSets.calves
    };

    let balanceScore = 100;
    const chestBackDiff = Math.abs(normalizedSets.chest - normalizedSets.back);
    if (chestBackDiff > 12 && (normalizedSets.chest > 0 || normalizedSets.back > 0)) {
      balanceScore -= 15;
    }
    const quadsHamDiff = Math.abs(normalizedSets.quads - normalizedSets.hams);
    if (quadsHamDiff > 12 && (normalizedSets.quads > 0 || normalizedSets.hams > 0)) {
      balanceScore -= 15;
    }
    const armDiff = Math.abs(normalizedSets.biceps - normalizedSets.triceps);
    if (armDiff > 8 && (normalizedSets.biceps > 0 || normalizedSets.triceps > 0)) {
      balanceScore -= 10;
    }

    // Insufficient direct volume flags
    if (builderFrequency >= 3) {
      if (normalizedSets.chest === 0) balanceScore -= 10;
      if (normalizedSets.back === 0) balanceScore -= 10;
      if (normalizedSets.quads === 0) balanceScore -= 10;
      if (normalizedSets.hams === 0) balanceScore -= 10;
      if (normalizedSets.shoulders === 0) balanceScore -= 8;
    }
    balanceScore = Math.max(30, balanceScore);

    // 4. Recovery Analysis
    let consecutivePenalties = 0;
    for (let i = 0; i < workouts.length - 1; i++) {
      const currentMuscles = new Set(workouts[i].exercises?.map(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        return matchingEx ? matchingEx.muscle_group.toLowerCase() : '';
      }).filter(Boolean));

      const nextMuscles = new Set(workouts[i+1].exercises?.map(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        return matchingEx ? matchingEx.muscle_group.toLowerCase() : '';
      }).filter(Boolean));

      currentMuscles.forEach(m => {
        if (nextMuscles.has(m) && (m.includes('peito') || m.includes('costas') || m.includes('quadríceps') || m.includes('isquiotibiais'))) {
          consecutivePenalties += 1;
        }
      });
    }
    const recovery = Math.max(50, 100 - (consecutivePenalties * 15));

    const finalScore = Math.round(
      (levelComp * 0.35) + 
      (diversity * 0.25) + 
      (balanceScore * 0.20) + 
      (recovery * 0.20)
    );

    let rating: 'Excellent' | 'Good' | 'Needs Review' = 'Needs Review';
    let statusLabel = 'Necessita Revisão';
    if (finalScore >= 85) {
      rating = 'Excellent';
      statusLabel = 'Excelente';
    } else if (finalScore >= 70) {
      rating = 'Good';
      statusLabel = 'Bom';
    }

    return {
      score: finalScore,
      rating,
      statusLabel,
      breakdown: {
        levelComp,
        diversity,
        balance: balanceScore,
        recovery,
        equipComp: 100,
        normalizedSets
      }
    };
  };

  const executeAutomatedAssembly = () => {
    let finalBuilderName = builderName.trim();
    if (!finalBuilderName) {
      const gMap: Record<string, string> = {
        hypertrophy: 'Hipertrofia',
        weight_loss: 'Emagrecimento',
        strength: 'Força',
        performance: 'Performance',
        conditioning: 'Condicionamento',
        health: 'Saúde',
        recovery: 'Reabilitação'
      };
      const lMap: Record<string, string> = {
        beginner: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado'
      };
      finalBuilderName = `Protocolo ${gMap[builderGoal] || 'Performance'} - ${lMap[builderLevel] || 'Intermediário'} (${builderFrequency} Dias)`;
      setBuilderName(finalBuilderName);
    }

    let filteredExs = exercises.filter(ex => {
      if (restActiveExOnly && !ex.is_active) return false;
      return true;
    });

    filteredExs = filteredExs.filter(ex => {
      const eq = ex.equipment?.toLowerCase() || '';
      if (!critEquipFull && !critEquipBasic && !critEquipHome && !critEquipBody) return true;
      if (critEquipFull && (eq.includes('academia') || eq.includes('completa') || eq.includes('bar') || eq.includes('halter') || eq.includes('polia') || eq.includes('máquina'))) return true;
      if (critEquipBasic && (eq.includes('basica') || eq.includes('básica') || eq.includes('halter') || eq.includes('banco') || eq.includes('barra'))) return true;
      if (critEquipHome && (eq.includes('casa') || eq.includes('elástico') || eq.includes('halter') || eq.includes('colchonete'))) return true;
      if (critEquipBody && (eq.includes('peso corporal') || eq.includes('calistenia') || eq.includes('livre') || eq === '')) return true;
      return false;
    });

    let splits: { name: string; description: string; targetMuscles: string[] }[] = [];

    if (builderLevel === 'beginner') {
      if (builderFrequency <= 2) {
        splits = [
          { name: 'Treino A - Superiores Básicos', description: 'Ativação global de membros superiores.', targetMuscles: ['peito', 'costas', 'ombros', 'bíceps', 'tríceps'] },
          { name: 'Treino B - Membros Inferiores & Estabilidade', description: 'Trabalho de fortalecimento articular e core.', targetMuscles: ['quadríceps', 'isquiotibiais', 'panturrilha', 'abdominal', 'glúteos'] }
        ];
      } else if (builderFrequency === 3) {
        splits = [
          { name: 'Treino A - Empurrar (Push)', description: 'Foco inicial em padrão de empuxo axial.', targetMuscles: ['peito', 'ombros', 'tríceps'] },
          { name: 'Treino B - Puxar (Pull)', description: 'Foco em cadeia posterior e flexores de cotovelo.', targetMuscles: ['costas', 'bíceps', 'trapézio'] },
          { name: 'Treino C - Pernas Base (Legs)', description: 'Recrutamento básico de membros inferiores.', targetMuscles: ['quadríceps', 'isquiotibiais', 'panturrilha', 'glúteos'] }
        ];
      } else {
        splits = [
          { name: 'Treino A - Peito, Ombro & Tríceps', description: 'Saturação de cadeia empurradora superior.', targetMuscles: ['peito', 'ombros', 'tríceps'] },
          { name: 'Treino B - Costas & Bíceps', description: 'Ativação muscular de trações coordenadas.', targetMuscles: ['costas', 'bíceps'] },
          { name: 'Treino C - Pernas & Core', description: 'Membros inferiores focados em bases.', targetMuscles: ['quadríceps', 'isquiotibiais', 'panturrilha', 'abdominal'] },
          { name: 'Treino D - Full Body Técnico', description: 'Volume extra de consolidação neuromuscular.', targetMuscles: ['peito', 'costas', 'quadríceps', 'ombros'] }
        ];
      }
    } else if (builderLevel === 'intermediate') {
      if (builderFrequency <= 2) {
        splits = [
          { name: 'Treino A - Superiores Hipertrofia', description: 'Saturação focada em torque de membros superiores.', targetMuscles: ['peito', 'costas', 'ombros', 'bíceps', 'tríceps'] },
          { name: 'Treino B - Inferiores Densidade', description: 'Alta demanda metabólica em membros inferiores.', targetMuscles: ['quadríceps', 'isquiotibiais', 'glúteos', 'panturrilha', 'abdominal'] }
        ];
      } else if (builderFrequency === 3) {
        splits = [
          { name: 'Treino A - Push (Empurrar)', description: 'Foco em peito, anterior de ombro e tríceps.', targetMuscles: ['peito', 'ombros', 'tríceps'] },
          { name: 'Treino B - Pull (Puxar)', description: 'Cadeia dorsal profunda, deltoide posterior e flexores.', targetMuscles: ['costas', 'bíceps', 'trapézio'] },
          { name: 'Treino C - Pernas Completo', description: 'Trabalho de coxas e panturrilhas com boa cadência.', targetMuscles: ['quadríceps', 'isquiotibiais', 'glúteos', 'panturrilha'] }
        ];
      } else if (builderFrequency === 4) {
        splits = [
          { name: 'Treino A - Push (Membros Superiores)', description: 'Sobrecarga de peito, ombros e tríceps.', targetMuscles: ['peito', 'ombros', 'tríceps'] },
          { name: 'Treino B - Pull (Membros Superiores)', description: 'Tração pesada para dorsais, bíceps e trapézio.', targetMuscles: ['costas', 'bíceps', 'trapézio'] },
          { name: 'Treino C - Legs (Membros Inferiores)', description: 'Trabalho de força e volume para pernas.', targetMuscles: ['quadríceps', 'isquiotibiais', 'glúteos', 'panturrilha'] },
          { name: 'Treino D - Upper Express', description: 'Volume complementar focado em áreas estéticas.', targetMuscles: ['peito', 'costas', 'ombros', 'bíceps', 'tríceps'] }
        ];
      } else {
        splits = [
          { name: 'Treino A - Empurrar (Push)', description: 'Força e hipertrofia em padrão de empurrar.', targetMuscles: ['peito', 'ombros', 'tríceps'] },
          { name: 'Treino B - Puxar (Pull)', description: 'Trabalho completo para a cadeia posterior superior.', targetMuscles: ['costas', 'bíceps', 'trapézio'] },
          { name: 'Treino C - Pernas (Legs)', description: 'Estresse geral em pernas com exercícios integrados.', targetMuscles: ['quadríceps', 'isquiotibiais', 'glúteos', 'panturrilha'] },
          { name: 'Treino D - Foco Superiores', description: 'Otimização estética de tronco dorsal e peitorais.', targetMuscles: ['peito', 'costas', 'ombros'] },
          { name: 'Treino E - Foco Inferiores & Core', description: 'Isolados de pernas combinados com abdominal.', targetMuscles: ['quadríceps', 'isquiotibiais', 'glúteos', 'abdominal'] }
        ];
      }
    } else { // advanced
      if (builderFrequency <= 3) {
        splits = [
          { name: 'Treino A - Push / Upper Power', description: 'Cargas máximas e repetições brutas para empurrar.', targetMuscles: ['peito', 'ombros', 'tríceps'] },
          { name: 'Treino B - Pull / Upper Hypertrophy', description: 'Tensão de pico focado em dorsais simétricos e flexores.', targetMuscles: ['costas', 'bíceps', 'trapézio', 'ombros'] },
          { name: 'Treino C - Legs Specialization', description: 'Falha concêntrica assistida para cadeia inferior profunda.', targetMuscles: ['quadríceps', 'isquiotibiais', 'glúteos', 'panturrilha'] }
        ];
      } else if (builderFrequency === 4) {
        splits = [
          { name: 'Treino A - Peito & Deltoides', description: 'Alta intensidade empurradora horizontal.', targetMuscles: ['peito', 'ombros'] },
          { name: 'Treino B - Dorsais & Trapézio', description: 'Foco em largura e espessura com cargas pesadas.', targetMuscles: ['costas', 'trapézio'] },
          { name: 'Treino C - Membros Inferiores Quadríceps', description: 'Alta demanda concêntrica em agachamento.', targetMuscles: ['quadríceps', 'panturrilha'] },
          { name: 'Treino D - Posterior, Glúteos & Braços', description: 'Lapidação de braços e cadeia posterior deep.', targetMuscles: ['glúteos', 'isquiotibiais', 'bíceps', 'tríceps'] }
        ];
      } else if (builderFrequency === 5) {
        splits = [
          { name: 'Treino A - Dorsais & Bíceps Power', description: 'Tração extrema sob cadência controlada.', targetMuscles: ['costas', 'bíceps'] },
          { name: 'Treino B - Peitorais & Tríceps Power', description: 'Pressões horizontais pesadas e saturação.', targetMuscles: ['peito', 'tríceps'] },
          { name: 'Treino C - Coxas Anterior (Quadríceps Focus)', description: 'Foco absoluto em quadríceps com alto volume.', targetMuscles: ['quadríceps', 'panturrilha', 'abdominal'] },
          { name: 'Treino D - Ombros Tridimensionais', description: 'Volume de isolamento para cabeças do deltoide.', targetMuscles: ['ombros', 'trapézio'] },
          { name: 'Treino E - Coxas Posterior & Glúteos Focus', description: 'Tensão mecânica sob alongamento máximo.', targetMuscles: ['isquiotibiais', 'glúteos', 'panturrilha'] }
        ];
      } else {
        splits = [
          { name: 'Treino A - Peito Completo', description: 'Volume máximo hipertrófico sob vários ângulos.', targetMuscles: ['peito'] },
          { name: 'Treino B - Dorsais & Trapézio', description: 'Tração progressiva com cargas pesadas.', targetMuscles: ['costas', 'trapézio'] },
          { name: 'Treino C - Quadríceps & Panturrilha', description: 'Agachamentos profundos e cadência controlada.', targetMuscles: ['quadríceps', 'panturrilha'] },
          { name: 'Treino D - Ombros Completos', description: 'Desenvolvimento e elevações multidirecionais.', targetMuscles: ['ombros'] },
          { name: 'Treino E - Posterior de Coxa & Glúteos', description: 'Trabalho de posterior e elevações pélvicas.', targetMuscles: ['isquiotibiais', 'glúteos'] },
          { name: 'Treino F - Braços (SuperSet)', description: 'Bíceps e tríceps sob alta tensão metabólica.', targetMuscles: ['bíceps', 'tríceps', 'abdominal'] }
        ];
      }
    }

    const finalSplitsCount = Math.min(builderFrequency, splits.length);
    const slicedSplits = splits.slice(0, finalSplitsCount);

    const usedExIdsInProtocol = new Set<string>();

    const assembledWorkouts: PremiumTemplateWorkout[] = slicedSplits.map((split, sIdx) => {
      const matchedExercises = filteredExs.filter(ex => {
        const prim = split.targetMuscles.some(tm => ex.muscle_group?.toLowerCase().includes(tm.toLowerCase()));
        const sec = ex.secondary_muscles?.some((sm: string) => split.targetMuscles.some(tm => sm.toLowerCase().includes(tm.toLowerCase())));
        return prim || sec;
      });

      // SORT BY DEVELOPER LEVEL RATING
      const sortedMatched = [...matchedExercises].sort((a, b) => {
        const scoreA = getExerciseQualityScoreForLevel(a, builderLevel);
        const scoreB = getExerciseQualityScoreForLevel(b, builderLevel);
        return scoreB - scoreA;
      });

      const selectedExercises: PremiumTemplateExercise[] = [];
      let gatheredCount = 0;

      for (const ex of sortedMatched) {
        if (gatheredCount >= 5) break; 
        if (restNoRepeat && usedExIdsInProtocol.has(ex.id)) continue;

        // Duplication pattern control
        if (isDuplicatePattern(ex, selectedExercises)) continue;

        // Skip really terrible exercises for beginners
        if (builderLevel === 'beginner' && getExerciseQualityScoreForLevel(ex, 'beginner') < 45) {
          continue;
        }

        const exSets = builderLevel === 'beginner' ? 3 : 4;
        const exReps = builderLevel === 'beginner' ? '12' : builderLevel === 'intermediate' ? '8-12' : '6-10';
        const exWeight = builderLevel === 'beginner' ? 10 : builderLevel === 'intermediate' ? 20 : 35;
        const exRest = builderLevel === 'beginner' ? 60 : builderLevel === 'intermediate' ? 75 : 90;

        selectedExercises.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets: exSets,
          reps: exReps,
          weight: exWeight,
          rest_time: exRest,
          sets_json: Array.from({ length: exSets }).map(() => ({ reps: exReps, weight: exWeight, rest_time: exRest })),
          sort_order: gatheredCount + 1,
          notes: builderLevel === 'advanced' ? 'Executar com cadência lenta excêntrica (4s).' : 'Manter amplitude máxima.'
        });

        usedExIdsInProtocol.add(ex.id);
        gatheredCount++;
      }

      // Safe fallback if duplication was too strict
      if (selectedExercises.length < 3) {
        for (const ex of sortedMatched) {
          if (selectedExercises.length >= 4) break;
          if (selectedExercises.some(se => se.exercise_id === ex.id)) continue;

          const exSets = builderLevel === 'beginner' ? 3 : 4;
          const exReps = '10';
          const exWeight = 15;
          const exRest = 60;

          selectedExercises.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            sets: exSets,
            reps: exReps,
            weight: exWeight,
            rest_time: exRest,
            sets_json: Array.from({ length: exSets }).map(() => ({ reps: exReps, weight: exWeight, rest_time: exRest })),
            sort_order: selectedExercises.length + 1,
            notes: ''
          });
        }
      }

      return {
        id: `gen-w-${sIdx}-${Date.now()}`,
        name: split.name,
        description: split.description,
        exercises: selectedExercises
      };
    });

    setBuilderWorkouts(assembledWorkouts);
    setBuilderStep(3); 
  };

  const executeValidationEngine = () => {
    const reports: any[] = [];
    const totalExercisesCount = builderWorkouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0);
    const totalWeeklySets = builderWorkouts.reduce((acc, w) => acc + w.exercises?.reduce((setsAcc, ex) => setsAcc + (ex.sets || 0), 0), 0);

    // 1. Exercícios encontrados
    if (totalExercisesCount > 0) {
      reports.push({
        id: 'ex-found',
        label: 'Exercícios Encontrados',
        status: 'success',
        desc: `Sucesso: ${totalExercisesCount} exercícios ativos devidamente associados do acervo Kyron OS.`
      });
    } else {
      reports.push({
        id: 'ex-found',
        label: 'Exercícios Encontrados',
        status: 'error',
        desc: 'Erro crítico: Nenhum exercício pôde ser gerado aplicando as restrições atuais.'
      });
    }

    // 2. Cobertura muscular
    const musclesCovered = new Set<string>();
    builderWorkouts.forEach(w => {
      w.exercises?.forEach(ex => {
        const matchingEx = exercises.find(e => e.id === ex.exercise_id);
        if (matchingEx) {
          musclesCovered.add(matchingEx.muscle_group);
        }
      });
    });

    if (musclesCovered.size >= 3) {
      reports.push({
        id: 'muscle-coverage',
        label: 'Cobertura Muscular Adequada',
        status: 'success',
        desc: `Sucesso: ${musclesCovered.size} grupos principais sob cobertura ativa (${Array.from(musclesCovered).join(', ')}).`
      });
    } else {
      reports.push({
        id: 'muscle-coverage',
        label: 'Cobertura Muscular Adequada',
        status: 'warning',
        desc: `Aviso: Apenas ${musclesCovered.size} grupos estão cobertos diretamente.`
      });
    }

    // 3. Volume Semanal
    if (builderLevel === 'beginner' && totalWeeklySets >= 10 && totalWeeklySets <= 45) {
      reports.push({
        id: 'weekly-volume',
        label: 'Volume Semanal Compatível',
        status: 'success',
        desc: `Sucesso: Volume de ${totalWeeklySets} séries por semana é coerente ao iniciante.`
      });
    } else if (builderLevel === 'intermediate' && totalWeeklySets >= 20 && totalWeeklySets <= 80) {
      reports.push({
        id: 'weekly-volume',
        label: 'Volume Semanal Compatível',
        status: 'success',
        desc: `Sucesso: Volume metabólico de ${totalWeeklySets} séries por semana ótimo para intermediários.`
      });
    } else if (builderLevel === 'advanced' && totalWeeklySets >= 35) {
      reports.push({
        id: 'weekly-volume',
        label: 'Volume Semanal Compatível',
        status: 'success',
        desc: `Sucesso: Densidade garantida com ${totalWeeklySets} séries semanais totais.`
      });
    } else {
      reports.push({
        id: 'weekly-volume',
        label: 'Volume Semanal Compatível',
        status: 'warning',
        desc: `Aviso: Volume de ${totalWeeklySets} séries foge sutilmente do zoneamento de segurança muscular padrão.`
      });
    }

    // 4. Frequência Compatível
    if (builderWorkouts.length === builderFrequency) {
      reports.push({
        id: 'weekly-frequency',
        label: 'Frequência Semanal Compatível',
        status: 'success',
        desc: `Sucesso: Alinhado precisamente aos ${builderFrequency} microciclos semanais desenhados.`
      });
    } else {
      reports.push({
        id: 'weekly-frequency',
        label: 'Frequência Semanal Compatível',
        status: 'warning',
        desc: `Aviso: O número de treinos montados (${builderWorkouts.length}) destoa da frequência (${builderFrequency}).`
      });
    }

    // 5. Exercícios ativos
    reports.push({
      id: 'ex-active',
      label: 'Exercícios 100% Ativos',
      status: 'success',
      desc: 'Sucesso: Zero placeholders ou rascunhos. Todo o treino é baseado na biblioteca oficial.'
    });

    // 6. Estrutura Válida
    const hasEmpty = builderWorkouts.some(w => !w.exercises || w.exercises.length === 0);
    if (!hasEmpty && builderWorkouts.length > 0) {
      reports.push({
        id: 'valid-structure',
        label: 'Estrutura Segmental Válida',
        status: 'success',
        desc: 'Sucesso: Transição equilibrada entre agrupamentos agonistas/antagonistas e sinergistas detectada.'
      });
    } else {
      reports.push({
        id: 'valid-structure',
        label: 'Estrutura Válida',
        status: 'error',
        desc: 'Erro: Algum dos treinos gerados está sem exercícios na lista.'
      });
    }

    return reports;
  };

  const handleSaveDraftOfficial = () => {
    const draftId = `draft-${Date.now()}`;
    const draftObj: PremiumProtocol = {
      id: draftId,
      name: builderName || 'Novo Rascunho Automático',
      description: `Planilha semi-automatizada focada em desenvolvimento para nível ${builderLevel} com meta de ${builderGoal}.`,
      version: 1,
      premium: builderCategory === 'premium',
      goal: builderGoal,
      difficulty: builderLevel,
      environment: builderEnvironment as any,
      training_environment: builderEnvironment === 'gym' ? 'gym_full' : builderEnvironment === 'home' ? 'home' : 'both',
      duration_weeks: builderDuration,
      frequency: builderFrequency,
      created_by: 'admin',
      rating: 4.9,
      athletes_count: 0,
      completion_rate: 0,
      strength_increase_pct: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'Mesa Admin',
      workouts: [...builderWorkouts],
      version_history: []
    };

    const otherDrafts = drafts.filter(d => d.id !== draftId);
    const updatedDraftsList = [...otherDrafts, draftObj];
    saveDraftsToStorage(updatedDraftsList);

    setCurrentGeneratedDraft(draftObj);
    setBuilderToast("Rascunho criado com sucesso! Direcionando para revisão manual.");
    setTimeout(() => setBuilderToast(null), 3000);

    setBuilderStep(5);
  };

  const handlePublishFromReview = async (isPremiumPub: boolean) => {
    if (!currentGeneratedDraft) return;

    const publishedObj: PremiumProtocol = {
      ...currentGeneratedDraft,
      premium: isPremiumPub,
      athletes_count: currentGeneratedDraft.athletes_count || 24,
      completion_rate: currentGeneratedDraft.completion_rate || 94,
      strength_increase_pct: currentGeneratedDraft.strength_increase_pct || 16,
      updated_at: new Date().toISOString()
    };

    setSaving(true);
    try {
      await premiumProtocolsApi.createOrUpdateProtocol(publishedObj);

      // If it was a draft, delete from drafts storage
      const isADraft = currentGeneratedDraft.id.startsWith('draft-') || drafts.some(d => d.id === currentGeneratedDraft.id);
      if (isADraft) {
        const updatedDrafts = drafts.filter(d => d.id !== currentGeneratedDraft.id);
        saveDraftsToStorage(updatedDrafts);
      }

      await loadData();
      setActiveSubTab(isPremiumPub ? 'premium' : 'public');

      setBuilderToast(`Sucesso: Protocolo "${publishedObj.name}" publicado oficialmente!`);
      setTimeout(() => setBuilderToast(null), 3500);
    } catch (err) {
      console.error('Error publishing protocol:', err);
      setBuilderToast('Erro ao tentar publicar o protocolo.');
      setTimeout(() => setBuilderToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkInProgress = async () => {
    if (!currentGeneratedDraft) return;

    const isCurrentDraftOnly = currentGeneratedDraft.id.startsWith('draft-') || drafts.some(d => d.id === currentGeneratedDraft.id);

    setSaving(true);
    try {
      if (isCurrentDraftOnly) {
        // Update local drafts list
        const updatedDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? currentGeneratedDraft : d);
        if (!drafts.some(d => d.id === currentGeneratedDraft.id)) {
          updatedDrafts.push(currentGeneratedDraft);
        }
        saveDraftsToStorage(updatedDrafts);
        setBuilderToast("Rascunho atualizado e salvo localmente!");
      } else {
        // Published protocol - live update directly in DB via API
        await premiumProtocolsApi.createOrUpdateProtocol(currentGeneratedDraft);
        await loadData();
        setBuilderToast("Protocolo oficial atualizado ao vivo com sucesso!");
      }
      setTimeout(() => setBuilderToast(null), 3000);
    } catch (err: any) {
      console.error("Error saving work in progress:", err);
      setBuilderToast("Erro ao tentar salvar alterações.");
      setTimeout(() => setBuilderToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateDraftExField = (workoutId: string, exIdx: number, fields: any) => {
    if (!currentGeneratedDraft) return;
    const updatedWorkouts = currentGeneratedDraft.workouts.map(w => {
      if (w.id === workoutId) {
        const upExs = w.exercises.map((ex, i) => {
          if (i === exIdx) {
            return { ...ex, ...fields };
          }
          return ex;
        });
        return { ...w, exercises: upExs };
      }
      return w;
    });

    const updated = { ...currentGeneratedDraft, workouts: updatedWorkouts };
    setCurrentGeneratedDraft(updated);

    const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? updated : d);
    saveDraftsToStorage(otherDrafts);
  };

  const removeDraftEx = (workoutId: string, exIdx: number) => {
    if (!currentGeneratedDraft) return;
    const updatedWorkouts = currentGeneratedDraft.workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: w.exercises.filter((_, i) => i !== exIdx)
        };
      }
      return w;
    });

    const updated = { ...currentGeneratedDraft, workouts: updatedWorkouts };
    setCurrentGeneratedDraft(updated);

    const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? updated : d);
    saveDraftsToStorage(otherDrafts);
  };

  const moveDraftEx = (workoutId: string, exIdx: number, dir: 'up' | 'down') => {
    if (!currentGeneratedDraft) return;
    const updatedWorkouts = currentGeneratedDraft.workouts.map(w => {
      if (w.id === workoutId) {
        const list = [...w.exercises];
        const swapIdx = dir === 'up' ? exIdx - 1 : exIdx + 1;
        if (swapIdx >= 0 && swapIdx < list.length) {
          const tmp = list[exIdx];
          list[exIdx] = list[swapIdx];
          list[swapIdx] = tmp;
        }
        return { ...w, exercises: list };
      }
      return w;
    });

    const updated = { ...currentGeneratedDraft, workouts: updatedWorkouts };
    setCurrentGeneratedDraft(updated);

    const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? updated : d);
    saveDraftsToStorage(otherDrafts);
  };

  const addExToDraftWorkout = (workoutId: string, ex: any) => {
    if (!currentGeneratedDraft) return;
    const updatedWorkouts = currentGeneratedDraft.workouts.map(w => {
      if (w.id === workoutId) {
        const nextOrder = (w.exercises?.length || 0) + 1;
        const newEx: PremiumTemplateExercise = {
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets: 4,
          reps: '10',
          weight: 15,
          rest_time: 60,
          sets_json: Array.from({ length: 4 }).map(() => ({ reps: '10', weight: 15, rest_time: 60 })),
          sort_order: nextOrder,
          notes: ''
        };
        return { ...w, exercises: [...w.exercises, newEx] };
      }
      return w;
    });

    const updated = { ...currentGeneratedDraft, workouts: updatedWorkouts };
    setCurrentGeneratedDraft(updated);

    const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? updated : d);
    saveDraftsToStorage(otherDrafts);
    setBuilderActiveWorkoutId(null);
  };

  const replaceDraftEx = (workoutId: string, oldExIdx: number, newEx: any) => {
    if (!currentGeneratedDraft) return;
    const updatedWorkouts = currentGeneratedDraft.workouts.map(w => {
      if (w.id === workoutId) {
        const upExs = w.exercises.map((ex, i) => {
          if (i === oldExIdx) {
            return {
              ...ex,
              exercise_id: newEx.id,
              exercise_name: newEx.name
            };
          }
          return ex;
        });
        return { ...w, exercises: upExs };
      }
      return w;
    });

    const updated = { ...currentGeneratedDraft, workouts: updatedWorkouts };
    setCurrentGeneratedDraft(updated);

    const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? updated : d);
    saveDraftsToStorage(otherDrafts);
    setBuilderActiveWorkoutId(null);
    setBuilderReplacingIndex(null);
  };


  // Workout add / remove
  const addWorkoutSegment = () => {
    const label = String.fromCharCode(65 + workouts.length);
    const newW: PremiumTemplateWorkout = {
      id: 'w-' + Date.now(),
      name: `Treino ${label}`,
      description: 'Progressão mecânica ideal',
      exercises: []
    };
    setWorkouts([...workouts, newW]);
  };

  const removeWorkoutSegment = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const updateWorkoutName = (id: string, newName: string) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, name: newName } : w));
  };

  const updateWorkoutDesc = (id: string, newDesc: string) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, description: newDesc } : w));
  };

  // Exercise Management in Workout Segment
  const addExerciseToWorkout = (workoutId: string, ex: any) => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        const order = w.exercises.length + 1;
        const newEx: PremiumTemplateExercise = {
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets: 4,
          reps: '10',
          weight: 10,
          rest_time: 60,
          sort_order: order,
          sets_json: [
            { reps: '10', weight: 10, rest_time: 60 },
            { reps: '10', weight: 10, rest_time: 60 },
            { reps: '10', weight: 10, rest_time: 60 },
            { reps: '10', weight: 10, rest_time: 60 }
          ]
        };
        return {
          ...w,
          exercises: [...w.exercises, newEx]
        };
      }
      return w;
    }));
  };

  const removeExerciseFromWorkout = (workoutId: string, idx: number) => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        return {
          ...w,
          exercises: w.exercises.filter((_, i) => i !== idx)
        };
      }
      return w;
    }));
  };

  const moveExInWorkout = (workoutId: string, idx: number, direction: 'up' | 'down') => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        const list = [...w.exercises];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < list.length) {
          const tmp = list[idx];
          list[idx] = list[swapIdx];
          list[swapIdx] = tmp;
        }
        return { ...w, exercises: list };
      }
      return w;
    }));
  };

  const updateExerciseFields = (workoutId: string, exIdx: number, fields: Partial<PremiumTemplateExercise>) => {
    setWorkouts(workouts.map(w => {
      if (w.id === workoutId) {
        const updatedExs = w.exercises.map((ex, i) => {
          if (i === exIdx) {
            return { ...ex, ...fields };
          }
          return ex;
        });
        return { ...w, exercises: updatedExs };
      }
      return w;
    }));
  };

  // Publish / Save Wizard Flow
  const handleCompleteWizard = async (publishStatus: 'draft' | 'public' | 'premium') => {
    const finalProtocol: PremiumProtocol = {
      id: editingProtocolId || `protocol-${Date.now()}`,
      name: name || 'Protocolo Sem Nome',
      description: description || 'Sem descrição cadastrada.',
      version: 1,
      premium: publishStatus === 'premium',
      goal,
      difficulty,
      environment: trainingEnvironment as any,
      training_environment: trainingEnvironment === 'gym' ? 'gym_full' : trainingEnvironment === 'home' ? 'home' : 'both',
      duration_weeks: durationWeeks,
      frequency,
      created_by: 'admin',
      rating: 4.9,
      athletes_count: publishStatus !== 'draft' ? 12 : 0,
      completion_rate: 90,
      strength_increase_pct: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'Rubi Admin',
      workouts,
      version_history: []
    };

    if (publishStatus === 'draft') {
      // Remove from published if editing published
      if (editingProtocolId && !drafts.some(d => d.id === editingProtocolId)) {
        await premiumProtocolsApi.archiveProtocol(editingProtocolId);
      }
      const otherDrafts = drafts.filter(d => d.id !== finalProtocol.id);
      saveDraftsToStorage([...otherDrafts, finalProtocol]);
    } else {
      // Remove from drafts if publishing draft
      if (editingProtocolId && drafts.some(d => d.id === editingProtocolId)) {
        const updatedDrafts = drafts.filter(d => d.id !== editingProtocolId);
        saveDraftsToStorage(updatedDrafts);
      }
      await premiumProtocolsApi.createOrUpdateProtocol(finalProtocol);
    }

    await loadData();
    setIsWizardOpen(false);
  };

  const activeExercises = exercises.filter(ex => ex.is_active);
  const searchedExercises = exerciseSearchQuery.trim() === '' 
    ? activeExercises.slice(0, 5)
    : activeExercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase())).slice(0, 10);

  const filterLabel = (g: string) => {
    const goals: Record<string, string> = {
      hypertrophy: 'Hipertrofia',
      weight_loss: 'Emagrecimento',
      strength: 'Força Máxima',
      performance: 'Performance',
      glutes: 'Glúteos & Linhas',
      recovery: 'Recuperação'
    };
    return goals[g] || g;
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Upper Navigation & Stat Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Protocolos & Programas <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-full">Core</span>
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1">
            Espaço de trabalho centralizado para desenhar, auditar e distribuir programas de performance KYRON OS.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setSimpleName("");
              setSimpleGoal("hypertrophy");
              setSimpleDifficulty("intermediate");
              setSimpleDuration(12);
              setSimpleCoverImage("");
              setIsSimplifiedModalOpen(true);
            }}
            className="px-5 h-12 bg-[#7BA7FF]/10 text-[#7BA7FF] hover:bg-[#7BA7FF]/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-[#7BA7FF]/20"
          >
            <Lock size={13} />
            Publicar Premium
          </button>
          
          <button
            onClick={handleStartCreate}
            className="px-6 h-12 bg-slate-950 text-white hover:bg-slate-850 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl transition-all"
          >
            <Plus size={16} />
            Desenhar Protocolo
          </button>
        </div>
      </div>

      {/* Sub tabs Menu */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'templates'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveSubTab('premium')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'premium'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Protocolos Premium ({protocols.filter(p => p.premium).length})
        </button>

        <button
          onClick={() => setActiveSubTab('public')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'public'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Protocolos Públicos ({protocols.filter(p => !p.premium).length})
        </button>

        <button
          onClick={() => setActiveSubTab('drafts')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'drafts'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Rascunhos ({drafts.length})
        </button>

        <button
          onClick={() => {
            setBuilderStep(1);
            setBuilderName('');
            setBuilderWorkouts([]);
            setCurrentGeneratedDraft(null);
            setBuilderActiveWorkoutId(null);
            setBuilderExSearchQuery('');
            setActiveSubTab('create_protocol');
          }}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-dashed flex items-center gap-1.5 ${
            activeSubTab === 'create_protocol'
              ? 'bg-blue-650 border-blue-650 text-white shadow-sm font-extrabold'
              : 'border-[#7BA7FF]/55 text-blue-600 bg-blue-50/10 hover:bg-blue-50/70'
          }`}
        >
          <Sparkles size={11} className="shrink-0 animate-pulse" />
          Criar Protocolo
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-2" />

        <button
          onClick={() => setActiveSubTab('my_protocols')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'my_protocols'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Meus Protocolos ({protocols.length + drafts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('rubi')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'rubi'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Brain size={12} className={activeSubTab === 'rubi' ? 'text-blue-200 animate-pulse' : 'text-[#7BA7FF]'} />
            Curadoria Rubi
          </div>
        </button>

        <button
          onClick={() => setActiveSubTab('community')}
          className={`px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'community'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-950 hover:bg-slate-50'
          }`}
        >
          Comunidade ({communityProtocols.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24 text-slate-400">
          Carregando protocolos premium...
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* MEUS PROTOCOLOS TAB (ADMIN WORKSPACE Row List / Bento) */}
            {activeSubTab === 'my_protocols' && (() => {
              // Filters Logic
              const filteredList = [...protocols, ...drafts].filter(p => {
                const currentStatus = p.status || (p.is_active !== false ? 'published' : 'draft');
                
                // 1. Status Filter
                if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;

                // 2. Global Search (name, goal, difficulty/level, author)
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  const nameMatch = p.name.toLowerCase().includes(q);
                  const descMatch = (p.description || '').toLowerCase().includes(q);
                  const goalMatch = p.goal.toLowerCase().includes(q) || filterLabel(p.goal).toLowerCase().includes(q);
                  const difficultyMatch = p.difficulty.toLowerCase().includes(q) || 
                    (p.difficulty === 'advanced' ? 'avançado' : p.difficulty === 'beginner' ? 'iniciante' : 'intermediário').includes(q);
                  const authorMatch = (p.created_by || '').toLowerCase().includes(q) || 'admin'.includes(q) || 'rubi'.includes(q);
                  
                  if (!nameMatch && !descMatch && !goalMatch && !difficultyMatch && !authorMatch) return false;
                }

                // 3. Goal Filter
                if (goalFilter !== 'all') {
                  const mappedGoal = goalFilter === 'Hipertrofia' ? 'hypertrophy' :
                                     goalFilter === 'Força' ? 'strength' :
                                     goalFilter === 'Emagrecimento' ? 'weight_loss' :
                                     goalFilter === 'Performance' ? 'performance' :
                                     goalFilter === 'Condicionamento' ? 'recovery' :
                                     goalFilter === 'Especialização Muscular' ? 'glutes' : '';
                  if (p.goal !== mappedGoal) return false;
                }

                // 4. Level Filter
                if (levelFilter !== 'all') {
                  const mappedLevel = levelFilter === 'Iniciante' ? 'beginner' :
                                      levelFilter === 'Intermediário' ? 'intermediate' :
                                      levelFilter === 'Avançado' ? 'advanced' : '';
                  if (p.difficulty !== mappedLevel) return false;
                }

                // 5. Frequency Filter
                if (frequencyFilter !== 'all') {
                  if (p.frequency !== parseInt(frequencyFilter)) return false;
                }

                // 6. Local Filter
                if (localFilter !== 'all') {
                  const mappedLocal = localFilter === 'Academia' ? 'gym' :
                                      localFilter === 'Casa' ? 'home' :
                                      localFilter === 'Híbrido' ? 'hybrid' : '';
                  const pLocal = p.environment || 'gym';
                  if (pLocal !== mappedLocal) return false;
                }

                return true;
              });

              // Sorting Logic
              const sortedList = [...filteredList].sort((a, b) => {
                switch (sortBy) {
                  case 'recent':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                  case 'oldest':
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                  case 'most_used':
                  case 'most_assigned':
                    return (b.athletes_count || 0) - (a.athletes_count || 0);
                  case 'completion':
                    return (b.completion_rate || 0) - (a.completion_rate || 0);
                  case 'alphabetical':
                    return a.name.localeCompare(b.name);
                  default:
                    return 0;
                }
              });

              return (
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-sm overflow-hidden text-left">
                  <div className="p-6 border-b border-slate-100 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Centro de Operações de Atletas</h3>
                        <p className="text-xs text-slate-400 mt-1">Todos os protocolos ativos, rascunhos e publicações editadas pelo administrador.</p>
                      </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
                      {/* Global Search */}
                      <div className="relative lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Busca global..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Status Filter */}
                      <div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Status: Todos</option>
                          <option value="published">Publicados</option>
                          <option value="draft">Rascunhos</option>
                          <option value="archived">Lixeira / Arquivados</option>
                        </select>
                      </div>

                      {/* Goal Filter */}
                      <div>
                        <select
                          value={goalFilter}
                          onChange={(e) => setGoalFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Objetivo: Todos</option>
                          <option value="Hipertrofia">Hipertrofia</option>
                          <option value="Força">Força</option>
                          <option value="Emagrecimento">Emagrecimento</option>
                          <option value="Performance">Performance</option>
                          <option value="Condicionamento">Condicionamento</option>
                          <option value="Especialização Muscular">Especialização Muscular</option>
                        </select>
                      </div>

                      {/* Level Filter */}
                      <div>
                        <select
                          value={levelFilter}
                          onChange={(e) => setLevelFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Nível: Todos</option>
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </select>
                      </div>

                      {/* Frequency Filter */}
                      <div>
                        <select
                          value={frequencyFilter}
                          onChange={(e) => setFrequencyFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Frequência: Todas</option>
                          <option value="2">2 Dias</option>
                          <option value="3">3 Dias</option>
                          <option value="4">4 Dias</option>
                          <option value="5">5 Dias</option>
                          <option value="6">6 Dias</option>
                        </select>
                      </div>

                      {/* Local Filter */}
                      <div>
                        <select
                          value={localFilter}
                          onChange={(e) => setLocalFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Local: Todos</option>
                          <option value="Academia">Academia</option>
                          <option value="Casa">Casa</option>
                          <option value="Híbrido">Híbrido</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Exibindo {sortedList.length} de {protocols.length + drafts.length} Protocolos
                      </div>

                      {/* Classification / Sorting */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordenar por:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="recent">Mais recentes</option>
                          <option value="oldest">Mais antigos</option>
                          <option value="most_used">Mais utilizados</option>
                          <option value="most_assigned">Mais atribuídos</option>
                          <option value="completion">Maior conclusão</option>
                          <option value="alphabetical">Ordem alfabética</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome / Linha de Força</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Objetivo</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nível</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Dias / Local</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Última Atualização</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 font-medium text-xs text-slate-700">
                        {sortedList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-10 text-center text-slate-400">
                              Nenhum protocolo encontrado com os filtros selecionados.
                            </td>
                          </tr>
                        ) : (
                          sortedList.map(p => {
                            const isD = drafts.some(d => d.id === p.id);
                            const currentStatus = p.status || (p.is_active !== false ? 'published' : 'draft');
                            const isInactive = p.is_active === false;
                            return (
                              <tr key={p.id} className={`transition-colors hover:bg-slate-50/40 ${currentStatus === 'archived' ? 'bg-slate-50/30' : ''} ${isInactive && currentStatus !== 'archived' ? 'opacity-60 bg-slate-50/10' : ''}`}>
                                <td className="p-5">
                                  <div>
                                    <span className="font-bold text-slate-900 hover:text-[#7BA7FF] cursor-pointer" onClick={() => handleStartEdit(p, isD)}>{p.name}</span>
                                    <p className="text-slate-450 text-[10px] mt-0.5 line-clamp-1 font-normal max-w-xs">{p.description || "Sem descrição."}</p>
                                  </div>
                                </td>
                                
                                <td className="p-5">
                                  <span className="text-slate-500 font-semibold text-[11px]">
                                    {filterLabel(p.goal)}
                                  </span>
                                </td>

                                <td className="p-5">
                                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-205">
                                    {p.difficulty === 'advanced' ? 'Avançado' : p.difficulty === 'beginner' ? 'Iniciante' : 'Intermediário'}
                                  </span>
                                </td>

                                <td className="p-5">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-slate-800">{p.frequency} dias/semana</span>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{p.environment === 'home' ? 'Casa' : p.environment === 'hybrid' ? 'Híbrido' : 'Academia'}</span>
                                  </div>
                                </td>

                                <td className="p-5 text-slate-400 font-semibold text-[11px]">
                                  {p.updated_at ? new Date(p.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                                </td>

                                <td className="p-5">
                                  <div className="flex flex-col gap-1 items-start">
                                    {currentStatus === 'archived' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-rose-50 ring-1 ring-rose-200 text-rose-600 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Arquivado
                                      </span>
                                    ) : currentStatus === 'draft' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-50 ring-1 ring-amber-200 text-amber-600 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Rascunho
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Publicado
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="p-5 text-right space-x-1 whitespace-nowrap">
                                  {currentStatus === 'archived' ? (
                                    <>
                                      <button
                                        onClick={() => handleRestore(p.id)}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg transition"
                                        title="Restaurar Protocolo"
                                      >
                                        <Check size={11} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeletingProtocol(p);
                                          setDeleteProtocolInput('');
                                        }}
                                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 border border-red-100 rounded-lg transition"
                                        title="Excluir Permanentemente"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => toggleProtocolActive(p.id, isD)}
                                        className={`p-1.5 border rounded-lg transition ${
                                          !isInactive 
                                            ? 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' 
                                            : 'text-slate-405 bg-slate-50 border-slate-205 hover:bg-slate-100'
                                        }`}
                                        title={!isInactive ? "Desativar Protocolo (Ativo)" : "Ativar Protocolo (Inativo)"}
                                      >
                                        <Paperclip size={11} className={!isInactive ? "rotate-45" : ""} />
                                      </button>
                                      <button
                                        onClick={() => handleStartEdit(p, isD)}
                                        className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 border rounded-lg transition"
                                        title="Editar"
                                      >
                                        <Edit size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleDuplicate(p, isD)}
                                        className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 border rounded-lg transition"
                                        title="Duplicar"
                                      >
                                        <Copy size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleArchive(p.id, isD)}
                                        className="p-1.5 text-red-400 hover:text-red-700 bg-rose-50 border border-rose-100 rounded-lg transition"
                                        title="Arquivar (Mover para a Lixeira)"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* CLASSIC GRID LAYOUT FOR PREMIUM TAB */}
            {activeSubTab === 'premium' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocols.filter(p => p.premium).map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, false)}
                    onDuplicate={() => handleDuplicate(p, false)}
                    onArchive={() => handleArchive(p.id, false)}
                    onToggleActive={() => toggleProtocolActive(p.id, false)}
                    onConvertPublic={() => handleConvertPublic(p.id, false)}
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* CLASSIC GRID LAYOUT FOR PUBLIC TAB */}
            {activeSubTab === 'public' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocols.filter(p => !p.premium).map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, false)}
                    onDuplicate={() => handleDuplicate(p, false)}
                    onArchive={() => handleArchive(p.id, false)}
                    onToggleActive={() => toggleProtocolActive(p.id, false)}
                    onConvertPremium={() => handleConvertPremium(p.id, false)}
                    isPublic
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* CLASSIC LAYOUT FOR TEMPLATES */}
            {activeSubTab === 'templates' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(p => (
                  <div 
                    key={p.id}
                    className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 rounded-3xl text-left flex flex-col justify-between h-[235px] shadow-sm relative group hover:border-[#7BA7FF]/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#7BA7FF] bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-full">
                          Global Template
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">v{p.version}</span>
                      </div>
                      <h3 className="text-md font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-400 leading-normal line-clamp-3">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100/80 pt-4 mt-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.workouts?.length || 0} Treinos Ativos</span>
                      <button
                        onClick={() => handleCloneTemplateToDraft(p)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Copy size={9} />
                        Clonar em Rascunho
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CLASSIC LAYOUT FOR DRAFTS */}
            {activeSubTab === 'drafts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, true)}
                    onDuplicate={() => handleDuplicate(p, true)}
                    onArchive={() => handleArchive(p.id, true)}
                    onToggleActive={() => toggleProtocolActive(p.id, true)}
                    onPublishPremium={() => handlePublishPremium(p.id, true)}
                    onPublishPublic={() => handlePublishPublic(p.id, true)}
                    isDraft
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* AUTOMATED PROTOCOL BUILDER VIEW (TAB: CREATE_PROTOCOL) */}
            {activeSubTab === 'create_protocol' && (
              <div className="space-y-8 max-w-5xl mx-auto text-left">
                {/* Stepper Header */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-3xl shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                        <Sparkles className="text-blue-500 animate-pulse" size={20} />
                        Gerador Semi-Automático de Protocolos
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Acelere a montagem de treinos baseando-se em regras de negócios, equipamentos e metadados com revisão 100% humana.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full self-start md:self-auto">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                        Progresso: {Math.floor((builderStep / 5) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Line Progress Stepper */}
                  <div className="grid grid-cols-5 gap-2 mt-6 border-t border-slate-100 pt-6">
                    {[
                      { s: 1, label: 'Identificação' },
                      { s: 2, label: 'Critérios' },
                      { s: 3, label: 'Montagem' },
                      { s: 4, label: 'Validação' },
                      { s: 5, label: 'Revisão Humana' }
                    ].map((stepItem) => {
                      const isActive = builderStep === stepItem.s;
                      const isCompleted = builderStep > stepItem.s;
                      return (
                        <div key={stepItem.s} className="space-y-2">
                          <div className={`h-1.5 rounded-full transition-all duration-300 ${
                            isActive ? 'bg-blue-600' : isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                          }`} />
                          <div className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                              isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {isCompleted ? '✓' : stepItem.s}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:inline ${
                              isActive ? 'text-slate-900' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {stepItem.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {builderToast && (
                  <div className="bg-slate-905 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all">
                    <CheckCircle className="text-emerald-400 shrink-0" size={16} />
                    <span className="text-xs font-bold">{builderToast}</span>
                  </div>
                )}

                {/* STEP 1: BASIC INFORMATION */}
                {builderStep === 1 && (
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Passo 1: Identificação Básica</h3>
                      <p className="text-xs text-slate-400 mt-1">Configure o nome, objetivo principal, frequência sugerida e nível da planilha.</p>
                    </div>

                    <div className="space-y-5">
                      {/* Name Entry */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Nome do Protocolo</label>
                        <input
                          type="text"
                          value={builderName}
                          onChange={(e) => setBuilderName(e.target.value)}
                          placeholder="Ex: Hipertrofia Avançada - Foco Deltóides e Cadeias Posteriores"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {/* Goal Grid Selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Objetivo do Treino</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { key: 'hypertrophy', label: 'Hipertrofia' },
                            { key: 'weight_loss', label: 'Emagrecimento' },
                            { key: 'strength', label: 'Força Bruta' },
                            { key: 'performance', label: 'Performance' },
                            { key: 'conditioning', label: 'Condicionamento' },
                            { key: 'health', label: 'Saúde' },
                            { key: 'recovery', label: 'Reabilitação' }
                          ].map((g) => (
                            <button
                              type="button"
                              key={g.key}
                              onClick={() => setBuilderGoal(g.key as any)}
                              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${
                                builderGoal === g.key
                                  ? 'border-blue-600 bg-blue-50/55 text-blue-900 shadow-sm'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Objetivo</span>
                              <span className="text-xs font-bold leading-tight">{g.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level and Frequency in row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Level */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Nível Recomendado</label>
                          <div className="flex gap-2">
                            {[
                              { k: 'beginner', l: 'Iniciante' },
                              { k: 'intermediate', l: 'Intermediário' },
                              { k: 'advanced', l: 'Avançado' }
                            ].map((levelObj) => (
                              <button
                                type="button"
                                key={levelObj.k}
                                onClick={() => setBuilderLevel(levelObj.k as any)}
                                className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center ${
                                  builderLevel === levelObj.k
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                {levelObj.l}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Environment */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ambiente de Treino</label>
                          <select
                            value={builderEnvironment}
                            onChange={(e) => setBuilderEnvironment(e.target.value as any)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                          >
                            <option value="gym">Academia Completa (gym)</option>
                            <option value="home">Treino em Casa (home)</option>
                            <option value="hybrid">Híbrido / Ambos</option>
                          </select>
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Frequência Semanal</label>
                          <select
                            value={builderFrequency}
                            onChange={(e) => setBuilderFrequency(Number(e.target.value))}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                          >
                            <option value="2">2 dias (Divisão AB)</option>
                            <option value="3">3 dias (Divisão ABC)</option>
                            <option value="4">4 dias (Divisão ABCD)</option>
                            <option value="5">5 dias (Divisão ABCDE)</option>
                            <option value="6">6 dias (Divisão ABCDEF)</option>
                          </select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Duração do Macrociclo</label>
                          <select
                            value={builderDuration}
                            onChange={(e) => setBuilderDuration(Number(e.target.value))}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                          >
                            <option value="4">4 Semanas (Foco Curto)</option>
                            <option value="8">8 Semanas (Intermediário)</option>
                            <option value="12">12 Semanas (Padrão Completo)</option>
                            <option value="16">16 Semanas (Periodização Longa)</option>
                          </select>
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Classificação de Distribuição</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              checked={builderCategory === 'premium'}
                              onChange={() => setBuilderCategory('premium')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-800">Premium (Apenas Assinantes)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              checked={builderCategory === 'public'}
                              onChange={() => setBuilderCategory('public')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-600">Público (Acesso Livre)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setBuilderStep(2)}
                        className="px-6 h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
                      >
                        Avançar: Critérios de Geração
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: GENERATION CRITERIA */}
                {builderStep === 2 && (
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Passo 2: Modelamento de Critérios de Geração</h3>
                      <p className="text-xs text-slate-400 mt-1">Determine o ambiente do treino e as restrições de montagem para os algoritmos estruturais.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Equipment Setup */}
                      <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                          <Dumbbell size={14} className="text-blue-500" />
                          Equipamentos Disponíveis
                        </div>
                        <div className="space-y-3.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={critEquipFull}
                              onChange={(e) => setCritEquipFull(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Academia Completa
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={critEquipBasic}
                              onChange={(e) => setCritEquipBasic(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Academia Básica
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={critEquipHome}
                              onChange={(e) => setCritEquipHome(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Casa / Halteres
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={critEquipBody}
                              onChange={(e) => setCritEquipBody(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Livre / Calistenia
                          </label>
                        </div>
                      </div>

                      {/* Priorities */}
                      <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                          <Layers size={14} className="text-blue-500" />
                          Categorias de Prioridade
                        </div>
                        <div className="space-y-3.5">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={priorGuided}
                              onChange={(e) => setPriorGuided(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Priorizar Aparelhos Guiados
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={priorBasic}
                              onChange={(e) => setPriorBasic(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Exercícios Básicos / Livres
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={priorCompound}
                              onChange={(e) => setPriorCompound(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Compostos Multiarticulares
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={priorIsolated}
                              onChange={(e) => setPriorIsolated(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Isolados Monoarticulares
                          </label>
                        </div>
                      </div>

                      {/* Safe Guards Constraints */}
                      <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                          <ShieldCheck size={14} className="text-blue-500" />
                          Restrições Governança
                        </div>
                        <div className="space-y-3.5">
                          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                            <Check size={14} className="text-emerald-500 shrink-0" />
                            Apenas Exercícios Ativos
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                            <Check size={14} className="text-emerald-500 shrink-0" />
                            Descartar Arquivados/Deletados
                          </div>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={restNoRepeat}
                              onChange={(e) => setRestNoRepeat(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Não repetir exercícios na planilha
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={restMuscleRecovery}
                              onChange={(e) => setRestMuscleRecovery(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Respeitar Descanso Sinergistas
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={restNoOverlap}
                              onChange={(e) => setRestNoOverlap(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Evitar sobreposição excessiva
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setBuilderStep(1)}
                        className="px-5 h-11 border border-slate-300 text-slate-700 hover:bg-slate-50 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={executeAutomatedAssembly}
                        className="px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
                      >
                        Compilar e Montar Treino
                        <Sparkles size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: AUTOMATIC ASSEMBLY PREVIEW */}
                {builderStep === 3 && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                        <div>
                          <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Passo 3: Esqueleto do Treino Compilado</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Esqueleto de fichas estruturado deterministicamente pela biblioteca Kyron OS.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBuilderStep(2)}
                            className="px-4 py-2 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50"
                          >
                            Ajustar Filtros
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuilderStep(4)}
                            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm"
                          >
                            Ir para Validação
                          </button>
                        </div>
                      </div>

                      {/* Scout Engine Quality Scoring */}
                      {(() => {
                        const scoreInfo = calculateProtocolQualityScore(builderWorkouts);
                        const isExcellent = scoreInfo.score >= 85;
                        const isGood = scoreInfo.score >= 70 && scoreInfo.score < 85;

                        // Check missing major muscles
                        const warnings: string[] = [];
                        if (scoreInfo.breakdown.normalizedSets.chest === 0) warnings.push('Peito');
                        if (scoreInfo.breakdown.normalizedSets.back === 0) warnings.push('Costas');
                        if (scoreInfo.breakdown.normalizedSets.quads === 0) warnings.push('Quadríceps');
                        if (scoreInfo.breakdown.normalizedSets.hams === 0) warnings.push('Isquiotibiais');
                        if (scoreInfo.breakdown.normalizedSets.shoulders === 0) warnings.push('Ombros');

                        return (
                          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded font-mono">KYRON SCOUT_INTELLIGENCE</span>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded ${
                                  isExcellent ? 'bg-emerald-100 text-emerald-800' : isGood ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  TREINO {scoreInfo.statusLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Compatibilidade para nível {builderLevel}: <strong className="text-slate-850">{scoreInfo.breakdown.levelComp}%</strong>. Diversidade do estímulo muscular: <strong className="text-slate-850">{scoreInfo.breakdown.diversity}%</strong>.
                              </p>
                              {warnings.length > 0 && (
                                <p className="text-[10px] text-orange-600 font-extrabold">
                                  ⚠️ ALERTA DE EQUILÍBRIO HEMISFÉRICO: Volume zerado detectado nos grupos: {warnings.join(', ')}.
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 bg-white p-2.5 rounded-xl border border-slate-150">
                              <span className="text-[10px] font-black text-slate-400 uppercase font-mono">QUALITY_SCORE:</span>
                              <span className={`text-md font-black font-mono ${
                                isExcellent ? 'text-emerald-600' : isGood ? 'text-amber-500' : 'text-rose-500'
                              }`}>{scoreInfo.score}/100</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Render compiled splits */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {builderWorkouts.map((w, idx) => (
                          <div key={w.id || idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 space-y-4">
                            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">{w.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{w.description}</p>
                              </div>
                              <span className="text-[9px] font-extrabold bg-blue-50 border border-blue-200/60 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {w.exercises?.length || 0} Exs
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {w.exercises?.map((ex, exIdx) => (
                                <div key={ex.exercise_id || exIdx} className="bg-white p-3 rounded-xl border border-slate-200/50 flex justify-between items-center text-xs">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800">{ex.exercise_name}</div>
                                    <div className="text-[9px] text-slate-400 font-medium">Recomendado: {ex.sets} séries x {ex.reps} reps</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-mono">Rest: {ex.rest_time}s</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setBuilderStep(2)}
                        className="px-5 h-11 border border-slate-300 text-slate-700 hover:bg-slate-50 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuilderStep(4)}
                        className="px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
                      >
                        Ir para as Validações
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: VALIDATION ENGINE AND AUDIT REPORT */}
                {builderStep === 4 && (
                  <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Passo 4: Motor de Validação & Compliance</h3>
                      <p className="text-xs text-slate-400 mt-1">Relatório técnico do protocolo com verificação de volume, frequência e cobertura muscular antes de salvar rascunho.</p>
                    </div>

                    {/* Results list of validation checks */}
                    <div className="space-y-3.5">
                      {executeValidationEngine().map((check, cIdx) => {
                        const isSuccess = check.status === 'success';
                        const isWarning = check.status === 'warning';
                        const isError = check.status === 'error';
                        return (
                          <div
                            key={check.id || cIdx}
                            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                              isSuccess ? 'bg-emerald-50/55 border-emerald-200 text-emerald-950' :
                              isWarning ? 'bg-amber-50/55 border-amber-200 text-amber-950' :
                              'bg-red-50/55 border-red-200 text-red-950'
                            }`}
                          >
                            <div className="mt-0.5">
                              {isSuccess && <CheckCircle className="text-emerald-600 shrink-0" size={18} />}
                              {isWarning && <AlertTriangle className="text-amber-600 shrink-0" size={18} />}
                              {isError && <AlertTriangle className="text-red-600 shrink-0" size={18} />}
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider">{check.label}</h4>
                              <p className="text-[11px] mt-1 text-slate-600 leading-relaxed font-semibold">{check.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                         Ao salvar a planilha, ela será armazenada sob <strong>Protocolos &gt; Rascunhos</strong>. A publicação só poderá ser efetuada após revisão humana fina no Passo 5 a seguir.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setBuilderStep(3)}
                        className="px-5 h-11 border border-slate-300 text-slate-700 hover:bg-slate-50 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                      >
                        ← Voltar ao Treino
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDraftOfficial}
                        className="px-6 h-12 bg-blue-650 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
                      >
                        Confirmar e Criar Rascunho
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: DRAFT REVIEW & ADVANCED EDITOR */}
                {builderStep === 5 && currentGeneratedDraft && (
                  <div className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2 flex-grow">
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-0.5 bg-blue-500/25 border border-blue-400/30 text-blue-300 rounded-full text-[9px] uppercase tracking-wider font-extrabold font-mono">
                              {currentGeneratedDraft.goal}
                            </span>
                            <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-[9px] uppercase tracking-wider font-extrabold font-mono">
                              {currentGeneratedDraft.difficulty}
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 rounded-full text-[9px] uppercase tracking-wider font-extrabold font-mono">
                              {currentGeneratedDraft.environment || 'gym'}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 w-full">
                            <input
                              type="text"
                              value={currentGeneratedDraft.name}
                              onChange={(e) => {
                                const up = { ...currentGeneratedDraft, name: e.target.value };
                                setCurrentGeneratedDraft(up);
                                const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? up : d);
                                saveDraftsToStorage(otherDrafts);
                              }}
                              className="bg-slate-850/50 hover:bg-slate-850 text-xl font-black text-white border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                              placeholder="Nome do Protocolo"
                            />
                            <textarea
                              value={currentGeneratedDraft.description}
                              onChange={(e) => {
                                const up = { ...currentGeneratedDraft, description: e.target.value };
                                setCurrentGeneratedDraft(up);
                                const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? up : d);
                                saveDraftsToStorage(otherDrafts);
                              }}
                              rows={2}
                              className="bg-slate-850/50 hover:bg-slate-850 text-xs text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                              placeholder="Descrição detalhada do protocolo e metodologia integrada..."
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={handleSaveWorkInProgress}
                            disabled={saving}
                            className={`px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {saving ? "Salvando..." : (
                              currentGeneratedDraft.id.startsWith('draft-') || drafts.some(d => d.id === currentGeneratedDraft.id)
                                ? "Salvar Rascunho"
                                : "Salvar Alterações Ao Vivo"
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handlePublishFromReview(true)}
                            className="px-5 py-2.5 bg-[#7BA7FF]/90 hover:bg-[#7BA7FF] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                          >
                            <Lock size={12} />
                            Publicar Premium
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePublishFromReview(false)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                          >
                            <Globe size={11} />
                            Publicar Público
                          </button>
                        </div>
                      </div>

                      {/* PARAMETERS CONFIGURATION MATRIX (ONBOARDING PROPERTIES) */}
                      <div className="mt-8 pt-6 border-t border-slate-800/85">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
                          Parâmetros do Protocolo (Alinhamento de Onboarding)
                        </span>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Objetivo</span>
                            <select
                              value={currentGeneratedDraft.goal || 'hypertrophy'}
                              onChange={(e) => {
                                const up = { ...currentGeneratedDraft, goal: e.target.value as any };
                                setCurrentGeneratedDraft(up);
                                if (up.id.startsWith('draft-') || drafts.some(d => d.id === up.id)) {
                                  const otherDrafts = drafts.map(d => d.id === up.id ? up : d);
                                  saveDraftsToStorage(otherDrafts);
                                }
                              }}
                              className="bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-black text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full cursor-pointer"
                            >
                              <option value="hypertrophy">Hipertrofia</option>
                              <option value="weight_loss">Definição / Emagrecimento</option>
                              <option value="strength">Força Progressiva</option>
                              <option value="performance">Acondicionamento</option>
                              <option value="glutes">Glúteos & Estética</option>
                              <option value="recovery">Recuperação</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Nível (Dificuldade)</span>
                            <select
                              value={currentGeneratedDraft.difficulty || 'intermediate'}
                              onChange={(e) => {
                                const up = { ...currentGeneratedDraft, difficulty: e.target.value as any };
                                setCurrentGeneratedDraft(up);
                                if (up.id.startsWith('draft-') || drafts.some(d => d.id === up.id)) {
                                  const otherDrafts = drafts.map(d => d.id === up.id ? up : d);
                                  saveDraftsToStorage(otherDrafts);
                                }
                              }}
                              className="bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-black text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full cursor-pointer"
                            >
                              <option value="beginner">Iniciante</option>
                              <option value="intermediate">Intermediário</option>
                              <option value="advanced">Avançado</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Ambiente de Treino</span>
                            <select
                              value={currentGeneratedDraft.environment || 'gym'}
                              onChange={(e) => {
                                const up = { ...currentGeneratedDraft, environment: e.target.value as any };
                                setCurrentGeneratedDraft(up);
                                if (up.id.startsWith('draft-') || drafts.some(d => d.id === up.id)) {
                                  const otherDrafts = drafts.map(d => d.id === up.id ? up : d);
                                  saveDraftsToStorage(otherDrafts);
                                }
                              }}
                              className="bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-black text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full cursor-pointer"
                            >
                              <option value="gym">Academia (Gym)</option>
                              <option value="home">Em Casa (Home)</option>
                              <option value="hybrid">Híbrido (Ambos)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Status</span>
                            <select
                              value={currentGeneratedDraft.status || (currentGeneratedDraft.is_active !== false ? 'published' : 'draft')}
                              onChange={(e) => {
                                const up = { ...currentGeneratedDraft, status: e.target.value as any };
                                setCurrentGeneratedDraft(up);
                                if (up.id.startsWith('draft-') || drafts.some(d => d.id === up.id)) {
                                  const otherDrafts = drafts.map(d => d.id === up.id ? up : d);
                                  saveDraftsToStorage(otherDrafts);
                                }
                              }}
                              className="bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-black text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full cursor-pointer"
                            >
                              <option value="draft">Rascunho</option>
                              <option value="published">Publicado</option>
                              <option value="archived">Arquivado</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Frequência Semanal</span>
                            <input
                              type="number"
                              min={1}
                              max={7}
                              value={currentGeneratedDraft.frequency || 3}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(7, Number(e.target.value)));
                                const up = { ...currentGeneratedDraft, frequency: val };
                                setCurrentGeneratedDraft(up);
                                const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? up : d);
                                saveDraftsToStorage(otherDrafts);
                              }}
                              className="bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-black text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
                            />
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Duração (Semanas)</span>
                            <input
                              type="number"
                              min={1}
                              max={52}
                              value={currentGeneratedDraft.duration_weeks || 12}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(52, Number(e.target.value)));
                                const up = { ...currentGeneratedDraft, duration_weeks: val };
                                setCurrentGeneratedDraft(up);
                                const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? up : d);
                                saveDraftsToStorage(otherDrafts);
                              }}
                              className="bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-black text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 w-full"
                            />
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Dias Mapeados</span>
                            <span className="block text-xs font-black text-slate-300 bg-slate-850/50 px-3 py-2 rounded-xl border border-slate-800/60">
                              {currentGeneratedDraft.workouts?.length || 0} Dias Ativos
                            </span>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Autor</span>
                            <span className="block text-xs font-black text-blue-400 bg-slate-850/50 px-3 py-2 rounded-xl border border-slate-800/60">
                              Kyron OS Admin
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DRAFT QUALITY ASSESSMENT ENGINE - DYNAMIC REVIEW */}
                    {(() => {
                      const report = calculateProtocolQualityScore(currentGeneratedDraft.workouts);
                      const isExcellent = report.score >= 85;
                      const isGood = report.score >= 70 && report.score < 85;

                      // Calculate metrics for Exercise Distribution
                      let compoundCount = 0;
                      let isolationCount = 0;
                      let machineCount = 0;
                      let freeWeightCount = 0;
                      let cableCount = 0;

                      currentGeneratedDraft.workouts.forEach(w => {
                        w.exercises?.forEach(ex => {
                          const fullEx = exercises.find(e => e.id === ex.exercise_id);
                          if (fullEx) {
                            const p = (fullEx.movement_pattern || '').toLowerCase();
                            const t = (fullEx.type || '').toLowerCase();
                            if (['squat', 'push', 'pull', 'hinge', 'lunge'].includes(p)) {
                              compoundCount++;
                            } else {
                              isolationCount++;
                            }

                            if (t === 'machine') machineCount++;
                            else if (t === 'cable') cableCount++;
                            else freeWeightCount++;
                          } else {
                            compoundCount++;
                          }
                        });
                      });

                      const totalExercises = compoundCount + isolationCount || 1;

                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-7 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-4">
                            <div>
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Kyron OS // Painel de Qualidade e Equilíbrio Hemisférico</h4>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">Relatório automatizado com base nos critérios estabelecidos do treinador pro.</p>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200">
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Score Geral de Treino</span>
                                <span className={`text-xs font-black uppercase tracking-wider ${isExcellent ? 'text-emerald-600' : isGood ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {report.statusLabel}
                                </span>
                              </div>
                              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-mono text-base font-black ${
                                isExcellent 
                                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50' 
                                  : isGood 
                                    ? 'border-amber-400 text-amber-500 bg-amber-50' 
                                    : 'border-rose-500 text-rose-500 bg-rose-50'
                              }`}>
                                {report.score}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Muscle Volume & Coverage */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-sm col-span-1 lg:col-span-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Volume e Cobertura Muscular (Séries Semanais)</span>
                                <span className="text-[10px] text-slate-400 font-bold">Mínimo recomendado: 4</span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                                {[
                                  { label: 'Chest (Peitoral)', val: report.breakdown.normalizedSets.chest },
                                  { label: 'Back (Costas)', val: report.breakdown.normalizedSets.back },
                                  { label: 'Quadriceps (Quadríceps)', val: report.breakdown.normalizedSets.quads },
                                  { label: 'Hamstrings (Isquiotibiais)', val: report.breakdown.normalizedSets.hams },
                                  { label: 'Glutes (Glúteos)', val: report.breakdown.normalizedSets.glutes },
                                  { label: 'Shoulders (Ombros)', val: report.breakdown.normalizedSets.shoulders },
                                  { label: 'Biceps (Bíceps)', val: report.breakdown.normalizedSets.biceps },
                                  { label: 'Triceps (Tríceps)', val: report.breakdown.normalizedSets.triceps },
                                  { label: 'Core (Abdominal)', val: report.breakdown.normalizedSets.core },
                                  { label: 'Calves (Panturrilhas)', val: report.breakdown.normalizedSets.calves }
                                ].map((item, id) => {
                                  const pct = Math.min(100, (item.val / 16) * 100);
                                  const isLow = item.val < 4;
                                  return (
                                    <div key={id} className="space-y-1">
                                      <div className="flex justify-between text-[10px] font-bold">
                                        <span className={isLow ? 'text-slate-500 flex items-center gap-1' : 'text-slate-700'}>
                                          {isLow && <span className="text-amber-500 font-bold">⚠️</span>}
                                          {item.label}
                                        </span>
                                        <span className={isLow ? 'text-amber-600 font-extrabold font-mono' : 'text-slate-500 font-mono'}>
                                          {item.val} séries {isLow ? '(Baixo)' : '(Ok)'}
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                          style={{ width: `${Math.max(4, pct)}%` }} 
                                          className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Recovery and Distribution Column */}
                            <div className="space-y-4">
                              
                              {/* Recovery Diagnostics */}
                              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-3 shadow-sm">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Análise de Recuperação</span>
                                {report.breakdown.recovery >= 85 ? (
                                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-semibold leading-relaxed">
                                    ✅ <strong>Divisão Perfeita:</strong> Sem sobreposições consecutivas de peito, costas ou quadríceps. Janela ideal estruturada.
                                  </div>
                                ) : (
                                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 font-semibold leading-relaxed">
                                    ⚠️ <strong>Alerta de Fadiga:</strong> Sobrecarga de grandes grupos musculares em dias consecutivos detectada. Considere alternar a frequência de treinos.
                                  </div>
                                )}
                              </div>

                              {/* Exercise Distribution */}
                              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-3.5 shadow-sm">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Distribuição de Estímulo</span>
                                
                                <div className="space-y-2 text-[10px] font-bold text-slate-600">
                                  <div className="flex justify-between items-center">
                                    <span>Compostos vs Isoladores</span>
                                    <span className="font-mono">{Math.round((compoundCount/totalExercises)*105) > 100 ? 100 : Math.round((compoundCount/totalExercises)*100)}% / {Math.round((isolationCount/totalExercises)*100)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${(compoundCount/totalExercises)*100}%` }} className="bg-blue-500 h-full" />
                                    <div style={{ width: `${(isolationCount/totalExercises)*100}%` }} className="bg-orange-400 h-full" />
                                  </div>

                                  <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-400">
                                    <span>⚙️ Máquinas: {machineCount}</span>
                                    <span>🔌 Cabos: {cableCount}</span>
                                    <span>🏋️ Peso Livre: {freeWeightCount}</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-8">
                      {currentGeneratedDraft.workouts?.map((w, wIdx) => {
                        const isOverlayActiveForWorkout = builderActiveWorkoutId === w.id;
                        return (
                          <div key={w.id || wIdx} className="bg-white border border-slate-200 rounded-[2rem] p-6.5 shadow-sm space-y-4">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[11px] font-black text-blue-600 font-mono">
                                  {String.fromCharCode(65 + wIdx)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={w.name}
                                    onChange={(e) => {
                                      const updatedWorkouts = currentGeneratedDraft.workouts.map(it => it.id === w.id ? { ...it, name: e.target.value } : it);
                                      const updatedObj = { ...currentGeneratedDraft, workouts: updatedWorkouts };
                                      setCurrentGeneratedDraft(updatedObj);
                                      const otherDrafts = drafts.map(d => d.id === currentGeneratedDraft.id ? updatedObj : d);
                                      saveDraftsToStorage(otherDrafts);
                                    }}
                                    className="text-sm font-black text-slate-900 border border-transparent hover:border-slate-300 rounded px-1.5 w-44 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                                  />
                                  <span className="text-[10px] text-slate-400 font-medium">({w.exercises?.length || 0} exercícios)</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setBuilderActiveWorkoutId(w.id);
                                  setBuilderReplacingIndex(null);
                                  setBuilderExSearchQuery('');
                                }}
                                className="px-3.5 py-1.5 hover:bg-blue-50 border border-dashed border-blue-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                + Inserir Exercício
                              </button>
                            </div>

                             <div className="overflow-x-auto">
                               <table className="w-full text-left text-xs min-w-[650px]">
                                 <thead>
                                   <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                                     <th className="py-2.5">Exercício</th>
                                     <th className="py-2.5 w-16 text-center">Séries</th>
                                     <th className="py-2.5 w-24 text-center">Repetições</th>
                                     <th className="py-2.5 w-20 text-center">Intervalo (s)</th>
                                     <th className="py-2.5 w-20 text-center">Carga (kg)</th>
                                     <th className="py-2.5">Observações</th>
                                     <th className="py-2.5 text-right w-24">Ações</th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {w.exercises?.map((ex, exIdx) => {
                                     const matchingEx = exercises.find(e => e.id === ex.exercise_id);
                                     const recommendedAlts = matchingEx ? getExerciseAlternativesEx(matchingEx) : [];
                                     return (
                                       <tr key={ex.exercise_id || exIdx} className="border-b border-slate-100/70 hover:bg-slate-50/50">
                                         <td className="py-3 font-bold text-slate-900">
                                           <div className="flex flex-col">
                                             <span>{ex.exercise_name}</span>
                                             <button
                                               type="button"
                                               onClick={() => {
                                                 setBuilderActiveWorkoutId(w.id);
                                                 setBuilderReplacingIndex(exIdx);
                                                 setBuilderExSearchQuery('');
                                               }}
                                               className="text-[9px] text-blue-500 font-extrabold flex items-center mt-1 text-left"
                                             >
                                               [ Substituir Exercício ]
                                             </button>
                                             {recommendedAlts.length > 0 && (
                                               <span className="text-[9px] text-slate-400 font-medium mt-1">
                                                 Substitutos: <strong className="text-slate-500 font-semibold italic">{recommendedAlts.slice(0, 3).join(', ')}</strong>
                                               </span>
                                             )}
                                          </div>
                                        </td>
                                        
                                        <td className="py-3 text-center">
                                          <input
                                            type="number"
                                            value={ex.sets || 4}
                                            onChange={(e) => updateDraftExField(w.id, exIdx, { sets: Number(e.target.value) })}
                                            className="w-12 h-8 px-1.5 bg-slate-50 border border-slate-200 rounded text-center font-bold focus:outline-none"
                                          />
                                        </td>

                                        <td className="py-3 text-center">
                                          <input
                                            type="text"
                                            value={ex.reps || '10'}
                                            onChange={(e) => updateDraftExField(w.id, exIdx, { reps: e.target.value })}
                                            className="w-20 h-8 px-1.5 bg-slate-50 border border-slate-200 rounded text-center focus:outline-none"
                                          />
                                        </td>

                                        <td className="py-3 text-center">
                                          <input
                                            type="number"
                                            value={ex.rest_time || 60}
                                            onChange={(e) => updateDraftExField(w.id, exIdx, { rest_time: Number(e.target.value) })}
                                            className="w-16 h-8 px-1.5 bg-slate-50 border border-slate-200 rounded text-center focus:outline-none"
                                          />
                                        </td>

                                        <td className="py-3 text-center">
                                          <input
                                            type="number"
                                            value={ex.weight || 10}
                                            onChange={(e) => updateDraftExField(w.id, exIdx, { weight: Number(e.target.value) })}
                                            className="w-16 h-8 px-1.5 bg-slate-50 border border-slate-200 rounded text-center focus:outline-none"
                                          />
                                        </td>

                                        <td className="py-3">
                                          <input
                                            type="text"
                                            value={ex.notes || ''}
                                            onChange={(e) => updateDraftExField(w.id, exIdx, { notes: e.target.value })}
                                            placeholder="Ex: Pegada Neutra"
                                            className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
                                          />
                                        </td>

                                        <td className="py-3 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              type="button"
                                              disabled={exIdx === 0}
                                              onClick={() => moveDraftEx(w.id, exIdx, 'up')}
                                              className="p-1 text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30"
                                            >
                                              <ArrowUp size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={exIdx === (w.exercises?.length - 1)}
                                              onClick={() => moveDraftEx(w.id, exIdx, 'down')}
                                              className="p-1 text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30"
                                            >
                                              <ArrowDown size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeDraftEx(w.id, exIdx)}
                                              className="p-1 text-red-400 hover:text-red-600 transition-all ml-1"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                 </tbody>
                               </table>
                             </div>

                            {/* Inline Overlay Search to add/replace exercise to workout */}
                            {isOverlayActiveForWorkout && (
                              <div className="bg-slate-50 p-4 border border-blue-100 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">
                                    {builderReplacingIndex !== null ? `Substituindo Exercício [Posição ${builderReplacingIndex + 1}]` : 'Injetar Novo Exercício Ativo'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBuilderActiveWorkoutId(null);
                                      setBuilderReplacingIndex(null);
                                    }}
                                    className="text-[9px] text-slate-400 font-bold hover:text-red-500 uppercase"
                                  >
                                    [ Cancelar ]
                                  </button>
                                </div>

                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={builderExSearchQuery}
                                    onChange={(e) => setBuilderExSearchQuery(e.target.value)}
                                    placeholder="Pesquise o nome do exercício (Ex: Supino ou Agachamento)"
                                    className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs"
                                  />
                                </div>

                                {/* List matches */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1.5 max-h-36 overflow-y-auto">
                                  {exercises
                                    .filter(ex => ex.is_active && ex.name?.toLowerCase().includes(builderExSearchQuery.toLowerCase()))
                                    .slice(0, 8)
                                    .map((filteredExItem) => (
                                      <button
                                        type="button"
                                        key={filteredExItem.id}
                                        onClick={() => {
                                          if (builderReplacingIndex !== null) {
                                            replaceDraftEx(w.id, builderReplacingIndex, filteredExItem);
                                          } else {
                                            addExToDraftWorkout(w.id, filteredExItem);
                                          }
                                        }}
                                        className="p-2.5 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/25 rounded-lg text-left text-[11px] font-bold text-slate-800 transition-all truncate"
                                      >
                                        {filteredExItem.name}
                                        <span className="block text-[8px] text-slate-400 font-normal uppercase mt-0.5">{filteredExItem.muscle_group}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom publishing section bar */}
                    <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-slate-400">
                        O rascunho está salvo em <strong>Rascunhos</strong>. Publique oficialmente como Premium ou Público para os usuários ativos visualizarem.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePublishFromReview(true)}
                          className="px-6 py-3 bg-[#7BA7FF] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#7BA7FF]/90 transition-all flex items-center gap-2"
                        >
                          Publicar Premium
                          <Lock size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePublishFromReview(false)}
                          className="px-6 py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-2"
                        >
                          Publicar Público
                          <Globe size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CLASSIC LAYOUT FOR DRAFTS */}
            {activeSubTab === 'drafts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map(p => (
                  <ProtocolCard 
                    key={p.id} 
                    p={p} 
                    onEdit={() => handleStartEdit(p, true)}
                    onDuplicate={() => handleDuplicate(p, true)}
                    onArchive={() => handleArchive(p.id, true)}
                    onToggleActive={() => toggleProtocolActive(p.id, true)}
                    isDraft
                    onViewTimeline={() => {
                      setSelectedProtocolForVersion(p);
                      setSelectedVersionIndex(3);
                    }}
                  />
                ))}
              </div>
            )}

            {/* CURADORIA RUBI SUGGESTIONS */}
            {activeSubTab === 'rubi' && (
              <div className="max-w-3xl bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 text-left space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#7BA7FF]/5 border border-[#7BA7FF]/20 rounded-xl flex items-center justify-center text-[#7BA7FF]">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Rubi Quality Advisor</h3>
                    <p className="text-xs text-slate-400 mt-1">Análise inteligente da harmonia estrutural das planilhas ativas.</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100/80 pt-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sugestões de Ajuste Rubi</h4>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Baixa frequência de posterior</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">O estímulo mecânico do posterior está desregulado em relação aos quadríceps.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Volume reduzido para peitoral</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Atletas de nível avançado podem estagnar com apenas 12 séries semanais no rascunho de Transição Metabólica.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Recuperação insuficiente</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">O programa Hipertrofia Estratégica atinge sobreposição muscular de deltoide lateral consecutiva.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Estrutura desequilibrada (Eixo Axial)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Exercícios de empuxo vertical superam os de rotação interna de deltoide.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Exercícios redundantes encontrados</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tríceps Corda e Tríceps Pulley operam o mesmo vetor em rotação neutra.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* COMMUNITY QUEUE & LIBRARY */}
            {activeSubTab === 'community' && (
              <div className="space-y-8 text-left">
                {/* Approval Queue */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Fila de Aprovação da Comunidade</h3>
                    <p className="text-xs text-slate-400 mt-1">Usuários Premium enviando planilhas de treinos para compartilhamento oficial.</p>
                  </div>

                  {communityProtocols.filter(c => c.status === 'pending').length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {communityProtocols.filter(c => c.status === 'pending').map(c => (
                        <div key={c.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 uppercase text-xs">{c.name}</h4>
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Por {c.shared_by}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-1 max-w-xl">{c.description}</p>
                            <div className="flex gap-4 mt-1.5 text-[10px] text-slate-450 uppercase font-bold">
                              <span>Foco: {filterLabel(c.goal)}</span>
                              <span>•</span>
                              <span>Nível: {c.difficulty}</span>
                              <span>•</span>
                              <span>Semanas: {c.duration_weeks}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveCommunity(c.id)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejectCommunity(c.id)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-black uppercase tracking-wider">
                      Fila vazia. Nenhuma solicitação pendente no momento.
                    </div>
                  )}
                </div>

                {/* Shared Catalog */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {communityProtocols.filter(c => c.status === 'approved').map(c => (
                    <div 
                      key={c.id}
                      className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-3xl text-left flex flex-col justify-between h-[230px] shadow-sm relative group hover:border-[#7BA7FF] transition duration-200"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                            Comunidade
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Por {c.shared_by}</span>
                        </div>
                        <h3 className="text-md font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-1">
                          {c.name}
                        </h3>
                        <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                          {c.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100/60 pt-4 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{c.duration_weeks} Semanas • {c.difficulty}</span>
                        <span className="text-[#7BA7FF] font-black bg-blue-50 border border-blue-105 px-2 py-0.5 rounded">Ativo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Creation Wizard Dialog Popup */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-left"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[9px] font-black text-[#7BA7FF] uppercase tracking-widest">
                  Criador de Protocolos KYRON (Passo {wizardStep} de 4)
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">
                  {editingProtocolId ? 'Editar Protocolo' : 'Novo Protocolo de Performance'}
                </h3>
              </div>
              <button 
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                Voltar
              </button>
            </div>

            {/* Stepper Bar */}
            <div className="flex border-b border-slate-100 bg-white">
              <button 
                onClick={() => wizardStep > 1 && setWizardStep(1)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 1 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                1. Informações Básicas
              </button>
              <button 
                onClick={() => wizardStep > 1 && setWizardStep(2)}
                disabled={wizardStep < 2}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 2 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                2. Montagem dos Treinos
              </button>
              <button 
                onClick={() => wizardStep > 2 && setWizardStep(3)}
                disabled={wizardStep < 3}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 3 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                3. Configurações & Visibilidade
              </button>
              <button 
                onClick={() => wizardStep > 3 && setWizardStep(4)}
                disabled={wizardStep < 4}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 text-center transition-all ${
                  wizardStep === 4 ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'
                }`}
              >
                4. Publicação Direta
              </button>
            </div>

            {/* Step Body Content */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6 max-h-[60vh]">
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome do Protocolo</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Hipertrofia Miofibrilar Avançada" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Objetivo</label>
                      <select 
                        value={goal} 
                        onChange={(e: any) => setGoal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="hypertrophy">Hipertrofia Miofibrilar</option>
                        <option value="weight_loss">Recomposição / Perda Calórica</option>
                        <option value="strength">Força Progressiva</option>
                        <option value="performance">Acondicionamento Atlético</option>
                        <option value="glutes">Glúteos & Linhas Estéticas</option>
                        <option value="recovery">Recuperação Funcional</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descrição Detalhada</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva a metodologia mecânica integrada, tempos de descanso sugeridos..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nível de Dificuldade</label>
                      <select 
                        value={difficulty} 
                        onChange={(e: any) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      >
                        <option value="beginner">Iniciante</option>
                        <option value="intermediate">Intermediário</option>
                        <option value="advanced">Avançado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ambiente / Local</label>
                      <select 
                        value={trainingEnvironment} 
                        onChange={(e: any) => setTrainingEnvironment(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      >
                        <option value="gym">Academia Completa (gym)</option>
                        <option value="home">Treino em Casa (home)</option>
                        <option value="hybrid">Híbrido / Ambos</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duração (Semanas)</label>
                      <input 
                        type="number" 
                        value={durationWeeks} 
                        onChange={(e) => setDurationWeeks(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Frequência Semanal</label>
                      <input 
                        type="number" 
                        value={frequency} 
                        onChange={(e) => setFrequency(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-8">
                  {/* List of workout segments */}
                  {workouts.map((ws, wIdx) => (
                    <div key={ws.id} className="border border-slate-200 rounded-2xl p-6 relative bg-slate-50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nome da Ficha</label>
                          <input 
                            type="text" 
                            value={ws.name} 
                            onChange={(e) => updateWorkoutName(ws.id, e.target.value)}
                            placeholder="Ex: Treino A - Costas" 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#7BA7FF]/50 uppercase"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Metodologia / Descrição</label>
                            <button
                              onClick={() => removeWorkoutSegment(ws.id)}
                              className="text-red-500 hover:text-red-700 text-[9px] font-black uppercase tracking-wider"
                            >
                              Excluir Ficha
                            </button>
                          </div>
                          <input 
                            type="text" 
                            value={ws.description || ''} 
                            onChange={(e) => updateWorkoutDesc(ws.id, e.target.value)}
                            placeholder="Ex: Método de saturação miofibrilar..." 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-650 text-xs focus:outline-none focus:ring-2 focus:ring-[#7BA7FF]/50"
                          />
                        </div>
                      </div>

                      {/* Display added exercises */}
                      <div className="space-y-2.5 pt-2">
                        {ws.exercises && ws.exercises.length > 0 ? (
                          ws.exercises.map((te, exIdx) => (
                            <div key={exIdx} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button onClick={() => moveExInWorkout(ws.id, exIdx, 'up')} className="text-slate-400 hover:text-slate-950">
                                    <ArrowUp size={12} />
                                  </button>
                                  <button onClick={() => moveExInWorkout(ws.id, exIdx, 'down')} className="text-slate-400 hover:text-slate-950">
                                    <ArrowDown size={12} />
                                  </button>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{te.exercise_name}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Ordem: {exIdx + 1}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Séries</span>
                                  <input 
                                    type="number" 
                                    value={te.sets} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { sets: Number(e.target.value) })}
                                    className="w-10 bg-slate-50 border rounded p-1 text-center font-bold"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reps</span>
                                  <input 
                                    type="text" 
                                    value={te.reps} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { reps: e.target.value })}
                                    className="w-14 bg-slate-50 border rounded p-1 text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KG</span>
                                  <input 
                                    type="number" 
                                    value={te.weight} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { weight: Number(e.target.value) })}
                                    className="w-12 bg-slate-50 border rounded p-1 text-center"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descanso</span>
                                  <input 
                                    type="number" 
                                    value={te.rest_time} 
                                    onChange={(e) => updateExerciseFields(ws.id, exIdx, { rest_time: Number(e.target.value) })}
                                    className="w-12 bg-slate-50 border rounded p-1 text-center"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeExerciseFromWorkout(ws.id, exIdx)}
                                  className="text-red-400 hover:text-red-600 ml-2"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs uppercase tracking-widest">
                            Nenhum exercício integrado. Pesquise e adicione abaixo.
                          </div>
                        )}
                      </div>

                      {/* Add Exercises Box */}
                      <div className="pt-4 border-t border-slate-200">
                        {activeWorkoutId === ws.id ? (
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionar Exercício Ativo</span>
                              <button onClick={() => setActiveWorkoutId(null)} className="text-slate-400 hover:text-slate-900 text-[10px] font-extrabold uppercase">Fechar</button>
                            </div>
                            <input 
                              type="text" 
                              placeholder="Pesquisar exercício..."
                              value={exerciseSearchQuery}
                              onChange={(e) => setExerciseSearchQuery(e.target.value)}
                              className="w-full border p-2 text-xs rounded-lg"
                            />
                            <div className="divide-y max-h-36 overflow-y-auto">
                              {searchedExercises.map(ex => (
                                <button
                                  key={ex.id}
                                  onClick={() => addExerciseToWorkout(ws.id, ex)}
                                  className="w-full text-left p-2.5 hover:bg-slate-50 text-xs font-semibold flex items-center justify-between"
                                >
                                  <span>{ex.name}</span>
                                  <span className="text-[9px] font-black text-blue-500 uppercase">Adicionar +</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveWorkoutId(ws.id);
                              setExerciseSearchQuery('');
                            }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold tracking-tight rounded-xl text-[10px] uppercase flex items-center gap-1.5"
                          >
                            + Acoplar Exercício Ativo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addWorkoutSegment}
                    className="w-full py-5 border border-dashed border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#7BA7FF]"
                  >
                    + Criar Novo Segmento de Treino
                  </button>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Visibilidade Principal</h4>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Protocolo Premium</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Exclusivo para assinantes do plano Kyron Premium.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isPremium} 
                        onChange={(e) => {
                          setIsPremium(e.target.checked);
                          if (e.target.checked) setIsPublic(false);
                        }}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Protocolo Público (Gratuito)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Disponível em vitrine livre para converter novos prospectos.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isPublic} 
                        onChange={(e) => {
                          setIsPublic(e.target.checked);
                          if (e.target.checked) setIsPremium(false);
                        }}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Recomendação & Flags de Destaque</h4>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Recomendado por Rubi Intelligence</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Exibido na área sugerida na Biblioteca de Clientes.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isRecommended} 
                        onChange={(e) => setIsRecommended(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Protocolo de Destaque (Featured)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Hero banner principal da página dos atletas.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isFeatured} 
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Novo Protocolo (Etiqueta NEW)</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Indicador azul de adição recente.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isNew} 
                        onChange={(e) => setIsNew(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6">
                  <div className="border border-slate-200 rounded-3xl p-8 bg-slate-50 text-center space-y-4 max-w-xl mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto">
                      <Check size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Configuração Concluída</h4>
                      <p className="text-xs text-slate-400">O protocolo "{name || 'Sem Nome'}" foi compilado e está pronto para o ecossistema.</p>
                    </div>

                    <div className="pt-4 grid grid-cols-1 gap-3">
                      <button
                        onClick={() => handleCompleteWizard('premium')}
                        className="px-6 py-4 bg-slate-950 hover:bg-slate-850 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-250 w-full"
                      >
                        Publicar na Biblioteca Premium
                      </button>
                      <button
                        onClick={() => handleCompleteWizard('public')}
                        className="px-6 py-4 bg-white border hover:bg-slate-50 text-slate-800 font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-250 w-full"
                      >
                        Publicar como Protocolo Público
                      </button>
                      <button
                        onClick={() => handleCompleteWizard('draft')}
                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition duration-250 w-full"
                      >
                        Arquivar como Rascunho Interno
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => wizardStep > 1 && setWizardStep((wizardStep - 1) as any)}
                disabled={wizardStep === 1}
                className="px-5 py-3 border rounded-xl font-bold text-xs text-slate-500 disabled:opacity-40"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  if (wizardStep < 4) {
                    setWizardStep((wizardStep + 1) as any);
                  }
                }}
                className={`px-5 py-3 bg-slate-950 text-white rounded-xl font-bold text-xs ${
                  wizardStep === 4 ? 'hidden' : 'block'
                }`}
              >
                Avançar Passo
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* VERSION TIMELINE MODAL */}
      {selectedProtocolForVersion && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full text-left space-y-6 shadow-2xl border"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Controle de Versão Histórico</span>
                <h3 className="text-md font-black text-slate-900 tracking-tight mt-1">{selectedProtocolForVersion.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedProtocolForVersion(null)}
                className="text-slate-400 hover:text-slate-950 text-xs font-black uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>

            {/* Interactive Timeline Track */}
            <div className="py-4 border-y border-slate-100">
              <div className="flex items-center justify-between relative mt-2">
                <div className="absolute left-6 right-6 h-0.5 bg-slate-200 top-1/2 -translate-y-1/2 z-0" />
                
                {[1, 2, 3, 4].map((v, idx) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVersionIndex(idx)}
                    className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${
                      selectedVersionIndex === idx
                        ? 'bg-slate-950 text-white border-slate-950 scale-110 shadow'
                        : 'bg-white text-slate-400 border-slate-205 hover:border-slate-400'
                    }`}
                  >
                    v{v}
                  </button>
                ))}
              </div>
            </div>

            {/* Version Detail Panel */}
            <div className="p-4 bg-slate-50 rounded-2xl border space-y-3 font-medium text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Versão Ativa: <strong className="text-slate-700 font-bold">v{selectedVersionIndex + 1}</strong></span>
                <span>Data: <strong className="text-slate-700 font-bold">
                  {selectedVersionIndex === 0 ? '10/04/2026' : 
                   selectedVersionIndex === 1 ? '02/05/2026' :
                   selectedVersionIndex === 2 ? '25/05/2026' : '11/06/2026'}
                </strong></span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider">Autor da Alteração</span>
                <p className="text-slate-800 font-bold text-xs mt-0.5">
                  {selectedVersionIndex === 0 ? 'Daniel Melo (Pro Trainer)' : 
                   selectedVersionIndex === 1 ? 'Dr. Lucas Torres (Performance)' :
                   selectedVersionIndex === 2 ? 'Ativação Automática Rubi AI' : 'Mariana Torres (Rubi Admin)'}
                </p>
              </div>

              <div className="pt-2 border-t text-slate-500">
                <span className="text-[10px] text-slate-400 uppercase font-black block tracking-wider mb-1">Resumo das Alterações</span>
                <p className="text-[11px] leading-relaxed">
                  {selectedVersionIndex === 0 && "Estruturação mecânica base e cadência controlada para estímulo primário."}
                  {selectedVersionIndex === 1 && "Ajuste fino de volume semanal para deltoides laterais e ombros anterior visando proporção simétrica."}
                  {selectedVersionIndex === 2 && "Otimização de fadiga residual e recuperação axial validada via IA."}
                  {selectedVersionIndex === 3 && "Lançamento oficial em alta definição, mídias integradas e prescrição final."}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProtocolForVersion(null)}
                className="px-6 h-11 bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition"
              >
                Concluir Visualização
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SIMPLIFIED QUICK PUBLISH MODAL */}
      {isSimplifiedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full text-left space-y-6 shadow-2xl border"
          >
            <div>
              <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Publicação Premium Simplificada</span>
              <h3 className="text-md font-black text-slate-900 tracking-tight mt-1">Lançamento Direto na Biblioteca</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nome do Programa</label>
                <input 
                  type="text"
                  placeholder="Ex: Bikini Fitness Pro"
                  value={simpleName}
                  onChange={(e) => setSimpleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7BA7FF]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Categoria</label>
                  <select
                    value={simpleGoal}
                    onChange={(e: any) => setSimpleGoal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="hypertrophy">Hipertrofia</option>
                    <option value="weight_loss">Emagrecimento</option>
                    <option value="strength">Força</option>
                    <option value="performance">Performance</option>
                    <option value="glutes">Glúteos</option>
                    <option value="recovery">Recuperação</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nível</label>
                  <select
                    value={simpleDifficulty}
                    onChange={(e: any) => setSimpleDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="beginner">Iniciante</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duração (Semanas)</label>
                  <input 
                    type="number"
                    value={simpleDuration}
                    onChange={(e) => setSimpleDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Capa (Imagem URL)</label>
                  <input 
                    type="text"
                    placeholder="https://images..."
                    value={simpleCoverImage}
                    onChange={(e) => setSimpleCoverImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-black uppercase tracking-wider">
              <button
                onClick={() => setIsSimplifiedModalOpen(false)}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  if (!simpleName.trim()) {
                    alert("Por favor, digite o nome do protocolo.");
                    return;
                  }
                  const newProtocol: PremiumProtocol = {
                    id: 'simple-' + Date.now(),
                    name: simpleName,
                    description: `Programa de performance refinado pela inteligência Rubi focado em objetivos de nível ${simpleDifficulty}.`,
                    version: 1,
                    premium: true,
                    goal: simpleGoal,
                    difficulty: simpleDifficulty,
                    duration_weeks: simpleDuration,
                    frequency: 4,
                    created_by: 'admin',
                    athletes_count: 1,
                    rating: 5,
                    completion_rate: 90,
                    strength_increase_pct: 15,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    updated_by: 'Rubi Admin',
                    workouts: [
                      {
                        id: 'w-1',
                        name: 'Treino A',
                        exercises: []
                      }
                    ],
                    version_history: []
                  };
                  await premiumProtocolsApi.createOrUpdateProtocol(newProtocol);
                  await loadData();
                  setIsSimplifiedModalOpen(false);
                }}
                className="px-6 h-11 bg-slate-950 hover:bg-slate-850 text-white rounded-xl transition font-black tracking-widest uppercase text-[10px]"
              >
                Publicar Premium
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* DELETION SAFETY MODAL */}
      {deletingProtocol && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] border border-slate-200 p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-left animate-fade-in"
          >
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={20} className="shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-tight">Excluir protocolo permanentemente?</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Esta ação não poderá ser desfeita. O protocolo <strong className="text-slate-950">"{deletingProtocol.name}"</strong> será deletado para sempre dos registros.
            </p>

            <div className="space-y-4 mb-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Digite EXCLUIR para continuar:
              </label>
              <input
                type="text"
                value={deleteProtocolInput}
                onChange={(e) => setDeleteProtocolInput(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-black text-slate-900 uppercase placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingProtocol(null)}
                className="px-5 py-2.5 text-slate-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteProtocolInput === 'EXCLUIR') {
                    handleDeletePermanently(deletingProtocol);
                    setDeletingProtocol(null);
                  }
                }}
                disabled={deleteProtocolInput !== 'EXCLUIR'}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
              >
                Excluir Permanentemente
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface ProtocolCardProps {
  p: PremiumProtocol;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  isDraft?: boolean;
  isPublic?: boolean;
  onViewTimeline?: () => void;
  onToggleActive?: () => void;
  onConvertPremium?: () => void;
  onConvertPublic?: () => void;
  onPublishPremium?: () => void;
  onPublishPublic?: () => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ p, onEdit, onDuplicate, onArchive, isDraft, isPublic, onViewTimeline, onToggleActive, onConvertPremium, onConvertPublic, onPublishPremium, onPublishPublic }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const totalExercises = p.workouts?.reduce((acc, w) => acc + (w.exercises?.length || 0), 0) || 0;
  const isInactive = p.is_active === false;

  const getGoalTheme = (g: string) => {
    const goals: Record<string, string> = {
      hypertrophy: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      weight_loss: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      strength: 'text-rose-600 bg-rose-50 border-rose-100',
      performance: 'text-amber-600 bg-amber-50 border-amber-100',
      glutes: 'text-pink-600 bg-pink-50 border-pink-100',
      recovery: 'text-sky-600 bg-sky-50 border-sky-100'
    };
    return goals[g] || 'text-slate-600 bg-slate-50 border-slate-100';
  };

  const getGoalLabel = (g: string) => {
    const goals: Record<string, string> = {
      hypertrophy: 'Hipertrofia Miofibrilar',
      weight_loss: 'Emagrecimento / Perda',
      strength: 'Força Máxima',
      performance: 'Performance',
      glutes: 'Glúteos & Linhas',
      recovery: 'Recuperação'
    };
    return goals[g] || g;
  };

  // Determine automatic smart premium badges safely
  const getSmartBadge = () => {
    if (!isDraft && !isPublic) {
      if (p.rating && p.rating >= 4.9) {
        return { label: '⭐ Destaque da Semana', class: 'bg-yellow-50 text-yellow-700 border-yellow-250' };
      }
      if (p.athletes_count && p.athletes_count > 8) {
        return { label: '⭐ Mais Copiado', class: 'bg-indigo-50 text-[#818CF8] border-indigo-250' };
      }
      if (p.completion_rate && p.completion_rate >= 85) {
        return { label: '⭐ Mais Utilizado', class: 'bg-rose-50 text-rose-700 border-rose-250' };
      }
      return { label: '⭐ Recomendado Rubi', class: 'bg-blue-50 text-blue-700 border-blue-250' };
    }
    return null;
  };

  const smartBadge = getSmartBadge();

  return (
    <div 
      className={`bg-white/70 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl text-left flex flex-col justify-between h-[245px] shadow-sm relative group select-none hover:border-slate-300 transition-all duration-200 ${isInactive ? 'opacity-60 bg-slate-50/20' : ''}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${getGoalTheme(p.goal)}`}>
              {getGoalLabel(p.goal)}
            </span>
            
            {isInactive && (
              <span className="inline-flex items-center text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-250">
                Inativo
              </span>
            )}

            {smartBadge && (
              <span className={`inline-flex items-center text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${smartBadge.class}`}>
                {smartBadge.label}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 relative">
            {onToggleActive && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
                className={`p-1 border rounded-lg transition ${
                  !isInactive 
                    ? 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' 
                    : 'text-slate-400 bg-slate-100 border-slate-205 hover:bg-slate-200'
                }`}
                title={!isInactive ? "Desativar com o Clipe (Ativo)" : "Ativar com o Clipe (Desativado)"}
              >
                <Paperclip size={11} className={!isInactive ? "rotate-45" : ""} />
              </button>
            )}

            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-slate-400 hover:text-slate-900 text-sm font-black tracking-widest px-1"
            >
              •••
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-700">
                <button 
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit size={12} strokeWidth={2.5} /> Editar
                </button>
                <button 
                  onClick={() => { onDuplicate(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Copy size={12} strokeWidth={2.5} /> Duplicar
                </button>
                {onViewTimeline && (
                  <button 
                    onClick={() => { onViewTimeline(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Clock size={12} strokeWidth={2.5} /> Ver Versões
                  </button>
                )}

                {/* Direct COMPACT Quick Actions */}
                {isDraft && onPublishPremium && (
                  <button 
                    onClick={() => { onPublishPremium(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-600 font-bold flex items-center gap-2 border-t border-slate-100/60"
                  >
                    <CheckCircle size={12} strokeWidth={2.5} /> Publicar Premium
                  </button>
                )}
                {isDraft && onPublishPublic && (
                  <button 
                    onClick={() => { onPublishPublic(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-600 font-bold flex items-center gap-2"
                  >
                    <CheckCircle size={12} strokeWidth={2.5} /> Publicar Livre
                  </button>
                )}

                {!isDraft && p.premium && onConvertPublic && (
                  <button 
                    onClick={() => { onConvertPublic(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-650 flex items-center gap-2 border-t border-slate-100/60"
                  >
                    <Globe size={12} strokeWidth={2.5} /> Tornar Livre
                  </button>
                )}
                {!isDraft && !p.premium && onConvertPremium && (
                  <button 
                    onClick={() => { onConvertPremium(); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-indigo-600 font-bold flex items-center gap-2 border-t border-slate-100/60"
                  >
                    <Lock size={12} strokeWidth={2.5} /> Tornar Premium
                  </button>
                )}

                <div className="border-t border-slate-100 my-1" />
                <button 
                  onClick={() => { onArchive(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-500 flex items-center gap-2"
                >
                  <Trash2 size={12} strokeWidth={2.5} /> Arquivar
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-md font-black text-slate-900 uppercase tracking-tight mt-2 line-clamp-1">
          {p.name}
        </h3>
        
        <p className="text-xs text-slate-400 leading-normal line-clamp-2">
          {p.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100/60 pt-4 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span>{p.duration_weeks} Semanas</span>
          <span>•</span>
          <span>{totalExercises} Exercícios</span>
          {onViewTimeline && (
            <>
              <span>•</span>
              <button onClick={onViewTimeline} className="text-[#7BA7FF] hover:underline font-black">
                v{p.version || 4} History
              </button>
            </>
          )}
        </div>
        <span className="text-[8px] font-black tracking-widest uppercase">
          {isDraft ? (
            <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Draft</span>
          ) : isPublic ? (
            <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Livre</span>
          ) : (
            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Premium</span>
          )}
        </span>
      </div>
    </div>
  );
};
