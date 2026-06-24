import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  Zap, 
  Calendar, 
  Dumbbell, 
  ArrowRight,
  CheckCircle2,
  Check,
  Sparkles,
  Trophy,
  User,
  Search,
  X,
  Plus,
  Scale,
  BrainCircuit,
  Armchair,
  Flame,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { cacheStore } from '../../lib/cache/cacheStore';
import { supabase } from '../../lib/api/supabase';
import { profileApi } from '../../lib/api/profileApi';
import { authApi } from '../../lib/api/authApi';
import { systemTemplatesApi, SystemTemplate } from '../../lib/api/systemTemplatesApi';
import { premiumProtocolsApi, PremiumProtocol } from '../../lib/api/premiumProtocolsApi';
import { exerciseApi } from '../../lib/api/exerciseApi';
import { workoutApi } from '../../lib/api/workoutApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Exercise, UserProfile, normalizeMuscleGroup, sortExercisesAnatomically } from '../../types';
import { useNavigation } from '../../App';
import kyronLogo from '../../assets/images/kyron_official_logo_1781087891387.png';

// Onboarding v2.1 Steps List:
// Step 0: Welcome / Presentation
// Step 1: Name / Identidade (Name and email check)
// Step 2: Objetivo Principal (primary_goal)
// Step 3: Experiência de Treino (training_experience)
// Step 4: Frequência Semanal (weekly_availability)
// Step 5: Local de Treino (training_environment)
// Step 6: Sexo (sex)
// Step 7: Idade (age / birth_date)
// Step 8: Peso e Altura (weight / height)
// Step 9: Restrições Físicas (restrictions)
// Step 10: Exercícios Indesejados (exercise_dislikes)
// Step 11: Recomendação e Payoff Final (Show recommended plans, match percentage, activates plan)

export default function SmartOnboarding() {
  const { setProfile } = useUserStore();
  const { navigate } = useNavigation();
  const { showSuccess, showError } = useErrorHandler();

  // Navigation Setup
  const [step, setStep] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Loaded Data Repositories for Step 11
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [allPremiumProtocols, setAllPremiumProtocols] = useState<PremiumProtocol[]>([]);
  const [allTemplates, setAllTemplates] = useState<SystemTemplate[]>([]);
  
  // Loading & State tracking
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingStep, setSavingStep] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Recommendations calculated state
  const [calculatedMatches, setCalculatedMatches] = useState<any[]>([]);
  const [customGeneratedDraft, setCustomGeneratedDraft] = useState<any | null>(null);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const [deployedFolderId, setDeployedFolderId] = useState<string | null>(null);
  const [firstWorkoutId, setFirstWorkoutId] = useState<string | null>(null);
  const [isRedoing, setIsRedoing] = useState<boolean>(false);

  // Form State matching UserProfile
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    primary_goal: '',
    training_experience: '',
    weekly_availability: 3,
    training_environment: 'gym_full',
    sex: '',
    age: 25,
    birth_date: '2001-01-01',
    weight: 70,
    height: 170,
    restrictions: ['Nenhuma'],
    exercise_dislikes: [],
    onboarding_completed: false,
    onboarding_version: '2.1'
  });

  // Step 10 search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 1. Load context and active user session on startup
  useEffect(() => {
    async function bootstrap() {
      try {
        const sessionUser = await authApi.getUser();
        if (sessionUser) {
          setUserId(sessionUser.id);
          const emailStr = sessionUser.email || sessionUser.user_metadata?.email || '';
          setUserEmail(emailStr);

          // Prepare initial form name from metadata if available
          setFormData(prev => ({
            ...prev,
            email: emailStr,
            name: prev.name || sessionUser.user_metadata?.full_name || ''
          }));

          // Load profile from SB and hydrate any previous answers
          const activeProf = await profileApi.getProfile(sessionUser.id);
          if (activeProf) {
            setIsRedoing(!!activeProf.onboarding_completed);
            setFormData(prev => ({
              ...prev,
              name: activeProf.name || activeProf.full_name || prev.name || '',
              primary_goal: activeProf.primary_goal || activeProf.goal || prev.primary_goal || '',
              training_experience: activeProf.training_experience || activeProf.experience_level || prev.training_experience || '',
              weekly_availability: activeProf.weekly_availability || (activeProf.frequency ? parseInt(activeProf.frequency, 10) : 3) || prev.weekly_availability,
              training_environment: activeProf.training_environment || prev.training_environment,
              sex: activeProf.sex || activeProf.gender || prev.sex,
              age: activeProf.age || prev.age,
              birth_date: activeProf.birth_date || prev.birth_date,
              weight: activeProf.weight || prev.weight,
              height: activeProf.height || prev.height,
              restrictions: activeProf.restrictions || prev.restrictions,
              exercise_dislikes: activeProf.exercise_dislikes || prev.exercise_dislikes
            }));
          }
        }

        // Parallel cache loading of templates and protocols
        const [exs, prots, tmps] = await Promise.all([
          exerciseApi.getExercises().catch(() => []),
          premiumProtocolsApi.getProtocols().catch(() => []),
          systemTemplatesApi.getTemplates().catch(() => [])
        ]);

        setActiveExercises(exs);
        setAllPremiumProtocols(prots.filter((p: any) => p.is_active !== false));
        setAllTemplates(tmps);
      } catch (err) {
        console.warn('[SmartOnboarding] Bootstrap loading errors:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    bootstrap();
  }, []);

  // 2. High-performance helper to persist immediately to DB & local state
  const saveProgressValue = async (updatedFields: Partial<UserProfile>) => {
    // 1. Sync React State immediately
    const mergedObj = { ...formData, ...updatedFields };
    setFormData(mergedObj);

    if (!userId) return;

    setSavingStep(true);
    try {
      const payload: Partial<UserProfile> = {
        ...updatedFields,
        onboarding_version: '2.1',
        updated_at: new Date().toISOString()
      };
      
      // Map complementary values if needed
      if (updatedFields.name) {
        payload.full_name = updatedFields.name;
      }
      
      await profileApi.updateProfile(userId, payload);
    } catch (err) {
      console.warn('[SmartOnboarding] Failed to silently write profile update to DB:', err);
    } finally {
      setSavingStep(false);
    }
  };

  // Navigations Actions
  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(0, prev - 1));

  // Compute recommendation results once Step 10 finishes
  const computeAndShowRecommendations = async () => {
    setStep(9);
    setIsFinishing(true);

    let selectedMatch: any = null;
    let fallback = false;
    let generatedDraft: any = null;

    try {
      const userGoal = formData.primary_goal || 'hypertrophy';
      const userExp = formData.training_experience || 'beginner';
      const userWeeks = formData.weekly_availability || 3;
      const userEnv = formData.training_environment || 'gym_full';
      const userRestr = formData.restrictions || ['Nenhuma'];
      const userSex = formData.sex || 'male';

      // Combine all programs to rate
      const candidates: any[] = [];

      // A. Premium Protocols
      allPremiumProtocols.forEach(p => {
        candidates.push({
          id: p.id,
          name: p.name,
          description: p.description,
          type: 'premium',
          workouts_count: p.workouts?.length || 0,
          difficulty: p.difficulty,
          frequency: p.frequency,
          pRef: p,
          score: calculateCompatibility(p, userGoal, userExp, userWeeks, userEnv, userRestr, userSex)
        });
      });

      // B. System Templates
      allTemplates.forEach(t => {
        candidates.push({
          id: t.id,
          name: t.name,
          description: t.description,
          type: 'template',
          workouts_count: t.workouts?.length || 0,
          difficulty: 'intermediate',
          frequency: t.workouts?.length || 3,
          pRef: t,
          score: calculateCompatibility(t, userGoal, userExp, userWeeks, userEnv, userRestr, userSex)
        });
      });

      // Sort descending by calculated compatibility score
      const sorted = candidates.sort((a, b) => b.score - a.score);

      // Best match must score at least 50% to be recommended
      if (sorted.length > 0 && sorted[0].score >= 50) {
        setCalculatedMatches(sorted.slice(0, 4));
        setFallbackTriggered(false);
        selectedMatch = sorted[0];
      } else {
        // Trigger automated fallback creation!
        console.log('[SmartOnboarding] No perfect match found. Dynamic constructor builder fallbacks initialized.');
        setFallbackTriggered(true);
        const dynamicDraft = await generateFallbackProtocol(userId || 'custom-user', formData, activeExercises);
        setCustomGeneratedDraft(dynamicDraft);
        fallback = true;
        generatedDraft = dynamicDraft;
      }
    } catch (e) {
      console.error('[Onboarding] Error matching plans:', e);
      setFallbackTriggered(true);
      const dynamicDraft = await generateFallbackProtocol(userId || 'custom-user', formData, activeExercises);
      setCustomGeneratedDraft(dynamicDraft);
      fallback = true;
      generatedDraft = dynamicDraft;
    }

    // Direct auto-deploy of the best matched protocol or generated dynamic draft!
    try {
      await handleDeployProtocolSelection(selectedMatch, fallback, generatedDraft);
    } catch (err: any) {
      console.error('[Onboarding] Error on auto deployment:', err);
      showError(err.message || 'Falha ao ativar protocolo de treinamento.');
      setIsFinishing(false);
    }
  };

  // Perform absolute deployment cloning the chosen plan and ending onboarding
  const handleDeployProtocolSelection = async (matchItem: any, isFallback = false, providedFallbackDraft?: any) => {
    if (!userId) return;
    setIsFinishing(true);

    const legPressEx = activeExercises.find(e => e.name.toLowerCase().includes('leg press')) || activeExercises[0];
    const fallbackLegPressId = legPressEx?.id || 'f1b01c1c-99e6-4251-ba84-475253896001';

    try {
      console.log('[KYRON_OS_DIAGNOSTIC] ONBOARDING_COMPLETED', { userId, isRedoing });

      // ETAPA 1: VALIDAR CRIAÇÃO DO PROTOCOLO (Se for compatível e tiver matchItem, ou se tiver draft)
      const finalProtocolId = matchItem?.id || providedFallbackDraft?.id || customGeneratedDraft?.id || 'failsafe-id';
      const finalProtocolName = matchItem?.name || providedFallbackDraft?.name || customGeneratedDraft?.name || 'Kyron OS Adaptativo';
      const finalProtocolStatus = matchItem?.status || 'Active';
      const finalProtocolCreatedAt = matchItem?.created_at || new Date().toISOString();

      console.log('[KYRON_OS_DIAGNOSTIC] PROTOCOL_CREATED', {
        id: finalProtocolId,
        nome: finalProtocolName,
        status: finalProtocolStatus,
        data_criacao: finalProtocolCreatedAt
      });

      // Se não existir protocolo válido e não for fallback, interromper para lançar o regenerador / failsafe
      if (!isFallback && !matchItem && !providedFallbackDraft && !customGeneratedDraft) {
        console.warn('[KYRON_OS_DIAGNOSTIC] Protocol validation failed. No protocol found. Triggering regeneration fallback...');
        throw new Error('Nenhum protocolo válido encontrado para ativação.');
      }

      // MIGRAÇÃO SEGURA: Se o usuário estiver refazendo o onboarding, salvar o anterior em historical_protocols
      if (isRedoing) {
        const favFolderId = localStorage.getItem('favorite_workout_folder_id');
        if (favFolderId) {
          try {
            const { data: folderData } = await supabase
              .from('workout_folders')
              .select('name, created_at')
              .eq('id', favFolderId)
              .maybeSingle();

            if (folderData) {
              let completionPct = 0;
              const { data: cats } = await supabase
                .from('workout_categories')
                .select('id')
                .eq('folder_id', favFolderId);

              if (cats && cats.length > 0) {
                const catIds = cats.map(c => c.id);
                const { count } = await supabase
                  .from('workout_history')
                  .select('*', { count: 'exact', head: true })
                  .in('category_id', catIds);

                if (count !== null) {
                  completionPct = Math.min(100, Math.round((count / cats.length) * 100)) || 0;
                }
              }

              const prevHistRaw = localStorage.getItem(`kyron_historical_protocols_${userId}`) || '[]';
              let prevHistList = [];
              try { prevHistList = JSON.parse(prevHistRaw); } catch {}
              prevHistList.push({
                nome: folderData.name,
                data_inicio: folderData.created_at || new Date().toISOString(),
                data_encerramento: new Date().toISOString(),
                percentual_concluido: completionPct
              });
              localStorage.setItem(`kyron_historical_protocols_${userId}`, JSON.stringify(prevHistList));
            }
          } catch (migErr) {
            console.warn('[Onboarding] Error during historical protocol migration:', migErr);
          }
        }
      }

      let clonedFolder: any = null;

      // PASSO 4 & 5: Se existir protocolo compatível, ativar automaticamente. Caso contrário, usar o dinâmico.
      if (!isFallback && matchItem) {
        clonedFolder = await premiumProtocolsApi.cloneToUser(userId, matchItem.id);
      } else {
        const draftToUse = providedFallbackDraft || customGeneratedDraft;
        if (draftToUse) {
          // PASSO 6: Salvar o rascunho com status "Gerado Automaticamente"
          const draftToSave = {
            ...draftToUse,
            status: 'Gerado Automaticamente'
          };
          
          // Registrar nas listas de drafts locais
          const rawDrafts = localStorage.getItem('kyron_admin_draft_protocols') || '[]';
          let draftsList: PremiumProtocol[] = [];
          try { draftsList = JSON.parse(rawDrafts); } catch {}
          draftsList.push(draftToSave);
          localStorage.setItem('kyron_admin_draft_protocols', JSON.stringify(draftsList));

          // Registrar no banco ou memória para que cloneToUser consiga buscar
          await premiumProtocolsApi.createOrUpdateProtocol(draftToSave);

          // PASSO 7: Clonar para a pasta do usuário
          clonedFolder = await premiumProtocolsApi.cloneToUser(userId, draftToSave.id);
        }
      }

      // ETAPA 2 & 3: VALIDAR VÍNCULO COM O USUÁRIO E CRIAR SE NÃO EXISTIR (Vínculo é o folder com o user_id e a chave favorita)
      if (!clonedFolder) {
        console.warn('[KYRON_OS_DIAGNOSTIC] Cloned folder missing. Establishing failsafe folder link...');
        clonedFolder = await workoutApi.createFolder(userId, finalProtocolName || 'Meu Protocolo Kyron OS');
      }

      console.log('[KYRON_OS_DIAGNOSTIC] PROTOCOL_ASSIGNED', {
        folderId: clonedFolder.id,
        folderName: clonedFolder.name,
        userId: userId,
        status: 'active'
      });

      // Se conseguiu clonar o folder, ativa-o como favorito/ativo principal
      localStorage.setItem('favorite_workout_folder_id', clonedFolder.id);
      setDeployedFolderId(clonedFolder.id);

      // ETAPA 4: GERAR PLANO DE TREINO ATIVO (Verificar se existem treinos e exercícios vinculados)
      const { data: categories } = await supabase
        .from('workout_categories')
        .select('id')
        .eq('folder_id', clonedFolder.id)
        .order('created_at', { ascending: true });

      // Se não houver treinos gerados para a pasta, cria um treino inicial/failsafe automático
      if (!categories || categories.length === 0) {
        console.warn('[KYRON_OS_DIAGNOSTIC] Workout plan empty. Generating active workout plan categories...');
        const cat = await workoutApi.createCategory({
          user_id: userId,
          folder_id: clonedFolder.id,
          name: 'Treino A — Ativação Geral',
          description: 'Treino adaptativo de ativação emergencial.'
        });
        
        const emergencyNames = [
          'Leg Press',
          'Supino Máquina',
          'Puxada Frontal',
          'Desenvolvimento Máquina',
          'Mesa Flexora',
          'Prancha'
        ];

        let emergencyExs = activeExercises.filter(ex => 
          emergencyNames.some(eName => ex.name.toLowerCase().includes(eName.toLowerCase()))
        );

        if (emergencyExs.length === 0) {
          emergencyExs = activeExercises.slice(0, 6);
        }

        const sortedEmergencyExs = sortExercisesAnatomically(emergencyExs);

        const finalPayload = sortedEmergencyExs.map((ex: any, idx) => ({
          category_id: cat.id,
          exercise_id: ex.id,
          exercise_name_snapshot: ex.name,
          sets: 3,
          reps: '12',
          weight: 15,
          rest_time: 60,
          sort_order: idx + 1,
          sets_json: [
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 }
          ]
        }));
        
        await workoutApi.insertWorkoutExercises(finalPayload);

        setFirstWorkoutId(cat.id);
        console.log('[KYRON_OS_DIAGNOSTIC] WORKOUT_PLAN_CREATED', {
          categoriesCount: 1,
          firstWorkoutId: cat.id
        });
      } else {
        setFirstWorkoutId(categories[0].id);
        console.log('[KYRON_OS_DIAGNOSTIC] WORKOUT_PLAN_CREATED', {
          categoriesCount: categories.length,
          firstWorkoutId: categories[0].id
        });
      }

      // ETAPA 5: ATUALIZAR PERFIL DO USUÁRIO
      const finalProfileData = {
        onboarding_completed: true,
        onboarding_version: '2.1',
        name: formData.name || 'Atleta Kyron OS',
        gender: formData.sex,
        sex: formData.sex,
        age: Number(formData.age) || 28,
        weight: Number(formData.weight) || 75,
        height: Number(formData.height) || 175,
        primary_goal: formData.primary_goal,
        training_experience: formData.training_experience,
        weekly_availability: Number(formData.weekly_availability) || 3,
        training_environment: formData.training_environment,
        restrictions: formData.restrictions || ['Nenhuma'],
        exercise_dislikes: formData.exercise_dislikes || [],
        updated_at: new Date().toISOString(),
        active_protocol_id: finalProtocolId,
        active_plan_id: clonedFolder.id,
        last_onboarding_update: new Date().toISOString()
      };

      await profileApi.updateProfile(userId, finalProfileData);

      // Hydrate user store
      const fullProfile = await profileApi.getProfile(userId);
      if (fullProfile) setProfile(fullProfile);

      // ETAPA 6: REFRESH IMEDIATO DO CACHE DO DASHBOARD
      console.log('[KYRON_OS_DIAGNOSTIC] Invalidating and clearing query caches for immediate refresh...');
      cacheStore.clear(); // Clear memory query caches
      localStorage.removeItem(`rubi_dashboard_cache_${userId}`); // Clear local storage dashboard backup cache

      showSuccess('KYRON OS Ativado!', 'Seu protocolo adaptativo está pronto para iniciar.');
    } catch (err: any) {
      console.warn('[Onboarding] Error during protocol setup, launching Failsafe...', err);
      // FAILSAFE SEVERO: Garantir que o usuário NUNCA saia sem treino ativo
      try {
        const fallbackFolder = await workoutApi.createFolder(userId, 'Kyron OS: Plano Failsafe');
        const cat = await workoutApi.createCategory({
          user_id: userId,
          folder_id: fallbackFolder.id,
          name: 'Treino A — Ativação Geral',
          description: 'Treino adaptativo de ativação emergencial.'
        });
        
        const emergencyNames = [
          'Leg Press',
          'Supino Máquina',
          'Puxada Frontal',
          'Desenvolvimento Máquina',
          'Mesa Flexora',
          'Prancha'
        ];

        let emergencyExs = activeExercises.filter(ex => 
          emergencyNames.some(eName => ex.name.toLowerCase().includes(eName.toLowerCase()))
        );

        if (emergencyExs.length === 0) {
          emergencyExs = activeExercises.slice(0, 6);
        }

        const sortedEmergencyExs = sortExercisesAnatomically(emergencyExs);

        const finalPayload = sortedEmergencyExs.map((ex: any, idx) => ({
          category_id: cat.id,
          exercise_id: ex.id,
          exercise_name_snapshot: ex.name,
          sets: 3,
          reps: '12',
          weight: 15,
          rest_time: 60,
          sort_order: idx + 1,
          sets_json: [
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 }
          ]
        }));
        
        await workoutApi.insertWorkoutExercises(finalPayload);

        localStorage.setItem('favorite_workout_folder_id', fallbackFolder.id);
        setDeployedFolderId(fallbackFolder.id);
        setFirstWorkoutId(cat.id);

        // ETAPA 5 fallback
        const failsafeProfileData = {
          onboarding_completed: true,
          onboarding_version: '2.1',
          updated_at: new Date().toISOString(),
          active_protocol_id: 'failsafe-id',
          active_plan_id: fallbackFolder.id,
          last_onboarding_update: new Date().toISOString()
        };
        await profileApi.updateProfile(userId, failsafeProfileData);
        const fullProfile = await profileApi.getProfile(userId);
        if (fullProfile) setProfile(fullProfile);

        // ETAPA 6 fallback
        cacheStore.clear();
        localStorage.removeItem(`rubi_dashboard_cache_${userId}`);

        showSuccess('KYRON OS Ativado!', 'Plano de emergência configurado para garantir seu treino.');
      } catch (fError) {
        console.error('[Severe Failsafe error]', fError);
      }
    } finally {
      setIsFinishing(false);
    }
  };

  // Compatibility score calculation logic
  const calculateCompatibility = (
    p: any, 
    userGoal: string, 
    userExp: string, 
    userWeeks: number, 
    userEnv: string, 
    userRestrictions: string[], 
    userSex: string
  ): number => {
    let score = 0;

    // A. Goal Match (Weight: 35%)
    const protocolGoal = (p.goal || '').toLowerCase();
    const uGoal = (userGoal || '').toLowerCase();
    
    const isHypUser = uGoal.includes('massa') || uGoal.includes('hypertrophy') || uGoal.includes('hipertrofia') || uGoal.includes('defini');
    const isHypProto = protocolGoal.includes('hyper') || protocolGoal.includes('hipertrofia') || protocolGoal.includes('definition');

    const isLossUser = uGoal.includes('emagrecer') || uGoal.includes('weight') || uGoal.includes('perda') || uGoal.includes('defini');
    const isLossProto = protocolGoal.includes('loss') || protocolGoal.includes('emagrecimento') || protocolGoal.includes('cardio');

    const isStrUser = uGoal.includes('força') || uGoal.includes('strength') || uGoal.includes('power');
    const isStrProto = protocolGoal.includes('strength') || protocolGoal.includes('força');

    const isPerfUser = uGoal.includes('performance') || uGoal.includes('desempenho');
    const isPerfProto = protocolGoal.includes('performance') || protocolGoal.includes('desempenho');

    const isHealthUser = uGoal.includes('saúde') || uGoal.includes('health') || uGoal.includes('recupera');
    const isHealthProto = protocolGoal.includes('health') || protocolGoal.includes('recovery') || protocolGoal.includes('endurance') || protocolGoal.includes('resist');

    if (protocolGoal === uGoal) {
      score += 35;
    } else if ((isHypUser && isHypProto) || (isLossUser && isLossProto) || (isStrUser && isStrProto) || (isPerfUser && isPerfProto) || (isHealthUser && isHealthProto)) {
      score += 35;
    } else if (isHypUser && isStrProto) {
      score += 25;
    } else if (isLossUser && isHealthProto) {
      score += 25;
    } else {
      score += 10;
    }

    // B. Experience Level Match (Weight: 25%)
    const pDiff = (p.difficulty || 'intermediate').toLowerCase();
    const uExp = (userExp || 'intermediate').toLowerCase();

    const isUserBeg = uExp === 'none' || uExp === 'beginner';
    const isUserInt = uExp === 'intermediate';
    const isUserAdv = uExp === 'advanced';

    const isProtoBeg = pDiff === 'beginner';
    const isProtoInt = pDiff === 'intermediate';
    const isProtoAdv = pDiff === 'advanced';

    if ((isUserBeg && isProtoBeg) || (isUserInt && isProtoInt) || (isUserAdv && isProtoAdv)) {
      score += 25;
    } else if ((isUserBeg && isProtoInt) || (isUserInt && isProtoBeg) || (isUserInt && isProtoAdv) || (isUserAdv && isProtoInt)) {
      score += 15;
    } else {
      score += 5;
    }

    // C. Frequency Match (Weight: 20%)
    const pFreq = p.frequency || p.workouts?.length || 3;
    const uWeeks = userWeeks || 3;
    const diffWeeks = Math.abs(pFreq - uWeeks);
    if (diffWeeks === 0) {
      score += 20;
    } else if (diffWeeks === 1) {
      score += 15;
    } else if (diffWeeks === 2) {
      score += 10;
    } else {
      score += 5;
    }

    // D. Environment Preference Match (Weight: 10%)
    const pEnv = p.training_environment;
    if (pEnv) {
      if (pEnv === 'both') {
        score += 10;
      } else if (pEnv === userEnv) {
        score += 10;
      } else {
        score += 2;
      }
    } else {
      const desc = (p.description || '').toLowerCase() + (p.name || '').toLowerCase();
      if (userEnv === 'home') {
        if (desc.includes('casa') || desc.includes('home') || desc.includes('halter') || desc.includes('caliste')) {
          score += 10;
        } else if (desc.includes('máquina') || desc.includes('academia') || desc.includes('polia')) {
          score += 3;
        } else {
          score += 7;
        }
      } else if (userEnv === 'gym_full') {
        if (desc.includes('completo') || desc.includes('academia') || desc.includes('máquina')) {
          score += 10;
        } else {
          score += 8;
        }
      } else {
        score += 10;
      }
    }

    // E. Physical Restrictions (Weight: 5%)
    if (userRestrictions && userRestrictions.length > 0 && !userRestrictions.includes('Nenhuma')) {
      // Minor adaptation penalty, user can modify exercises anytime
      score += 4;
    } else {
      score += 5;
    }

    // F. Sex alignment (Weight: 5%)
    const pTitle = (p.name || '').toLowerCase();
    if (formData.sex === 'female' && (pTitle.includes('femin') || pTitle.includes('glúte') || pTitle.includes('musa'))) {
      score += 5;
    } else if (formData.sex === 'male' && pTitle.includes('femin')) {
      score += 1;
    } else {
      score += 5;
    }

    return Math.min(Math.round(score), 100);
  };

  // Auto fallback design generation function mapping active database exercises
  const generateFallbackProtocol = async (userIdStr: string, activeForm: any, listExs: any[]): Promise<any> => {
    const goalName = activeForm.primary_goal || 'Performance';
    const freq = Number(activeForm.weekly_availability) || 3;
    const level = activeForm.training_experience || 'beginner';
    const environment = activeForm.training_environment || 'gym_full';
    const restrictions = activeForm.restrictions || ['Nenhuma'];
    const dislikes = activeForm.exercise_dislikes || [];
    
    let niceGoal = 'Hipertrofia Dinâmica';
    if (goalName === 'weight_loss') niceGoal = 'Foco em Queima e Definição';
    if (goalName === 'definition') niceGoal = 'Definição e Lapidação Rubi';
    if (goalName === 'health') niceGoal = 'Longevidade e Saúde Ativa';
    if (goalName === 'strength') niceGoal = 'Força Bruta e Power';
    if (goalName === 'performance') niceGoal = 'Performance de Elite';

    const protocolId = `draft-auto-${Date.now()}`;
    const newProtocol: any = {
      id: protocolId,
      name: `Kyron OS: ${niceGoal}`,
      description: `Protocolo adaptativo gerado sob demanda para atender aos limites do atleta. Foco em ${niceGoal}, nível ${level}, frequência semanal de ${freq} dias no ambiente ${environment === 'home' ? 'Residencial' : 'Academia Completa'}.`,
      version: 1,
      premium: true,
      goal: goalName,
      difficulty: level === 'none' ? 'beginner' : level,
      duration_weeks: 4,
      frequency: freq,
      created_by: 'rubi_ai',
      rating: 5.2,
      athletes_count: 1,
      completion_rate: 98,
      strength_increase_pct: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: 'Rubi Optimizer',
      workouts: [],
      version_history: []
    };

    // Filtros de Exercícios baseados no ambiente, nível e preferências
    const cleanListExs = listExs.filter(ex => {
      if (ex.is_active === false) return false;

      const nameLower = ex.name.toLowerCase();

      // 1. Unwanted Exercises (Dislikes)
      if (dislikes.some((dis: string) => nameLower.includes(dis.toLowerCase()))) {
        return false;
      }

      // 2. Training Environment restrictions
      if (environment === 'home') {
        // Exclude machine-heavy exercises
        if (
          nameLower.includes('leg press') ||
          nameLower.includes('pulley') ||
          nameLower.includes('polia') ||
          nameLower.includes('cadeira extensor') ||
          nameLower.includes('cadeira flexor') ||
          nameLower.includes('mesa flexora') ||
          nameLower.includes('crossover') ||
          nameLower.includes('hack') ||
          nameLower.includes('smith') ||
          nameLower.includes('graviton') ||
          nameLower.includes('supino inclinado articulado')
        ) {
          return false;
        }
      }

      // 3. Physical Limitations restrictions
      if (restrictions.some((r: string) => r.toLowerCase().includes('ombro'))) {
        if (nameLower.includes('desenvolvimento com barra') || nameLower.includes('overhead press')) {
          return false;
        }
      }
      if (restrictions.some((r: string) => r.toLowerCase().includes('joelho'))) {
        if (nameLower.includes('agachamento livre profundo') || nameLower.includes('leg press 45')) {
          return false;
        }
      }
      if (restrictions.some((r: string) => r.toLowerCase().includes('lombar'))) {
        if (nameLower.includes('levantamento terra') || nameLower.includes('remada curvada')) {
          return false;
        }
      }

      return true;
    });

    // Splits configuration based on weekly workouts
    let splits: { name: string; muscles: string[] }[] = [];
    if (freq === 2) {
      splits = [
        { name: 'Treino A - Membros Superiores (Push/Pull)', muscles: ['Peito', 'Costas', 'Ombros', 'Tríceps', 'Bíceps'] },
        { name: 'Treino B - Membros Inferiores & Core', muscles: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen'] }
      ];
    } else if (freq === 3) {
      splits = [
        { name: 'Treino A - Superior Empurrar (Peito/Ombro/Tríceps)', muscles: ['Peito', 'Ombros', 'Tríceps'] },
        { name: 'Treino B - Superior Puxar (Costas/Bíceps/Lombar)', muscles: ['Costas', 'Bíceps'] },
        { name: 'Treino C - Inferior Foco Quad (Pernas/Core)', muscles: ['Quadríceps', 'Glúteos', 'Panturrilha', 'Abdômen'] }
      ];
    } else if (freq === 4) {
      splits = [
        { name: 'Treino A - Peito & Ombros', muscles: ['Peito', 'Ombros', 'Tríceps'] },
        { name: 'Treino B - Costas & Postural', muscles: ['Costas', 'Bíceps'] },
        { name: 'Treino C - Pernas Completas (Quad/Glúteos)', muscles: ['Quadríceps', 'Glúteos'] },
        { name: 'Treino D - Posterior & Core', muscles: ['Posterior', 'Lombar', 'Abdômen'] }
      ];
    } else if (freq === 5) {
      splits = [
        { name: 'Treino A - Peitorais & Tríceps', muscles: ['Peito', 'Tríceps'] },
        { name: 'Treino B - Costas, Trapézio & Bíceps', muscles: ['Costas', 'Bíceps'] },
        { name: 'Treino C - Pernas Foco Anterior (Quad)', muscles: ['Quadríceps', 'Panturrilha'] },
        { name: 'Treino D - Deltóides e Tríceps Estímulo', muscles: ['Ombros', 'Tríceps'] },
        { name: 'Treino E - Cadeia Posterior & Lombar', muscles: ['Posterior', 'Glúteos', 'Lombar'] }
      ];
    } else {
      splits = [
        { name: 'Treino A - Peito & Tríceps', muscles: ['Peito', 'Tríceps'] },
        { name: 'Treino B - Costas & Bíceps', muscles: ['Costas', 'Bíceps'] },
        { name: 'Treino C - Quadríceps & Panturrilha', muscles: ['Quadríceps', 'Panturrilha'] },
        { name: 'Treino D - Ombros & Trapézio', muscles: ['Ombros'] },
        { name: 'Treino E - Posterior de Coxa & Glúteos', muscles: ['Posterior', 'Glúteos'] },
        { name: 'Treino F - Abdominais & Core Cardio', muscles: ['Abdômen'] }
      ];
    }

    splits.forEach((split, sIdx) => {
      const workoutWorkoutId = `auto-w-${sIdx}-${Date.now()}`;
      const workout: any = {
        id: workoutWorkoutId,
        name: split.name,
        description: `Sessão adaptativa focada em ${split.muscles.join(', ')}.`,
        exercises: []
      };

      let count = 0;
      split.muscles.forEach(muscle => {
        // Encontrar os exercícios compatíveis com este grupo muscular usando normalização inteligente
        const normMuscle = normalizeMuscleGroup(muscle);
        const filtered = cleanListExs.filter(ex => {
          const exNorm = normalizeMuscleGroup(ex.muscle_group || '');
          return exNorm.toLowerCase() === normMuscle.toLowerCase() ||
                 ex.name.toLowerCase().includes(muscle.toLowerCase());
        });
        
        // Se for iniciante, priorizar máquinas ou exercícios corporais simples
        const sortedCandidateExs = filtered.sort((a, b) => {
          if (level === 'beginner') {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aIsMachine = aName.includes('máquina') || aName.includes('sentado') || aName.includes('apoiado');
            const bIsMachine = bName.includes('máquina') || bName.includes('sentado') || bName.includes('apoiado');
            if (aIsMachine && !bIsMachine) return -1;
            if (!aIsMachine && bIsMachine) return 1;
          }
          return 0.5 - Math.random();
        });

        const selected = sortedCandidateExs.slice(0, 2);

        selected.forEach(ex => {
          count++;
          const finalSetsCount = 4;
          const finalReps = level === 'beginner' || level === 'none' ? '12' : '10';
          const finalWeight = level === 'beginner' || level === 'none' ? 10 : 20;

          workout.exercises.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            muscle_group: ex.muscle_group,
            sets: finalSetsCount,
            reps: finalReps,
            weight: finalWeight,
            rest_time: 60,
            sort_order: count,
            notes: level === 'beginner' ? 'Foco em controle postural e respiração.' : 'Séries de trabalho buscando a falha técnica.',
            sets_json: Array.from({ length: finalSetsCount }, () => ({
              reps: finalReps,
              weight: finalWeight,
              rest_time: 60
            }))
          });
        });
      });

      // FAILSAFE OBRIGATÓRIO: Ensure workout has between 5 and 10 exercises
      if (workout.exercises.length < 5) {
        const currentIds = new Set(workout.exercises.map((e: any) => e.exercise_id));
        const extraCandidates = cleanListExs.filter(ex => !currentIds.has(ex.id));
        
        let idx = workout.exercises.length;
        for (const ex of extraCandidates) {
          if (workout.exercises.length >= 6) break; // target size of 6, which is strictly between 5 and 10
          idx++;
          workout.exercises.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            muscle_group: ex.muscle_group,
            sets: level === 'advanced' ? 4 : 3,
            reps: level === 'beginner' ? '12' : '10',
            weight: level === 'beginner' ? 10 : 20,
            rest_time: 60,
            sort_order: idx,
            notes: 'Exercício complementar adaptativo.',
            sets_json: Array.from({ length: level === 'advanced' ? 4 : 3 }, () => ({
              reps: level === 'beginner' ? '12' : '10',
              weight: level === 'beginner' ? 10 : 20,
              rest_time: 60
            }))
          });
        }
      }

      // FALLBACK DE EMERGÊNCIA: If still less than 5 exercises, pull from emergency fallback list
      if (workout.exercises.length < 5) {
        const emergencyNames = [
          'Leg Press',
          'Supino Máquina',
          'Puxada Frontal',
          'Desenvolvimento Máquina',
          'Mesa Flexora',
          'Prancha'
        ];
        
        const currentNames = new Set(workout.exercises.map((e: any) => e.exercise_name.toLowerCase()));
        const fallbackList = listExs.filter(ex => 
          emergencyNames.some(eName => ex.name.toLowerCase().includes(eName.toLowerCase())) && !currentNames.has(ex.name.toLowerCase())
        );

        let idx = workout.exercises.length;
        for (const ex of fallbackList) {
          if (workout.exercises.length >= 6) break;
          idx++;
          workout.exercises.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            muscle_group: ex.muscle_group,
            sets: 3,
            reps: '12',
            weight: 15,
            rest_time: 60,
            sort_order: idx,
            notes: 'Ativação de emergência Kyron OS.',
            sets_json: [
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 }
            ]
          });
        }
      }

      // If still less than 5, grab any active ones from listExs
      if (workout.exercises.length < 5) {
        const currentIds = new Set(workout.exercises.map((e: any) => e.exercise_id));
        const extraRandom = listExs.filter(ex => !currentIds.has(ex.id));
        let idx = workout.exercises.length;
        for (const ex of extraRandom) {
          if (workout.exercises.length >= 6) break;
          idx++;
          workout.exercises.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            muscle_group: ex.muscle_group,
            sets: 3,
            reps: '12',
            weight: 15,
            rest_time: 60,
            sort_order: idx,
            notes: 'Recrutamento motor compensatório.',
            sets_json: [
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 },
              { reps: '12', weight: 15, rest_time: 60 }
            ]
          });
        }
      }

      // Enforce MAXIMUM of 10 exercises
      if (workout.exercises.length > 10) {
        workout.exercises = workout.exercises.slice(0, 10);
      }

      // Order anatomically: upper body (Chest, Triceps, Back, Biceps, Shoulder) first, then lower body (Anterior, Posterior, Glute, Calf) and core
      workout.exercises = sortExercisesAnatomically(workout.exercises);
      workout.exercises.forEach((ex: any, i: number) => {
        ex.sort_order = i + 1;
      });

      newProtocol.workouts.push(workout);
    });

    return newProtocol;
  };

  // Quick setup logic for physical restrictions multiselect
  const handleToggleRestriction = (value: string) => {
    let current = [...(formData.restrictions || [])];
    if (value === 'Nenhuma') {
      current = ['Nenhuma'];
    } else {
      current = current.filter(r => r !== 'Nenhuma');
      if (current.includes(value)) {
        current = current.filter(r => r !== value);
        if (current.length === 0) current = ['Nenhuma'];
      } else {
        current.push(value);
      }
    }
    saveProgressValue({ restrictions: current });
  };

  // Quick setups for exercise dislikes search and badges
  const handleAddDislike = (exerciseName: string) => {
    const current = [...(formData.exercise_dislikes || [])];
    if (!current.includes(exerciseName)) {
      current.push(exerciseName);
      saveProgressValue({ exercise_dislikes: current });
    }
    setSearchQuery('');
  };

  const handleRemoveDislike = (exerciseName: string) => {
    const current = (formData.exercise_dislikes || []).filter(name => name !== exerciseName);
    saveProgressValue({ exercise_dislikes: current });
  };

  const handleGoToDashboard = async () => {
    if (!userId) {
      navigate('dashboard');
      return;
    }

    try {
      console.log('[KYRON_OS_DIAGNOSTIC] Navigating to Dashboard - Executing ETAPA 7 Secure Redirect Validation...');
      
      // Clear memory cache so dashboard query is forced to fetch fresh data
      cacheStore.clear();
      localStorage.removeItem(`rubi_dashboard_cache_${userId}`);

      // 1. Validar se existe plano ativo no localStorage
      let activePlanId = localStorage.getItem('favorite_workout_folder_id');
      
      // FAILSAFE 1: Se não houver vínculo no localStorage, tentar encontrar uma pasta existente do usuário no banco
      if (!activePlanId) {
        console.warn('[KYRON_OS_DIAGNOSTIC] Failsafe 1 activated - favorite_workout_folder_id missing in localStorage. Querying database...');
        const { data: userFolders } = await supabase
          .from('workout_folders')
          .select('id, name')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (userFolders && userFolders.length > 0) {
          activePlanId = userFolders[0].id;
          localStorage.setItem('favorite_workout_folder_id', activePlanId);
          console.log('[KYRON_OS_DIAGNOSTIC] Failsafe 1 resolved - Linked existing folder:', userFolders[0].name);
        }
      }

      // 2. Validar se a pasta realmente existe e se tem categorias/treinos vinculados
      let hasWorkouts = false;
      if (activePlanId) {
        // Confirmar se o plano/pasta existe
        const { data: folderExists } = await supabase
          .from('workout_folders')
          .select('id')
          .eq('id', activePlanId)
          .maybeSingle();

        if (folderExists) {
          // Confirmar se possui treinos cadastrados
          const { data: categories } = await supabase
            .from('workout_categories')
            .select('id')
            .eq('folder_id', activePlanId);

          if (categories && categories.length > 0) {
            hasWorkouts = true;
            console.log('[KYRON_OS_DIAGNOSTIC] DASHBOARD_PROTOCOL_FOUND and DASHBOARD_WORKOUT_FOUND verified.', {
              activePlanId,
              workoutsCount: categories.length
            });
          }
        }
      }

      // FAILSAFE 2: Se a pasta favorita não tiver treinos ou não existir, criar pasta e treinos emergenciais
      if (!activePlanId || !hasWorkouts) {
        console.warn('[KYRON_OS_DIAGNOSTIC] Failsafe 2 activated - Missing active plan or workouts. Building emergency training sheet...');
        
        let targetFolderId = activePlanId;
        if (!targetFolderId) {
          const newF = await workoutApi.createFolder(userId, 'Kyron OS: Plano Failsafe');
          targetFolderId = newF.id;
          localStorage.setItem('favorite_workout_folder_id', targetFolderId);
        }

        const cat = await workoutApi.createCategory({
          user_id: userId,
          folder_id: targetFolderId,
          name: 'Treino A — Ativação Geral',
          description: 'Treino adaptativo de ativação emergencial.'
        });
        
        const emergencyNames = [
          'Leg Press',
          'Supino Máquina',
          'Puxada Frontal',
          'Desenvolvimento Máquina',
          'Mesa Flexora',
          'Prancha'
        ];

        let emergencyExs = activeExercises.filter(ex => 
          emergencyNames.some(eName => ex.name.toLowerCase().includes(eName.toLowerCase()))
        );

        if (emergencyExs.length === 0) {
          emergencyExs = activeExercises.slice(0, 6);
        }

        const sortedEmergencyExs = sortExercisesAnatomically(emergencyExs);

        const finalPayload = sortedEmergencyExs.map((ex: any, idx) => ({
          category_id: cat.id,
          exercise_id: ex.id,
          exercise_name_snapshot: ex.name,
          sets: 3,
          reps: '12',
          weight: 15,
          rest_time: 60,
          sort_order: idx + 1,
          sets_json: [
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 },
            { reps: '12', weight: 15, rest_time: 60 }
          ]
        }));
        
        await workoutApi.insertWorkoutExercises(finalPayload);

        console.log('[KYRON_OS_DIAGNOSTIC] Failsafe 2 resolved - Emergency plan generated with Treino A.');
      }

      // Final cache clearing right before routing to guarantee instant refresh
      cacheStore.clear();
      localStorage.removeItem(`rubi_dashboard_cache_${userId}`);

      console.log('[KYRON_OS_DIAGNOSTIC] Validation success. Redirecting safely to dashboard...');
      navigate('dashboard');
    } catch (e) {
      console.error('[KYRON_OS_DIAGNOSTIC] Error in redirection validation:', e);
      // FAILSAFE 4: Se qualquer etapa falhar, limpa cache e navega para que o novo Empty State do Dashboard assuma o controle
      cacheStore.clear();
      navigate('dashboard');
    }
  };

  // Render individual wizard screen step-by-step
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-6 pt-6">
            <div className="w-12 h-12 bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-12 transition-transform duration-300">
              <img src={kyronLogo} alt="KYRON OS Logo" className="w-8 h-8 object-contain scale-[1.75]" referrerPolicy="no-referrer" />
            </div>
            
            <div className="space-y-4">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#7BA7FF] bg-blue-50 border border-blue-100 px-3.5 py-1 rounded-full">
                Kyron Onboarding 2.1
              </span>
              <h1 className="text-3xl font-[1000] tracking-tighter text-slate-950 uppercase leading-none">
                Vamos construir seu sistema de performance.
              </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Uma experiência desenhada para decodificar sua biomecânica e alinhar metas em menos de 2 minutos.
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-8 cursor-pointer"
            >
              Começar
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl w-fit">
                <User size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Como podemos te chamar?</h2>
              <p className="text-xs text-slate-500">Insira seu nome de exibição preferido.</p>
            </div>

            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => saveProgressValue({ name: e.target.value })}
              placeholder="Seu nome"
              autoFocus
              className="w-full bg-white border-2 border-slate-100 rounded-2xl p-5 text-lg font-bold placeholder:text-slate-300 focus:border-slate-800 focus:ring-0 focus:outline-none transition-all shadow-xs"
            />

            <button
              disabled={!formData.name?.trim()}
              onClick={handleNext}
              className="w-full bg-slate-950 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all select-none flex items-center justify-center gap-2 cursor-pointer"
            >
              Continuar
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        );

      case 2:
        const goals = [
          { id: 'hypertrophy', label: 'Ganhar Massa Muscular', desc: 'Foco em hipertrofia e volume muscular', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { id: 'weight_loss', label: 'Emagrecer', desc: 'Queima calórica acelerada e definição muscular', icon: Target, color: 'text-violet-500', bg: 'bg-violet-50' },
          { id: 'definition', label: 'Definição', desc: 'Preservar massa magra e lapidar contornos', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { id: 'health', label: 'Saúde', desc: 'Longevidade física, cardiovascular e bem-estar', icon: BrainCircuit, color: 'text-blue-500', bg: 'bg-blue-50' },
          { id: 'strength', label: 'Força', desc: 'Powerlifting e aumento de carga máxima', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
          { id: 'performance', label: 'Performance', desc: 'Atletas focados em explosão, velocidade e potência', icon: Zap, color: 'text-[#7BA7FF]', bg: 'bg-blue-50/50' }
        ];
        return (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Qual seu principal objetivo?</h2>
              <p className="text-xs text-slate-500">Iremos personalizar o treinamento em torno dessa meta.</p>
            </div>

            <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-1">
              {goals.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    saveProgressValue({ primary_goal: opt.id });
                    setTimeout(handleNext, 200);
                  }}
                  className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                    formData.primary_goal === opt.id 
                      ? 'border-slate-905 bg-slate-50 scale-[1.01] shadow-xs' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`${opt.bg} ${opt.color} p-2.5 rounded-xl mr-3.5`}>
                    <opt.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-slate-900 text-sm">{opt.label}</p>
                    <p className="text-[10px] font-semibold text-slate-400 line-clamp-1">{opt.desc}</p>
                  </div>
                  {formData.primary_goal === opt.id && <CheckCircle2 className="text-slate-950 ml-2" size={18} />}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        const experienceLevels = [
          { id: 'none', label: 'Nunca treinei', desc: 'Estou começando hoje do absoluto zero' },
          { id: 'beginner', label: 'Menos de 6 meses', desc: 'Familiarizado com os movimentos básicos' },
          { id: 'intermediate', label: '6 meses a 2 anos', desc: 'Treino com consistência e boa técnica' },
          { id: 'advanced', label: 'Mais de 2 anos', desc: 'Avançado com excelente consciência corporal' }
        ];
        return (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase font-sans">Há quanto tempo você treina?</h2>
              <p className="text-xs text-slate-500">Deixe-nos adequar a complexidade e volume dos blocos.</p>
            </div>

            <div className="grid gap-3">
              {experienceLevels.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    saveProgressValue({ training_experience: opt.id });
                    setTimeout(handleNext, 200);
                  }}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    formData.training_experience === opt.id 
                      ? 'border-slate-950 bg-slate-50' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{opt.desc}</p>
                  </div>
                  {formData.training_experience === opt.id && <CheckCircle2 className="text-slate-950 shrink-0 ml-4" size={18} />}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="bg-red-50 text-red-500 p-3.5 rounded-2xl w-fit mx-auto mb-2">
                <Calendar size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Quantos dias para treinar?</h2>
              <p className="text-xs text-slate-500">Quantas sessões semanais você consegue encaixar?</p>
            </div>

            <div className="flex justify-between items-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              {[2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    saveProgressValue({ weekly_availability: num });
                  }}
                  className={`w-11 h-11 rounded-full font-black text-sm transition-all cursor-pointer ${
                    formData.weekly_availability === num 
                      ? 'bg-slate-950 text-white scale-110 shadow-sm' 
                      : 'bg-white border border-slate-200/60 text-slate-450 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <p className="text-center font-bold text-slate-400 text-xs">Dispõe de {formData.weekly_availability} dias p/ semana</p>

            <button
              onClick={handleNext}
              className="w-full bg-slate-950 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Continuar
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        );

      case 5:
        const environments = [
          { id: 'gym_full', label: 'Academia Completa', desc: 'Acesso a todas as máquinas, polias, gaiolas e pesos livres' },
          { id: 'gym_basic', label: 'Academia Básica', desc: 'Prédio, condomínio ou hotel com esteiras e dumbells limitados' },
          { id: 'home', label: 'Casa', desc: 'Foco total em calistenia (peso do corpo) ou faixas elásticas' },
          { id: 'mixed', label: 'Casa + Academia', desc: 'Prefere alternar com flexibilidade de acordo com a rotina' }
        ];
        return (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Onde você costuma treinar?</h2>
              <p className="text-xs text-slate-500">Isso influencia quais aparelhos e cabos utilizaremos.</p>
            </div>

            <div className="grid gap-3">
              {environments.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    saveProgressValue({ training_environment: opt.id });
                    setTimeout(handleNext, 200);
                  }}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    formData.training_environment === opt.id 
                      ? 'border-slate-950 bg-slate-50' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-slate-905 text-sm uppercase">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{opt.desc}</p>
                  </div>
                  {formData.training_environment === opt.id && <CheckCircle2 className="text-slate-950 shrink-0 ml-4" size={18} />}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        const biologicalSexes = [
          { id: 'male', label: 'Masculino', desc: 'Masc' },
          { id: 'female', label: 'Feminino', desc: 'Fem' }
        ];
        return (
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Dados Corporais</h2>
              <p className="text-[11px] text-slate-400">Calibração antropométrica essencial para progressões precisas.</p>
            </div>

            <div className="space-y-4">
              {/* Sexo Biopolitico Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sexo Biológico</label>
                <div className="grid grid-cols-2 gap-2">
                  {biologicalSexes.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => saveProgressValue({ sex: opt.id })}
                      className={`p-3.5 rounded-xl border-2 font-black text-xs uppercase tracking-wider text-center transition-all cursor-pointer ${
                        formData.sex === opt.id
                          ? 'border-slate-950 bg-slate-50'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      {opt.id === 'male' ? 'Masculino' : 'Feminino'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age / Weight / Height Inline Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Idade</label>
                  <input
                    type="number"
                    min="12"
                    max="105"
                    value={formData.age || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 18;
                      const userBirthYear = new Date().getFullYear() - val;
                      saveProgressValue({ 
                        age: val,
                        birth_date: `${userBirthYear}-01-01`
                      });
                    }}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-slate-800 focus:outline-none transition-all text-center"
                    placeholder="25"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Peso (kg)</label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => saveProgressValue({ weight: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-slate-800 focus:outline-none transition-all text-center"
                    placeholder="70"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Altura (cm)</label>
                  <input
                    type="number"
                    value={formData.height || ''}
                    onChange={(e) => saveProgressValue({ height: parseInt(e.target.value, 10) || 170 })}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-slate-800 focus:outline-none transition-all text-center"
                    placeholder="170"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={!formData.sex || !formData.age || !formData.weight || !formData.height}
              onClick={handleNext}
              className="w-full bg-slate-950 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              Continuar
              <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        );

      case 7:
        const joints = ['Ombro', 'Lombar', 'Joelho', 'Quadril', 'Outra'];
        const isNone = formData.restrictions?.includes('Nenhuma');

        return (
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <span className="inline-flex text-[8px] font-black tracking-widest uppercase text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                Pergunta Opcional
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Alguma limitação física?</h2>
              <p className="text-[11px] text-slate-400">Iremos filtrar exercícios prejudiciais a estas articulações.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  saveProgressValue({ restrictions: ['Nenhuma'] });
                  setTimeout(handleNext, 200);
                }}
                className={`col-span-2 p-3 rounded-xl border text-center font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isNone 
                    ? 'bg-slate-950 border-slate-950 text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                }`}
              >
                <CheckCircle2 size={12} />
                Nenhuma Limitação
              </button>

              {joints.map((joint) => {
                const active = formData.restrictions?.includes(joint);
                return (
                  <button
                    key={joint}
                    type="button"
                    onClick={() => handleToggleRestriction(joint)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      active 
                        ? 'bg-red-50 border-red-500 text-red-750 font-extrabold' 
                        : 'bg-white border-slate-100 text-slate-650 hover:border-slate-200'
                    }`}
                  >
                    {joint}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-slate-950 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              Prosseguir
              <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        );

      case 8:
        const commonDislikes = [
          { id: 'Agachamento com Barra', label: 'Barbell Squat', desc: 'Agachamento Barra' },
          { id: 'Levantamento Terra', label: 'Deadlift', desc: 'Levantamento Terra' },
          { id: 'Barra Fixa', label: 'Pull-Up', desc: 'Puxadores/Barra' },
          { id: 'Desenvolvimento Militar', label: 'Military Press', desc: 'Desenvolvimento' },
          { id: 'Paralelas', label: 'Dips', desc: 'Mergulho Paralelas' }
        ];

        const searchedExercises = queryMatches(activeExercises, searchQuery, formData.exercise_dislikes || []);

        return (
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <span className="inline-flex text-[8px] font-black tracking-widest uppercase text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                Pergunta Opcional
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Exercícios Indesejados?</h2>
              <p className="text-[11px] text-slate-400">Prefere evitar movimentos específicos? Selecione se aplicável.</p>
            </div>

            {/* Preselected list checkmarks layout */}
            <div className="grid grid-cols-2 gap-2">
              {commonDislikes.map((opt) => {
                const active = formData.exercise_dislikes?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (active) {
                        handleRemoveDislike(opt.id);
                      } else {
                        handleAddDislike(opt.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      active 
                        ? 'bg-amber-50/70 border-amber-400 text-amber-900 scale-[1.01]' 
                        : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        active ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'
                      }`}>
                        {active && <Check size={8} strokeWidth={4} />}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 font-semibold">{opt.desc}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  saveProgressValue({ exercise_dislikes: [] });
                  computeAndShowRecommendations();
                }}
                className="col-span-2 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-105/80 text-center font-black text-[10px] uppercase tracking-widest text-slate-500 rounded-xl cursor-pointer"
              >
                Nenhum destes (Gerar Plano)
              </button>
            </div>

            {/* Advanced Toggle */}
            <div className="pt-2 border-t border-slate-100/60">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Search size={12} />
                {showAdvanced ? 'Ocultar Pesquisa Avançada' : 'Pesquisa Avançada...'}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 relative">
                  {/* Selected badges from advanced */}
                  {formData.exercise_dislikes && formData.exercise_dislikes.filter(x => !commonDislikes.some(c => c.id === x)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {formData.exercise_dislikes.filter(x => !commonDislikes.some(c => c.id === x)).map((name) => (
                        <span key={name} className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                          {name}
                          <button type="button" onClick={() => handleRemoveDislike(name)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                            <X size={10} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: Crucifixo, Tríceps corda..."
                      className="w-full bg-white border-2 border-slate-100 rounded-xl pl-10 pr-3.5 py-3 text-[11px] font-bold focus:border-slate-800 focus:outline-none transition-all shadow-xs"
                    />

                    {searchQuery.trim().length > 0 && searchedExercises.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg max-h-[140px] overflow-y-auto divide-y divide-slate-50">
                        {searchedExercises.map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => handleAddDislike(ex.name)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 font-bold text-[10px] text-slate-700 uppercase flex items-center justify-between cursor-pointer"
                          >
                            <span className="line-clamp-1">{ex.name}</span>
                            <Plus size={12} className="text-[#7BA7FF]" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={computeAndShowRecommendations}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <Sparkles size={14} className="animate-pulse" />
              Concluir Configuração
            </button>
          </div>
        );

      case 9:
        // Loading state of computing matches / builder fallbacks
        if (isFinishing || loadingInitial) {
          return (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#7BA7FF]/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 uppercase">Rubi Optimizer</h3>
                <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed animate-pulse">
                  Analisando antropometria e calculando aderência molecular das planilhas...
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6 text-center font-sans animate-fade-in">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full">
                ✓ {isRedoing ? 'Plano Atualizado' : 'Configuração Concluída'}
              </span>
              <h2 className="text-2xl font-[1000] tracking-tight text-slate-950 uppercase mt-2 leading-none">
                {isRedoing ? 'Protocolo Ajustado!' : 'Treino Pronto para Iniciar!'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                {isRedoing 
                  ? 'As recomendações foram ajustadas com sucesso com base nas suas novas preferências.' 
                  : 'Seu protocolo adaptativo foi gerado e ativado imediatamente.'
                }
              </p>
            </div>

            {/* PREPARED PLAN CONTAINER */}
            <div className="bg-[#0F172A] text-white p-6 rounded-[2.2rem] border border-slate-800 text-left relative overflow-hidden shadow-xl">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-[#7BA7FF] bg-[#7BA7FF]/10 px-2.5 py-1 rounded-full">
                    Protocolo Ativo Atual
                  </span>
                  <h3 className="text-lg font-[1000] uppercase mt-2 tracking-tight text-white leading-tight">
                    {customGeneratedDraft?.name || (calculatedMatches[0]?.name || 'Kyron OS: Plano Personalizado')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1.5">
                    {customGeneratedDraft?.description || (calculatedMatches[0]?.description || 'Seu novo programa de alta performance ajustado aos seus objetivos de treinamento.')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/40">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Frequência</span>
                    <span className="text-xs font-black text-white uppercase">{formData.weekly_availability}x por Semana</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/40">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Ambiente</span>
                    <span className="text-xs font-black text-white uppercase">{formData.training_environment === 'home' ? 'Casa / Livre' : 'Academia'}</span>
                  </div>
                </div>

                {formData.restrictions && formData.restrictions[0] !== 'Nenhuma' && (
                  <div className="pt-2">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Limitações Respeitadas</span>
                    <div className="flex flex-wrap gap-1">
                      {formData.restrictions.map((res: string) => (
                        <span key={res} className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              {firstWorkoutId ? (
                <button
                  type="button"
                  onClick={() => navigate('preparation', { id: firstWorkoutId })}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  Iniciar Primeiro Treino
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                Ir para o Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper method to safely compute searched exercises matching the pattern
  function queryMatches(list: Exercise[], phrase: string, excludedNames: string[]): Exercise[] {
    if (!phrase.trim()) return [];
    return list.filter(ex => 
      ex.name.toLowerCase().includes(phrase.toLowerCase()) && 
      !excludedNames.includes(ex.name)
    ).slice(0, 5);
  };

  // Safe percentage calculator
  const computedProgress = step === 9 ? 100 : (step / 8) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Visual background atmospheric elements */}
      <div className="absolute top-[-20%] right-[-15%] w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-20%] left-[-15%] w-96 h-96 bg-purple-100/40 rounded-full blur-3xl opacity-60" />

      {loadingInitial ? (
        <div className="w-full max-w-sm flex flex-col items-center justify-center text-center py-20 z-10 space-y-4">
          <div className="w-10 h-10 border-4 border-[#7BA7FF]/25 border-t-[#7BA7FF] rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Banco de Dados...</p>
        </div>
      ) : (
        <div className="w-full max-w-md flex flex-col h-full z-10 bg-white/70 backdrop-blur-2xl border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] shadow-sm relative">
          
          {/* Top Wizard Steps Tracker Header */}
          {step <= 8 && (
            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                {step > 0 ? (
                  <button 
                    onClick={handleBack} 
                    disabled={savingStep}
                    className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 -ml-1 border border-transparent hover:border-slate-100 hover:bg-slate-50 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <ChevronLeft size={16} strokeWidth={3} />
                  </button>
                ) : (
                  <div className="w-8" />
                )}
                
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {step === 0 ? 'Boas-Vindas' : `Passo ${step} de 8`}
                </span>
                
                {savingStep ? (
                  <div className="w-4 h-4 border-2 border-slate-350 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <div className="w-4" />
                )}
              </div>

              {/* Progress bar line */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${computedProgress}%` }}
                  className="h-full bg-slate-950 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Action Step Panel Component */}
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex-1 flex flex-col"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Minimal Brand Footer Accent */}
          {step <= 8 && (
            <div className="pt-6 mt-6 border-t border-slate-100/60 flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              <span>Performance Segura</span>
              <span>•</span>
              <span>Kyron OS Core</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
