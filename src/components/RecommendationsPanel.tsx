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
    
    // Plataformas críticas y de alto riesgo
    const criticalPlatforms = platforms.filter(p => p.riskScore >= 80);
    const highRiskPlatforms = platforms.filter(p => p.riskScore >= 60 && p.riskScore < 80);
    const exposedPlatforms = platforms.filter(p => !p.isRoofed);

    // RECOMENDACIONES CRÍTICAS - Acción inmediata requerida
    if (weatherData.precipitation > 20) {
      recommendations.push({
        id: 'precipitation_extreme',
        type: 'immediate',
        severity: 'critical',
        title: 'Precipitación Extrema - Evacuación Inmediata',
        description: `Lluvia torrencial de ${weatherData.precipitation.toFixed(1)} mm/h supera umbrales de seguridad`,
        actions: [
          'EVACUACIÓN INMEDIATA de andenes descubiertos',
          'Suspender todos los servicios en plataformas expuestas',
          'Activar protocolo de emergencia meteorológica',
          'Coordinar con servicios de emergencia locales'
        ],
        platforms: exposedPlatforms.map(p => p.name),
        timeframe: 'Inmediato (0-5 minutos)',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.6),
          estimatedDelay: '2-4 horas',
          economicImpact: 'Alto'
        },
        confidence: 95,
        automaticActions: [
          'Cierre automático de accesos a andenes expuestos',
          'Activación de sistemas de drenaje de emergencia',
          'Alerta automática a control de tráfico'
        ],
        manualActions: [
          'Evacuación dirigida por personal',
          'Comunicación de emergencia a pasajeros',
          'Coordinación con bomberos y protección civil'
        ]
      });
    }

    if (weatherData.windSpeed > 25) {
      recommendations.push({
        id: 'wind_extreme',
        type: 'immediate',
        severity: 'critical',
        title: 'Vientos Extremos - Suspensión de Servicios',
        description: `Viento de ${weatherData.windSpeed.toFixed(1)} m/s presenta riesgo de seguridad inmediato`,
        actions: [
          'SUSPENSIÓN INMEDIATA de servicios en andenes expuestos',
          'Refugio obligatorio para pasajeros',
          'Asegurar elementos móviles y señalización',
          'Evaluación de daños en tiempo real'
        ],
        platforms: exposedPlatforms.map(p => p.name),
        timeframe: 'Inmediato (0-2 minutos)',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.8),
          estimatedDelay: '1-3 horas',
          economicImpact: 'Muy Alto'
        },
        confidence: 90,
        automaticActions: [
          'Bloqueo automático de puertas de andén',
          'Sistemas de megafonía en alerta máxima'
        ],
        manualActions: [
          'Inspección visual de infraestructura',
          'Remoción de objetos sueltos'
        ]
      });
    }

    // RECOMENDACIONES DE ALTO RIESGO - Acción en 15-30 minutos
    if (weatherData.precipitation > 8 && weatherData.precipitation <= 20) {
      const affectedPassengers = Math.round(totalPassengers * 0.4);
      recommendations.push({
        id: 'precipitation_high',
        type: 'immediate',
        severity: 'high',
        title: 'Lluvia Intensa - Medidas Preventivas Urgentes',
        description: `Precipitación de ${weatherData.precipitation.toFixed(1)} mm/h requiere acción preventiva`,
        actions: [
          'Limitar acceso a andenes descubiertos',
          'Desplegar personal adicional para asistencia',
          'Activar sistemas de drenaje preventivo',
          'Preparar equipos de limpieza post-lluvia'
        ],
        platforms: exposedPlatforms.slice(0, 2).map(p => p.name),
        timeframe: '15-30 minutos',
        impact: {
          passengersAffected: affectedPassengers,
          estimatedDelay: '30-60 minutos',
          economicImpact: 'Medio'
        },
        confidence: 85,
        automaticActions: [
          'Incremento frecuencia de anuncios',
          'Activación luces de emergencia'
        ],
        manualActions: [
          'Colocación señalización temporal',
          'Distribución de paraguas emergencia'
        ]
      });
    }

    if (weatherData.windSpeed > 15 && weatherData.windSpeed <= 25) {
      recommendations.push({
        id: 'wind_high',
        type: 'immediate',
        severity: 'high',
        title: 'Viento Fuerte - Vigilancia Reforzada',
        description: `Viento sostenido de ${weatherData.windSpeed.toFixed(1)} m/s requiere supervisión activa`,
        actions: [
          'Aumentar vigilancia en andenes expuestos',
          'Asegurar paneles informativos y señalización',
          'Personal de seguridad en posiciones estratégicas',
          'Monitorización continua de condiciones'
        ],
        platforms: highRiskPlatforms.map(p => p.name),
        timeframe: '10-20 minutos',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.3),
          estimatedDelay: '15-30 minutos',
          economicImpact: 'Bajo-Medio'
        },
        confidence: 80,
        automaticActions: [
          'Sensores de viento en alerta',
          'Cámaras enfocadas en elementos móviles'
        ],
        manualActions: [
          'Inspección cada 15 minutos',
          'Comunicación preventiva a pasajeros'
        ]
      });
    }

    // Temperaturas extremas
    if (weatherData.temperature > 38) {
      recommendations.push({
        id: 'heat_extreme',
        type: 'preventive',
        severity: 'high',
        title: 'Calor Extremo - Medidas de Protección',
        description: `Temperatura de ${weatherData.temperature.toFixed(1)}°C puede causar malestar y dilatación térmica`,
        actions: [
          'Habilitar todas las áreas climatizadas',
          'Distribuir agua en andenes expuestos',
          'Verificar expansión térmica en vías',
          'Reducir velocidad de trenes si es necesario'
        ],
        platforms: exposedPlatforms.map(p => p.name),
        timeframe: '30-45 minutos',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.5),
          estimatedDelay: '10-20 minutos',
          economicImpact: 'Medio'
        },
        confidence: 75,
        automaticActions: [
          'Sistemas de nebulización activados',
          'Climatización al máximo'
        ],
        manualActions: [
          'Distribución de agua gratuita',
          'Personal médico en alerta'
        ]
      });
    }

    if (weatherData.temperature < -2) {
      recommendations.push({
        id: 'frost_risk',
        type: 'preventive',
        severity: 'high',
        title: 'Riesgo de Formación de Hielo',
        description: `Temperatura de ${weatherData.temperature.toFixed(1)}°C puede generar superficies resbaladizas`,
        actions: [
          'Activar sistemas antihielo en andenes',
          'Esparcir sal de deshielo en zonas críticas',
          'Señalización de advertencia de superficies resbaladizas',
          'Personal con equipos antideslizantes'
        ],
        platforms: platforms.map(p => p.name),
        timeframe: '20-40 minutos',
        impact: {
          passengersAffected: totalPassengers,
          estimatedDelay: '5-15 minutos',
          economicImpact: 'Bajo'
        },
        confidence: 80,
        automaticActions: [
          'Calefacción de andenes activada',
          'Sistemas antihielo en funcionamiento'
        ],
        manualActions: [
          'Aplicación manual de sal',
          'Colocación alfombras antideslizantes'
        ]
      });
    }

    // RECOMENDACIONES PREVENTIVAS - Información y preparación
    if (weatherData.pressure < 1005 && weatherData.pressure > 995) {
      recommendations.push({
        id: 'pressure_low',
        type: 'preventive',
        severity: 'medium',
        title: 'Presión Baja - Posible Deterioro Meteorológico',
        description: `Presión de ${weatherData.pressure.toFixed(0)} hPa indica posible empeoramiento`,
        actions: [
          'Consultar pronóstico meteorológico extendido',
          'Preparar equipos de emergencia',
          'Informar a personal sobre posible escalada',
          'Revisar protocolos de contingencia'
        ],
        timeframe: '1-2 horas',
        impact: {
          passengersAffected: 0,
          estimatedDelay: 'Preventivo',
          economicImpact: 'Mínimo'
        },
        confidence: 65,
        automaticActions: [
          'Monitorización automática cada 10 min'
        ],
        manualActions: [
          'Revisión manual de equipos',
          'Contacto con servicios meteorológicos'
        ]
      });
    }

    // Recomendaciones específicas por contexto horario
    if (isRushHour && (weatherData.precipitation > 2 || weatherData.windSpeed > 10)) {
      recommendations.push({
        id: 'rush_hour_weather',
        type: 'immediate',
        severity: 'high',
        title: 'Condiciones Adversas en Hora Punta',
        description: 'Combinación de mal tiempo y alta afluencia requiere gestión especial',
        actions: [
          'Reforzar personal en andenes principales',
          'Comunicación intensiva sobre retrasos',
          'Habilitar rutas alternativas',
          'Gestión activa de multitudes'
        ],
        timeframe: 'Inmediato',
        impact: {
          passengersAffected: Math.round(totalPassengers * 1.5), // Hora punta
          estimatedDelay: '20-40 minutos',
          economicImpact: 'Alto'
        },
        confidence: 90,
        automaticActions: [
          'Anuncios cada 2 minutos',
          'Señalización dinámica actualizada'
        ],
        manualActions: [
          'Personal adicional desplegado',
          'Coordinación con transporte alternativo'
        ]
      });
    }

    // Horario nocturno con condiciones adversas
    if ((currentHour >= 22 || currentHour <= 6) && (weatherData.precipitation > 5 || weatherData.windSpeed > 15)) {
      recommendations.push({
        id: 'night_weather',
        type: 'preventive',
        severity: 'medium',
        title: 'Condiciones Nocturnas Adversas',
        description: 'Mal tiempo en horario nocturno con personal reducido',
        actions: [
          'Incrementar iluminación en andenes',
          'Personal de seguridad en ronda continua',
          'Comunicación reforzada por megafonía',
          'Preparar asistencia para pasajeros vulnerables'
        ],
        timeframe: 'Continuo',
        impact: {
          passengersAffected: Math.round(totalPassengers * 0.3), // Menos pasajeros nocturnos
          estimatedDelay: '10-20 minutos',
          economicImpact: 'Bajo'
        },
        confidence: 70,
        automaticActions: [
          'Iluminación nocturna al 100%',
          'Sistemas de vigilancia activos'
        ],
        manualActions: [
          'Rondas de seguridad cada 30 min',
          'Asistencia personalizada'
        ]
      });
    }

    return recommendations
      .sort((a, b) => {
        // Ordenar por severidad primero, luego por tipo
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const typeOrder = { immediate: 3, preventive: 2, informational: 1 };
        
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return typeOrder[b.type] - typeOrder[a.type];
      })
      .slice(0, 5); // Máximo 5 recomendaciones para evitar sobrecarga
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
      case 'critical': return 'CRÍTICO';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      default: return 'Info';
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Sistema de Recomendaciones Inteligente
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Condiciones operativas normales</p>
          <p className="text-green-600 text-sm">
            Continuar con operación estándar. Sistema monitorizando continuamente.
          </p>
          {operationalContext && (
            <div className="mt-3 text-xs text-green-700">
              {operationalContext.estimatedPassengers} pasajeros estimados • 
              {operationalContext.isRushHour ? ' Hora punta' : ' Horario normal'} • 
              Confianza: 95%
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
          Recomendaciones Operativas Inteligentes
        </h2>
        <div className="text-sm text-gray-500 text-right">
          <div>{recommendations.length} recomendación{recommendations.length !== 1 ? 'es' : ''} activa{recommendations.length !== 1 ? 's' : ''}</div>
          {operationalContext && (
            <div className="text-xs mt-1">
              {operationalContext.estimatedPassengers} pasajeros • {operationalContext.isRushHour ? 'Hora punta' : 'Normal'}
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
                      {recommendation.confidence}% confianza
                    </span>
                  </div>
                </div>
                
                <p className="text-sm mb-3 text-gray-700">{recommendation.description}</p>
                
                {/* Información de impacto */}
                <div className="bg-white/60 rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{recommendation.impact.passengersAffected} afectados</span>
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
                    <span>Impacto {recommendation.impact.economicImpact}</span>
                  </div>
                </div>

                {/* Acciones automáticas */}
                {recommendation.automaticActions && recommendation.automaticActions.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium text-sm mb-1 text-green-800">Acciones Automáticas:</h4>
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

                {/* Acciones manuales */}
                <div className="mb-3">
                  <h4 className="font-medium text-sm mb-1 text-gray-800">Acciones Requeridas:</h4>
                  <ul className="text-sm space-y-1">
                    {recommendation.actions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-600 font-mono text-xs mt-1">{index + 1}.</span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plataformas afectadas */}
                {recommendation.platforms && recommendation.platforms.length > 0 && (
                  <div className="flex items-center gap-2 text-sm border-t pt-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Andenes afectados:</span>
                    <span className="text-gray-600">{recommendation.platforms.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen estadístico */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-red-800 font-bold text-lg">
              {recommendations.filter(r => r.severity === 'critical').length}
            </p>
            <p className="text-red-600 text-sm">Críticas</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-orange-800 font-bold text-lg">
              {recommendations.filter(r => r.severity === 'high').length}
            </p>
            <p className="text-orange-600 text-sm">Alto Riesgo</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-yellow-800 font-bold text-lg">
              {recommendations.filter(r => r.type === 'immediate').length}
            </p>
            <p className="text-yellow-600 text-sm">Inmediatas</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-blue-800 font-bold text-lg">
              {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)}%
            </p>
            <p className="text-blue-600 text-sm">Confianza Media</p>
          </div>
        </div>
      </div>
    </div>
  );
}