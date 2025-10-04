import { NextResponse } from 'next/server';

const CHAMARTIN_LAT = 40.4729;
const CHAMARTIN_LON = -3.6797;

interface WeatherApiResponse {
  temperature?: number;
  humidity?: number;
  precipitation?: number;
  windSpeed?: number;
  windDirection?: number;
  pressure?: number;
  source: string;
  status: string;
  error?: string;
}

interface ERA5Day {
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  pressure: number;
}

interface CopernicusResponse {
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
  validation: {
    anomalyLevel: 'normal' | 'moderate' | 'high' | 'extreme';
    confidence: number;
    similarDaysFound: number;
    dataSource: string;
  };
  source: string;
  status: string;
  error?: string;
}

async function fetchNASAData(): Promise<WeatherApiResponse> {
  try {
    // Intentar con diferentes rangos de fechas si los recientes fallan
    const dateRanges = [
      { startDays: 3, endDays: 10 },   // Hace 3-10 días
      { startDays: 10, endDays: 17 },  // Hace 10-17 días
      { startDays: 17, endDays: 30 }   // Hace 17-30 días
    ];

    for (const range of dateRanges) {
      const startDate = new Date();
      const endDate = new Date();
      startDate.setDate(startDate.getDate() - range.endDays);
      endDate.setDate(endDate.getDate() - range.startDays);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
      };

      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN,WS2M,RH2M,PS&community=RE&longitude=${CHAMARTIN_LON}&latitude=${CHAMARTIN_LAT}&start=${formatDate(startDate)}&end=${formatDate(endDate)}&format=JSON`;
      
      console.log(`[NASA] Trying date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`[NASA] HTTP error ${response.status} for range ${range.startDays}-${range.endDays} days ago`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.properties || !data.properties.parameter) {
        console.log(`[NASA] No data properties for range ${range.startDays}-${range.endDays} days ago`);
        continue;
      }
      
      const properties = data.properties.parameter;
      const dates = Object.keys(properties.T2M_MAX || {});
      
      if (dates.length === 0) {
        console.log(`[NASA] No dates available for range ${range.startDays}-${range.endDays} days ago`);
        continue;
      }
      
      const latestDate = dates[dates.length - 1];
      const temp = properties.T2M_MAX[latestDate];
      const humidity = properties.RH2M[latestDate];
      
      if (temp !== -999 && humidity !== -999 && temp !== undefined && humidity !== undefined) {
        console.log(`[NASA] Valid data found for date ${latestDate}, range ${range.startDays}-${range.endDays} days ago`);
        return {
          temperature: temp,
          humidity: humidity,
          precipitation: Math.max(0, properties.PRECTOTCORR[latestDate] || 0),
          windSpeed: properties.WS2M[latestDate] || 5,
          windDirection: 180,
          pressure: (properties.PS[latestDate] || 1013000) / 100, // Convertir de Pa a hPa
          source: 'NASA',
          status: 'success'
        };
      } else {
        console.log(`[NASA] Invalid data (-999) for date ${latestDate}, range ${range.startDays}-${range.endDays} days ago`);
      }
    }
    
    throw new Error('NASA data not available for any tested date range');
    
  } catch (error) {
    console.error('[NASA] All attempts failed:', error);
    return {
      source: 'NASA',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown NASA API error'
    };
  }
}

async function fetchAEMETData(): Promise<WeatherApiResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_AEMET_API_KEY;
    if (!apiKey) {
      throw new Error('AEMET API key not found');
    }

    const stationId = '3195';
    const observationUrl = `https://opendata.aemet.es/opendata/api/observacion/convencional/datos/estacion/${stationId}`;
    
    const obsResponse = await fetch(observationUrl, {
      headers: {
        'api_key': apiKey
      }
    });

    if (!obsResponse.ok) {
      throw new Error(`AEMET API error: ${obsResponse.status}`);
    }

    const obsData = await obsResponse.json();
    
    if (obsData.estado === 200 && obsData.datos) {
      const dataResponse = await fetch(obsData.datos);
      const weatherArray = await dataResponse.json();
      
      if (weatherArray && weatherArray.length > 0) {
        const latest = weatherArray[weatherArray.length - 1];
        
        return {
          temperature: parseFloat(latest.ta) || undefined,
          humidity: parseFloat(latest.hr) || undefined,
          precipitation: parseFloat(latest.prec) || 0,
          windSpeed: parseFloat(latest.vv) || undefined,
          windDirection: parseFloat(latest.dv) || undefined,
          pressure: parseFloat(latest.pres) || undefined,
          source: 'AEMET',
          status: 'success'
        };
      }
    }
    
    throw new Error('No AEMET data available');
  } catch (error) {
    console.error('AEMET API failed:', error);
    return {
      source: 'AEMET',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown AEMET API error'
    };
  }
}

async function fetchERA5HistoricalData(): Promise<ERA5Day[]> {
  try {
    // Buscar últimos 5 días para comparación
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Hasta ayer
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5); // Desde hace 5 días
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const url = `https://archive-api.open-meteo.com/v1/era5?` +
      `latitude=${CHAMARTIN_LAT}&longitude=${CHAMARTIN_LON}&` +
      `hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,surface_pressure&` +
      `start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&` +
      `timezone=Europe%2FMadrid`;
    
    console.log('[ERA5] Fetching historical data from Open-Meteo:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo ERA5 API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.hourly) {
      throw new Error('No hourly data in ERA5 response');
    }
    
    // Agrupar por días y calcular promedios diarios
    const days: { [key: string]: ERA5Day } = {};
    
    data.hourly.time.forEach((time: string, index: number) => {
      const date = time.split('T')[0];
      
      if (!days[date]) {
        days[date] = {
          date,
          temperature: 0,
          humidity: 0,
          precipitation: 0,
          windSpeed: 0,
          pressure: 0
        };
      }
      
      // Acumular valores para promediar
      const temp = data.hourly.temperature_2m[index];
      const humidity = data.hourly.relativehumidity_2m[index];
      const precip = data.hourly.precipitation[index];
      const wind = data.hourly.windspeed_10m[index];
      const pressure = data.hourly.surface_pressure[index];
      
      if (temp !== null) days[date].temperature += temp;
      if (humidity !== null) days[date].humidity += humidity;
      if (precip !== null) days[date].precipitation += precip;
      if (wind !== null) days[date].windSpeed += wind;
      if (pressure !== null) days[date].pressure += pressure;
    });
    
    // Convertir a array y calcular promedios
    const result = Object.values(days).map(day => ({
      ...day,
      temperature: day.temperature / 24, // Promedio diario
      humidity: day.humidity / 24,
      windSpeed: day.windSpeed / 24,
      pressure: day.pressure / 24
      // precipitación se mantiene como suma diaria
    }));
    
    console.log(`[ERA5] Successfully processed ${result.length} days of historical data`);
    return result;
    
  } catch (error) {
    console.error('[ERA5] Error fetching historical data:', error);
    return [];
  }
}

function calculateAnomalyLevel(currentValue: number, historicalValues: number[], threshold: number): {
  anomaly: number;
  level: 'normal' | 'moderate' | 'high' | 'extreme';
} {
  if (historicalValues.length === 0) {
    return { anomaly: 0, level: 'normal' };
  }
  
  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const variance = historicalValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historicalValues.length;
  const stdDev = Math.sqrt(variance);
  
  const anomaly = currentValue - mean;
  const normalizedAnomaly = stdDev > 0 ? Math.abs(anomaly) / stdDev : 0;
  
  let level: 'normal' | 'moderate' | 'high' | 'extreme' = 'normal';
  if (normalizedAnomaly > 3) level = 'extreme';
  else if (normalizedAnomaly > 2) level = 'high';
  else if (normalizedAnomaly > 1) level = 'moderate';
  
  return { anomaly, level };
}

async function fetchCopernicusHistoricalContext(currentWeather: {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  pressure: number;
}): Promise<CopernicusResponse> {
  try {
    console.log('[Copernicus] Starting ERA5 historical validation...');
    
    const era5Data = await fetchERA5HistoricalData();
    
    if (era5Data.length === 0) {
      throw new Error('No ERA5 historical data available');
    }
    
    // Calcular promedios históricos
    const historicalAvg = {
      temperature: era5Data.reduce((sum, day) => sum + day.temperature, 0) / era5Data.length,
      humidity: era5Data.reduce((sum, day) => sum + day.humidity, 0) / era5Data.length,
      precipitation: era5Data.reduce((sum, day) => sum + day.precipitation, 0) / era5Data.length,
      windSpeed: era5Data.reduce((sum, day) => sum + day.windSpeed, 0) / era5Data.length,
      pressure: era5Data.reduce((sum, day) => sum + day.pressure, 0) / era5Data.length
    };
    
    // Calcular anomalías para cada parámetro
    const tempAnomaly = calculateAnomalyLevel(
      currentWeather.temperature,
      era5Data.map(d => d.temperature),
      2 // threshold
    );
    
    const precipAnomaly = calculateAnomalyLevel(
      currentWeather.precipitation,
      era5Data.map(d => d.precipitation),
      5 // threshold más alto para precipitación
    );
    
    const windAnomaly = calculateAnomalyLevel(
      currentWeather.windSpeed,
      era5Data.map(d => d.windSpeed),
      3
    );
    
    const pressureAnomaly = calculateAnomalyLevel(
      currentWeather.pressure,
      era5Data.map(d => d.pressure),
      10
    );
    
    // Determinar nivel de anomalía general
    const anomalyLevels = [tempAnomaly.level, precipAnomaly.level, windAnomaly.level, pressureAnomaly.level];
    const anomalyScores = anomalyLevels.map(level => {
      switch (level) {
        case 'extreme': return 4;
        case 'high': return 3;
        case 'moderate': return 2;
        default: return 1;
      }
    });
    
    const maxAnomalyScore = Math.max(...anomalyScores);
    let overallAnomalyLevel: 'normal' | 'moderate' | 'high' | 'extreme' = 'normal';
    
    if (maxAnomalyScore === 4) overallAnomalyLevel = 'extreme';
    else if (maxAnomalyScore === 3) overallAnomalyLevel = 'high';
    else if (maxAnomalyScore === 2) overallAnomalyLevel = 'moderate';
    
    // Calcular confianza basada en cantidad de datos y consistencia
    const confidence = Math.min(95, 50 + (era5Data.length * 10) + (anomalyLevels.filter(l => l === 'normal').length * 5));
    
    console.log(`[Copernicus] Validation complete: ${overallAnomalyLevel} anomaly level, ${confidence}% confidence`);
    
    return {
      historicalAvg,
      anomaly: {
        temperature: tempAnomaly.anomaly,
        humidity: currentWeather.humidity - historicalAvg.humidity,
        precipitation: precipAnomaly.anomaly,
        windSpeed: windAnomaly.anomaly,
        pressure: pressureAnomaly.anomaly
      },
      validation: {
        anomalyLevel: overallAnomalyLevel,
        confidence,
        similarDaysFound: era5Data.length,
        dataSource: 'Open-Meteo ERA5'
      },
      source: 'Copernicus ERA5',
      status: 'success'
    };
    
  } catch (error) {
    console.error('[Copernicus] ERA5 validation failed:', error);
    
    // Fallback a promedios climatológicos aproximados para Madrid
    return {
      historicalAvg: {
        temperature: 15.5, // Promedio anual Madrid
        humidity: 64,
        precipitation: 1.4, // Promedio diario
        windSpeed: 8.2,
        pressure: 1013.2
      },
      anomaly: {
        temperature: currentWeather.temperature - 15.5,
        humidity: currentWeather.humidity - 64,
        precipitation: currentWeather.precipitation - 1.4,
        windSpeed: currentWeather.windSpeed - 8.2,
        pressure: currentWeather.pressure - 1013.2
      },
      validation: {
        anomalyLevel: 'normal',
        confidence: 30, // Baja confianza sin datos ERA5
        similarDaysFound: 0,
        dataSource: 'Climatological fallback'
      },
      source: 'Copernicus ERA5',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown Copernicus API error'
    };
  }
}

function fuseWeatherData(aemetData: WeatherApiResponse, nasaData: WeatherApiResponse, copernicusData: CopernicusResponse) {
  const fusedData = {
    timestamp: new Date().toISOString(),
    temperature: 0,
    humidity: 0,
    precipitation: 0,
    windSpeed: 0,
    windDirection: 0,
    pressure: 0,
    sources: [] as string[],
    confidence: 0,
    dataQuality: 'high'
  };

  let tempSum = 0, tempCount = 0;
  let humSum = 0, humCount = 0;
  let precipSum = 0, precipCount = 0;
  let windSum = 0, windCount = 0;
  let pressSum = 0, pressCount = 0;
  let directionSum = 0, directionCount = 0;

  // AEMET tiene prioridad (peso 0.6)
  if (aemetData.status === 'success') {
    fusedData.sources.push('AEMET');
    const weight = 0.6;
    
    if (aemetData.temperature !== undefined) {
      tempSum += aemetData.temperature * weight;
      tempCount += weight;
    }
    if (aemetData.humidity !== undefined) {
      humSum += aemetData.humidity * weight;
      humCount += weight;
    }
    if (aemetData.precipitation !== undefined) {
      precipSum += aemetData.precipitation * weight;
      precipCount += weight;
    }
    if (aemetData.windSpeed !== undefined) {
      windSum += aemetData.windSpeed * weight;
      windCount += weight;
    }
    if (aemetData.pressure !== undefined) {
      pressSum += aemetData.pressure * weight;
      pressCount += weight;
    }
    if (aemetData.windDirection !== undefined) {
      directionSum += aemetData.windDirection * weight;
      directionCount += weight;
    }
  }

  // NASA como complemento (peso 0.4)
  if (nasaData.status === 'success') {
    fusedData.sources.push('NASA');
    const weight = 0.4;
    
    if (nasaData.temperature !== undefined) {
      tempSum += nasaData.temperature * weight;
      tempCount += weight;
    }
    if (nasaData.humidity !== undefined) {
      humSum += nasaData.humidity * weight;
      humCount += weight;
    }
    if (nasaData.precipitation !== undefined) {
      precipSum += nasaData.precipitation * weight;
      precipCount += weight;
    }
    if (nasaData.windSpeed !== undefined) {
      windSum += nasaData.windSpeed * weight;
      windCount += weight;
    }
    if (nasaData.pressure !== undefined) {
      pressSum += nasaData.pressure * weight;
      pressCount += weight;
    }
    if (nasaData.windDirection !== undefined) {
      directionSum += nasaData.windDirection * weight;
      directionCount += weight;
    }
  }

  // Calcular valores finales
  fusedData.temperature = tempCount > 0 ? tempSum / tempCount : 18;
  fusedData.humidity = humCount > 0 ? humSum / humCount : 60;
  fusedData.precipitation = precipCount > 0 ? precipSum / precipCount : 0;
  fusedData.windSpeed = windCount > 0 ? windSum / windCount : 5;
  fusedData.pressure = pressCount > 0 ? pressSum / pressCount : 1013;
  fusedData.windDirection = directionCount > 0 ? directionSum / directionCount : 180;

  // Ajustar confianza basada en validación ERA5
  let baseConfidence = fusedData.sources.length >= 2 ? 95 : 
                       fusedData.sources.length === 1 ? 75 : 50;
  
  // Modificar confianza según nivel de anomalía ERA5
  if (copernicusData.status === 'success') {
    const era5Confidence = copernicusData.validation.confidence;
    const anomalyPenalty = {
      'normal': 0,
      'moderate': -5,
      'high': -10,
      'extreme': -15
    }[copernicusData.validation.anomalyLevel];
    
    fusedData.confidence = Math.max(30, Math.min(baseConfidence, era5Confidence + anomalyPenalty));
    fusedData.sources.push('Copernicus ERA5');
  } else {
    fusedData.confidence = Math.max(30, baseConfidence - 10); // Penalizar sin validación ERA5
  }

  return {
    fusedData,
    rawSources: {
      aemet: aemetData,
      nasa: nasaData,
      copernicus: copernicusData
    }
  };
}

export async function GET() {
  try {
    console.log('[Weather API] Starting multi-source data fusion with ERA5 validation...');
    
    // Obtener datos primarios (AEMET + NASA)
    const [aemetData, nasaData] = await Promise.all([
      fetchAEMETData(),
      fetchNASAData()
    ]);

    // Preparar datos actuales para validación Copernicus
    const currentWeather = {
      temperature: aemetData.temperature || nasaData.temperature || 18,
      humidity: aemetData.humidity || nasaData.humidity || 60,
      precipitation: aemetData.precipitation || nasaData.precipitation || 0,
      windSpeed: aemetData.windSpeed || nasaData.windSpeed || 5,
      pressure: aemetData.pressure || nasaData.pressure || 1013
    };

    // Validar con datos históricos ERA5
    const copernicusData = await fetchCopernicusHistoricalContext(currentWeather);

    // Fusionar todos los datos
    const { fusedData, rawSources } = fuseWeatherData(aemetData, nasaData, copernicusData);

    const response = {
      ...fusedData,
      metadata: {
        fusionStrategy: 'weighted_average_with_era5_validation',
        sourcesUsed: fusedData.sources,
        confidence: fusedData.confidence,
        era5Validation: copernicusData.validation,
        anomalyLevel: copernicusData.validation.anomalyLevel,
        historicalContext: copernicusData.historicalAvg,
        rawSources: rawSources,
        processingTime: new Date().toISOString()
      }
    };

    console.log(`[Weather API] Fusion complete: ${fusedData.sources.join('+')} | Confidence: ${fusedData.confidence}% | Anomaly: ${copernicusData.validation.anomalyLevel}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Weather API] Critical fusion error:', error);
    
    const fallbackData = {
      timestamp: new Date().toISOString(),
      temperature: 18 + Math.random() * 8,
      humidity: 50 + Math.random() * 30,
      precipitation: Math.random() * 3,
      windSpeed: 3 + Math.random() * 12,
      windDirection: Math.random() * 360,
      pressure: 1010 + Math.random() * 10,
      sources: ['Emergency Fallback'],
      confidence: 20,
      dataQuality: 'estimated',
      metadata: {
        fusionStrategy: 'emergency_fallback',
        sourcesUsed: ['Emergency Fallback'],
        confidence: 20,
        era5Validation: {
          anomalyLevel: 'normal',
          confidence: 20,
          similarDaysFound: 0,
          dataSource: 'None - Emergency fallback'
        },
        error: 'All data sources failed',
        processingTime: new Date().toISOString()
      }
    };
    
    return NextResponse.json(fallbackData);
  }
}