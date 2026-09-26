'use client';

import React, { useState } from 'react';
import { 
  Mountain, 
  ShieldCheck, 
  Zap, 
  Trophy, 
  ArrowRight, 
  LogIn, 
  Brain, 
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const [view, setView] = useState<'public' | 'coach' | 'athlete'>('public');

  if (view === 'coach') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Brain /> Central do Treinador
            </h1>
            <button 
              onClick={() => setView('public')}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300 transition"
            >
              ← Voltar ao Site Público
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-2">Painel de Gestão de Atletas</h2>
            <p className="text-slate-400 text-sm">Aqui geres o pacing, os planos de nutrição e as métricas fisiológicas dos teus atletas.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'athlete') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Activity /> Área Reservada do Atleta
            </h1>
            <button 
              onClick={() => setView('public')}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-slate-300 transition"
            >
              ← Voltar ao Site Público
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-2">O Teu Treino do Dia</h2>
            <p className="text-slate-400 text-sm">Acede às tuas zonas de ritmo, hidratação por hora e estratégia de prova.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed top-0 w-full z-50">
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
              onClick={() => setView('athlete')}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
            >
              Área do Atleta
            </button>
            <button 
              onClick={() => setView('coach')}
              className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition"
            >
              <LogIn className="w-4 h-4" />
              Área do Treinador
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
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition">
            Começar Acompanhamento <ArrowRight className="w-5 h-5" />
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
    </div>
  );
}
