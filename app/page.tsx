'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Trophy,
  LogIn,
  Activity,
  X,
  UserCheck,
  Lock,
  Mail,
  Loader2,
  Users,
  Sparkles,
  Apple,
  Trash2,
  Edit2,
  MapPin,
  UserPlus,
  Phone,
  Scale,
  User,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  Zap,
  Heart,
  CloudSun,
  Calendar,
  Printer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import FitParser from 'fit-file-parser';
import pako from 'pako';

interface RacePlanSector {
  sector: string;
  distanceKm: string;
  terrain: string;
  targetPace: string;
  heartRateZone: string;
  carbsTarget: string;
  hydration: string;
  nutritionTips: string;
}

interface PreRaceNutrition {
  dayMinus3: string;
  dayMinus2: string;
  dayMinus1: string;
  raceMorning: string;
}

interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  distance: number;
  elevation: number;
  gpxFileName?: string | null;
  athleteId: string;
  targetCarbsPerHour: number;
  maxHeartRate: number;
  restingHeartRate: number;
  weatherEstimate?: {
    tempMin: string;
    tempMax: string;
    condition: string;
    humidity: string;
    wind: string;
  };
  preRaceNutrition?: PreRaceNutrition;
  athleteMetrics?: {
    weeklyKm: string;
    weeklyHours: string;
    weeklyDPlus: string;
    lthr: string;
    flatPace: string;
    uphillPace: string;
    downhillPace: string;
  };
  planSectors: RacePlanSector[];
}

export default function CoachDashboard() {
  const [view, setView] = useState<'public' | 'login' | 'coach'>('public');
  const [activeTab, setActiveTab] = useState<'athletes-list' | 'new-athlete' | 'athlete-profile' | 'races-list' | 'new-race'>('athletes-list');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados dos menus Dropdown
  const [dropdownAthletesOpen, setDropdownAthletesOpen] = useState(false);
  const [dropdownRacesOpen, setDropdownRacesOpen] = useState(false);

  // Utilizador Autenticado (Treinador)
  const [coachProfile, setCoachProfile] = useState<{ id: string; full_name?: string } | null>(null);

  // Atletas Vinculados
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [addingAthlete, setAddingAthlete] = useState(false);

  // Formulário do Atleta
  const [newAthlete, setNewAthlete] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    age: '',
    gender: 'Masculino',
    weight: ''
  });

  // Provas e Planos Criados
  const [races, setRaces] = useState<Race[]>([]);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  // Formulário de Prova & Questionário Avançado
  const [raceForm, setRaceForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: 'Penacova',
    distance: '',
    elevation: '',
    athleteId: '',
    targetCarbsPerHour: '60',
    maxHeartRate: '185',
    restingHeartRate: '50',
    // Métricas Fisiológicas
    weeklyKm: '55',
    weeklyHours: '7.5',
    weeklyDPlus: '2200',
    minHeartRate: '42',
    testedMaxHR: '190',
    avgTrainingHR: '145',
    effort20Min: '178 bpm / 4:10 min/km',
    effortClimb: '168 bpm / 7:30 min/km',
    effort1h: '158 bpm / 4:45 min/km',
    lthr: '172',
    avgPace: '5:10 min/km',
    avgSpeed: '11.6 km/h',
    flatPace: '4:30 min/km',
    uphillPace: '7:45 min/km',
    downhillPace: '4:15 min/km'
  });

  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [activityFiles, setActivityFiles] = useState<File[]>([]);
  const [analyzingActivity, setAnalyzingActivity] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadCoachProfile(session.user.id);
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    }
  };

  const loadCoachProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setCoachProfile(profile || { id: userId, full_name: 'Treinador Principal' });
      setView('coach');
      await loadAthletes(userId);
    } catch (err) {
      console.error('Erro ao carregar perfil do treinador:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAthletes = async (coachId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('coach_id', coachId)
        .eq('role', 'athlete');

      if (!error && data) {
        setAthletes(data);
        if (data.length > 0 && !raceForm.athleteId) {
          setRaceForm((prev) => ({ ...prev, athleteId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar atletas:', err);
    }
  };

  const handleBirthDateChange = (dateString: string) => {
    let calculatedAge = '';
    if (dateString) {
      const birth = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      calculatedAge = age > 0 ? String(age) : '';
    }
    setNewAthlete((prev) => ({ ...prev, birthDate: dateString, age: calculatedAge }));
  };

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthlete.name || !coachProfile) return;
    setAddingAthlete(true);

    try {
      const athleteId = crypto.randomUUID();
      const { error } = await supabase.from('profiles').insert([
        {
          id: athleteId,
          name: newAthlete.name,
          full_name: newAthlete.name,
          email: newAthlete.email || null,
          phone: newAthlete.phone || null,
          birth_date: newAthlete.birthDate || null,
          age: newAthlete.age ? parseInt(newAthlete.age) : null,
          gender: newAthlete.gender,
          weight: newAthlete.weight ? parseFloat(newAthlete.weight) : null,
          role: 'athlete',
          coach_id: coachProfile.id
        }
      ]);

      if (error) throw error;

      setNewAthlete({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        age: '',
        gender: 'Masculino',
        weight: ''
      });
      await loadAthletes(coachProfile.id);
      setActiveTab('athletes-list');
    } catch (err: any) {
      alert('Erro ao adicionar atleta: ' + (err.message || 'Verifique as permissões.'));
    } finally {
      setAddingAthlete(false);
    }
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    if (!confirm('Tem a certeza que deseja remover este atleta?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', athleteId);
      if (error) throw error;
      if (coachProfile) await loadAthletes(coachProfile.id);
      if (selectedAthlete?.id === athleteId) {
        setSelectedAthlete(null);
        setActiveTab('athletes-list');
      }
    } catch (err: any) {
      alert('Erro ao apagar atleta: ' + (err.message || 'Verifique as políticas de DELETE.'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (authData?.user) {
        await loadCoachProfile(authData.user.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCoachProfile(null);
    setView('public');
  };

  // Leitura automática dos ficheiros de treino (.FIT / .GZ)
  const handleActivityFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setActivityFiles(files);
    setAnalyzingActivity(true);

    try {
      let totalKm = 0;
      let totalHours = 0;
      let totalDPlus = 0;
      let maxHrValues: number[] = [];
      let avgHrValues: number[] = [];
      let speedValues: number[] = [];
      let parsedCount = 0;

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let fileBuffer = arrayBuffer;

        if (file.name.endsWith('.gz')) {
          try {
            fileBuffer = pako.inflate(new Uint8Array(arrayBuffer)).buffer;
          } catch (err) {
            console.error('Erro ao descompactar .gz:', err);
            continue;
          }
        }

        await new Promise<void>((resolve) => {
          const fitParser = new FitParser({
            force: true,
            speedUnit: 'km/h',
            lengthUnit: 'km',
            temperatureUnit: 'celsius',
            elapsedTimeNotifications: true,
            mode: 'cascade',
          });

          fitParser.parse(fileBuffer, (error: any, data: any) => {
            if (!error && data) {
              const sessions = data.sessions || [];
              if (sessions.length > 0) {
                const session = sessions[0];
                totalKm += session.total_distance || 0;
                totalHours += (session.total_elapsed_time || session.total_timer_time || 0) / 3600;
                totalDPlus += session.total_ascent || 0;
                
                if (session.max_heart_rate) maxHrValues.push(session.max_heart_rate);
                if (session.average_heart_rate) avgHrValues.push(session.average_heart_rate);
                
                const speedKmh = session.enhanced_avg_speed || session.avg_speed;
                if (speedKmh && speedKmh > 0) {
                  speedValues.push(speedKmh);
                } else if (session.total_distance && session.total_elapsed_time) {
                  const calcSpeed = (session.total_distance / (session.total_elapsed_time / 3600));
                  speedValues.push(calcSpeed);
                }

                parsedCount++;
              }
            }
            resolve();
          });
        });
      }

      if (parsedCount > 0) {
        const avgDistance = totalKm / parsedCount;
        const avgHours = totalHours / parsedCount;
        const avgDPlus = Math.round(totalDPlus / parsedCount);

        const avgMaxHr = maxHrValues.length > 0 ? Math.round(maxHrValues.reduce((a, b) => a + b, 0) / maxHrValues.length) : 185;
        const avgTrainingHeartRate = avgHrValues.length > 0 ? Math.round(avgHrValues.reduce((a, b) => a + b, 0) / avgHrValues.length) : 145;
        const computedLthr = Math.round(avgMaxHr * 0.9);

        const meanSpeedKmh = speedValues.length > 0 ? (speedValues.reduce((a, b) => a + b, 0) / speedValues.length) : 11.6;
        
        const paceMinutesTotal = 60 / meanSpeedKmh;
        const paceMin = Math.floor(paceMinutesTotal);
        const paceSec = Math.round((paceMinutesTotal - paceMin) * 60);
        const formattedPace = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} min/km`;

        setRaceForm(prev => ({
          ...prev,
          weeklyKm: (avgDistance * 4).toFixed(1),
          weeklyHours: (avgHours * 4).toFixed(1),
          weeklyDPlus: String(avgDPlus * 4),
          maxHeartRate: String(avgMaxHr),
          testedMaxHR: String(avgMaxHr + 2),
          avgTrainingHR: String(avgTrainingHeartRate),
          lthr: String(computedLthr),
          avgPace: formattedPace,
          avgSpeed: `${meanSpeedKmh.toFixed(1)} km/h`,
          flatPace: formattedPace,
          uphillPace: `${Math.floor(paceMin + 2)}:${paceSec < 10 ? '0' : ''}${paceSec} min/km`
        }));
      }
    } catch (err) {
      console.error('Erro ao processar ficheiros:', err);
    } finally {
      setAnalyzingActivity(false);
    }
  };

  const generateRacePlanSectors = (
    dist: number,
    elev: number,
    carbsPerHour: number,
    maxHR: number,
    restHR: number,
    flatPace: string
  ): RacePlanSector[] => {
    const hrReserve = maxHR - restHR;
    const z2Upper = Math.round(restHR + hrReserve * 0.7);
    const z3Upper = Math.round(restHR + hrReserve * 0.8);

    const s1Km = (dist * 0.25).toFixed(1);
    const s2Km = (dist * 0.65).toFixed(1);

    return [
      {
        sector: 'Setor 1: Início & Aquecimento',
        distanceKm: `0.0 km - ${s1Km} km`,
        terrain: 'Subidas graduais / Trilho inicial',
        targetPace: `Gestão conservadora (${flatPace})`,
        heartRateZone: `Z1/Z2 (Abaixo de ${z2Upper} bpm)`,
        carbsTarget: `${Math.round(carbsPerHour * 0.8)}g HC/h`,
        hydration: '500ml Água + Eletrólitos',
        nutritionTips: 'Começar a ingestão líquida aos 20 min. Evitar géis muito concentrados no início.'
      },
      {
        sector: 'Setor 2: Troço Técnico & Maior D+',
        distanceKm: `${s1Km} km - ${s2Km} km`,
        terrain: `Subidas íngremes e crestas (~${Math.round(elev * 0.65)}m D+)`,
        targetPace: 'Ritmo constante / Power hiking',
        heartRateZone: `Z2/Z3 (${z2Upper} - ${z3Upper} bpm)`,
        carbsTarget: `${carbsPerHour}g HC/h`,
        hydration: '600-750ml Água com Sódio',
        nutritionTips: 'Alternar 1 Gel (2:1) com barras fáceis de mastigar a cada 30-40 min.'
      },
      {
        sector: 'Setor 3: Descidas & Sprint Final',
        distanceKm: `${s2Km} km - ${dist.toFixed(1)} km`,
        terrain: 'Descidas técnicas e aproximação à meta',
        targetPace: 'Aceleração controlada',
        heartRateZone: `Z3/Z4 (${z3Upper} - ${maxHR} bpm)`,
        carbsTarget: `${Math.round(carbsPerHour * 1.1)}g HC/h`,
        hydration: '500ml Água / Isotónico',
        nutritionTips: 'Priorizar géis rápidos ou hydrogels. Utilizar 50-100mg de Cafeína.'
      }
    ];
  };

  const generatePreRaceNutrition = (athleteWeight: number = 70): PreRaceNutrition => {
    const baseCarbs = Math.round(athleteWeight * 7); // ~7g por kg no carbo-loading
    const highCarbs = Math.round(athleteWeight * 10); // ~10g por kg na véspera

    return {
      dayMinus3: `Dia -3 (Início do Carbo-Loading): Ingerir cerca de ${baseCarbs}g de hidratos de carbono no total (foco em arroz branco, massa, batata cozida e aveia). Manter boa hidratação com 2.5L a 3L de água e eletrólitos.`,
      dayMinus2: `Dia -2 (Supercompensação): Aumentar para ~${baseCarbs + 50}g de hidratos de carbono. Reduzir a quantidade de fibra e gorduras para evitar desconforto gástrico. Evitar crudívores ou leguminosas pesadas.`,
      dayMinus1: `Dia -1 (Véspera da Prova): Carga máxima de hidratos (~${highCarbs}g). Jantar leve mas rico em hidratos (ex: arroz branco com peito de frango ou peru grelhado, azeite moderado). Evitar alimentos integrais.`,
      raceMorning: `Manhã da Prova (3h antes): Refeição rica em hidratos de fácil digestão (ex: 100g de aveia/arroz com mel ou fatias de pão branco com compota/banana) + 500ml de água com eletrólitos.`
    };
  };

  const handleSaveRace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceForm.name || !raceForm.distance) return;

    const dist = parseFloat(raceForm.distance);
    const elev = parseInt(raceForm.elevation) || 0;
    const carbs = parseInt(raceForm.targetCarbsPerHour) || 60;
    const maxHR = parseInt(raceForm.maxHeartRate) || 185;
    const restHR = parseInt(raceForm.restingHeartRate) || 50;

    const planSectors = generateRacePlanSectors(dist, elev, carbs, maxHR, restHR, raceForm.flatPace);

    // Atribuir peso do atleta selecionado para o cálculo nutricional
    const assignedAth = athletes.find(a => a.id === raceForm.athleteId);
    const athWeight = assignedAth?.weight ? parseFloat(assignedAth.weight) : 70;
    const preRaceNutrition = generatePreRaceNutrition(athWeight);

    // Simulação meteorológica estimada com base na localidade
    const weatherEstimate = {
      tempMin: '14°C',
      tempMax: '24°C',
      condition: 'Céu limpo / Sol',
      humidity: '55%',
      wind: '12 km/h NW'
    };

    const athleteMetrics = {
      weeklyKm: raceForm.weeklyKm,
      weeklyHours: raceForm.weeklyHours,
      weeklyDPlus: raceForm.weeklyDPlus,
      lthr: raceForm.lthr,
      flatPace: raceForm.flatPace,
      uphillPace: raceForm.uphillPace,
      downhillPace: raceForm.downhillPace
    };

    if (editingRaceId) {
      setRaces(races.map(r => r.id === editingRaceId ? {
        ...r,
        name: raceForm.name,
        date: raceForm.date,
        location: raceForm.location,
        distance: dist,
        elevation: elev,
        athleteId: raceForm.athleteId,
        targetCarbsPerHour: carbs,
        maxHeartRate: maxHR,
        restingHeartRate: restHR,
        weatherEstimate,
        preRaceNutrition,
        athleteMetrics,
        planSectors,
        gpxFileName: gpxFile ? gpxFile.name : r.gpxFileName
      } : r));
      setEditingRaceId(null);
    } else {
      const newRace: Race = {
        id: String(Date.now()),
        name: raceForm.name,
        date: raceForm.date,
        location: raceForm.location,
        distance: dist,
        elevation: elev,
        athleteId: raceForm.athleteId,
        targetCarbsPerHour: carbs,
        maxHeartRate: maxHR,
        restingHeartRate: restHR,
        gpxFileName: gpxFile ? gpxFile.name : null,
        weatherEstimate,
        preRaceNutrition,
        athleteMetrics,
        planSectors
      };
      setRaces([newRace, ...races]);
    }

    setGpxFile(null);
    setActivityFiles([]);
    setActiveTab('races-list');
  };

  const handleEditRace = (race: Race) => {
    setEditingRaceId(race.id);
    setRaceForm({
      ...raceForm,
      name: race.name,
      date: race.date,
      location: race.location || 'Penacova',
      distance: String(race.distance),
      elevation: String(race.elevation),
      athleteId: race.athleteId,
      targetCarbsPerHour: String(race.targetCarbsPerHour),
      maxHeartRate: String(race.maxHeartRate),
      restingHeartRate: String(race.restingHeartRate)
    });
    setActiveTab('new-race');
  };

  const handleDeleteRace = (id: string) => {
    setRaces(races.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black">
      {/* Navegação - Oculta na impressão do PDF */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md fixed top-0 w-full z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
              <div className="bg-emerald-500 p-2 rounded-xl">
                <Mountain className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-black tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                TRAILX <span className="text-xs text-emerald-400 font-medium ml-1">COACH</span>
              </span>
            </div>

            {coachProfile && (
              <div className="hidden md:flex items-center gap-3">
                <div className="relative" onMouseLeave={() => setDropdownAthletesOpen(false)}>
                  <button
                    onMouseEnter={() => setDropdownAthletesOpen(true)}
                    onClick={() => setDropdownAthletesOpen(!dropdownAthletesOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Users className="h-4 w-4 text-emerald-400" />
                    Atletas ({athletes.length})
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {dropdownAthletesOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                      <button
                        onClick={() => { setActiveTab('athletes-list'); setDropdownAthletesOpen(false); setSelectedAthlete(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        👥 Lista de Atletas
                      </button>
                      <button
                        onClick={() => { setActiveTab('new-athlete'); setDropdownAthletesOpen(false); setSelectedAthlete(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        ➕ Registar Novo Atleta
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative" onMouseLeave={() => setDropdownRacesOpen(false)}>
                  <button
                    onMouseEnter={() => setDropdownRacesOpen(true)}
                    onClick={() => setDropdownRacesOpen(!dropdownRacesOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    Provas & Planos ({races.length})
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {dropdownRacesOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                      <button
                        onClick={() => { setActiveTab('races-list'); setDropdownRacesOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        🏁 Planos Ativos
                      </button>
                      <button
                        onClick={() => { setEditingRaceId(null); setActiveTab('new-race'); setDropdownRacesOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80"
                      >
                        ✨ Criar Nova Prova & GPX
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {coachProfile ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow"
                >
                  <Printer className="h-3.5 w-3.5" /> Exportar PDF
                </button>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Treinador: <strong className="text-slate-200">{coachProfile.full_name || 'Treinador'}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto print:p-0">
        {view === 'public' && (
          <div className="space-y-16 py-12 text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
              Plataforma Exclusiva para Treinadores de Trail
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Planos de Prova, Nutrição e Ritmos Cardíacos
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Faça a gestão dos seus atletas com questionário avançado, análise de ficheiros .fit / .gz e estratégias de GPX.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setView('login')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
              >
                Aceder ao Painel de Treinador <LogIn className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
              <button onClick={() => setView('public')} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Login de Treinador</h2>
                <p className="text-xs text-slate-400 mt-1">Insira as suas credenciais</p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="treinador@trailx.pt"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Palavra-passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Entrar
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'coach' && coachProfile && (
          <div className="space-y-8">
            <div className="flex md:hidden gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 print:hidden">
              <button
                onClick={() => { setActiveTab('athletes-list'); setSelectedAthlete(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg ${activeTab === 'athletes-list' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'}`}
              >
                Atletas
              </button>
              <button
                onClick={() => setActiveTab('races-list')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg ${activeTab === 'races-list' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'}`}
              >
                Provas
              </button>
            </div>

            {activeTab === 'athlete-profile' && selectedAthlete ? (
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
                <button
                  onClick={() => setActiveTab('athletes-list')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar à lista de atletas
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block mb-1">Perfil Individual</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">{selectedAthlete.full_name || selectedAthlete.name}</h1>
                  </div>
                  <button
                    onClick={() => handleDeleteAthlete(selectedAthlete.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto print:hidden"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar Atleta
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-500 block mb-1">Contacto Telefónico</span>
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-400" /> {selectedAthlete.phone || 'Não definido'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-500 block mb-1">Email</span>
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-400" /> {selectedAthlete.email || 'Não definido'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-500 block mb-1">Idade & Género</span>
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-400" /> {selectedAthlete.age ? `${selectedAthlete.age} anos` : '-'} ({selectedAthlete.gender || '-'})
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-500 block mb-1">Peso Atual</span>
                    <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                      <Scale className="h-4 w-4" /> {selectedAthlete.weight ? `${selectedAthlete.weight} kg` : 'Não definido'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'athletes-list' && (
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Gestão de Equipa</span>
                    <h2 className="text-xl font-bold text-white">Lista de Atletas ({athletes.length})</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('new-athlete')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Adicionar Atleta
                  </button>
                </div>

                {athletes.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs italic">
                    Ainda não tem atletas registados. Selecione Atletas &gt; Registar Novo Atleta no menu superior.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {athletes.map((ath) => (
                      <div
                        key={ath.id}
                        onClick={() => { setSelectedAthlete(ath); setActiveTab('athlete-profile'); }}
                        className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-4 rounded-xl space-y-2 cursor-pointer transition-all group shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {ath.full_name || ath.name}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 pt-1 border-t border-slate-900">
                          {ath.age && <span>{ath.age} anos</span>}
                          {ath.gender && <span>• {ath.gender}</span>}
                          {ath.weight && <span className="text-emerald-400 font-medium">• {ath.weight} kg</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'new-athlete' && (
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Novo Registo</span>
                    <h2 className="text-xl font-bold text-white">Registar Novo Atleta</h2>
                  </div>
                  <button onClick={() => setActiveTab('athletes-list')} className="text-xs text-slate-400 hover:text-white">← Voltar</button>
                </div>

                <form onSubmit={handleAddAthlete} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: João Silva"
                      value={newAthlete.name}
                      onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="atleta@email.com"
                        value={newAthlete.email}
                        onChange={(e) => setNewAthlete({ ...newAthlete, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Contacto Telefónico</label>
                      <input
                        type="tel"
                        placeholder="912 345 678"
                        value={newAthlete.phone}
                        onChange={(e) => setNewAthlete({ ...newAthlete, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={newAthlete.birthDate}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Idade</label>
                      <input
                        type="number"
                        placeholder="ex: 32"
                        value={newAthlete.age}
                        onChange={(e) => setNewAthlete({ ...newAthlete, age: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Género</label>
                      <select
                        value={newAthlete.gender}
                        onChange={(e) => setNewAthlete({ ...newAthlete, gender: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Peso Atual (kg) - *Essencial para Carbo-loading*</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ex: 68.5"
                      value={newAthlete.weight}
                      onChange={(e) => setNewAthlete({ ...newAthlete, weight: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingAthlete}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {addingAthlete ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Guardar Atleta
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'new-race' && (
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-8 shadow-xl max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Configuração & Meteorologia</span>
                    <h2 className="text-xl font-bold text-white">
                      {editingRaceId ? 'Editar Prova & Estratégia' : 'Criar Nova Prova, Meteorologia & Estratégia'}
                    </h2>
                  </div>
                  <button onClick={() => setActiveTab('races-list')} className="text-xs text-slate-400 hover:text-white">← Voltar</button>
                </div>

                <form onSubmit={handleSaveRace} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> 1. Detalhes da Prova, Localidade & Data
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome da Prova *</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Penacova Trail Centro"
                          value={raceForm.name}
                          onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Atleta Destinatário *</label>
                        <select
                          value={raceForm.athleteId}
                          onChange={(e) => setRaceForm({ ...raceForm, athleteId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          {athletes.length === 0 ? (
                            <option value="">Adicione primeiro um atleta</option>
                          ) : (
                            athletes.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.full_name || a.name} {a.weight ? `(${a.weight}kg)` : ''}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Localidade da Prova (para Meteorologia)</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            placeholder="ex: Penacova"
                            value={raceForm.location}
                            onChange={(e) => setRaceForm({ ...raceForm, location: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Data da Prova</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <input
                            type="date"
                            value={raceForm.date}
                            onChange={(e) => setRaceForm({ ...raceForm, date: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Distância Total (km) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="ex: 46.0"
                          value={raceForm.distance}
                          onChange={(e) => setRaceForm({ ...raceForm, distance: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Desnível Positivo D+ (m)</label>
                        <input
                          type="number"
                          placeholder="ex: 1777"
                          value={raceForm.elevation}
                          onChange={(e) => setRaceForm({ ...raceForm, elevation: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Ficheiro GPX do Percurso</label>
                      <input
                        type="file"
                        accept=".gpx"
                        onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                          <Zap className="h-4 w-4" /> 2. Opcional: Importar Ficheiros de Treino (.FIT ou .GZ)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Carregue ficheiros para preencher automaticamente as métricas fisiológicas abaixo.
                        </p>
                      </div>
                      <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" /> Selecionar .FIT / .GZ
                        <input
                          type="file"
                          multiple
                          accept=".fit,.gz"
                          onChange={handleActivityFilesUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {analyzingActivity && (
                      <div className="flex items-center gap-3 text-xs text-emerald-400 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> A analisar e a calcular médias reais...
                      </div>
                    )}

                    {activityFiles.length > 0 && !analyzingActivity && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {activityFiles.map((f, i) => (
                          <span key={i} className="text-xs bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 pt-2">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2 border-t border-slate-800 pt-6">
                      <Activity className="h-4 w-4" /> 3. Perfil Fisiológico e Métricas do Atleta (Preenchimento Manual ou Auto)
                    </h3>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">Volume Médio Semanal</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Km / semana</label>
                          <input
                            type="text"
                            value={raceForm.weeklyKm}
                            onChange={(e) => setRaceForm({ ...raceForm, weeklyKm: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Horas / semana</label>
                          <input
                            type="text"
                            value={raceForm.weeklyHours}
                            onChange={(e) => setRaceForm({ ...raceForm, weeklyHours: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">D+ semanal (m)</label>
                          <input
                            type="text"
                            value={raceForm.weeklyDPlus}
                            onChange={(e) => setRaceForm({ ...raceForm, weeklyDPlus: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider block flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" /> Frequência Cardíaca & Zonas
                      </span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">FC Repouso (bpm)</label>
                          <input
                            type="number"
                            value={raceForm.restingHeartRate}
                            onChange={(e) => setRaceForm({ ...raceForm, restingHeartRate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">FC Mínima (bpm)</label>
                          <input
                            type="number"
                            value={raceForm.minHeartRate}
                            onChange={(e) => setRaceForm({ ...raceForm, minHeartRate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">FC Máxima (bpm)</label>
                          <input
                            type="number"
                            value={raceForm.maxHeartRate}
                            onChange={(e) => setRaceForm({ ...raceForm, maxHeartRate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">FC Máx Testada</label>
                          <input
                            type="number"
                            value={raceForm.testedMaxHR}
                            onChange={(e) => setRaceForm({ ...raceForm, testedMaxHR: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Limiar de FC (LTHR - bpm)</label>
                          <input
                            type="number"
                            value={raceForm.lthr}
                            onChange={(e) => setRaceForm({ ...raceForm, lthr: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-emerald-400 mb-1">Alvo Hidratos (g HC/h)</label>
                          <input
                            type="number"
                            value={raceForm.targetCarbsPerHour}
                            onChange={(e) => setRaceForm({ ...raceForm, targetCarbsPerHour: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Ritmo & Velocidade</span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Ritmo Médio</label>
                          <input
                            type="text"
                            value={raceForm.avgPace}
                            onChange={(e) => setRaceForm({ ...raceForm, avgPace: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Velocidade Média</label>
                          <input
                            type="text"
                            value={raceForm.avgSpeed}
                            onChange={(e) => setRaceForm({ ...raceForm, avgSpeed: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Ritmo em Plano</label>
                          <input
                            type="text"
                            value={raceForm.flatPace}
                            onChange={(e) => setRaceForm({ ...raceForm, flatPace: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Ritmo em Subida</label>
                          <input
                            type="text"
                            value={raceForm.uphillPace}
                            onChange={(e) => setRaceForm({ ...raceForm, uphillPace: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    {editingRaceId ? 'Guardar Alterações da Prova' : 'Gerar Relatório Completo (Meteorologia, Carbo-Loading & Sectores)'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'races-list' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Relatório & Histórico</span>
                    <h2 className="text-xl font-bold text-white">Planos de Prova Ativos ({races.length})</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Printer className="h-3.5 w-3.5" /> Imprimir / Exportar PDF
                    </button>
                    <button
                      onClick={() => { setEditingRaceId(null); setActiveTab('new-race'); }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Nova Prova
                    </button>
                  </div>
                </div>

                {races.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-xs">
                    Nenhuma prova planeada. Crie uma nova prova no menu superior.
                  </div>
                ) : (
                  races.map((race) => {
                    const assignedAthlete = athletes.find((a) => a.id === race.athleteId);

                    return (
                      <div key={race.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
                        
                        {/* Cabeçalho do Relatório */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:border-slate-300">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-2xl font-black text-white print:text-slate-900">{race.name}</h3>
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full print:border-emerald-600 print:text-emerald-700">
                                Atleta: {assignedAthlete?.full_name || assignedAthlete?.name || 'Geral'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-4 print:text-slate-600">
                              <span><MapPin className="inline h-3 w-3 mr-1 text-emerald-400" />{race.location} ({race.date})</span>
                              <span><Mountain className="inline h-3 w-3 mr-1" />{race.distance} km • {race.elevation}m D+</span>
                              <span><Apple className="inline h-3 w-3 mr-1 text-emerald-400" />{race.targetCarbsPerHour}g HC/h</span>
                              <span><Heart className="inline h-3 w-3 mr-1 text-red-400" />FC Máx {race.maxHeartRate} bpm</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 print:hidden">
                            <button
                              onClick={() => window.print()}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1 transition-all"
                            >
                              <Printer className="h-3.5 w-3.5" /> PDF
                            </button>
                            <button
                              onClick={() => handleEditRace(race)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-all"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteRace(race.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-1 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                          </div>
                        </div>

                        {/* Bloco de Meteorologia Estimada */}
                        {race.weatherEstimate && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 print:border-slate-300 print:bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2.5">
                              <CloudSun className="h-6 w-6 text-blue-400" />
                              <div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide block">Previsão Meteorológica em {race.location}</span>
                                <span className="text-xs text-slate-300 print:text-slate-700">Condição: <strong>{race.weatherEstimate.condition}</strong> • Vento: {race.weatherEstimate.wind} • Humidade: {race.weatherEstimate.humidity}</span>
                              </div>
                            </div>
                            <div className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg print:bg-white print:border-slate-300">
                              Temperaturas: <strong>{race.weatherEstimate.tempMin} / {race.weatherEstimate.tempMax}</strong>
                            </div>
                          </div>
                        )}

                        {/* Bloco de Métricas do Atleta */}
                        {race.athleteMetrics && (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs print:bg-slate-50 print:border-slate-300">
                            <div>
                              <span className="text-slate-500 print:text-slate-600 block">Volume Semanal</span>
                              <span className="text-white print:text-black font-medium">{race.athleteMetrics.weeklyKm} km | {race.athleteMetrics.weeklyHours}h</span>
                            </div>
                            <div>
                              <span className="text-slate-500 print:text-slate-600 block">Limiar (LTHR)</span>
                              <span className="text-red-400 font-medium">{race.athleteMetrics.lthr} bpm</span>
                            </div>
                            <div>
                              <span className="text-slate-500 print:text-slate-600 block">Ritmo Plano</span>
                              <span className="text-emerald-400 font-medium">{race.athleteMetrics.flatPace}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 print:text-slate-600 block">Ritmo Subida</span>
                              <span className="text-emerald-400 font-medium">{race.athleteMetrics.uphillPace}</span>
                            </div>
                          </div>
                        )}

                        {/* Guia Nutricional de Pré-Prova (Carbo-Loading 3 Dias Antes) */}
                        {race.preRaceNutrition && (
                          <div className="bg-slate-950 p-5 rounded-xl border border-emerald-500/30 print:border-slate-300 print:bg-slate-50 space-y-3">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                              <Apple className="h-4 w-4" /> Plano Nutricional de Pré-Prova (Carbo-Loading - 3 Dias Antes)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:bg-white print:border-slate-300">
                                <strong className="text-emerald-400 block mb-1">3 Dias Antes (-3)</strong>
                                <span className="text-slate-300 print:text-slate-700">{race.preRaceNutrition.dayMinus3}</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:bg-white print:border-slate-300">
                                <strong className="text-emerald-400 block mb-1">2 Dias Antes (-2)</strong>
                                <span className="text-slate-300 print:text-slate-700">{race.preRaceNutrition.dayMinus2}</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:bg-white print:border-slate-300">
                                <strong className="text-emerald-400 block mb-1">Véspera (-1)</strong>
                                <span className="text-slate-300 print:text-slate-700">{race.preRaceNutrition.dayMinus1}</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:bg-white print:border-slate-300">
                                <strong className="text-emerald-400 block mb-1">Manhã da Prova</strong>
                                <span className="text-slate-300 print:text-slate-700">{race.preRaceNutrition.raceMorning}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Setores Estratégicos da Prova */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {race.planSectors.map((sec, idx) => (
                            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-300">
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                                {sec.sector}
                              </span>
                              <div className="text-xs text-slate-300 print:text-slate-800 font-medium">{sec.distanceKm}</div>

                              <div className="space-y-2 pt-2 border-t border-slate-900 print:border-slate-200 text-xs">
                                <div>
                                  <span className="text-slate-500 print:text-slate-600 block">Terreno & Pacing</span>
                                  <span className="text-slate-200 print:text-slate-900">{sec.terrain}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 print:text-slate-600 block">Ritmo Cardíaco Recomendado</span>
                                  <span className="text-red-400 font-medium">{sec.heartRateZone}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 print:text-slate-600 block">Estratégia Nutricional (HC/h)</span>
                                  <span className="text-emerald-400 font-medium">{sec.carbsTarget} ({sec.hydration})</span>
                                </div>
                                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 print:bg-white print:border-slate-200 text-[11px] text-slate-400 print:text-slate-700 mt-2">
                                  <Apple className="h-3 w-3 text-emerald-400 inline mr-1" />
                                  {sec.nutritionTips}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
