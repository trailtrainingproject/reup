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
  Flag,
  Sparkles,
  Heart,
  Apple,
  Trash2,
  Edit2,
  MapPin,
  UserPlus,
  Phone,
  Calendar,
  Scale,
  User,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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

interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  elevation: number;
  gpxFileName?: string | null;
  athleteId: string;
  targetCarbsPerHour: number;
  maxHeartRate: number;
  restingHeartRate: number;
  planSectors: RacePlanSector[];
}

export default function CoachDashboard() {
  const [view, setView] = useState<'public' | 'login' | 'coach'>('public');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'athletes' | 'new-athlete' | 'athlete-profile' | 'races' | 'new-race'>('dashboard');
  
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

  // Formulário de Criação/Edição de Prova
  const [raceForm, setRaceForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    distance: '',
    elevation: '',
    athleteId: '',
    targetCarbsPerHour: '60',
    maxHeartRate: '185',
    restingHeartRate: '50'
  });
  const [gpxFile, setGpxFile] = useState<File | null>(null);

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
      const { error } = await supabase.from('profiles').insert([
        {
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
      setActiveTab('athletes');
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
        setActiveTab('athletes');
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

  const generateRacePlanSectors = (
    dist: number,
    elev: number,
    carbsPerHour: number,
    maxHR: number,
    restHR: number
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
        targetPace: 'Gestão conservadora (6:30 - 7:15 min/km)',
        heartRateZone: `Z1/Z2 (Abaixo de ${z2Upper} bpm)`,
        carbsTarget: `${Math.round(carbsPerHour * 0.8)}g HC/h`,
        hydration: '500ml Água + Eletrólitos',
        nutritionTips: 'Começar a ingestão líquida aos 20 min. Evitar géis muito concentrados no início.'
      },
      {
        sector: 'Setor 2: Troço Técnico & Maior D+',
        distanceKm: `${s1Km} km - ${s2Km} km`,
        terrain: `Subidas íngremes e crestas (~${Math.round(elev * 0.65)}m D+)`,
        targetPace: 'Ritmo constante / Power hiking (8:00 - 9:30 min/km)',
        heartRateZone: `Z2/Z3 (${z2Upper} - ${z3Upper} bpm)`,
        carbsTarget: `${carbsPerHour}g HC/h`,
        hydration: '600-750ml Água com Sódio',
        nutritionTips: 'Alternar 1 Gel de glicose/frutose (2:1) com barras fáceis de mastigar a cada 30-40 min.'
      },
      {
        sector: 'Setor 3: Descidas & Sprint Final',
        distanceKm: `${s2Km} km - ${dist.toFixed(1)} km`,
        terrain: 'Descidas técnicas e aproximação à meta',
        targetPace: 'Aceleração controlada (5:45 - 6:30 min/km)',
        heartRateZone: `Z3/Z4 (${z3Upper} - ${maxHR} bpm)`,
        carbsTarget: `${Math.round(carbsPerHour * 1.1)}g HC/h`,
        hydration: '500ml Água / Isotónico',
        nutritionTips: 'Priorizar géis rápidos ou hydrogels. Utilizar 50-100mg de Cafeína para foco neuromuscular.'
      }
    ];
  };

  const handleSaveRace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceForm.name || !raceForm.distance) return;

    const dist = parseFloat(raceForm.distance);
    const elev = parseInt(raceForm.elevation) || 0;
    const carbs = parseInt(raceForm.targetCarbsPerHour) || 60;
    const maxHR = parseInt(raceForm.maxHeartRate) || 185;
    const restHR = parseInt(raceForm.restingHeartRate) || 50;

    const planSectors = generateRacePlanSectors(dist, elev, carbs, maxHR, restHR);

    if (editingRaceId) {
      setRaces(races.map(r => r.id === editingRaceId ? {
        ...r,
        name: raceForm.name,
        date: raceForm.date,
        distance: dist,
        elevation: elev,
        athleteId: raceForm.athleteId,
        targetCarbsPerHour: carbs,
        maxHeartRate: maxHR,
        restingHeartRate: restHR,
        planSectors,
        gpxFileName: gpxFile ? gpxFile.name : r.gpxFileName
      } : r));
      setEditingRaceId(null);
    } else {
      const newRace: Race = {
        id: String(Date.now()),
        name: raceForm.name,
        date: raceForm.date,
        distance: dist,
        elevation: elev,
        athleteId: raceForm.athleteId,
        targetCarbsPerHour: carbs,
        maxHeartRate: maxHR,
        restingHeartRate: restHR,
        gpxFileName: gpxFile ? gpxFile.name : null,
        planSectors
      };
      setRaces([newRace, ...races]);
    }

    setRaceForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      distance: '',
      elevation: '',
      athleteId: athletes[0]?.id || '',
      targetCarbsPerHour: '60',
      maxHeartRate: '185',
      restingHeartRate: '50'
    });
    setGpxFile(null);
    setActiveTab('races');
  };

  const handleEditRace = (race: Race) => {
    setEditingRaceId(race.id);
    setRaceForm({
      name: race.name,
      date: race.date,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* NAVEGAÇÃO SUPERIOR */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('public')}>
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Mountain className="h-6 w-6 text-slate-950" />
            </div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              TRAILX <span className="text-xs text-emerald-400 font-medium ml-1">COACH</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {coachProfile ? (
              <div className="flex items-center gap-3">
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/10 transition-all"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {/* LANDING PAGE */}
        {view === 'public' && (
          <div className="space-y-16 py-12 text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
              Plataforma Exclusiva para Treinadores de Trail
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Planos de Prova, Nutrição e Ritmos Cardíacos
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              Faça a gestão dos seus atletas, planeie estratégias de GPX e calcule métricas nutricionais por setor.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setView('login')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                Aceder ao Painel de Treinador <LogIn className="h-4 w-4" />
              </button>
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
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Entrar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PAINEL DO TREINADOR COM MENU POR ABAS */}
        {view === 'coach' && coachProfile && (
          <div className="space-y-8">
            {/* MENU DE NAVEGAÇÃO DO TREINADOR */}
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🏠 Início
                </button>
                <button
                  onClick={() => setActiveTab('athletes')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'athletes' || activeTab === 'athlete-profile' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  👥 Atletas ({athletes.length})
                </button>
                <button
                  onClick={() => setActiveTab('new-athlete')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'new-athlete' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ➕ Novo Atleta
                </button>
                <button
                  onClick={() => setActiveTab('races')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'races' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  🏁 Provas & Planos ({races.length})
                </button>
                <button
                  onClick={() => {
                    setEditingRaceId(null);
                    setActiveTab('new-race');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'new-race' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  ✨ Nova Prova GPX
                </button>
              </div>
            </div>

            {/* TAB: DASHBOARD / INÍCIO */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h1 className="text-2xl font-bold text-white">Painel do Treinador</h1>
                  <p className="text-xs text-slate-400">Visão geral da sua equipa e planos de treino ativos.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <Users className="h-5 w-5" /> Atletas Registados
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">Tem atualmente {athletes.length} atletas vinculados.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('athletes')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                      >
                        Ver Lista
                      </button>
                      <button
                        onClick={() => setActiveTab('new-athlete')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                      >
                        Registar Atleta
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <Trophy className="h-5 w-5" /> Provas & Estratégias
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">{races.length} planos de prova ativos gerados.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('races')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                      >
                        Ver Provas
                      </button>
                      <button
                        onClick={() => {
                          setEditingRaceId(null);
                          setActiveTab('new-race');
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all"
                      >
                        Criar Nova Prova
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LISTA DE ATLETAS */}
            {activeTab === 'athletes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Lista de Atletas</h1>
                    <p className="text-xs text-slate-400">Clique num atleta para ver o perfil detalhado.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('new-athlete')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    <UserPlus className="h-4 w-4" /> Novo Atleta
                  </button>
                </div>

                {athletes.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-xs">
                    Nenhum atleta registado. Clique em "Novo Atleta" para começar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {athletes.map((ath) => (
                      <div
                        key={ath.id}
                        onClick={() => {
                          setSelectedAthlete(ath);
                          setActiveTab('athlete-profile');
                        }}
                        className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-5 rounded-2xl space-y-3 cursor-pointer transition-all group shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                            {ath.full_name || ath.name}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                        </div>

                        <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                          {ath.email && <div>Email: {ath.email}</div>}
                          <div className="flex gap-3 pt-1 text-slate-300">
                            {ath.age && <span>{ath.age} anos</span>}
                            {ath.gender && <span>• {ath.gender}</span>}
                            {ath.weight && <span className="text-emerald-400 font-medium">• {ath.weight} kg</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PERFIL DETALHADO DO ATLETA */}
            {activeTab === 'athlete-profile' && selectedAthlete && (
              <div className="space-y-6">
                <button
                  onClick={() => setActiveTab('athletes')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar à lista de atletas
                </button>

                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block mb-1">Perfil do Atleta</span>
                      <h1 className="text-2xl sm:text-3xl font-black text-white">{selectedAthlete.full_name || selectedAthlete.name}</h1>
                    </div>
                    <button
                      onClick={() => handleDeleteAthlete(selectedAthlete.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
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

                  <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-base font-bold text-white mb-3">Provas Atribuidas a este Atleta</h3>
                    {races.filter(r => r.athleteId === selectedAthlete.id).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhuma prova atribuída a este atleta de momento.</p>
                    ) : (
                      <div className="space-y-3">
                        {races.filter(r => r.athleteId === selectedAthlete.id).map(r => (
                          <div key={r.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-white text-sm block">{r.name}</span>
                              <span className="text-xs text-slate-400">{r.distance} km • {r.elevation}m D+</span>
                            </div>
                            <button
                              onClick={() => handleEditRace(r)}
                              className="text-xs text-emerald-400 hover:underline"
                            >
                              Ver Plano
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOVO ATLETA */}
            {activeTab === 'new-athlete' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h1 className="text-2xl font-bold text-white">Registar Novo Atleta</h1>
                  <button onClick={() => setActiveTab('athletes')} className="text-xs text-slate-400 hover:text-white">← Voltar</button>
                </div>

                <form onSubmit={handleAddAthlete} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
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
                    <label className="block text-xs text-slate-400 mb-1">Peso Atual (kg)</label>
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
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
                  >
                    {addingAthlete ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Guardar Atleta
                  </button>
                </form>
              </div>
            )}

            {/* TAB: CRIAR / EDITAR PROVA E GPX */}
            {activeTab === 'new-race' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h1 className="text-2xl font-bold text-white">
                    {editingRaceId ? 'Editar Prova & Estratégia' : 'Criar Nova Prova & Estratégia GPX'}
                  </h1>
                  <button onClick={() => setActiveTab('races')} className="text-xs text-slate-400 hover:text-white">← Voltar</button>
                </div>

                <form onSubmit={handleSaveRace} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome da Prova</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: UTSM - 50k"
                        value={raceForm.name}
                        onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Atleta Destinatário</label>
                      <select
                        value={raceForm.athleteId}
                        onChange={(e) => setRaceForm({ ...raceForm, athleteId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {athletes.length === 0 ? (
                          <option value="">Adicione primeiro um atleta na aba "Novo Atleta"</option>
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
                      <label className="block text-xs text-slate-400 mb-1">Distância Total (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        placeholder="ex: 42.5"
                        value={raceForm.distance}
                        onChange={(e) => setRaceForm({ ...raceForm, distance: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Desnível Positivo D+ (m)</label>
                      <input
                        type="number"
                        placeholder="ex: 2500"
                        value={raceForm.elevation}
                        onChange={(e) => setRaceForm({ ...raceForm, elevation: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <div>
                      <label className="block text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                        <Apple className="h-3.5 w-3.5" /> Hidratos/Hora (g HC/h)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="60 - 90"
                        value={raceForm.targetCarbsPerHour}
                        onChange={(e) => setRaceForm({ ...raceForm, targetCarbsPerHour: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> FC Máxima (bpm)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="ex: 185"
                        value={raceForm.maxHeartRate}
                        onChange={(e) => setRaceForm({ ...raceForm, maxHeartRate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" /> FC Repouso (bpm)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="ex: 50"
                        value={raceForm.restingHeartRate}
                        onChange={(e) => setRaceForm({ ...raceForm, restingHeartRate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Carregar Percurso em Ficheiro GPX</label>
                    <input
                      type="file"
                      accept=".gpx"
                      onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    {editingRaceId ? 'Guardar Alterações da Prova' : 'Gerar Plano Nutricional & Pacing GPX'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: LISTA DE PROVAS */}
            {activeTab === 'races' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h1 className="text-2xl font-bold text-white">Planos de Prova Ativos</h1>
                  <button
                    onClick={() => {
                      setEditingRaceId(null);
                      setActiveTab('new-race');
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="h-4 w-4" /> Nova Prova
                  </button>
                </div>

                {races.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-500 text-xs">
                    Nenhuma prova planeada. Clique em "Nova Prova" para gerar a estratégia.
                  </div>
                ) : (
                  races.map((race) => {
                    const assignedAthlete = athletes.find((a) => a.id === race.athleteId);

                    return (
                      <div key={race.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-white">{race.name}</h3>
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                Atleta: {assignedAthlete?.full_name || assignedAthlete?.name || 'Geral'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                              <span><MapPin className="inline h-3 w-3 mr-1" />{race.distance} km</span>
                              <span><Mountain className="inline h-3 w-3 mr-1" />{race.elevation}m D+</span>
                              <span><Apple className="inline h-3 w-3 mr-1 text-emerald-400" />{race.targetCarbsPerHour}g HC/h</span>
                              <span><Heart className="inline h-3 w-3 mr-1 text-red-400" />FC Máx {race.maxHeartRate} bpm</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
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

                        {/* ESTRATÉGIA POR SETOR */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {race.planSectors.map((sec, idx) => (
                            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                                {sec.sector}
                              </span>
                              <div className="text-xs text-slate-300 font-medium">{sec.distanceKm}</div>

                              <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
                                <div>
                                  <span className="text-slate-500 block">Terreno & Pacing</span>
                                  <span className="text-slate-200">{sec.terrain}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Ritmo Cardíaco Recomendado</span>
                                  <span className="text-red-400 font-medium">{sec.heartRateZone}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Estratégia Nutricional (HC/h)</span>
                                  <span className="text-emerald-400 font-medium">{sec.carbsTarget} ({sec.hydration})</span>
                                </div>
                                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 mt-2">
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
