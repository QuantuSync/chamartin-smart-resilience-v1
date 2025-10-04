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

const UPDATE_INTERVAL = 1200000; // 20 minutes in milliseconds
const MIN_MANUAL_UPDATE_INTERVAL = 300000; // 5 minutes minimum between manual updates

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
    
    // Precipitation factor (30%) - Calibrated with historical events + ERA5
    let precipitationFactor = 0;
    if (weather.precipitation > 5) {
      precipitationFactor = Math.min(100, 50 + (weather.precipitation - 5) * 10);
    } else if (weather.precipitation > 0.5) {
      precipitationFactor = 20 + (weather.precipitation - 0.5) * 6.7;
    }
    score += precipitationFactor * 0.30;
    
    // Wind factor (25%) - Exponential scaling for extreme gusts
    let windFactor = 0;
    if (weather.windSpeed > 14) {
      windFactor = Math.min(100, 70 + (weather.windSpeed - 14) * 3);
    } else if (weather.windSpeed > 8) {
      windFactor = 30 + (weather.windSpeed - 8) * 6.7;
    }
    score += windFactor * 0.25;
    
    // Platform-specific exposure factor (15%)
    const exposureFactor = platform.isRoofed ? 0 : platform.exposure * 100;
    score += exposureFactor * 0.15;
    
    // Humidity factor (10%) - Visibility and condensation
    const humidityFactor = weather.humidity > 85 ? 60 : 0;
    score += humidityFactor * 0.10;
    
    // Temperature factor (10%) - Operational risk at extremes
    let tempFactor = 0;
    if (weather.temperature > 35) {
      tempFactor = 40 + (weather.temperature - 35) * 5;
    } else if (weather.temperature < 0) {
      tempFactor = 60 + Math.abs(weather.temperature) * 5;
    }
    score += tempFactor * 0.10;
    
    // Pressure factor (10%) - Atmospheric stability indicator
    const pressureFactor = weather.pressure < 1000 ? 40 : 0;
    score += pressureFactor * 0.10;
    
    // Apply ERA5 anomaly factor
    const adjustedScore = score * era5Factor;
    
    return Math.min(Math.round(adjustedScore), 100);
  }, []);

  const updatePlatformScores = useCallback((weather: WeatherData, era5AnomalyLevel?: string) => {
    // Get risk factor based on ERA5 anomaly level
    const era5Factor = era5AnomalyLevel ? era5AnomalyToRiskFactor(era5AnomalyLevel) : 1.0;
    
    const updatedPlatforms = initialPlatforms.map(platform => ({
      ...platform,
      riskScore: calculateRiskScore(weather, platform, era5Factor)
    }));
    setPlatforms(updatedPlatforms);
  }, [calculateRiskScore]);

  const updateHistoricalAnalysis = useCallback((weather: WeatherData, averageRiskScore: number, metadata?: WeatherMetadata) => {
    if (!weather) return;

    // Prepare ERA5 context if available
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

    // Generate enhanced historical analysis
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

    // Trend analysis
    const trendAnalysis = analyzeTrends({
      precipitation: weather.precipitation,
      windSpeed: weather.windSpeed,
      temperature: weather.temperature,
      pressure: weather.pressure
    }, era5Context);

    // Calculate combined confidence
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
    
    // Check if it's a manual update and if it's allowed
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
        
        // Process enhanced API data
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

        // Process metadata
        const weatherMetadata: WeatherMetadata = data.metadata;
        
        setWeatherData(enhancedWeatherData);
        setMetadata(weatherMetadata);
        setConfidence(data.confidence || 50);
        setDataSource(data.sources?.join(' + ') || 'Live APIs');
        setAnomalyLevel(weatherMetadata.anomalyLevel || 'normal');
        
        // Update platform scores with ERA5 factor
        updatePlatformScores(enhancedWeatherData, weatherMetadata.anomalyLevel);
        
        // Calculate average score for historical analysis
        const averageRiskScore = platforms.reduce((sum, p) => sum + p.riskScore, 0) / platforms.length;
        
        // Update historical analysis with ERA5 context
        updateHistoricalAnalysis(enhancedWeatherData, averageRiskScore, weatherMetadata);
        
        const now = new Date();
        setLastUpdate(now);
        
        // Update manual timestamp if applicable
        if (isManual) {
          setLastManualUpdate(now);
        }
        
        // Save original data if first time
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
      
      // Keep functioning with previous data if available
      if (!weatherData) {
        // Only use fallback if no previous data
        setDataSource('Local fallback');
        setConfidence(30);
      }
    } finally {
      setLoading(false);
    }
  }, [isSimulating, originalWeatherData, updatePlatformScores, updateHistoricalAnalysis, platforms, weatherData, canMakeManualUpdate, lastManualUpdate]);

  const refreshData = useCallback(() => {
    updateWeatherData(true); // Mark as manual
  }, [updateWeatherData]);

  const simulateWeather = useCallback((simulatedData: WeatherData) => {
    setIsSimulating(true);
    
    const enhancedSimulatedData: EnhancedWeatherData = {
      ...simulatedData,
      sources: ['DANA Simulation'],
      confidence: 95,
      dataQuality: 'simulated'
    };
    
    setWeatherData(enhancedSimulatedData);
    setDataSource('DANA Simulation');
    setConfidence(95);
    setAnomalyLevel('extreme'); // Simulations are usually extreme conditions
    
    // Update scores with extreme factor
    updatePlatformScores(simulatedData, 'extreme');
    
    // Calculate historical analysis for simulation
    const averageRiskScore = platforms.reduce((sum, p) => sum + p.riskScore, 0) / platforms.length;
    updateHistoricalAnalysis(simulatedData, averageRiskScore);
    
    setLastUpdate(new Date());
  }, [updatePlatformScores, updateHistoricalAnalysis, platforms]);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setAnomalyLevel('normal');
    
    if (originalWeatherData) {
      setWeatherData(originalWeatherData);
      setDataSource(originalWeatherData.sources?.join(' + ') || 'Live APIs');
      setConfidence(originalWeatherData.confidence || 50);
      updatePlatformScores(originalWeatherData);
      
      const averageRiskScore = platforms.reduce((sum, p) => sum + p.riskScore, 0) / platforms.length;
      updateHistoricalAnalysis(originalWeatherData, averageRiskScore, metadata || undefined);
      
      setLastUpdate(new Date());
    } else {
      updateWeatherData();
    }
  }, [originalWeatherData, updatePlatformScores, updateHistoricalAnalysis, platforms, metadata, updateWeatherData]);

  // Function to get system status
  const getSystemStatus = useCallback(() => {
    if (!weatherData || !metadata) {
      return {
        status: 'loading',
        description: 'Loading weather data...'
      };
    }

    const era5Status = metadata.era5Validation?.dataSource || 'Not available';
    const sourcesCount = weatherData.sources?.length || 0;
    
    if (confidence >= 80 && sourcesCount >= 2) {
      return {
        status: 'optimal',
        description: `System operating optimally with ${sourcesCount} sources + ERA5`
      };
    } else if (confidence >= 60 && sourcesCount >= 1) {
      return {
        status: 'good',
        description: `Normal operation with ${sourcesCount} source(s) + ERA5`
      };
    } else if (sourcesCount >= 1) {
      return {
        status: 'degraded',
        description: `Limited operation - Check APIs`
      };
    } else {
      return {
        status: 'fallback',
        description: `Fallback mode - APIs unavailable`
      };
    }
  }, [weatherData, metadata, confidence]);

  // Function to get time until next automatic update
  const getTimeToNextUpdate = useCallback((): number => {
    if (!lastUpdate) return 0;
    const timeSinceLastUpdate = Date.now() - lastUpdate.getTime();
    const timeToNext = UPDATE_INTERVAL - timeSinceLastUpdate;
    return Math.max(0, timeToNext);
  }, [lastUpdate]);

  // Function to get time until next allowed manual update
  const getTimeToNextManualUpdate = useCallback((): number => {
    if (!lastManualUpdate) return 0;
    const timeSinceLastManual = Date.now() - lastManualUpdate.getTime();
    const timeToNext = MIN_MANUAL_UPDATE_INTERVAL - timeSinceLastManual;
    return Math.max(0, timeToNext);
  }, [lastManualUpdate]);

  // Effect for automatic update every 20 minutes
  useEffect(() => {
    // Make first call
    updateWeatherData(false);
    
    // Set 20-minute interval
    const interval = setInterval(() => {
      updateWeatherData(false);
    }, UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, []); // Empty array to avoid circular dependencies

  return {
    // Main data
    weatherData,
    platforms,
    loading,
    lastUpdate,
    dataSource,
    confidence,
    isSimulating,
    
    // Enhanced historical analysis
    historicalAnalysis,
    anomalyLevel,
    metadata,
    
    // Functions
    refreshData, // Now includes rate limiting
    simulateWeather,
    resetSimulation,
    getSystemStatus,
    getTimeToNextUpdate,
    getTimeToNextManualUpdate,
    
    // Derived states
    hasERA5Validation: !!metadata?.era5Validation,
    era5Confidence: metadata?.era5Validation?.confidence || 0,
    sourcesUsed: weatherData?.sources || [],
    isHighAnomaly: anomalyLevel === 'high' || anomalyLevel === 'extreme',
    canManualUpdate: canMakeManualUpdate(),
    
    // Rate limiting information
    updateInterval: UPDATE_INTERVAL,
    minManualInterval: MIN_MANUAL_UPDATE_INTERVAL
  };
}