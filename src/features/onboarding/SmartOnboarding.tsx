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
import { profileApi } from '../../lib/api/profileApi';
import { authApi } from '../../lib/api/authApi';
import { systemTemplatesApi, SystemTemplate } from '../../lib/api/systemTemplatesApi';
import { premiumProtocolsApi, PremiumProtocol } from '../../lib/api/premiumProtocolsApi';
import { exerciseApi } from '../../lib/api/exerciseApi';
import { workoutApi } from '../../lib/api/workoutApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Exercise, UserProfile } from '../../types';
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
        setAllPremiumProtocols(prots);
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

    try {
      // 1. Save profile as fully onboarding-completed in Postgres DB
      const finalProfileData = {
        onboarding_completed: true,
        onboarding_version: '2.1',
        name: formData.name || 'Atleta Kyron OS',
        updated_at: new Date().toISOString()
      };
      await profileApi.updateProfile(userId, finalProfileData);

      // 2. Hydrate user store
      const fullProfile = await profileApi.getProfile(userId);
      if (fullProfile) setProfile(fullProfile);

      // 3. Clone selected matched design
      const draftToUse = providedFallbackDraft || customGeneratedDraft;
      if (isFallback && draftToUse) {
        // Save to Draft local storage first (Aguardando Curadoria)
        const rawDrafts = localStorage.getItem('kyron_admin_draft_protocols') || '[]';
        let draftsList: PremiumProtocol[] = [];
        try {
          draftsList = JSON.parse(rawDrafts);
        } catch {}
        draftsList.push(draftToUse);
        localStorage.setItem('kyron_admin_draft_protocols', JSON.stringify(draftsList));

        // Directly clone workouts to user active program list so they can train immediately!
        // (Just like copy template does, we map categories and insert exercises)
        const folderName = `${draftToUse.name}`;
        const newFolder = await workoutApi.createFolder(userId, folderName);

        for (const tw of draftToUse.workouts) {
          const categoryPayload = {
            user_id: userId,
            folder_id: newFolder.id,
            name: tw.name,
            description: tw.description || ''
          };
          const newCategory = await workoutApi.createCategory(categoryPayload);

          const workoutExercisesPayload = tw.exercises.map((te: any, idx: number) => {
            let matchedUuid = te.exercise_id;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(matchedUuid)) {
              const fallbackExercise = activeExercises.find((ex: any) => ex.is_active) || activeExercises[0];
              matchedUuid = fallbackExercise?.id || '5ce43864-44ac-4822-ba91-30efc477431e';
            }

            return {
              category_id: newCategory.id,
              exercise_id: matchedUuid,
              exercise_name_snapshot: te.exercise_name,
              sets: te.sets,
              reps: te.reps,
              weight: te.weight,
              rest_time: te.rest_time,
              sort_order: te.sort_order || (idx + 1),
              sets_json: te.sets_json || []
            };
          });

          if (workoutExercisesPayload.length > 0) {
            await workoutApi.insertWorkoutExercises(workoutExercisesPayload);
          }
        }
      } else if (matchItem.type === 'template') {
        await systemTemplatesApi.copyTemplateToUser(userId, matchItem.id);
      } else {
        await premiumProtocolsApi.cloneToUser(userId, matchItem.id);
      }

      showSuccess('KYRON OS Ativado!', 'Seu primeiro protocolo foi configurado com sucesso e está pronto.');
      navigate('dashboard');
    } catch (err: any) {
      showError(err.message || 'Falha ao ativar protocolo de treinamento.');
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
    const freq = activeForm.weekly_availability || 3;
    const level = activeForm.training_experience || 'beginner';
    const environment = activeForm.training_environment || 'gym_full';
    
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
      description: `Protocolo adaptativo gerado sob demanda para atender aos limites do atleta. Foco em ${niceGoal}, nível ${level}, frequência semanal de ${freq} dias no ambiente ${environment}.`,
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
    } else {
      splits = [
        { name: 'Treino A - Peitorais & Tríceps', muscles: ['Peito', 'Tríceps'] },
        { name: 'Treino B - Costas, Trapézio & Bíceps', muscles: ['Costas', 'Bíceps'] },
        { name: 'Treino C - Pernas Foco Anterior (Quad)', muscles: ['Quadríceps', 'Panturrilha'] },
        { name: 'Treino D - Deltóides e Tríceps Estímulo', muscles: ['Ombros', 'Tríceps'] },
        { name: 'Treino E - Cadeia Posterior & Lombar', muscles: ['Posterior', 'Glúteos', 'Lombar'] }
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
        const filtered = listExs.filter(ex => 
          ex.is_active && 
          (ex.muscle_group?.toLowerCase().includes(muscle.toLowerCase()) || 
           muscle.toLowerCase().includes(ex.muscle_group?.toLowerCase()))
        );
        
        const selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 2);

        selected.forEach(ex => {
          count++;
          workout.exercises.push({
            exercise_id: ex.id,
            exercise_name: ex.name,
            sets: 4,
            reps: level === 'beginner' || level === 'none' ? '12' : '10',
            weight: level === 'beginner' || level === 'none' ? 12 : 24,
            rest_time: 60,
            sort_order: count,
            notes: 'Aquecimento gradual na primeira série.',
            sets_json: [
              { reps: level === 'beginner' || level === 'none' ? '12' : '10', weight: level === 'beginner' || level === 'none' ? 12 : 24, rest_time: 60 },
              { reps: level === 'beginner' || level === 'none' ? '12' : '10', weight: level === 'beginner' || level === 'none' ? 12 : 24, rest_time: 60 },
              { reps: level === 'beginner' || level === 'none' ? '12' : '10', weight: level === 'beginner' || level === 'none' ? 12 : 24, rest_time: 60 },
              { reps: level === 'beginner' || level === 'none' ? '12' : '10', weight: level === 'beginner' || level === 'none' ? 12 : 24, rest_time: 60 }
            ]
          });
        });
      });

      // Absolute safety guard line fallback
      if (workout.exercises.length === 0) {
        const fallbackExercise = listExs.find((ex: any) => ex.is_active) || listExs[0];
        workout.exercises.push({
          exercise_id: fallbackExercise?.id || '5ce43864-44ac-4822-ba91-30efc477431e',
          exercise_name: fallbackExercise?.name || 'Leg Press 45',
          sets: 4,
          reps: '12',
          weight: 40,
          rest_time: 60,
          sort_order: 1,
          sets_json: [
            { reps: '12', weight: 40, rest_time: 60 },
            { reps: '12', weight: 40, rest_time: 60 },
            { reps: '12', weight: 40, rest_time: 60 },
            { reps: '12', weight: 40, rest_time: 60 }
          ]
        });
      }

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
              Finalizar e Mostrar Plano
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
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <span className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                ✓ Seu plano está pronto!
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 uppercase mt-2">
                Seu Protocolo de Performance
              </h2>
              <p className="text-xs text-slate-500">
                {fallbackTriggered 
                  ? 'Geração sob demanda adaptada à fadigação mapeada pelo builder.'
                  : 'Cruzamento da biblioteca KYRON concluído. Escolha seu ponto de partida.'
                }
              </p>
            </div>

            {/* Recommended Payoff Container */}
            {fallbackTriggered && customGeneratedDraft ? (
              <div className="space-y-4">
                <div className="bg-[#0F172A] text-white p-5 rounded-3xl border border-slate-750 flex flex-col justify-between shadow-md relative overflow-hidden">
                  <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#7BA7FF] bg-[#7BA7FF]/10 px-2.5 py-1 rounded-full">
                        Gerado sob Medida — Fallback AI
                      </span>
                      <span className="text-[10px] font-black text-emerald-400">99% Aderência</span>
                    </div>

                    <h3 className="text-md font-black uppercase mt-1 text-white">{customGeneratedDraft.name}</h3>
                    <p className="text-[11px] text-slate-300 leading-normal line-clamp-3">
                      {customGeneratedDraft.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4 text-[9px] font-bold text-slate-400 uppercase">
                    <span>{customGeneratedDraft.workouts?.length || 0} Dias Ativos / Sem</span>
                    <span className="text-slate-350">Status: Rascunho / Curadoria</span>
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-850">
                  <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase">Fila de Curadoria de Atletas</p>
                    <p className="text-[10px] text-amber-700 leading-normal font-semibold">
                      Este plano dinâmico iniciará imediatamente nos seus treinos locais, mas paralelamente foi registrado na mesa admin KYRON para aprimoramento adaptivo manual.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeployProtocolSelection(null, true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} />
                  Ativar e Iniciar Treino
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Best Recommendation Card */}
                {calculatedMatches[0] && (
                  <div className="bg-[#0F172A] text-white p-5 rounded-3xl border border-slate-800 flex flex-col justify-between shadow-sm relative group">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#7BA7FF] bg-[#7BA7FF]/10 px-2.5 py-1 rounded-full">
                          Recomendado Principal
                        </span>
                        <span className="text-[11px] font-black text-emerald-400 font-mono">{calculatedMatches[0].score}% COMPATÍVEL</span>
                      </div>
                      <h3 className="text-md font-black uppercase tracking-tight text-white">{calculatedMatches[0].name}</h3>
                      <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                        {calculatedMatches[0].description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{calculatedMatches[0].workouts_count} Treinos Ativos</span>
                      <button
                        onClick={() => handleDeployProtocolSelection(calculatedMatches[0])}
                        className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm font-sans cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Iniciar Treino
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Alternatives list */}
                {calculatedMatches.length > 1 && (
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Alternativas de Menor Volume</span>
                    <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                      {calculatedMatches.slice(1, 4).map((alt) => (
                        <div key={alt.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-slate-205 transition-all">
                          <div className="space-y-1.5 flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-xs uppercase line-clamp-1">{alt.name}</h4>
                              <span className="shrink-0 text-[9px] font-extrabold text-slate-400 font-mono">{alt.score}%</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-1">{alt.description}</p>
                          </div>
                          <button
                            onClick={() => handleDeployProtocolSelection(alt)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide shrink-0 cursor-pointer"
                          >
                            Ativar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
