'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
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
  Calendar,
  Users,
  Send,
  Flag,
  Sparkles,
  Target,
  Trash2,
  Edit2,
  Save,
  FileCode2,
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

  // Utilizador Autenticado
  const [userProfile, setUserProfile] = useState<{ id: string; full_name?: string; role?: string } | null>(null);

  // Estados do Atleta
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [newWorkout, setNewWorkout] = useState({
    title: '',
    distance: '',
    elevation: '',
    duration: '',
    type: 'Trail Run'
  });

  // Estados do Treinador
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

  // Gestão de Provas
  const [races, setRaces] = useState<any[]>([]);
  const [newRace, setNewRace] = useState({ name: '', date: '', distance: '', elevation: '' });
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editRaceData, setEditRaceData] = useState({ name: '', date: '', distance: '', elevation: '' });

  // Inscrição de Atletas e Prescrições
  const [raceRegistrations, setRaceRegistrations] = useState<any[]>([]);
  const [selectedRaceForAthlete, setSelectedRaceForAthlete] = useState<string>('');
  const [selectedAthleteForRace, setSelectedAthleteForRace] = useState<string>('');
  const [athleteRaceTarget, setAthleteRaceTarget] = useState<string>('');

  const [prescribedWorkouts, setPrescribedWorkouts] = useState<any[]>([]);
  const [prescription, setPrescription] = useState({
    title: '',
    distance: '',
    elevation: '',
    notes: ''
  });

  // Verificar sessão ativa de forma segura
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    }
  };

  // Carregar perfil do utilizador logado com proteção contra erros
  const loadUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Usa maybeSingle em vez de single para não crashar se o perfil não existir

      if (profile) {
        setUserProfile(profile);
        if (profile.role === 'coach') {
          setView('coach');
          loadCoachAthletes(profile.id);
        } else {
          setView('athlete');
        }
      } else {
        // Se a conta existir no Auth mas não tiver entrada na tabela profiles
        setUserProfile({ id: userId, full_name: 'Utilizador', role: 'athlete' });
        setView('athlete');
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar Atletas do Treinador no Supabase
  const loadCoachAthletes = async (coachId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('coach_id', coachId)
        .eq('role', 'athlete');

      if (!error && data) {
        setAthletes(data);
        if (data.length > 0) {
          setSelectedAthleteId(data[0].id);
          setSelectedAthleteForRace(data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar atletas:', err);
    }
  };

  // Login
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
        await loadUserProfile(authData.user.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao efetuar login. Verifica os teus dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setView('public');
  };

  // Funções do Atleta
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

  // Algoritmo de Parse do GPX
  const parseGpxAndBuildPlan = (dist: number, elev: number) => {
    const p1 = (dist * 0.3).toFixed(0);
    const p2 = (dist * 0.7).toFixed(0);

    return [
      { km: `0 - ${p1} km`, zone: 'Z1 / Z2 (Aquecimento)', terrain: 'Subida inicial progressiva', nutrition: '50g Carbs/h' },
      { km: `${p1} - ${p2} km`, zone: 'Z2 / Z3 (Bloco Principal)', terrain: `Troço exigente (~${(elev * 0.6).toFixed(0)}m D+)`, nutrition: '75g Carbs/h + Sais' },
      { km: `${p2} - ${dist} km`, zone: 'Z3 / Z4 (Gestão Final)', terrain: 'Reta final e descidas técnicas', nutrition: 'Gel de Cafeína' }
    ];
  };

  const handleAddRace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRace.name || !newRace.distance) return;

    const dist = parseFloat(newRace.distance);
    const elev = parseInt(newRace.elevation) || 0;
    const newId = String(Date.now());

    const race = {
      id: newId,
      name: newRace.name,
      date: newRace.date || new Date().toISOString().split('T')[0],
      distance: dist,
      elevation: elev,
      gpxFileName: gpxFile ? gpxFile.name : null,
      racePlan: parseGpxAndBuildPlan(dist, elev)
    };

    setRaces([...races, race]);
    setSelectedRaceForAthlete(newId);
    setNewRace({ name: '', date: '', distance: '', elevation: '' });
    setGpxFile(null);
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
            {userProfile ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {userProfile.role === 'coach' ? 'Treinador: ' : 'Atleta: '}
                  <strong className="text-slate-200">{userProfile.full_name || 'Utilizador'}</strong>
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
                  Entrar na Plataforma <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE LOGIN */}
        {view === 'login' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
              <button onClick={() => setView('public')} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Aceder à Plataforma</h2>
                <p className="text-xs text-slate-400 mt-1">Introduz as tuas credenciais de acesso</p>
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
                  Entrar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DASHBOARD ATLETA */}
        {view === 'athlete' && userProfile && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Bem-vindo, {userProfile.full_name}</h1>
              <p className="text-xs text-slate-400">O teu painel pessoal de treino de Trail Running</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <Activity className="h-6 w-6 text-emerald-400" />
                <div>
                  <span className="text-xs font-medium text-slate-400 block">DISTÂNCIA ACUMULADA</span>
                  <span className="text-2xl font-bold text-white">{totalDistance.toFixed(1)} km</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <Mountain className="h-6 w-6 text-emerald-400" />
                <div>
                  <span className="text-xs font-medium text-slate-400 block">DESNÍVEL ACUMULADO</span>
                  <span className="text-2xl font-bold text-white">{totalElevation} m D+</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" /> Registar Treino
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
                  Guardar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DASHBOARD TREINADOR */}
        {view === 'coach' && userProfile && (
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Painel do Treinador ({userProfile.full_name})</h1>
              <p className="text-xs text-slate-400">Atletas Vinculados no Supabase: <strong>{athletes.length}</strong></p>
            </div>

            {/* ADICIONAR PROVA VIA GPX */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flag className="h-5 w-5 text-emerald-400" /> Criar Prova & Gerar Plano GPX
              </h2>
              <form onSubmit={handleAddRace} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nome da Prova"
                  value={newRace.name}
                  onChange={(e) => setNewRace({ ...newRace, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
                <input
                  type="date"
                  value={newRace.date}
                  onChange={(e) => setNewRace({ ...newRace, date: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  required
                  placeholder="Distância (km)"
                  value={newRace.distance}
                  onChange={(e) => setNewRace({ ...newRace, distance: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  placeholder="Desnível D+ (m)"
                  value={newRace.elevation}
                  onChange={(e) => setNewRace({ ...newRace, elevation: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
                <div className="sm:col-span-2">
                  <input
                    type="file"
                    accept=".gpx"
                    onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  className="sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Criar Prova
                </button>
              </form>
            </div>

            {/* LISTA DE ATLETAS */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" /> Os Meus Atletas Vinculados (Supabase)
              </h2>
              {athletes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Nenhum atleta associado ao teu `coach_id`. Adiciona `coach_id = '{userProfile.id}'` na tabela `profiles` do atleta no Supabase.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {athletes.map((a) => (
                    <div key={a.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="font-bold text-white text-sm block">{a.full_name || 'Atleta'}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block mt-1">
                        Atleta Ativo
                      </span>
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
