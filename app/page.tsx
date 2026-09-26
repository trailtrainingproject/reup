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
  CheckCircle2
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
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    distance: '',
    elevation: '',
    duration: '',
    type: 'Trail Run'
  });

  // Estados do Dashboard do Treinador
  const [athletes, setAthletes] = useState<any[]>([
    { id: '1', name: 'João Silva', email: 'joao@example.com', target: 'UTMB 50K' },
    { id: '2', name: 'Maria Santos', email: 'maria@example.com', target: 'MIGUT 30K' }
  ]);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('1');

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

  // Funções de Treinador
  const handleAddAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthleteName) return;

    const athlete = {
      id: String(Date.now()),
      name: newAthleteName,
      email: newAthleteEmail || 'atleta@example.com',
      target: 'Geral'
    };

    setAthletes([...athletes, athlete]);
    setNewAthleteName('');
    setNewAthleteEmail('');
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
                Gestão Profissional de Trail Running
              </span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
                Domina as Montanhas com Estrutura & Pacing
              </h1>
              <p className="text-slate-400 text-base sm:text-lg">
                Plataforma integrada para treinadores e atletas de Trail Running. Planeamento de esforço, nutrição e análise de métricas em tempo real.
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

        {/* DASHBOARD DO TREINADOR COMPLETO */}
        {view === 'coach' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Painel do Treinador</h1>
                <p className="text-xs text-slate-400">Gestão técnica de atletas, planos de carga e prescrição de treinos</p>
              </div>
            </div>

            {/* SECÇÃO 1: ADICIONAR E LISTAR ATLETAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" /> Adicionar Atleta
                </h2>
                <form onSubmit={handleAddAthlete} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nome do Atleta</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Mota"
                      value={newAthleteName}
                      onChange={(e) => setNewAthleteName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="atleta@email.com"
                      value={newAthleteEmail}
                      onChange={(e) => setNewAthleteEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-all"
                  >
                    Registar Atleta
                  </button>
                </form>
              </div>

              {/* LISTA DE ATLETAS ASSOCIADOS */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-emerald-400" /> Os Meus Atletas ({athletes.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {athletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      onClick={() => setSelectedAthleteId(athlete.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedAthleteId === athlete.id
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-sm">{athlete.name}</h3>
                          <p className="text-xs text-slate-400">{athlete.email}</p>
                        </div>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-semibold">
                          {athlete.target}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECÇÃO 2: PRESCRIÇÃO DE TREINOS */}
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

            {/* SECÇÃO 3: HISTÓRICO DE PRESCRIÇÕES */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Treinos Prescritos Recentemente
              </h2>
              {prescribedWorkouts.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma prescrição enviada recentemente.</p>
              ) : (
                <div className="space-y-2">
                  {prescribedWorkouts.map((p) => (
                    <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400">{p.athleteName}</span>
                          <span className="text-xs text-slate-600">•</span>
                          <h3 className="font-bold text-white text-sm">{p.title}</h3>
                        </div>
                        {p.notes && <p className="text-xs text-slate-400 mt-1">{p.notes}</p>}
                      </div>
                      <div className="flex gap-4 text-xs font-semibold text-slate-300">
                        {p.distance && <span>{p.distance} km</span>}
                        {p.elevation && <span>{p.elevation} m D+</span>}
                        <span className="text-slate-500">{p.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
