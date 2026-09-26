'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Calendar, 
  Compass, 
  Package, 
  Trophy, 
  Flame, 
  Clock, 
  Droplet, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Mountain, 
  CloudSun, 
  Wind, 
  Thermometer, 
  Brain, 
  Plus, 
  Save, 
  Sparkles,
  Layers,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('coach');
  
  const [athlete, setAthlete] = useState({
    name: 'Carlos Silva',
    weight: 68,
    vVO2max: 18.5,
    itraScore: 685,
    weeklyVolumeAvg: 62,
    weeklyElevationAvg: 2800
  });

  const [selectedRace] = useState({
    name: 'MIUT 115 - Madeira Island Ultra Trail',
    distance: 115,
    elevation: 7200,
    maxAltitude: 1862,
    weatherForecast: { summitTemp: 4, windSpeed: 28 }
  });

  const [strategy, setStrategy] = useState({
    targetTimeOptimistic: '16h 45m',
    targetTimeRealist: '18h 15m',
    targetTimeConservative: '20h 30m',
    basePaceFlat: '5:15 min/km (Z2)',
    hourlyCarbs: 75,
    hourlyHydration: 600,
    hourlySodium: 500,
    coachNotes: 'O grande teste mental será na subida do Pico do Arieiro ao Pico Ruivo (km 62). Foca-te na técnica de bastões, respiração e não falhes os 75g/h de hidratos.',
    segments: [
      { id: 1, name: 'Porto Moniz ➔ Fanal', km: 14, dPlus: 1420, hrZone: 'Z2 (135-145 bpm)', estPace: '10:30 min/km', estTime: '2h 25m', nutrition: '1x Flask Água + 1x Gel Sódio', advice: 'Partida noturna. Não te deixes levar pelo ritmo do pelotão.' },
      { id: 2, name: 'Fanal ➔ Chão da Ribeira', km: 12, dPlus: 220, hrZone: 'Z2 / Descida Técnica', estPace: '7:45 min/km', estTime: '1h 33m', nutrition: '500ml Isotónico + 1x Barra', advice: 'Descida acentuada e húmida. Protege os quadricípites.' },
      { id: 3, name: 'Chão da Ribeira ➔ Encumeada', km: 16, dPlus: 1650, hrZone: 'Z2 Alta (148-152 bpm)', estPace: '12:10 min/km', estTime: '3h 15m', nutrition: '2x Flasks + 2x Géis', advice: 'Subida dura e constante. Ritmo de bastões bem cadenciado.' }
    ]
  });

  const [readiness] = useState({
    sleepHours: 7.5,
    fatigueScore: 3,
    hrvStatus: 'Ideal',
    overallScore: 88
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStrategy(prev => ({
        ...prev,
        targetTimeRealist: '17h 50m',
        coachNotes: `Plano recalibrado com base na vVO2max (${athlete.vVO2max} km/h) e média semanal de ${athlete.weeklyVolumeAvg}km.`
      }));
    }, 1200);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-black">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">TRAIL<span className="text-emerald-400">X</span></h1>
              <p className="text-xs text-slate-400">Coach & Athlete OS</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('coach')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'coach' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-emerald-400" />
                <span>Área do Treinador</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</span>
            </button>

            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Painel do Atleta</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {activeTab === 'coach' ? 'Central de Estratégia do Treinador' : 'Painel de Controlo do Atleta'}
            </h2>
          </div>

          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Prova Alvo</p>
              <p className="text-xs font-bold text-slate-200">{selectedRace.name}</p>
            </div>
          </div>
        </header>

        {activeTab === 'coach' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h3 className="font-bold text-slate-200">{athlete.name}</h3>
                <p className="text-xs text-slate-400 mt-1">ITRA: {athlete.itraScore} | vVO2max: {athlete.vVO2max} km/h</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase font-semibold">Meteorologia no Cume</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="flex items-center text-xs font-bold text-sky-400"><Thermometer className="w-4 h-4 mr-1"/>{selectedRace.weatherForecast.summitTemp}°C</span>
                  <span className="flex items-center text-xs font-bold text-emerald-400"><Wind className="w-4 h-4 mr-1"/>{selectedRace.weatherForecast.windSpeed} km/h</span>
                </div>
              </div>

              <button 
                onClick={handleRegeneratePlan}
                disabled={isGenerating}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-4 rounded-2xl flex items-center justify-center space-x-2 transition-all"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Recalcular Plano Tático</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Pacing & Estratégia de Prova</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">Tempo Alvo Otimista</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{strategy.targetTimeOptimistic}</p>
                </div>
                <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                  <p className="text-xs text-emerald-400 font-bold">Tempo Alvo Realista</p>
                  <p className="text-2xl font-black text-white mt-1">{strategy.targetTimeRealist}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">Tempo Conservador</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{strategy.targetTimeConservative}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xl font-bold text-white">Treino de Hoje</h3>
            <p className="text-xs text-slate-400 mt-1">Séries de Rampa + Z3 em Montanha (1h 30m • +650m D+)</p>
          </div>
        )}
      </main>
    </div>
  );
}
