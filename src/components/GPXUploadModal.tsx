'use client';

import { useState } from 'react';
import { analyzeGPX, RaceAnalysis } from '@/lib/gpx-analyzer';
import { Mountain, Upload, Activity, Clock, Flame } from 'lucide-react';

interface GPXUploadProps {
  onAnalysisComplete: (analysis: RaceAnalysis, fileName: string, rawContent: string) => void;
}

export default function GPXUploader({ onAnalysisComplete }: GPXUploadProps) {
  const [analysis, setAnalysis] = useState<RaceAnalysis | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (content) {
          const result = analyzeGPX(content);
          setAnalysis(result);
          onAnalysisComplete(result, file.name, content);
        }
      } catch (err: any) {
        setError('Erro ao processar o ficheiro GPX. Certifique-se de que é um formato válido.');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Mountain className="text-emerald-400" /> Análise Automática de Prova (GPX)
      </h3>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-lg p-6 cursor-pointer bg-slate-950/50 transition-colors">
        <Upload className="w-8 h-8 text-emerald-400 mb-2" />
        <span className="text-sm font-medium">
          {fileName ? fileName : 'Clique aqui para carregar o ficheiro .GPX da prova'}
        </span>
        <span className="text-xs text-slate-400 mt-1">Compatível com Garmin, Suunto, Coros ou Strava</span>
        <input type="file" accept=".gpx" onChange={handleFileUpload} className="hidden" />
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
              <Activity className="w-4 h-4" /> Distância & Altimetria
            </div>
            <p className="text-xl font-bold">{analysis.totalDistanceKm} km</p>
            <p className="text-xs text-slate-400">+{analysis.totalElevationGain}m D+ / -{analysis.totalElevationLoss}m D-</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
              <Clock className="w-4 h-4" /> Tempo Estimado
            </div>
            <p className="text-xl font-bold">~{analysis.estimatedTimeHours} horas</p>
            <p className="text-xs text-slate-400">Ajustado à altimetria (Regra de Naismith)</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
              <Flame className="w-4 h-4" /> Nutrição Recomendada
            </div>
            <p className="text-xl font-bold">{analysis.recommendedCarbsGramPerHour}g HC / hora</p>
            <p className="text-xs text-slate-400">Total est.: ~{Math.round(analysis.estimatedTimeHours * analysis.recommendedCarbsGramPerHour)}g</p>
          </div>
        </div>
      )}
    </div>
  );
}
