'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherData, Platform } from '@/types';
import { fetchWeatherData } from './weatherAPI';
import { platforms as initialPlatforms } from '@/data/mockData';
import { 
  generateHistoricalRecommendations, 
  findSimilarHistoricalEvent,
  getCombinedConfidence,
  era5AnomalyToRiskFactor,
  analyzeTrends
} from './copernicusAPI';

interface EnhancedWeatherData extends WeatherData {
  sources?: string[];
  confidence?: number;
  dataQuality?: string;
}

interface WeatherMetadata {
  fusionStrategy?: string;
  sourcesUsed?: string[];
  confidence?: number;
  era5Validation?: {
    anomalyLevel: 'normal' | 'moderate' | 'high' | 'extreme';
    confidence: number;
    similarDaysFound: number;
    dataSource: string;
  };
  anomalyLevel?: string;
  historicalContext?: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    pressure: number;
  };
  processingTime?: string;
}

interface HistoricalAnalysis {
  historicalContext: string;
  recommendations: string[];
  confidence: number;
  warningLevel: 'info' | 'watch' | 'advisory' | 'warning';
  era5Insights: string[];
  trends: string[];
  alerts: string[];
  combinedConfidence: number;
}

const UPDATE_INTERVAL = 1200000; // 20 minutos en milisegundos
const MIN_MANUAL_UPDATE_INTERVAL = 300000; // 5 minutos mínimo entre updates manuales

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState<EnhancedWeatherData | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastManualUpdate, setLastManualUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [originalWeatherData, setOriginalWeatherData] = useState<EnhancedWeatherData | null>(null);
  const [historicalAnalysis, setHistoricalAnalysis] = useState<HistoricalAnalysis | null>(null);
  const [metadata, setMetadata] = useState<WeatherMetadata | null>(null);
  const [anomalyLevel, setAnomalyLevel] = useState<string>('normal');

  const calculateRiskScore = useCallback((weather: WeatherData, platform: Platform, era5Factor: number = 1.0): number => {
    let score = 0;
    
    // Factor precipitación (30%) - Calibrado con eventos históricos + ERA5
    let precipitationFactor = 0;
    if (weather.precipitation > 5) {
      precipitationFactor = Math.min(100, 50 + (weather.precipitation - 5) * 10);
    } else if (weather.precipitation > 0.5) {
      precipitationFactor = 20 + (weather.precipitation - 0.5) * 6.7;
    }
    score += precipitationFactor * 0.30;
    
    // Factor viento (25%) - Escalado exponencial para rachas extremas
    let windFactor = 0;
    if (weather.windSpeed > 14) {
      windFactor = Math.min(100, 70 + (weather.windSpeed - 14) * 3);
    } else if (weather.windSpeed > 8) {
      windFactor = 30 + (weather.windSpeed - 8) * 6.7;
    }
    score += windFactor * 0.25;
    
    // Factor exposición específica por andén (15%)
    const exposureFactor = platform.isRoofed ? 0 : platform.exposure * 100;
    score += exposureFactor * 0.15;
    
    // Factor humedad (10%) - Visibilidad y condensación
    const humidityFactor = weather.humidity > 85 ? 60 : 0;
    score += humidityFactor * 0.10;
    
    // Factor temperatura (10%) - Riesgo operativo en extremos
    let tempFactor = 0;
    if (weather.temperature > 35) {
      tempFactor = 40 + (weather.temperature - 35) * 5;
    } else if (weather.temperature < 0) {
      tempFactor = 60 + Math.abs(weather.temperature) * 5;
    }
    score += tempFactor * 0.10;
    
    // Factor presión (10%) - Indicador de estabilidad atmosférica
    const pressureFactor = weather.pressure < 1000 ? 40 : 0;
    score += pressureFactor * 0.10;
    
    // Aplicar factor de anomalía ERA5
    const adjustedScore = score * era5Factor;
    
    return Math.min(Math.round(adjustedScore), 100);
  }, []);

  const updatePlatformScores = useCallback((weather: WeatherData, era5AnomalyLevel?: string) => {
    // Obtener factor de riesgo basado en nivel de anomalía ERA5
    const era5Factor = era5AnomalyLevel ? era5AnomalyToRiskFactor(era5AnomalyLevel) : 1.0;
    
    const updatedPlatforms = initialPlatforms.map(platform => ({
      ...platform,
      riskScore: calculateRiskScore(weather, platform, era5Factor)
    }));
    setPlatforms(updatedPlatforms);
  }, [calculateRiskScore]);

  const updateHistoricalAnalysis = useCallback((weather: WeatherData, averageRiskScore: number, metadata?: WeatherMetadata) => {
    if (!weather) return;

    // Preparar contexto ERA5 si está disponible
    const era5Context = metadata?.historicalContext ? {
      historicalAvg: metadata.historicalContext,
      anomaly: {
        temperature: weather.temperature - metadata.historicalContext.temperature,
        humidity: weather.humidity - metadata.historicalContext.humidity,
        precipitation: weather.precipitation - metadata.historicalContext.precipitation,
        windSpeed: weather.windSpeed - metadata.historicalContext.windSpeed,
        pressure: weather.pressure - metadata.historicalContext.pressure
      }
    } : undefined;

    // Generar análisis histórico mejorado
    const analysis = generateHistoricalRecommendations(
      {
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
        temperature: weather.temperature,
        pressure: weather.pressure
      },
      averageRiskScore,
      metadata?.era5Validation,
      era5Context
    );

    // Análisis de tendencias
    const trendAnalysis = analyzeTrends({
      precipitation: weather.precipitation,
      windSpeed: weather.windSpeed,
      temperature: weather.temperature,
      pressure: weather.pressure
    }, era5Context);

    // Calcular confianza combinada
    const combinedConfidence = getCombinedConfidence(analysis.confidence, metadata?.era5Validation);

    setHistoricalAnalysis({
      ...analysis,
      trends: trendAnalysis.trends,
      alerts: trendAnalysis.alerts,
      combinedConfidence
    });
  }, []);

  const canMakeManualUpdate = useCallback((): boolean => {
    if (!lastManualUpdate) return true;
    const timeSinceLastManual = Date.now() - lastManualUpdate.getTime();
    return timeSinceLastManual >= MIN_MANUAL_UPDATE_INTERVAL;
  }, [lastManualUpdate]);

  const updateWeatherData = useCallback(async (isManual: boolean = false) => {
    if (isSimulating) return;
    
    // Verificar si es un update manual y si está permitido
    if (isManual && !canMakeManualUpdate()) {
      const timeLeft = Math.ceil((MIN_MANUAL_UPDATE_INTERVAL - (Date.now() - (lastManualUpdate?.getTime() || 0))) / 1000);
      console.log(`[useWeatherData] Manual update blocked. Try again in ${timeLeft} seconds.`);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`[useWeatherData] Fetching enhanced weather data with ERA5 validation... (${isManual ? 'Manual' : 'Automatic'})`);
      
      const response = await fetch('/api/weather');
      
      if (response.ok) {
        const data = await response.json();
        
        // Procesar datos mejorados del API
        const enhancedWeatherData: EnhancedWeatherData = {
          timestamp: data.timestamp,
          temperature: data.temperature,
          humidity: data.humidity,
          precipitation: data.precipitation,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          pressure: data.pressure,
          sources: data.sources,
          confidence: data.confidence,
          dataQuality: data.dataQuality
        };

        // Procesar metadata
        const weatherMetadata: WeatherMetadata = data.metadata;
        
        setWeatherData(enhancedWeatherData);
        setMetadata(weatherMetadata);
        setConfidence(data.confidence || 50);
        setDataSource(data.sources?.join(' + ') || 'APIs en vivo');
        setAnomalyLevel(weatherMetadata.anomalyLevel || 'normal');
        
        // Actualizar scores de plataformas con factor ERA5
        updatePlatformScores(enhancedWeatherData, weatherMetadata.anomalyLevel);
        
        // Calcular score promedio para análisis histórico
        const averageRiskScore = platforms.reduce((sum, p) => sum + p.riskScore, 0) / platforms.length;
        
        // Actualizar análisis histórico con contexto ERA5
        updateHistoricalAnalysis(enhancedWeatherData, averageRiskScore, weatherMetadata);
        
        const now = new Date();
        setLastUpdate(now);
        
        // Actualizar timestamp de manual si corresponde
        if (isManual) {
          setLastManualUpdate(now);
        }
        
        // Guardar datos originales si es la primera vez
        if (!originalWeatherData) {
          setOriginalWeatherData(enhancedWeatherData);
        }
        
        console.log(`[useWeatherData] Data updated successfully:`, {
          sources: data.sources,
          confidence: data.confidence,
          anomalyLevel: weatherMetadata.anomalyLevel,
          era5DaysAnalyzed: weatherMetadata.era5Validation?.similarDaysFound,
          updateType: isManual ? 'Manual' : 'Automatic'
        });
        
      } else {
        throw new Error(`API response error: ${response.status}`);
      }
    } catch (error) {
      console.error('[useWeatherData] Error updating weather data:', error);
      
      // Mantener funcionamiento con datos anteriores si están disponibles
      if (!weatherData) {
        // Solo usar fallback si no hay datos previos
        setDataSource('Fallback local');
        setConfidence(30);
      }
    } finally {
      setLoading(false);
    }
  }, [isSimulating, originalWeatherData, updatePlatformScores, updateHistoricalAnalysis, platforms, weatherData, canMakeManualUpdate, lastManualUpdate]);

  const refreshData = useCallback(() => {
    updateWeatherData(true); // Marcar como manual
  }, [updateWeatherData]);

  const simulateWeather = useCallback((simulatedData: WeatherData) => {
    setIsSimulating(true);
    
    const enhancedSimulatedData: EnhancedWeatherData = {
      ...simulatedData,
      sources: ['Simulación DANA'],
      confidence: 95,
      dataQuality: 'simulated'
    };
    
    setWeatherData(enhancedSimulatedData);
    setDataSource('Simulación DANA');
    setConfidence(95);
    setAnomalyLevel('extreme'); // Las simulaciones suelen ser condiciones extremas
    
    // Actualizar scores con factor de extremo
    updatePlatformScores(simulatedData, 'extreme');
    
    // Calcular análisis histórico para simulación
    const averageRiskScore = platforms.reduce((sum, p) => sum + p.riskScore, 0) / platforms.length;
    updateHistoricalAnalysis(simulatedData, averageRiskScore);
    
    setLastUpdate(new Date());
  }, [updatePlatformScores, updateHistoricalAnalysis, platforms]);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setAnomalyLevel('normal');
    
    if (originalWeatherData) {
      setWeatherData(originalWeatherData);
      setDataSource(originalWeatherData.sources?.join(' + ') || 'APIs en vivo');
      setConfidence(originalWeatherData.confidence || 50);
      updatePlatformScores(originalWeatherData);
      
      const averageRiskScore = platforms.reduce((sum, p) => sum + p.riskScore, 0) / platforms.length;
      updateHistoricalAnalysis(originalWeatherData, averageRiskScore, metadata || undefined);
      
      setLastUpdate(new Date());
    } else {
      updateWeatherData();
    }
  }, [originalWeatherData, updatePlatformScores, updateHistoricalAnalysis, platforms, metadata, updateWeatherData]);

  // Función para obtener estado del sistema
  const getSystemStatus = useCallback(() => {
    if (!weatherData || !metadata) {
      return {
        status: 'loading',
        description: 'Cargando datos meteorológicos...'
      };
    }

    const era5Status = metadata.era5Validation?.dataSource || 'No disponible';
    const sourcesCount = weatherData.sources?.length || 0;
    
    if (confidence >= 80 && sourcesCount >= 2) {
      return {
        status: 'optimal',
        description: `Sistema funcionando óptimamente con ${sourcesCount} fuentes + ERA5`
      };
    } else if (confidence >= 60 && sourcesCount >= 1) {
      return {
        status: 'good',
        description: `Funcionamiento normal con ${sourcesCount} fuente(s) + ERA5`
      };
    } else if (sourcesCount >= 1) {
      return {
        status: 'degraded',
        description: `Funcionamiento limitado - Verificar APIs`
      };
    } else {
      return {
        status: 'fallback',
        description: `Modo fallback - APIs no disponibles`
      };
    }
  }, [weatherData, metadata, confidence]);

  // Función para obtener tiempo hasta próximo update automático
  const getTimeToNextUpdate = useCallback((): number => {
    if (!lastUpdate) return 0;
    const timeSinceLastUpdate = Date.now() - lastUpdate.getTime();
    const timeToNext = UPDATE_INTERVAL - timeSinceLastUpdate;
    return Math.max(0, timeToNext);
  }, [lastUpdate]);

  // Función para obtener tiempo hasta próximo update manual permitido
  const getTimeToNextManualUpdate = useCallback((): number => {
    if (!lastManualUpdate) return 0;
    const timeSinceLastManual = Date.now() - lastManualUpdate.getTime();
    const timeToNext = MIN_MANUAL_UPDATE_INTERVAL - timeSinceLastManual;
    return Math.max(0, timeToNext);
  }, [lastManualUpdate]);

  // Efecto para actualización automática cada 20 minutos
  useEffect(() => {
    // Hacer la primera llamada
    updateWeatherData(false);
    
    // Configurar intervalo de 20 minutos
    const interval = setInterval(() => {
      updateWeatherData(false);
    }, UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, []); // Array vacío para evitar dependencias circulares

  return {
    // Datos principales
    weatherData,
    platforms,
    loading,
    lastUpdate,
    dataSource,
    confidence,
    isSimulating,
    
    // Análisis histórico mejorado
    historicalAnalysis,
    anomalyLevel,
    metadata,
    
    // Funciones
    refreshData, // Ahora incluye limitación de rate
    simulateWeather,
    resetSimulation,
    getSystemStatus,
    getTimeToNextUpdate,
    getTimeToNextManualUpdate,
    
    // Estados derivados
    hasERA5Validation: !!metadata?.era5Validation,
    era5Confidence: metadata?.era5Validation?.confidence || 0,
    sourcesUsed: weatherData?.sources || [],
    isHighAnomaly: anomalyLevel === 'high' || anomalyLevel === 'extreme',
    canManualUpdate: canMakeManualUpdate(),
    
    // Información de rate limiting
    updateInterval: UPDATE_INTERVAL,
    minManualInterval: MIN_MANUAL_UPDATE_INTERVAL
  };
}