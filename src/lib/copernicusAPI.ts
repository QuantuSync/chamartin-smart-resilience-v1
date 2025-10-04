// Copernicus Climate Data Store API
// Historical analysis with real ERA5 validation for context and recommendations

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
    name: "Storm Filomena",
    date: "2021-01-09",
    location: "Madrid - Chamartín",
    maxPrecipitation: 45.2,
    maxWindSpeed: 38.5,
    minTemperature: -6.8,
    maxTemperature: 2.1,
    minPressure: 985.3,
    description: "Historic snowfall that paralyzed Madrid for days",
    impact: "400,000 passengers affected, 72h total service interruption"
  },
  {
    name: "DANA Valencia-Madrid",
    date: "2024-10-29",
    location: "Mediterranean Corridor-Madrid",
    maxPrecipitation: 78.4,
    maxWindSpeed: 42.1,
    minTemperature: 12.3,
    maxTemperature: 18.7,
    minPressure: 992.1,
    description: "Severe DANA with torrential precipitation",
    impact: "250,000 passengers rerouted, 48h limited services"
  },
  {
    name: "Extreme Heat Wave",
    date: "2023-07-14",
    location: "Madrid - Metropolitan Area",
    maxPrecipitation: 0,
    maxWindSpeed: 15.2,
    minTemperature: 28.9,
    maxTemperature: 44.3,
    minPressure: 1018.7,
    description: "Record temperatures affecting railway infrastructure",
    impact: "Speed reduced on 15% of routes, thermal expansion of tracks"
  },
  {
    name: "Madrid Hail Storm",
    date: "2022-08-30",
    location: "Madrid Center-North",
    maxPrecipitation: 32.1,
    maxWindSpeed: 68.4,
    minTemperature: 19.2,
    maxTemperature: 31.8,
    minPressure: 996.4,
    description: "Severe storm with hail up to 4cm diameter",
    impact: "6h partial suspension, damage to outdoor signage"
  },
  {
    name: "Storm Celia",
    date: "2023-12-18",
    location: "Madrid - Atlantic Corridor",
    maxPrecipitation: 28.7,
    maxWindSpeed: 52.3,
    minTemperature: 4.1,
    maxTemperature: 12.5,
    minPressure: 988.9,
    description: "Hurricane-force winds and heavy rain",
    impact: "120,000 passengers affected, 24h interrupted services"
  }
];

// Enhanced function to find similar historical event with ERA5-calibrated tolerances
export function findSimilarHistoricalEvent(
  currentWeather: WeatherConditions, 
  era5Context?: HistoricalContext
): HistoricalEvent | null {
  
  // Adaptive tolerances based on ERA5 context
  const getTolerances = () => {
    if (!era5Context) {
      // Default tolerances without ERA5 context
      return {
        precipitation: 15,
        wind: 20,
        temperature: 8
      };
    }
    
    // Adjust tolerances based on ERA5 anomalies
    const tempAnomaly = Math.abs(era5Context.anomaly.temperature);
    const precipAnomaly = Math.abs(era5Context.anomaly.precipitation);
    const windAnomaly = Math.abs(era5Context.anomaly.windSpeed);
    
    return {
      precipitation: Math.max(10, 15 - precipAnomaly * 2), // Lower tolerance if anomaly exists
      wind: Math.max(15, 20 - windAnomaly * 2),
      temperature: Math.max(5, 8 - tempAnomaly * 0.5)
    };
  };
  
  const tolerances = getTolerances();
  
  // Search for events with similar conditions using calibrated tolerances
  const similarEvents = historicalEvents.filter(event => {
    const precipitationMatch = Math.abs(event.maxPrecipitation - currentWeather.precipitation) < tolerances.precipitation;
    const windMatch = Math.abs(event.maxWindSpeed - currentWeather.windSpeed) < tolerances.wind;
    const tempInRange = currentWeather.temperature >= (event.minTemperature - tolerances.temperature) && 
                       currentWeather.temperature <= (event.maxTemperature + tolerances.temperature);
    
    // At least 2 of 3 conditions must match to consider similarity
    const matches = [precipitationMatch, windMatch, tempInRange].filter(Boolean).length;
    return matches >= 2;
  });

  if (similarEvents.length > 0) {
    // Return the most recent similar event
    return similarEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  return null;
}

// Enhanced function to generate recommendations based on historical patterns + ERA5 validation
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
  let historicalContext = 'No similar historical patterns identified';
  let recommendations: string[] = [];
  let era5Insights: string[] = [];
  let confidence = 50;
  let warningLevel: 'info' | 'watch' | 'advisory' | 'warning' = 'info';

  // Add ERA5 validation insights
  if (era5Validation && era5Context) {
    const anomalyLevel = era5Validation.anomalyLevel;
    
    switch (anomalyLevel) {
      case 'extreme':
        era5Insights.push(`🔴 EXTREME conditions detected by ERA5 - Unprecedented in last ${era5Validation.similarDaysFound} days`);
        era5Insights.push(`Temperature anomaly: ${era5Context.anomaly.temperature > 0 ? '+' : ''}${era5Context.anomaly.temperature.toFixed(1)}°C`);
        if (Math.abs(era5Context.anomaly.precipitation) > 5) {
          era5Insights.push(`Precipitation anomaly: ${era5Context.anomaly.precipitation > 0 ? '+' : ''}${era5Context.anomaly.precipitation.toFixed(1)}mm/h`);
        }
        confidence = Math.max(confidence, 90);
        break;
        
      case 'high':
        era5Insights.push(`🟠 HIGH anomalous conditions according to ERA5 - Unusual for the season`);
        era5Insights.push(`Significant deviation from recent historical average`);
        confidence = Math.max(confidence, 80);
        break;
        
      case 'moderate':
        era5Insights.push(`🟡 Moderately anomalous conditions - Above/below normal`);
        confidence = Math.max(confidence, 70);
        break;
        
      case 'normal':
        era5Insights.push(`🟢 Conditions within normal ranges according to ERA5`);
        era5Insights.push(`Typical weather pattern for this time of year`);
        confidence = Math.min(confidence + 10, 95);
        break;
    }
  }

  // Recommendation logic based on similar historical event
  if (similarEvent) {
    historicalContext = `Conditions similar to ${similarEvent.name} (${similarEvent.date}): ${similarEvent.description}`;
    confidence = Math.max(confidence, 85);
    
    // Adjust alert level based on current score + ERA5 validation
    let adjustedRiskScore = currentRiskScore;
    
    if (era5Validation) {
      // Increase risk if high anomalies present
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
        `⚠️ CRITICAL PATTERN: Conditions similar to ${similarEvent.name}`,
        `Historical impact: ${similarEvent.impact}`,
        'ACTIVATE preventive emergency protocols',
        'Continuous monitoring MANDATORY',
        'Prepare crisis communication to passengers',
        'Coordinate with emergency services'
      ];
      
      if (era5Validation?.anomalyLevel === 'extreme') {
        recommendations.unshift('🚨 MAXIMUM ALERT: Unprecedented recent conditions according to ERA5');
      }
      
    } else if (adjustedRiskScore >= 50) {
      warningLevel = 'advisory';
      recommendations = [
        `🔶 PATTERN DETECTED: Similarity to ${similarEvent.name}`,
        `Historical precedent: ${similarEvent.impact}`,
        'Maintain enhanced surveillance',
        'Review and prepare contingency protocols',
        'Operational staff on preventive alert',
        'Proactive communication recommended'
      ];
      
    } else if (adjustedRiskScore >= 30) {
      warningLevel = 'watch';
      recommendations = [
        `📋 Historical pattern: Reminiscent of ${similarEvent.name}`,
        'Standard monitoring appropriate',
        'Maintain normal surveillance protocols',
        'No immediate actions required'
      ];
      
    } else {
      warningLevel = 'info';
      recommendations = [
        `ℹ️ Historical reference: Conditions similar to ${similarEvent.name}`,
        'Conditions within normal operational parameters',
        'Routine monitoring sufficient'
      ];
    }
    
  } else {
    // No similar events - recommendations based on ERA5 and score
    const effectiveScore = era5Validation ? 
      Math.min(100, currentRiskScore + ({'extreme': 20, 'high': 15, 'moderate': 5, 'normal': 0}[era5Validation.anomalyLevel])) :
      currentRiskScore;
      
    if (effectiveScore >= 50) {
      warningLevel = 'watch';
      recommendations = [
        '🔍 Atypical conditions without clear historical precedents',
        'Maintain enhanced standard surveillance',
        'Consider consultation with specialized meteorology',
        'Monitor evolution every 15 minutes'
      ];
      
      if (era5Validation?.anomalyLevel === 'extreme') {
        recommendations.unshift('⚠️ ERA5 confirms: Extremely unusual conditions');
        warningLevel = 'advisory';
      }
      
    } else {
      recommendations = [
        'Normal conditions without identified risk patterns',
        'Standard procedures applicable',
        'Routine monitoring adequate'
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

// Function to get combined confidence (historical + ERA5)
export function getCombinedConfidence(
  historicalConfidence: number,
  era5Validation?: ERA5ValidationData
): number {
  if (!era5Validation) {
    return Math.max(30, historicalConfidence - 20); // Penalize without ERA5 validation
  }
  
  // Combine confidences with weights
  const era5Weight = 0.4;
  const historicalWeight = 0.6;
  
  const combinedConfidence = (historicalConfidence * historicalWeight) + (era5Validation.confidence * era5Weight);
  
  // Bonus if both sources agree (high confidence)
  const agreement = Math.abs(historicalConfidence - era5Validation.confidence) < 20;
  const bonus = agreement ? 5 : 0;
  
  return Math.min(95, Math.round(combinedConfidence + bonus));
}

// Helper function to convert ERA5 anomaly level to risk factor
export function era5AnomalyToRiskFactor(anomalyLevel: string): number {
  switch (anomalyLevel) {
    case 'extreme': return 1.2; // 20% more risk
    case 'high': return 1.15;   // 15% more risk
    case 'moderate': return 1.05; // 5% more risk
    case 'normal': return 1.0;   // No change
    default: return 1.0;
  }
}

// Function for temporal trend analysis (using ERA5 data if available)
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
    // Trend analysis based on ERA5 anomalies
    if (Math.abs(era5Context.anomaly.temperature) > 5) {
      const direction = era5Context.anomaly.temperature > 0 ? 'above' : 'below';
      trends.push(`Temperature ${Math.abs(era5Context.anomaly.temperature).toFixed(1)}°C ${direction} historical average`);
    }
    
    if (era5Context.anomaly.precipitation > 3) {
      trends.push(`Precipitation ${era5Context.anomaly.precipitation.toFixed(1)}mm/h above normal`);
      alerts.push('Anomalously high precipitation detected');
    }
    
    if (Math.abs(era5Context.anomaly.windSpeed) > 10) {
      const intensity = era5Context.anomaly.windSpeed > 0 ? 'higher' : 'lower';
      trends.push(`Wind ${intensity} intensity than historical average`);
    }
    
    if (Math.abs(era5Context.anomaly.pressure) > 15) {
      const direction = era5Context.anomaly.pressure > 0 ? 'high' : 'low';
      trends.push(`Atmospheric pressure ${direction} - possible weather change`);
      alerts.push('Significant pressure variation detected');
    }
  }
  
  return { trends, alerts };
}