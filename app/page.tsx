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
  FileSpreadsheet,
  CheckCircle2,
  Zap,
  Heart,
  CloudSun,
  Calendar,
  Printer,
  Flag,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import FitParser from 'fit-file-parser';
import pako from 'pako';

interface AidStation {
  id: string;
  name: string;
  km: number;
  type: 'Água' | 'Completo (Sólidos + Líquidos)' | 'Base de Vida';
  targetCarbs: string;
  hydrationNotes: string;
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
  estimatedTimeHours: string;
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
  aidStations: AidStation[];
}

export default function CoachDashboard() {
  const [view, setView] = useState<'public' | 'login' | 'coach'>('public');
  const [activeTab, setActiveTab] = useState<'athletes-list' | 'new-athlete' | 'athlete-profile' | 'races-list' | 'new-race'>('athletes-list');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Formulário de Prova & Questionário Avançado Completo
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
    aidStationsInput: 'KM 12 - Posto de Água | KM 25 - Abastecimento Completo | KM 38 - Base de Vida',
    // Questionário Detalhado Fisiológico
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

  const generateAidStations = (dist: number, elev: number, inputString: string): AidStation[] => {
    if (inputString && inputString.includes('KM')) {
      const parts = inputString.split('|');
      return parts.map((p, idx) => {
        const kmMatch = p.match(/KM\s*(\d+)/i);
        const kmVal = kmMatch ? parseFloat(kmMatch[1]) : Math.round((dist / (parts.length + 1)) * (idx + 1));
        return {
          id: String(idx + 1),
          name: p.trim(),
          km: kmVal,
          type: idx === parts.length - 1 ? 'Base de Vida' : 'Completo (Sólidos + Líquidos)',
          targetCarbs: '60g - 75g HC / hora',
          hydrationNotes: '500ml Água + Sódio por posto'
        };
      });
    }

    const stations: AidStation[] = [];
    const count = dist > 40 ? 3 : 2;
    for (let i = 1; i <= count; i++) {
      const kmPos = Math.round((dist / (count + 1)) * i);
      stations.push({
        id: String(i),
        name: `Posto de Abastecimento ${i} (KM ${kmPos})`,
        km: kmPos,
        type: i === count ? 'Base de Vida' : 'Completo (Sólidos + Líquidos)',
        targetCarbs: '60g - 80g HC / hora',
        hydrationNotes: 'Recarga de 500ml de Água e Isotónico'
      });
    }
    return stations;
  };

  const calculateEstimatedTime = (dist: number, elev: number, flatPaceStr: string): string => {
    const parts = flatPaceStr.split(':');
    const min = parseFloat(parts[0]) || 5;
    const sec = parseFloat(parts[1]) || 0;
    const paceMinPerKm = min + (sec / 60);

    const runningTimeMin = dist * paceMinPerKm;
    const climbingPenaltyMin = (elev / 1000) * 35;
    const totalMinutes = runningTimeMin + climbingPenaltyMin;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
  };

  const generatePreRaceNutrition = (athleteWeight: number = 70): PreRaceNutrition => {
    const baseCarbs = Math.round(athleteWeight * 7);
    const highCarbs = Math.round(athleteWeight * 10);

    return {
      dayMinus3: `Dia -3 (Início Carbo-Loading): ~${baseCarbs}g HC (arroz, massa, batata, aveia). Água: 2.5L - 3L com eletrólitos.`,
      dayMinus2: `Dia -2 (Supercompensação): ~${baseCarbs + 50}g HC. Reduzir fibras e gorduras para otimizar digestão.`,
      dayMinus1: `Dia -1 (Véspera): Carga máxima (~${highCarbs}g HC). Jantar leve e limpo (ex: arroz com peito de frango).`,
      raceMorning: `Manhã da Prova (3h antes): Refeição rica em hidratos de fácil digestão (ex: aveia com mel ou pão branco) + 500ml água.`
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

    const estimatedTimeHours = calculateEstimatedTime(dist, elev, raceForm.flatPace);
    const aidStations = generateAidStations(dist, elev, raceForm.aidStationsInput);

    const assignedAth = athletes.find(a => a.id === raceForm.athleteId);
    const athWeight = assignedAth?.weight ? parseFloat(assignedAth.weight) : 70;
    const preRaceNutrition = generatePreRaceNutrition(athWeight);

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
        estimatedTimeHours,
        athleteId: raceForm.athleteId,
        targetCarbsPerHour: carbs,
        maxHeartRate: maxHR,
        restingHeartRate: restHR,
        weatherEstimate,
        preRaceNutrition,
        athleteMetrics,
        aidStations,
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
        estimatedTimeHours,
        athleteId: raceForm.athleteId,
        targetCarbsPerHour: carbs,
        maxHeartRate: maxHR,
        restingHeartRate: restHR,
        gpxFileName: gpxFile ? gpxFile.name : null,
        weatherEstimate,
        preRaceNutrition,
        athleteMetrics,
        aidStations
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
      {/* Navbar Superior */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md fixed top-0 w-full z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Mountain className="h-5 w-5 text-slate-950" />
            </div>
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              TRAILX <span className="text-xs text-emerald-400 font-medium ml-1">COACH</span>
            </span>
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
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-xl shadow-lg"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Landing / Login / Dashboard Principal */}
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto print:p-0">
        {view === 'public' && (
          <div className="space-y-16 py-12 text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
              Plataforma para Treinadores de Trail
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Planos de Prova, Postos de Abastecimento e Nutrição
            </h1>
            <p className="text-slate-400">
              Faça a gestão dos seus atletas, importe ficheiros .fit/.gz e crie estratégias completas prontas a exportar em PDF.
            </p>
            <button
              onClick={() => setView('login')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl inline-flex items-center gap-2 shadow-lg"
            >
              Aceder ao Painel <LogIn className="h-4 w-4" />
            </button>
          </div>
        )}

        {view === 'login' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
              <button onClick={() => setView('public')} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-4">Login de Treinador</h2>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="treinador@trailx.pt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Palavra-passe</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Entrar
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'coach' && coachProfile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Menu Lateral Estilo Dashboard */}
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 h-fit print:hidden">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 px-3 font-bold block mb-2">Menu Principal</span>
              
              <button
                onClick={() => { setActiveTab('athletes-list'); setSelectedAthlete(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'athletes-list' || activeTab === 'athlete-profile'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" /> Lista de Atletas ({athletes.length})
              </button>

              <button
                onClick={() => setActiveTab('new-athlete')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'new-athlete'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4" /> Registar Novo Atleta
              </button>

              <button
                onClick={() => setActiveTab('races-list')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'races-list'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Trophy className="h-4 w-4" /> Planos & Provas Ativas ({races.length})
              </button>

              <button
                onClick={() => { setEditingRaceId(null); setActiveTab('new-race'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'new-race'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4" /> Criar Nova Prova & GPX
              </button>
            </div>

            {/* Conteúdo Dinâmico Central */}
            <div className="md:col-span-3 space-y-6">
              {activeTab === 'athletes-list' && (
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-white">Lista de Atletas</h2>
                    <button
                      onClick={() => setActiveTab('new-athlete')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Adicionar Atleta
                    </button>
                  </div>

                  {athletes.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs italic">
                      Ainda não tem atletas registados. Use o menu lateral para adicionar o primeiro atleta.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {athletes.map((ath) => (
                        <div
                          key={ath.id}
                          onClick={() => { setSelectedAthlete(ath); setActiveTab('athlete-profile'); }}
                          className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-4 rounded-xl space-y-2 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white group-hover:text-emerald-400">{ath.full_name || ath.name}</span>
                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400" />
                          </div>
                          <p className="text-xs text-slate-400">Peso atual: <strong className="text-emerald-400">{ath.weight ? `${ath.weight} kg` : 'Não definido'}</strong></p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'new-athlete' && (
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl max-w-2xl mx-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-white">Registar Novo Atleta</h2>
                    <button onClick={() => setActiveTab('athletes-list')} className="text-xs text-slate-400 hover:text-white">← Voltar</button>
                  </div>
                  <form onSubmit={handleAddAthlete} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Fernando Pinto"
                        value={newAthlete.name}
                        onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
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
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Peso Atual (kg) * Essencial para Carbo-loading</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="ex: 68.5"
                          value={newAthlete.weight}
                          onChange={(e) => setNewAthlete({ ...newAthlete, weight: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={addingAthlete} className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-xs">
                      {addingAthlete ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Atleta'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'new-race' && (
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-8 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-white">{editingRaceId ? 'Editar Prova' : 'Criar Nova Prova & Abastecimentos'}</h2>
                    <button onClick={() => setActiveTab('races-list')} className="text-xs text-slate-400 hover:text-white">← Voltar</button>
                  </div>

                  <form onSubmit={handleSaveRace} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome da Prova *</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Penacova Trail Centro"
                          value={raceForm.name}
                          onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Atleta Destinatário *</label>
                        <select
                          value={raceForm.athleteId}
                          onChange={(e) => setRaceForm({ ...raceForm, athleteId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        >
                          {athletes.map((a) => (
                            <option key={a.id} value={a.id}>{a.full_name || a.name} {a.weight ? `(${a.weight}kg)` : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Localidade (para Meteorologia)</label>
                        <input
                          type="text"
                          value={raceForm.location}
                          onChange={(e) => setRaceForm({ ...raceForm, location: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Data da Prova</label>
                        <input
                          type="date"
                          value={raceForm.date}
                          onChange={(e) => setRaceForm({ ...raceForm, date: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Distância (km) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={raceForm.distance}
                          onChange={(e) => setRaceForm({ ...raceForm, distance: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Desnível D+ (m)</label>
                        <input
                          type="number"
                          value={raceForm.elevation}
                          onChange={(e) => setRaceForm({ ...raceForm, elevation: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>

                    {/* Importação .FIT / .GZ */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-emerald-400 uppercase">Importar Ficheiros de Treino (.FIT / .GZ)</span>
                          <p className="text-[11px] text-slate-400">Carregue ficheiros para preencher automaticamente as métricas fisiológicas.</p>
                        </div>
                        <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" /> Selecionar Ficheiros
                          <input type="file" multiple accept=".fit,.gz" onChange={handleActivityFilesUpload} className="hidden" />
                        </label>
                      </div>
                      {analyzingActivity && <p className="text-xs text-emerald-400 animate-pulse">A analisar ficheiros...</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Postos de Abastecimento (Separados por | )</label>
                      <input
                        type="text"
                        value={raceForm.aidStationsInput}
                        onChange={(e) => setRaceForm({ ...raceForm, aidStationsInput: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                        placeholder="ex: KM 12 - Posto de Água | KM 28 - Abastecimento Completo | KM 38 - Base de Vida"
                      />
                    </div>

                    <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-3.5 rounded-xl text-xs shadow-lg">
                      {editingRaceId ? 'Guardar Alterações da Prova' : 'Gerar Relatório Completo (Meteorologia, Abastecimentos & Carbo-Loading)'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'races-list' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
                    <h2 className="text-xl font-bold text-white">Planos de Prova Ativos ({races.length})</h2>
                    <div className="flex gap-2">
                      <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                        <Printer className="h-3.5 w-3.5" /> Exportar PDF
                      </button>
                      <button onClick={() => { setEditingRaceId(null); setActiveTab('new-race'); }} className="bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs">
                        Nova Prova
                      </button>
                    </div>
                  </div>

                  {races.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-xs">
                      Nenhuma prova planeada. Use o menu lateral para criar a primeira.
                    </div>
                  ) : (
                    races.map((race) => {
                      const assignedAthlete = athletes.find((a) => a.id === race.athleteId);

                      return (
                        <div key={race.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black text-white print:text-slate-900">{race.name}</h3>
                                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  Atleta: {assignedAthlete?.full_name || assignedAthlete?.name || 'Geral'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-4">
                                <span><MapPin className="inline h-3 w-3 mr-1 text-emerald-400" />{race.location} ({race.date})</span>
                                <span><Mountain className="inline h-3 w-3 mr-1" />{race.distance} km • {race.elevation}m D+</span>
                                <span className="text-emerald-400 font-bold"><Clock className="inline h-3 w-3 mr-1" /> Tempo Estimado: {race.estimatedTimeHours}</span>
                              </p>
                            </div>
                            <div className="flex gap-2 print:hidden">
                              <button onClick={() => handleEditRace(race)} className="p-2 bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center gap-1">
                                <Edit2 className="h-3.5 w-3.5" /> Editar
                              </button>
                              <button onClick={() => handleDeleteRace(race.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg text-xs flex items-center gap-1">
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                              </button>
                            </div>
                          </div>

                          {/* Meteorologia Estimada */}
                          {race.weatherEstimate && (
                            <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
                              <div className="flex items-center gap-2.5">
                                <CloudSun className="h-6 w-6 text-blue-400" />
                                <div>
                                  <span className="text-xs font-bold text-blue-400 block">Previsão Meteorológica em {race.location}</span>
                                  <span className="text-xs text-slate-300">Condição: <strong>{race.weatherEstimate.condition}</strong> • Vento: {race.weatherEstimate.wind}</span>
                                </div>
                              </div>
                              <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1 rounded-lg">
                                Temp: <strong>{race.weatherEstimate.tempMin} / {race.weatherEstimate.tempMax}</strong>
                              </span>
                            </div>
                          )}

                          {/* Mapa de Postos de Abastecimento */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                              <Flag className="h-4 w-4" /> Mapa de Postos de Abastecimento & Estratégia
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {race.aidStations.map((station) => (
                                <div key={station.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white">{station.name}</span>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">KM {station.km}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 space-y-1">
                                    <p><strong>Tipo:</strong> {station.type}</p>
                                    <p><strong>Hidratos:</strong> {station.targetCarbs}</p>
                                    <p><strong>Hidratação:</strong> {station.hydrationNotes}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Carbo-Loading 3 Dias Antes */}
                          {race.preRaceNutrition && (
                            <div className="bg-slate-950 p-5 rounded-xl border border-emerald-500/30 space-y-3">
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                                <Apple className="h-4 w-4" /> Plano Nutricional de Pré-Prova (Carbo-Loading - 3 Dias Antes)
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                  <strong className="text-emerald-400 block mb-1">3 Dias Antes</strong>
                                  <span className="text-slate-300">{race.preRaceNutrition.dayMinus3}</span>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                  <strong className="text-emerald-400 block mb-1">2 Dias Antes</strong>
                                  <span className="text-slate-300">{race.preRaceNutrition.dayMinus2}</span>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                  <strong className="text-emerald-400 block mb-1">Véspera</strong>
                                  <span className="text-slate-300">{race.preRaceNutrition.dayMinus1}</span>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                  <strong className="text-emerald-400 block mb-1">Manhã da Prova</strong>
                                  <span className="text-slate-300">{race.preRaceNutrition.raceMorning}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
