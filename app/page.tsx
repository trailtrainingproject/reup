'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mountain, 
  ShieldCheck, 
  Zap, 
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
  Flame,
  Droplets,
  Gauge,
  Footprints,
  Calendar,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const [view, setView] = useState<'public' | 'login' | 'coach' | 'athlete'>('public');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ id?: string; full_name?: string; role?: string } | null>(null);

  // Estados do Dashboard do Atleta
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [gearList, setGearList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'pacing' | 'workouts' | 'gear'>('overview');

  // Formulário de Novo Treino
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutDist, setWorkoutDist] = useState('');
  const [workoutElev, setWorkoutElev] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutRpe, setWorkoutRpe] = useState('5');
  const [workoutType, setWorkoutType] = useState('longo');

  // Calculadora de Pacing Tático
  const [calcDist, setCalcDist] = useState(30);
  const [calcElev, setCalcElev] = useState(1800);
  const [calcWeight, setCalcWeight] = useState(70);
  const [calcTargetHours, setCalcTargetHours] = useState(4.5);

  useEffect(() => {
    if (view === 'athlete' && userProfile?.id) {
      loadAthleteData(userProfile.id);
    }
  }, [view, userProfile]);

  const loadAthleteData = async (userId: string) => {
    // Carregar Treinos
    const { data: wData } = await supabase
      .from('workouts')
      .select('*')
      .eq('athlete_id', userId)
      .order('date', { ascending: false });
    if (wData) setWorkouts(wData);

    // Carregar Equipamento
    const { data: gData } = await supabase
      .from('gear')
      .select('*')
      .eq('athlete_id', userId);
    if (gData) setGearList(gData);
  };

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

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        setUserProfile(profile);

        if (profile?.role === 'treinador') {
          setView('coach');
        } else {
          setView('athlete');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login. Verifica as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    const newWorkout = {
      athlete_id: userProfile.id,
      title: workoutTitle,
      date: workoutDate,
      distance_km: parseFloat(workoutDist),
      elevation_gain_m: parseInt(workoutElev) || 0,
      duration_minutes: parseInt(workoutDuration),
      perceived_exertion_rpe: parseInt(workoutRpe),
      workout_type: workoutType
    };

    const { error } = await supabase.from('workouts').insert([newWorkout]);

    if (!error) {
      setWorkoutTitle('');
      setWorkoutDist('');
      setWorkoutElev('');
      setWorkoutDuration('');
      loadAthleteData(userProfile.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setView('public');
  };

  // Cálculos táticos de Pacing e Nutrição
  const totalKm = workouts.reduce((acc, curr) => acc + (Number(curr.distance_km) || 0), 0);
  const totalDplus = workouts.reduce((acc, curr) => acc + (Number(curr.elevation_gain_m) || 0), 0);
  const calculatedPaceMin = calcTargetHours > 0 && calcDist > 0 ? (calcTargetHours * 60) / calcDist : 0;
  const carbsPerHour = Math.min(90, Math.max(40, Math.round(calcWeight * 0.9)));
  const waterPerHour = Math.round(calcWeight * 8);

  if (view === 'coach') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Brain /> Central do Treinador
            </h1>
            <button 
              onClick={handleLogout}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300 transition"
            >
              ← Encerrar Sessão
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-2">
              Bem-vindo, {userProfile?.full_name || 'Treinador'}
            </h2>
            <p className="text-slate-400 text-sm">
              Aqui geres o pacing, os planos de nutrição e as métricas fisiológicas dos teus atletas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'athlete') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        {/* Topbar do Atleta */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-2 rounded-lg text-slate-950">
                <Mountain className="w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tight text-white">
                TRAIL<span className="text-emerald-400">X</span>
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium text-slate-400">
                Atleta: <strong className="text-slate-200">{userProfile?.full_name || 'Atleta'}</strong>
              </span>
              <button 
                onClick={handleLogout}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Tabs de Navegação */}
          <div className="flex space-x-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('pacing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'pacing' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              Estratégia & Pacing
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'workouts' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              Registar Treinos ({workouts.length})
            </button>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Cards de Métricas Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Distância Total</p>
                    <p className="text-2xl font-black text-white">{totalKm.toFixed(1)} <span className="text-sm font-normal text-slate-500">km</span></p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Mountain className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Desnível (D+)</p>
                    <p className="text-2xl font-black text-white">{totalDplus} <span className="text-sm font-normal text-slate-500">m</span></p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Treinos Registados</p>
                    <p className="text-2xl font-black text-white">{workouts.length}</p>
                  </div>
                </div>
              </div>

              {/* Treinos Recentes */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Histórico de Treinos
                </h3>
                {workouts.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum treino registrado ainda. Muda para o tab "Registar Treinos" para adicionar o teu primeiro treino!</p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {workouts.map((w) => (
                      <div key={w.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{w.title}</p>
                          <p className="text-slate-500">{w.date} • {w.workout_type}</p>
                        </div>
                        <div className="text-right space-x-3">
                          <span className="font-mono text-emerald-400">{w.distance_km} km</span>
                          <span className="font-mono text-slate-400">{w.elevation_gain_m}m D+</span>
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">RPE {w.perceived_exertion_rpe}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PACING & NUTRIÇÃO */}
          {activeTab === 'pacing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculadora */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" /> Parâmetros da Prova / Treino
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Distância da Prova (km)</label>
                    <input 
                      type="number" 
                      value={calcDist}
                      onChange={(e) => setCalcDist(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Desnível Acumulado D+ (metros)</label>
                    <input 
                      type="number" 
                      value={calcElev}
                      onChange={(e) => setCalcElev(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Tempo Alvo (Horas)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={calcTargetHours}
                      onChange={(e) => setCalcTargetHours(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Peso do Atleta (kg)</label>
                    <input 
                      type="number" 
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Resultados Táticos */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" /> Estratégia Calculada
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-400">Ritmo Médio Estimado</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono">
                      {Math.floor(calculatedPaceMin)}'{Math.round((calculatedPaceMin % 1) * 60).toString().padStart(2, '0')}" /km
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Plano Nutricional (Carbo/hora)</p>
                      <p className="text-lg font-bold text-white">{carbsPerHour}g / hora</p>
                    </div>
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Plano de Hidratação (Água/hora)</p>
                      <p className="text-lg font-bold text-white">{waterPerHour} ml / hora</p>
                    </div>
                    <Droplets className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTAR TREINOS */}
          {activeTab === 'workouts' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl mx-auto space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Registar Novo Treino no Supabase
              </h3>

              <form onSubmit={handleAddWorkout} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Título do Treino</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Treino Longo de Serra / Rampas de Sintra"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Data</label>
                    <input 
                      type="date" 
                      required 
                      value={workoutDate}
                      onChange={(e) => setWorkoutDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Tipo de Treino</label>
                    <select
                      value={workoutType}
                      onChange={(e) => setWorkoutType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="longo">Longo</option>
                      <option value="rampas">Rampas</option>
                      <option value="tempo">Tempo / Ritmo</option>
                      <option value="regenerativo">Regenerativo</option>
                      <option value="cross_training">Cross Training</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Distância (km)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      value={workoutDist}
                      onChange={(e) => setWorkoutDist(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">D+ (metros)</label>
                    <input 
                      type="number" 
                      value={workoutElev}
                      onChange={(e) => setWorkoutElev(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Duração (minutos)</label>
                    <input 
                      type="number" 
                      required 
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Perceção de Esforço RPE (1 a 10): {workoutRpe}</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={workoutRpe}
                    onChange={(e) => setWorkoutRpe(e.target.value)}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition"
                >
                  Guardar Treino
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed top-0 w-full z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl text-slate-950">
              <Mountain className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              TRAIL<span className="text-emerald-400">X</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setView('login')}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-2 transition"
            >
              <LogIn className="w-4 h-4" />
              Área Reservada
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-36 pb-20 px-6 max-w-6xl mx-auto text-center">
        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest inline-block mb-6">
          Treino Científico de Trail Running
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Domina as Montanhas com Gestão Tática e Fisiológica
        </h1>
        <p className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto">
          Plataforma de acompanhamento personalizado de Trail e Ultra Trail. Estratégias de prova ao quilómetro, pacing por zonas de esforço e plano nutricional otimizado.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => setView('login')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition"
          >
            Aceder ao Painel <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* RECURSOS */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl w-fit mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Pacing por Altimetria</h3>
          <p className="text-slate-400 text-sm">Calculamos os ritmos ideais para cada subida e descida com base na tua vVO2max e inclinação.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl w-fit mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Plano Nutricional em Prova</h3>
          <p className="text-slate-400 text-sm">Estratégia exata de gramas de hidratos de carbono, sódio e água calculados por hora de esforço.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl w-fit mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Monitorização de Carga</h3>
          <p className="text-slate-400 text-sm">Acompanhamento contínuo da fadiga, sono e variabilidade da frequência cardíaca (HRV).</p>
        </div>
      </section>

      {/* MODAL DE LOGIN UNIFICADO */}
      {view === 'login' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full relative space-y-6">
            <button 
              onClick={() => {
                setView('public');
                setErrorMessage(null);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Aceder à Plataforma</h2>
              <p className="text-slate-400 text-xs">Introduz o teu email e palavra-passe registrados</p>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teu.email@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Palavra-passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" /> Entrar na Conta
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
