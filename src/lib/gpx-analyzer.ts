// @ts-ignore
import gpxParser from 'gpxparser';

export interface RaceAnalysis {
  totalDistanceKm: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  estimatedTimeHours: number;
  recommendedCarbsGramPerHour: number;
  pointsCount: number;
}

export function analyzeGPX(gpxString: string, avgPaceMinKm: number = 6): RaceAnalysis {
  const gpx = new gpxParser();
  gpx.parse(gpxString);

  const track = gpx.tracks[0];
  if (!track) {
    throw new Error("O ficheiro GPX não contém trilhos válidos.");
  }

  const totalDistanceKm = Math.round((track.distance.total / 1000) * 10) / 10;
  const totalElevationGain = Math.round(track.elevation.pos || 0);
  const totalElevationLoss = Math.round(track.elevation.neg || 0);

  // Estimativa de tempo baseada na Regra de Naismith (100m D+ adicionam ~10 min ao tempo base)
  const baseTimeMinutes = totalDistanceKm * avgPaceMinKm;
  const elevationExtraMinutes = (totalElevationGain / 100) * 10;
  const totalEstimatedMinutes = baseTimeMinutes + elevationExtraMinutes;
  const estimatedTimeHours = Math.round((totalEstimatedMinutes / 60) * 10) / 10;

  // Cálculo de Nutrição Recomendada (Trail Longo / Ultra)
  const recommendedCarbsGramPerHour = estimatedTimeHours > 4 ? 90 : 60;

  return {
    totalDistanceKm,
    totalElevationGain,
    totalElevationLoss,
    estimatedTimeHours,
    recommendedCarbsGramPerHour,
    pointsCount: track.points.length,
  };
}
