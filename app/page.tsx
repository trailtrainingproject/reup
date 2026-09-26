'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import {
  Mountain,
  Trophy,
  ArrowRight,
  LogIn,
  Brain,
  Activity,
  X,
  UserCheck,
  Lock,
  Mail,
  Loader2,
  Plus,
  Gauge,
  Calendar,
  Users,
  Send,
  CheckCircle2,
  Flag,
  Sparkles,
  Target,
  Trash2,
  Edit2,
  Save,
  FileCode2,
  MapPin,
  TrendingUp,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const [view, setView] = useState<'public' | 'login' | 'coach' | 'athlete'>('public');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; full_name?: string; role?: string } | null>(null);
  const [loginRole, setLoginRole] = useState<'athlete' | 'coach'>('athlete');

  // Estados do Dashboard do Atleta
  const [workouts, setWorkouts] = useState<any[]>([
    { id: 1, title: 'Treino de Volume Monte Frestas', distance: 22, elevation: 1200, duration: '2h45', date: '20/09/2026' },
    { id: 2, title: 'Séries de Subida', distance: 12, elevation: 800, duration: '1h20', date: '23/09/2026' }
  ]);
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    distance: '',
    elevation: '',
    duration: '',
    type: 'Trail Run'
  });

  // Estados do Dashboard do Treinador
  const [athletes, setAthletes] = useState<any[]>([
    { id: '1', name: 'João Silva', email: 'joao@example.com', totalKm: 140, totalDPlus: 6500 },
    { id: '2', name: 'Maria Santos', email: 'maria@example.com', totalKm: 85, totalDPlus: 3200 }
  ]);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('1');

  // Gestão de Provas / Corridas (com suporte para dados GPX e plano estratégico)
  const [races, setRaces] = useState<any[]>([
    {
      id: 'r1',
      name: 'MIGUT 50K',
      date: '2026-10-15',
      distance: 50,
      elevation: 3100,
      gpxFileName: 'migut_50k_route.gpx',
      racePlan: [
        { km: '0 - 15 km', zone: 'Z2 (Conservador)', terrain: 'Subida inicial progressiva', nutrition: '60g Carbs/h + 500ml Água' },
        { km: '15 - 35 km', zone: 'Z3 (Ritmo de Prova)', terrain: 'Trilho técnico e crista', nutrition: '75g Carbs/h + Sais' },
        { km: '35 - 50 km', zone: 'Z2 / Z4 (Gestão Final)', terrain: 'Descida rápida e estradão final', nutrition: 'Gel de Cafeína no KM 40' }
      ]
    }
  ]);
  const [newRace, setNewRace] = useState({ name: '', date: '', distance: '', elevation: '' });
  const [gpxFile, setGpxFile] = useState<File | null>(null);

  // Estado para edição de prova
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editRaceData, setEditRaceData] = useState({ name: '', date: '', distance: '', elevation: '' });

  // Inscrição de Atletas em Provas + Objetivos
  const [raceRegistrations, setRaceRegistrations] = useState<any[]>([
    { id: 'reg1', raceId: 'r1', athleteId: '1', target: 'Sub-6h00 (Pacing Z2/Z3)' }
  ]);
  const [selectedRaceForAthlete, setSelectedRaceForAthlete] = useState<string>('r1');
  const [selectedAthleteForRace, setSelectedAthleteForRace] = useState<string>('1');
  const [athleteRaceTarget, setAthleteRaceTarget] = useState<string>('');

  // Prescrições de Treino
  const [prescribedWorkouts, setPrescribedWorkouts] = useState<any[]>([]);
  const [prescription, setPrescription] = useState({
    title: '',
    distance: '',
    elevation: '',
    pace: '',
    notes: ''
  });

  // Função de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const effectiveRole = profile?.role || loginRole;

        setUserProfile({
          id: authData.user.id,
          full_name: profile?.full_name || profile?.name || authData.user.email?.split('@')[0] || 'Utilizador',
          role: effectiveRole
        });

        if (effectiveRole === 'coach' || effectiveRole === 'treinador') {
          setView('coach');
        } else {
          setView('athlete');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setView('public');
  };

  // Funções de Atleta
  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkout.title || !newWorkout.distance) return;

    setWorkouts([
      {
        id: Date.now(),
        ...newWorkout,
        distance: parseFloat(newWorkout.distance),
        elevation: parseInt(newWorkout.elevation) || 0,
        date: new Date().toLocaleDateString('pt-PT')
      },
      ...workouts
    ]);

    setNewWorkout({ title: '', distance: '', elevation: '', duration: '', type: 'Trail Run' });
  };

  // Processar Ficheiro GPX para Criar o Plano Strategico da Prova
  const parseGpxAndBuildPlan = (dist: number, elev: number) => {
    const p1 = (dist * 0.3).toFixed(0);
    const p2 = (dist * 0.7).toFixed(0);

    return [
      {
        km: `0 - ${p1} km`,
        zone: 'Z1 / Z2 (Controlo Inicial)',
        terrain: 'Início de percurso e aquecimento gradual',
        nutrition: '50g - 60g Carbs/h + Hidratação regular'
      },
      {
        km: `${p1} - ${p2} km`,
        zone: 'Z2 / Z3 (Bloco Principal de Esforço)',
        terrain: `Setor acumulado com maior densidade de D+ (~${(elev * 0.6).toFixed(0)}m)`,
        nutrition: '65g - 80g Carbs/h + Reposição de Eletrólitos/Sais'
      },
      {
        km: `${p2} - ${dist} km`,
        zone: 'Z3 / Z4 (Gestão de Reta Final)',
        terrain: 'Troço final, descidas e aceleração rumo à meta',
        nutrition: 'Gel com Cafeína + Gel de Absorção Rápida'
      }
    ];
  };

  const handleAddRace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRace.name || !newRace.distance) return;

    const dist = parseFloat(newRace.distance);
    const elev = parseInt(newRace.elevation) || 0;
    const newId = String(Date.now());

    // Gerar plano estratégico baseado no GPX (ou estimativa)
    const generatedPlan = parseGpxAndBuildPlan(dist, elev);

    const race = {
      id: newId,
      name: newRace.name,
      date: newRace.date || new Date().toISOString().split('T')[0],
      distance: dist,
      elevation: elev,
      gpxFileName: gpxFile ? gpxFile.name : null,
      racePlan: generatedPlan
    };

    setRaces([...races, race]);
    setSelectedRaceForAthlete(newId);
    setNewRace({ name: '', date: '', distance: '', elevation: '' });
    setGpxFile(null);
  };

  // Apagar Prova
  const handleDeleteRace = (raceId: string) => {
    setRaces(races.filter(r => r.id !== raceId));
    setRaceRegistrations(raceRegistrations.filter(reg => reg.raceId !== raceId));
  };

  // Iniciar e Guardar Edição de Prova
  const handleStartEditRace = (race: any) => {
    setEditingRaceId(race.id);
    setEditRaceData({
      name: race.name,
      date: race.date,
      distance: String(race.distance),
      elevation: String(race.elevation)
    });
  };

  const handleSaveEditRace = (raceId: string) => {
    setRaces(races.map(r => {
      if (r.id === raceId) {
        const d = parseFloat(editRaceData.distance) || r.distance;
        const e = parseInt(editRaceData.elevation) || r.elevation;
        return {
          ...r,
          name: editRaceData.name,
          date: editRaceData.date,
          distance: d,
          elevation: e,
          racePlan: parseGpxAndBuildPlan(d, e)
        };
      }
      return r;
    }));
    setEditingRaceId(null);
  };

  const handleRegisterAthleteToRace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteRaceTarget) return;

    const newReg = {
      id: String(Date.now()),
      raceId: selectedRaceForAthlete,
      athleteId: selectedAthleteForRace,
      target: athleteRaceTarget
    };

    setRaceRegistrations([...raceRegistrations, newReg]);
    setAthleteRaceTarget('');
  };

  const handlePrescribeWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription.title) return;

    const athlete = athletes.find(a => a.id === selectedAthleteId);

    setPrescribedWorkouts([
      {
        id: Date.now(),
        athleteName: athlete?.name || 'Atleta',
        ...prescription,
        date: new Date().toLocaleDateString('pt-PT')
      },
      ...prescribedWorkouts
    ]);

    setPrescription({ title: '', distance: '', elevation: '', pace: '', notes: '' });
  };

  // Recomendação de Performance
  const getPerformanceSuggestion = (athleteId: string, raceId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    const race = races.find(r => r.id === raceId);

    if (!athlete || !race) return null;

    const kmRatio = athlete.totalKm / race.distance;
    const dPlusRatio = athlete.totalDPlus / (race.elevation || 1);

    if (kmRatio >= 2.5 && dPlusRatio >= 1.5) {
      return {
        status: 'Excelente Preparação',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        text: `O atleta tem volume acumulado robusto (${athlete.totalKm}km / ${athlete.totalDPlus}m D+). Sugestão: Ritmo competitivo sustentado em Z3 nas subidas.`
      };
    } else if (kmRatio >= 1.5) {
      return {
        status: 'Preparação Moderada',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        text: `Volume de treinos razoável (${athlete.totalKm}km). Sugestão: Gestão conservadora no primeiro terço da prova. Foco estrito em nutrição.`
      };
    } else {
      return {
        status: 'Carga Reduzida (Risco de Fadiga)',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        text: `Histórico reduzido para a exigência da prova (${race.distance}km / ${race.elevation}m D+). Sugestão: Ritmo confortável em Z1/Z2.`
      };
    }
  };

  const totalDistance = workouts.reduce((acc, curr) => acc + (curr.distance || 0), 0);
  const totalElevation = workouts.reduce((acc, curr) => acc + (curr.elevation || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* NAVEGAÇÃO PRINCIPAL */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Mountain className="h-6 w-6 text-slate-950" />
            </div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              TRAILX
            </span>
          </div>

          <div className="flex items-center gap-4">
            {view !== 'public' ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {userProfile?.role === 'coach' || userProfile?.role === 'treinador' ? 'Treinador: ' : 'Atleta: '}
                  <strong className="text-slate-200">{userProfile?.full_name || 'Autenticado'}</strong>
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/10 transition-all"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {/* MODAL DE LOGIN */}
        {view === 'login' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
              <button
                onClick={() => setView('public')}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Aceder à Plataforma</h2>
                <p className="text-xs text-slate-400 mt-1">Introduz o teu email e palavra-passe registrados</p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 p-1 bg-slate-800/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginRole('athlete')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    loginRole === 'athlete'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Atleta
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('coach')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    loginRole === 'coach'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Treinador
                </button>
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
                      placeholder="teu@email.com"
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
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Entrar na Conta
                </button>
              </form>
            </div>
          </div>
        )}

        {/* LANDING PAGE PÚBLICA */}
        {view === 'public' && (
          <div className="space-y-16 py-12">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                Gestão Profissional de Trail Running & GPX
              </span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
                Domina as Montanhas com GPX & Planos de Prova
              </h1>
              <p className="text-slate-400 text-base sm:text-lg">
                Plataforma integrada para treinadores e atletas de Trail Running. Importação de percursos GPX, planos de pacing e nutrição por setor.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => setView('login')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Começar Agora <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD DO ATLETA */}
        {view === 'athlete' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Painel do Atleta</h1>
                <p className="text-xs text-slate-400">Acompanha o teu rendimento e regista as tuas sessões</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">DISTÂNCIA TOTAL</span>
                  <span className="text-2xl font-bold text-white">{totalDistance.toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span></span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Mountain className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">DESNÍVEL (D+)</span>
                  <span className="text-2xl font-bold text-white">{totalElevation} <span className="text-xs font-normal text-slate-400">m</span></span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-400 block">TREINOS REGISTADOS</span>
                  <span className="text-2xl font-bold text-white">{workouts.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" /> Registar Novo Treino
              </h2>
              <form onSubmit={handleAddWorkout} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Nome do Treino"
                  value={newWorkout.title}
                  onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Distância (km)"
                  value={newWorkout.distance}
                  onChange={(e) => setNewWorkout({ ...newWorkout, distance: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Desnível D+ (m)"
                  value={newWorkout.elevation}
                  onChange={(e) => setNewWorkout({ ...newWorkout, elevation: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Duração (ex: 1h30)"
                  value={newWorkout.duration}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all"
                >
                  Guardar Treino
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" /> Histórico de Treinos
              </h2>
              {workouts.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum treino registrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {workouts.map((w) => (
                    <div key={w.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white text-sm">{w.title}</h3>
                        <span className="text-xs text-slate-400">{w.date}</span>
                      </div>
                      <div className="flex gap-4 text-xs font-semibold text-slate-300">
                        <span>{w.distance} km</span>
                        <span>{w.elevation} m D+</span>
                        <span>{w.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DASHBOARD DO TREINADOR (COM SUPORTE GPX) */}
        {view === 'coach' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Painel do Treinador</h1>
                <p className="text-xs text-slate-400">Criação de Provas com GPX, Análise Altimétrica & Planos de Esforço</p>
              </div>
            </div>

            {/* SECÇÃO 1: CRIAR PROVAS COM UPLOAD DE GPX */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ADICIONAR PROVA + FICHEIRO GPX */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flag className="h-5 w-5 text-emerald-400" /> Criar Prova & Gerar Plano via GPX
                </h2>
                <form onSubmit={handleAddRace} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Nome da Prova</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Transgrancanaria 45K"
                      value={newRace.name}
                      onChange={(e) => setNewRace({ ...newRace, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Data da Prova</label>
                    <input
                      type="date"
                      value={newRace.date}
                      onChange={(e) => setNewRace({ ...newRace, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Distância (km)</label>
                    <input
                      type="number"
                      required
                      placeholder="45"
                      value={newRace.distance}
                      onChange={(e) => setNewRace({ ...newRace, distance: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Desnível D+ (m)</label>
                    <input
                      type="number"
                      placeholder="2800"
                      value={newRace.elevation}
                      onChange={(e) => setNewRace({ ...newRace, elevation: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* CAMPO DE UPLOAD DE GPX */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Ficheiro do Percurso (.gpx)</label>
                    <div className="relative border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 bg-slate-950/50 flex items-center gap-3 cursor-pointer">
                      <FileCode2 className="h-5 w-5 text-emerald-400" />
                      <div className="flex-1 overflow-hidden">
                        <span className="text-xs text-slate-300 block truncate">
                          {gpxFile ? gpxFile.name : 'Selecionar ou arrastar ficheiro GPX'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">O ficheiro criará o plano de setores automaticamente</span>
                      </div>
                      <input
                        type="file"
                        accept=".gpx"
                        onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" /> Criar Prova & Gerar Plano Estratégico
                  </button>
                </form>
              </div>

              {/* ATRIBUIR ATLETA À PROVA & DEFINIR OBJETIVOS */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" /> Inscrever Atleta & Definir Objetivo
                </h2>
                <form onSubmit={handleRegisterAthleteToRace} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Selecionar Prova</label>
                    <select
                      value={selectedRaceForAthlete}
                      onChange={(e) => setSelectedRaceForAthlete(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {races.length === 0 ? (
                        <option value="">Nenhuma prova disponível</option>
                      ) : (
                        races.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.distance}km / {r.elevation}m D+)</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Selecionar Atleta</label>
                    <select
                      value={selectedAthleteForRace}
                      onChange={(e) => setSelectedAthleteForRace(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {athletes.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Objetivo Específico</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sub-5h30, Pacing Z2 constante, Top 10 Escalão"
                      value={athleteRaceTarget}
                      onChange={(e) => setAthleteRaceTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={races.length === 0}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Confirmar Inscrição na Prova
                  </button>
                </form>
              </div>
            </div>

            {/* SECÇÃO 2: CALENDÁRIO E PLANOS DE PROVA DECORRENTES DO GPX */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" /> Calendário de Provas & Planos de Esforço
                </h2>
                <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-medium">
                  {races.length} Provas
                </span>
              </div>

              {races.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">Nenhuma prova registada. Cria uma nova prova acima!</p>
              ) : (
                <div className="space-y-6">
                  {races.map((race) => {
                    const regs = raceRegistrations.filter((reg) => reg.raceId === race.id);
                    const isEditing = editingRaceId === race.id;

                    return (
                      <div key={race.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
                        {isEditing ? (
                          /* FORMULÁRIO DE EDIÇÃO */
                          <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Editar Detalhes da Prova</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={editRaceData.name}
                                onChange={(e) => setEditRaceData({ ...editRaceData, name: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                                placeholder="Nome da Prova"
                              />
                              <input
                                type="date"
                                value={editRaceData.date}
                                onChange={(e) => setEditRaceData({ ...editRaceData, date: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                              <input
                                type="number"
                                value={editRaceData.distance}
                                onChange={(e) => setEditRaceData({ ...editRaceData, distance: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                                placeholder="Distância (km)"
                              />
                              <input
                                type="number"
                                value={editRaceData.elevation}
                                onChange={(e) => setEditRaceData({ ...editRaceData, elevation: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                                placeholder="Desnível (m D+)"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                onClick={() => setEditingRaceId(null)}
                                className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEditRace(race.id)}
                                className="px-3 py-1 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1"
                              >
                                <Save className="h-3.5 w-3.5" /> Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* CABEÇALHO DA PROVA */
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">PROVA PLANEADA</span>
                                {race.gpxFileName && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <FileCode2 className="h-3 w-3" /> GPX Anexado
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-white">{race.name}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2 text-xs font-semibold text-slate-300">
                                <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{race.date}</span>
                                <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{race.distance} km</span>
                                <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{race.elevation} m D+</span>
                              </div>
                              <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                                <button
                                  onClick={() => handleStartEditRace(race)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition-all"
                                  title="Editar Prova"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRace(race.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all"
                                  title="Apagar Prova"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PLANO DE PROVA GERADO PELO GPX */}
                        {race.racePlan && (
                          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 space-y-3">
                            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-amber-400" /> Plano Estratégico por Setores (Calculado via GPX)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {race.racePlan.map((sector: any, idx: number) => (
                                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-emerald-400">{sector.km}</span>
                                    <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">{sector.zone}</span>
                                  </div>
                                  <p className="text-slate-300 text-[11px] font-medium">{sector.terrain}</p>
                                  <p className="text-slate-400 text-[10px] italic">Nutrição: {sector.nutrition}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* LISTA DE ATLETAS DA PROVA */}
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 mb-3">Atletas Inscritos e Sugestões de Performance:</h4>
                          {regs.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">Nenhum atleta associado a esta prova ainda.</p>
                          ) : (
                            <div className="space-y-3">
                              {regs.map((reg) => {
                                const athlete = athletes.find((a) => a.id === reg.athleteId);
                                const suggestion = getPerformanceSuggestion(reg.athleteId, race.id);

                                return (
                                  <div key={reg.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-emerald-400" />
                                        <span className="font-bold text-sm text-white">{athlete?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Objetivo:</span>
                                        <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          {reg.target}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Caixa de Recomendação de Performance */}
                                    {suggestion && (
                                      <div className={`p-3 rounded-lg border text-xs space-y-1 ${suggestion.color}`}>
                                        <div className="font-bold flex items-center gap-1.5">
                                          <Sparkles className="h-3.5 w-3.5" />
                                          <span>Análise da Plataforma: {suggestion.status}</span>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed">{suggestion.text}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECÇÃO 3: PRESCRIÇÃO RÁPIDA DE TREINOS */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-400" /> Prescrever Treino
              </h2>
              <form onSubmit={handlePrescribeWorkout} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Atleta Selecionado</label>
                    <select
                      value={selectedAthleteId}
                      onChange={(e) => setSelectedAthleteId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {athletes.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Título do Treino</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Séries Subida Z4"
                      value={prescription.title}
                      onChange={(e) => setPrescription({ ...prescription, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Distância (km)</label>
                    <input
                      type="number"
                      placeholder="15"
                      value={prescription.distance}
                      onChange={(e) => setPrescription({ ...prescription, distance: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Desnível D+ (m)</label>
                    <input
                      type="number"
                      placeholder="800"
                      value={prescription.elevation}
                      onChange={(e) => setPrescription({ ...prescription, elevation: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Instruções Técnicas & Nutrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Manter RPE 6 nas subidas. 40g de hidratos/hora."
                    value={prescription.notes}
                    onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <Send className="h-4 w-4" /> Enviar Prescrição ao Atleta
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
