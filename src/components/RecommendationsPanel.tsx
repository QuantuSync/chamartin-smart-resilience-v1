import { WeatherData, Platform } from '@/types';
import { AlertTriangle, Users, Shield, Umbrella, CheckCircle, Info, Clock, TrendingUp, MapPin, Zap } from 'lucide-react';

interface RecommendationsPanelProps {
  weatherData: WeatherData;
  platforms: Platform[];
  operationalContext?: {
    currentHour: number;
    isRushHour: boolean;
    isWeekend: boolean;
    estimatedPassengers: number;
  };
}

interface SmartRecommendation {
  id: string;
  type: 'immediate' | 'preventive' | 'informational';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actions: string[];
  platforms?: string[];
  timeframe: string;
  impact: {
    passengersAffected: number;
    estimatedDelay?: string;
    economicImpact?: string;
  };
  confidence: number;
  automaticActions?: string[];
  manualActions?: string[];
}

export default function RecommendationsPanel({ 
  weatherData, 
  platforms, 
  operationalContext 
}: RecommendationsPanelProps) {

  const generateIntelligentRecommendations = (): SmartRecommendation[] => {
    const recommendations: SmartRecommendation[] = [];
    const currentHour = operationalContext?.currentHour || new Date().getHours();
    const isRushHour = operationalContext?.isRushHour || false;
    const totalPassengers = operationalContext?.estimatedPassengers || 200;
    
    // Critical and high-risk platforms
    const criticalPlatforms = platforms.filter(p => p.riskScore >= 80);
    const highRiskPlatforms = platforms.filter(p => p.riskScore >= 60 && p.riskScore < 80);
    const exposedPlatforms = platforms.filter(p => !p.isRoofed);

    // CRITICAL RECOMMENDATIONS - Immediate action required
    if (weatherData.precipitation > 20) {
      recommendations.push({
        id: 'precipitation_extreme',
        type: 'immediate',
        severity: 'critical',
        title: 'Extreme Precipitation - Immediate Evacuation',
        description: `Torrential rain of ${weatherData.precipitation.toFixed(1)} mm/h exceeds safety thresholds`,
        actions: [
          'IMMEDIATE EVACUATION of uncovered platforms',
          'Suspend all services on exposed platforms',
          'Activate weather emergency protocol',
          'Coordinate with local emergency services'
        ],
        platforms: exposedPlatforms.map(p => p.name),
        timeframe: 'Immediate (0-5 minutes)',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.6),
          estimatedDelay: '2-4 hours',
          economicImpact: 'High'
        },
        confidence: 95,
        automaticActions: [
          'Automatic closure of exposed platform access',
          'Emergency drainage system activation',
          'Automatic alert to traffic control'
        ],
        manualActions: [
          'Staff-directed evacuation',
          'Emergency communication to passengers',
          'Coordination with firefighters and civil protection'
        ]
      });
    }

    if (weatherData.windSpeed > 25) {
      recommendations.push({
        id: 'wind_extreme',
        type: 'immediate',
        severity: 'critical',
        title: 'Extreme Winds - Service Suspension',
        description: `Wind of ${weatherData.windSpeed.toFixed(1)} m/s presents immediate safety risk`,
        actions: [
          'IMMEDIATE SUSPENSION of services on exposed platforms',
          'Mandatory shelter for passengers',
          'Secure mobile elements and signage',
          'Real-time damage assessment'
        ],
        platforms: exposedPlatforms.map(p => p.name),
        timeframe: 'Immediate (0-2 minutes)',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.8),
          estimatedDelay: '1-3 hours',
          economicImpact: 'Very High'
        },
        confidence: 90,
        automaticActions: [
          'Automatic platform door lock',
          'PA systems on maximum alert'
        ],
        manualActions: [
          'Visual infrastructure inspection',
          'Removal of loose objects'
        ]
      });
    }

    // HIGH RISK RECOMMENDATIONS - Action in 15-30 minutes
    if (weatherData.precipitation > 8 && weatherData.precipitation <= 20) {
      const affectedPassengers = Math.round(totalPassengers * 0.4);
      recommendations.push({
        id: 'precipitation_high',
        type: 'immediate',
        severity: 'high',
        title: 'Heavy Rain - Urgent Preventive Measures',
        description: `Precipitation of ${weatherData.precipitation.toFixed(1)} mm/h requires preventive action`,
        actions: [
          'Limit access to uncovered platforms',
          'Deploy additional staff for assistance',
          'Activate preventive drainage systems',
          'Prepare post-rain cleaning teams'
        ],
        platforms: exposedPlatforms.slice(0, 2).map(p => p.name),
        timeframe: '15-30 minutes',
        impact: {
          passengersAffected: affectedPassengers,
          estimatedDelay: '30-60 minutes',
          economicImpact: 'Medium'
        },
        confidence: 85,
        automaticActions: [
          'Increased announcement frequency',
          'Emergency lights activation'
        ],
        manualActions: [
          'Temporary signage placement',
          'Emergency umbrella distribution'
        ]
      });
    }

    if (weatherData.windSpeed > 15 && weatherData.windSpeed <= 25) {
      recommendations.push({
        id: 'wind_high',
        type: 'immediate',
        severity: 'high',
        title: 'Strong Wind - Enhanced Surveillance',
        description: `Sustained wind of ${weatherData.windSpeed.toFixed(1)} m/s requires active supervision`,
        actions: [
          'Increase surveillance on exposed platforms',
          'Secure information panels and signage',
          'Security personnel at strategic positions',
          'Continuous condition monitoring'
        ],
        platforms: highRiskPlatforms.map(p => p.name),
        timeframe: '10-20 minutes',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.3),
          estimatedDelay: '15-30 minutes',
          economicImpact: 'Low-Medium'
        },
        confidence: 80,
        automaticActions: [
          'Wind sensors on alert',
          'Cameras focused on mobile elements'
        ],
        manualActions: [
          'Inspection every 15 minutes',
          'Preventive communication to passengers'
        ]
      });
    }

    // Extreme temperatures
    if (weatherData.temperature > 38) {
      recommendations.push({
        id: 'heat_extreme',
        type: 'preventive',
        severity: 'high',
        title: 'Extreme Heat - Protection Measures',
        description: `Temperature of ${weatherData.temperature.toFixed(1)}°C may cause discomfort and thermal expansion`,
        actions: [
          'Enable all air-conditioned areas',
          'Distribute water on exposed platforms',
          'Verify thermal expansion on tracks',
          'Reduce train speed if necessary'
        ],
        platforms: exposedPlatforms.map(p => p.name),
        timeframe: '30-45 minutes',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.5),
          estimatedDelay: '10-20 minutes',
          economicImpact: 'Medium'
        },
        confidence: 75,
        automaticActions: [
          'Misting systems activated',
          'Air conditioning at maximum'
        ],
        manualActions: [
          'Free water distribution',
          'Medical personnel on alert'
        ]
      });
    }

    if (weatherData.temperature < -2) {
      recommendations.push({
        id: 'frost_risk',
        type: 'preventive',
        severity: 'high',
        title: 'Ice Formation Risk',
        description: `Temperature of ${weatherData.temperature.toFixed(1)}°C may generate slippery surfaces`,
        actions: [
          'Activate anti-ice systems on platforms',
          'Spread de-icing salt in critical areas',
          'Warning signage for slippery surfaces',
          'Staff with anti-slip equipment'
        ],
        platforms: platforms.map(p => p.name),
        timeframe: '20-40 minutes',
        impact: {
          passengersAffected: totalPassengers,
          estimatedDelay: '5-15 minutes',
          economicImpact: 'Low'
        },
        confidence: 80,
        automaticActions: [
          'Platform heating activated',
          'Anti-ice systems in operation'
        ],
        manualActions: [
          'Manual salt application',
          'Anti-slip mat placement'
        ]
      });
    }

    // PREVENTIVE RECOMMENDATIONS - Information and preparation
    if (weatherData.pressure < 1005 && weatherData.pressure > 995) {
      recommendations.push({
        id: 'pressure_low',
        type: 'preventive',
        severity: 'medium',
        title: 'Low Pressure - Possible Weather Deterioration',
        description: `Pressure of ${weatherData.pressure.toFixed(0)} hPa indicates possible worsening`,
        actions: [
          'Check extended weather forecast',
          'Prepare emergency equipment',
          'Inform staff about possible escalation',
          'Review contingency protocols'
        ],
        timeframe: '1-2 hours',
        impact: {
          passengersAffected: 0,
          estimatedDelay: 'Preventive',
          economicImpact: 'Minimal'
        },
        confidence: 65,
        automaticActions: [
          'Automatic monitoring every 10 min'
        ],
        manualActions: [
          'Manual equipment review',
          'Contact with weather services'
        ]
      });
    }

    // Time-specific recommendations
    if (isRushHour && (weatherData.precipitation > 2 || weatherData.windSpeed > 10)) {
      recommendations.push({
        id: 'rush_hour_weather',
        type: 'immediate',
        severity: 'high',
        title: 'Adverse Conditions During Rush Hour',
        description: 'Combination of bad weather and high traffic requires special management',
        actions: [
          'Reinforce staff on main platforms',
          'Intensive communication about delays',
          'Enable alternative routes',
          'Active crowd management'
        ],
        timeframe: 'Immediate',
        impact: {
          passengersAffected: Math.round(totalPassengers * 1.5), // Rush hour
          estimatedDelay: '20-40 minutes',
          economicImpact: 'High'
        },
        confidence: 90,
        automaticActions: [
          'Announcements every 2 minutes',
          'Dynamic signage updated'
        ],
        manualActions: [
          'Additional staff deployed',
          'Coordination with alternative transport'
        ]
      });
    }

    // Nighttime with adverse conditions
    if ((currentHour >= 22 || currentHour <= 6) && (weatherData.precipitation > 5 || weatherData.windSpeed > 15)) {
      recommendations.push({
        id: 'night_weather',
        type: 'preventive',
        severity: 'medium',
        title: 'Adverse Night Conditions',
        description: 'Bad weather during nighttime with reduced staff',
        actions: [
          'Increase lighting on platforms',
          'Security personnel on continuous patrol',
          'Enhanced PA communication',
          'Prepare assistance for vulnerable passengers'
        ],
        timeframe: 'Continuous',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.3), // Fewer nighttime passengers
          estimatedDelay: '10-20 minutes',
          economicImpact: 'Low'
        },
        confidence: 70,
        automaticActions: [
          'Night lighting at 100%',
          'Surveillance systems active'
        ],
        manualActions: [
          'Security rounds every 30 min',
          'Personalized assistance'
        ]
      });
    }

    return recommendations
      .sort((a, b) => {
        // Sort by severity first, then by type
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const typeOrder = { immediate: 3, preventive: 2, informational: 1 };
        
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return typeOrder[b.type] - typeOrder[a.type];
      })
      .slice(0, 5); // Maximum 5 recommendations to avoid overload
  };

  const recommendations = generateIntelligentRecommendations();

  const getRecommendationStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-300 shadow-md';
      case 'high':
        return 'bg-orange-50 border-orange-300';
      case 'medium':
        return 'bg-yellow-50 border-yellow-300';
      case 'low':
        return 'bg-blue-50 border-blue-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const getRecommendationIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />;
    
    switch (type) {
      case 'immediate':
        return <Zap className="w-5 h-5 text-orange-600" />;
      case 'preventive':
        return <Shield className="w-5 h-5 text-yellow-600" />;
      case 'informational':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Info';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Intelligent Recommendations System
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Normal operating conditions</p>
          <p className="text-green-600 text-sm">
            Continue with standard operation. System monitoring continuously.
          </p>
          {operationalContext && (
            <div className="mt-3 text-xs text-green-700">
              {operationalContext.estimatedPassengers} estimated passengers • 
              {operationalContext.isRushHour ? ' Rush hour' : ' Normal hours'} • 
              Confidence: 95%
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Intelligent Operational Recommendations
        </h2>
        <div className="text-sm text-gray-500 text-right">
          <div>{recommendations.length} active recommendation{recommendations.length !== 1 ? 's' : ''}</div>
          {operationalContext && (
            <div className="text-xs mt-1">
              {operationalContext.estimatedPassengers} passengers • {operationalContext.isRushHour ? 'Rush hour' : 'Normal'}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className={`rounded-lg border-2 p-4 ${getRecommendationStyle(recommendation.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getRecommendationIcon(recommendation.type, recommendation.severity)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/70 font-medium">
                      {getSeverityLabel(recommendation.severity)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-black/10">
                      {recommendation.confidence}% confidence
                    </span>
                  </div>
                </div>
                
                <p className="text-sm mb-3 text-gray-700">{recommendation.description}</p>
                
                {/* Impact information */}
                <div className="bg-white/60 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{recommendation.impact.passengersAffected} affected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{recommendation.timeframe}</span>
                  </div>
                  {recommendation.impact.estimatedDelay && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{recommendation.impact.estimatedDelay}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>{recommendation.impact.economicImpact} Impact</span>
                  </div>
                </div>

                {/* Automatic actions */}
                {recommendation.automaticActions && recommendation.automaticActions.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-sm mb-1 text-green-800">Automatic Actions:</h4>
                    <ul className="text-xs space-y-1">
                      {recommendation.automaticActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-1 text-green-700">
                          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Manual actions */}
                <div className="mb-3">
                  <h4 className="font-medium text-sm mb-1 text-gray-800">Required Actions:</h4>
                  <ul className="text-sm space-y-1">
                    {recommendation.actions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-600 font-mono text-xs mt-1">{index + 1}.</span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Affected platforms */}
                {recommendation.platforms && recommendation.platforms.length > 0 && (
                  <div className="flex items-center gap-2 text-sm border-t pt-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Affected platforms:</span>
                    <span className="text-gray-600">{recommendation.platforms.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistical summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-red-800 font-bold text-lg">
              {recommendations.filter(r => r.severity === 'critical').length}
            </p>
            <p className="text-red-600 text-sm">Critical</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-orange-800 font-bold text-lg">
              {recommendations.filter(r => r.severity === 'high').length}
            </p>
            <p className="text-orange-600 text-sm">High Risk</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-yellow-800 font-bold text-lg">
              {recommendations.filter(r => r.type === 'immediate').length}
            </p>
            <p className="text-yellow-600 text-sm">Immediate</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-800 font-bold text-lg">
              {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
            </p>
            <p className="text-blue-600 text-sm">Avg. Confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
}