// Copernicus Climate Data Store API
// Análisis histórico con validación ERA5 real para contexto y recomendaciones

export interface HistoricalEvent {
  name: string;
  date: string;
  location: string;
  maxPrecipitation: number;
  maxWindSpeed: number;
  minTemperature: number;
  maxTemperature: number;
  minPressure: number;
  description: string;
  impact: string;
}

interface WeatherConditions {
  precipitation: number;
  windSpeed: number;
  temperature: number;
  pressure: number;
}

interface ERA5ValidationData {
  anomalyLevel: 'normal' | 'moderate' | 'high' | 'extreme';
  confidence: number;
  similarDaysFound: number;
  dataSource: string;
}

interface HistoricalContext {
  historicalAvg: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    pressure: number;
  };
  anomaly: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    pressure: number;
  };
}

export const historicalEvents: HistoricalEvent[] = [
  {
    name: "Borrasca Filomena",
    date: "2021-01-09",
    location: "Madrid - Chamartín",
    maxPrecipitation: 45.2,
    maxWindSpeed: 38.5,
    minTemperature: -6.8,
    maxTemperature: 2.1,
    minPressure: 985.3,
    description: "Nevada histórica que paralizó Madrid durante días",
    impact: "400,000 pasajeros afectados, 72h de interrupción total del servicio"
  },
  {
    name: "DANA Valencia-Madrid",
    date: "2024-10-29",
    location: "Corredor Mediterráneo-Madrid",
    maxPrecipitation: 78.4,
    maxWindSpeed: 42.1,
    minTemperature: 12.3,
    maxTemperature: 18.7,
    minPressure: 992.1,
    description: "DANA severa con precipitaciones torrenciales",
    impact: "250,000 pasajeros redirigidos, 48h de servicios limitados"
  },
  {
    name: "Ola de Calor Extremo",
    date: "2023-07-14",
    location: "Madrid - Área Metropolitana",
    maxPrecipitation: 0,
    maxWindSpeed: 15.2,
    minTemperature: 28.9,
    maxTemperature: 44.3,
    minPressure: 1018.7,
    description: "Temperaturas record que afectaron infraestructura ferroviaria",
    impact: "Velocidad reducida en 15% de trayectos, expansión térmica de vías"
  },
  {
    name: "Tormenta Granizo Madrid",
    date: "2022-08-30",
    location: "Madrid Centro-Norte",
    maxPrecipitation: 32.1,
    maxWindSpeed: 68.4,
    minTemperature: 19.2,
    maxTemperature: 31.8,
    minPressure: 996.4,
    description: "Tormenta severa con granizo de hasta 4cm de diámetro",
    impact: "6h de suspensión parcial, daños en señalización exterior"
  },
  {
    name: "Borrasca Celia",
    date: "2023-12-18",
    location: "Madrid - Corredor Atlántico",
    maxPrecipitation: 28.7,
    maxWindSpeed: 52.3,
    minTemperature: 4.1,
    maxTemperature: 12.5,
    minPressure: 988.9,
    description: "Vientos huracanados y lluvia intensa",
    impact: "120,000 pasajeros afectados, 24h de servicios interrumpidos"
  }
];

// Función mejorada para encontrar evento histórico similar con tolerancias calibradas por ERA5
export function findSimilarHistoricalEvent(
  currentWeather: WeatherConditions, 
  era5Context?: HistoricalContext
): HistoricalEvent | null {
  
  // Tolerancias adaptativas basadas en contexto ERA5
  const getTolerances = () => {
    if (!era5Context) {
      // Tolerancias por defecto sin contexto ERA5
      return {
        precipitation: 15,
        wind: 20,
        temperature: 8
      };
    }
    
    // Ajustar tolerancias según anomalías ERA5
    const tempAnomaly = Math.abs(era5Context.anomaly.temperature);
    const precipAnomaly = Math.abs(era5Context.anomaly.precipitation);
    const windAnomaly = Math.abs(era5Context.anomaly.windSpeed);
    
    return {
      precipitation: Math.max(10, 15 - precipAnomaly * 2), // Menor tolerancia si hay anomalía
      wind: Math.max(15, 20 - windAnomaly * 2),
      temperature: Math.max(5, 8 - tempAnomaly * 0.5)
    };
  };
  
  const tolerances = getTolerances();
  
  // Buscar eventos con condiciones similares usando tolerancias calibradas
  const similarEvents = historicalEvents.filter(event => {
    const precipitationMatch = Math.abs(event.maxPrecipitation - currentWeather.precipitation) < tolerances.precipitation;
    const windMatch = Math.abs(event.maxWindSpeed - currentWeather.windSpeed) < tolerances.wind;
    const tempInRange = currentWeather.temperature >= (event.minTemperature - tolerances.temperature) && 
                       currentWeather.temperature <= (event.maxTemperature + tolerances.temperature);
    
    // Al menos 2 de 3 condiciones deben coincidir para considerar similaridad
    const matches = [precipitationMatch, windMatch, tempInRange].filter(Boolean).length;
    return matches >= 2;
  });

  if (similarEvents.length > 0) {
    // Devolver el evento más reciente de los similares
    return similarEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  return null;
}

// Función mejorada para generar recomendaciones basadas en patrones históricos + validación ERA5
export function generateHistoricalRecommendations(
  currentWeather: WeatherConditions, 
  currentRiskScore: number,
  era5Validation?: ERA5ValidationData,
  era5Context?: HistoricalContext
): {
  historicalContext: string;
  recommendations: string[];
  confidence: number;
  warningLevel: 'info' | 'watch' | 'advisory' | 'warning';
  era5Insights: string[];
} {
  const similarEvent = findSimilarHistoricalEvent(currentWeather, era5Context);
  let historicalContext = 'Sin patrones históricos similares identificados';
  let recommendations: string[] = [];
  let era5Insights: string[] = [];
  let confidence = 50;
  let warningLevel: 'info' | 'watch' | 'advisory' | 'warning' = 'info';

  // Agregar insights de validación ERA5
  if (era5Validation && era5Context) {
    const anomalyLevel = era5Validation.anomalyLevel;
    
    switch (anomalyLevel) {
      case 'extreme':
        era5Insights.push(`🔴 Condiciones EXTREMAS detectadas por ERA5 - Sin precedentes en últimos ${era5Validation.similarDaysFound} días`);
        era5Insights.push(`Anomalía temperatura: ${era5Context.anomaly.temperature > 0 ? '+' : ''}${era5Context.anomaly.temperature.toFixed(1)}°C`);
        if (Math.abs(era5Context.anomaly.precipitation) > 5) {
          era5Insights.push(`Anomalía precipitación: ${era5Context.anomaly.precipitation > 0 ? '+' : ''}${era5Context.anomaly.precipitation.toFixed(1)}mm/h`);
        }
        confidence = Math.max(confidence, 90);
        break;
        
      case 'high':
        era5Insights.push(`🟠 Condiciones ALTAS anómalas según ERA5 - Inusuales para la época`);
        era5Insights.push(`Desviación significativa respecto a promedio histórico reciente`);
        confidence = Math.max(confidence, 80);
        break;
        
      case 'moderate':
        era5Insights.push(`🟡 Condiciones moderadamente anómalas - Por encima/debajo de lo normal`);
        confidence = Math.max(confidence, 70);
        break;
        
      case 'normal':
        era5Insights.push(`🟢 Condiciones dentro de rangos normales según ERA5`);
        era5Insights.push(`Patrón meteorológico típico para esta época del año`);
        confidence = Math.min(confidence + 10, 95);
        break;
    }
  }

  // Lógica de recomendaciones basada en evento histórico similar
  if (similarEvent) {
    historicalContext = `Condiciones similares a ${similarEvent.name} (${similarEvent.date}): ${similarEvent.description}`;
    confidence = Math.max(confidence, 85);
    
    // Ajustar nivel de alerta basado en score actual + validación ERA5
    let adjustedRiskScore = currentRiskScore;
    
    if (era5Validation) {
      // Incrementar riesgo si hay anomalías altas
      const anomalyBonus = {
        'extreme': 15,
        'high': 10,
        'moderate': 5,
        'normal': 0
      }[era5Validation.anomalyLevel];
      
      adjustedRiskScore = Math.min(100, currentRiskScore + anomalyBonus);
    }
    
    if (adjustedRiskScore >= 70) {
      warningLevel = 'warning';
      recommendations = [
        `⚠️ PATRÓN CRÍTICO: Condiciones similares a ${similarEvent.name}`,
        `Impacto histórico: ${similarEvent.impact}`,
        'ACTIVAR protocolos de emergencia preventivos',
        'Monitorización continua OBLIGATORIA',
        'Preparar comunicación de crisis a pasajeros',
        'Coordinar con servicios de emergencia'
      ];
      
      if (era5Validation?.anomalyLevel === 'extreme') {
        recommendations.unshift('🚨 ALERTA MÁXIMA: Condiciones sin precedentes recientes según ERA5');
      }
      
    } else if (adjustedRiskScore >= 50) {
      warningLevel = 'advisory';
      recommendations = [
        `🔶 PATRÓN DETECTADO: Similitud con ${similarEvent.name}`,
        `Precedente histórico: ${similarEvent.impact}`,
        'Mantener vigilancia reforzada',
        'Revisar y preparar protocolos de contingencia',
        'Personal operativo en alerta preventiva',
        'Comunicación proactiva recomendada'
      ];
      
    } else if (adjustedRiskScore >= 30) {
      warningLevel = 'watch';
      recommendations = [
        `📋 Patrón histórico: Recuerda a ${similarEvent.name}`,
        'Monitorización estándar apropiada',
        'Mantener protocolos de vigilancia normal',
        'Sin acciones inmediatas requeridas'
      ];
      
    } else {
      warningLevel = 'info';
      recommendations = [
        `ℹ️ Referencia histórica: Condiciones similares a ${similarEvent.name}`,
        'Condiciones dentro de parámetros operativos normales',
        'Seguimiento rutinario suficiente'
      ];
    }
    
  } else {
    // Sin eventos similares - recomendaciones basadas en ERA5 y score
    const effectiveScore = era5Validation ? 
      Math.min(100, currentRiskScore + ({'extreme': 20, 'high': 15, 'moderate': 5, 'normal': 0}[era5Validation.anomalyLevel])) :
      currentRiskScore;
      
    if (effectiveScore >= 50) {
      warningLevel = 'watch';
      recommendations = [
        '🔍 Condiciones atípicas sin precedentes históricos claros',
        'Mantener vigilancia estándar reforzada',
        'Considerar consulta con meteorología especializada',
        'Monitorear evolución cada 15 minutos'
      ];
      
      if (era5Validation?.anomalyLevel === 'extreme') {
        recommendations.unshift('⚠️ ERA5 confirma: Condiciones extremadamente inusuales');
        warningLevel = 'advisory';
      }
      
    } else {
      recommendations = [
        'Condiciones normales sin patrones de riesgo identificados',
        'Procedimientos estándar aplicables',
        'Seguimiento rutinario adecuado'
      ];
    }
  }

  return {
    historicalContext,
    recommendations,
    confidence,
    warningLevel,
    era5Insights
  };
}

// Función para obtener nivel de confianza combinado (histórico + ERA5)
export function getCombinedConfidence(
  historicalConfidence: number,
  era5Validation?: ERA5ValidationData
): number {
  if (!era5Validation) {
    return Math.max(30, historicalConfidence - 20); // Penalizar sin validación ERA5
  }
  
  // Combinar confianzas con pesos
  const era5Weight = 0.4;
  const historicalWeight = 0.6;
  
  const combinedConfidence = (historicalConfidence * historicalWeight) + (era5Validation.confidence * era5Weight);
  
  // Bonificar si ambas fuentes están de acuerdo (alta confianza)
  const agreement = Math.abs(historicalConfidence - era5Validation.confidence) < 20;
  const bonus = agreement ? 5 : 0;
  
  return Math.min(95, Math.round(combinedConfidence + bonus));
}

// Función auxiliar para convertir nivel de anomalía ERA5 en factor de riesgo
export function era5AnomalyToRiskFactor(anomalyLevel: string): number {
  switch (anomalyLevel) {
    case 'extreme': return 1.2; // 20% más riesgo
    case 'high': return 1.15;   // 15% más riesgo
    case 'moderate': return 1.05; // 5% más riesgo
    case 'normal': return 1.0;   // Sin cambio
    default: return 1.0;
  }
}

// Función para análisis temporal de tendencias (usando datos ERA5 si están disponibles)
export function analyzeTrends(
  currentWeather: WeatherConditions,
  era5Context?: HistoricalContext
): {
  trends: string[];
  alerts: string[];
} {
  const trends: string[] = [];
  const alerts: string[] = [];
  
  if (era5Context) {
    // Análisis de tendencias basado en anomalías ERA5
    if (Math.abs(era5Context.anomaly.temperature) > 5) {
      const direction = era5Context.anomaly.temperature > 0 ? 'superior' : 'inferior';
      trends.push(`Temperatura ${Math.abs(era5Context.anomaly.temperature).toFixed(1)}°C ${direction} a la media histórica`);
    }
    
    if (era5Context.anomaly.precipitation > 3) {
      trends.push(`Precipitación ${era5Context.anomaly.precipitation.toFixed(1)}mm/h por encima de lo normal`);
      alerts.push('Precipitación anómalamente alta detectada');
    }
    
    if (Math.abs(era5Context.anomaly.windSpeed) > 10) {
      const intensity = era5Context.anomaly.windSpeed > 0 ? 'mayor' : 'menor';
      trends.push(`Viento ${intensity} intensidad que promedio histórico`);
    }
    
    if (Math.abs(era5Context.anomaly.pressure) > 15) {
      const direction = era5Context.anomaly.pressure > 0 ? 'alta' : 'baja';
      trends.push(`Presión atmosférica ${direction} - posible cambio meteorológico`);
      alerts.push('Variación significativa de presión detectada');
    }
  }
  
  return { trends, alerts };
}