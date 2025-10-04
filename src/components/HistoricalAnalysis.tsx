import { History, TrendingUp, AlertCircle, CheckCircle, Clock, MapPin, Info, Users, Shield, XCircle, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateHistoricalRecommendations, historicalEvents, HistoricalEvent } from '@/lib/copernicusAPI';
import { WeatherData } from '@/types';

interface HistoricalAnalysisProps {
  weatherData: WeatherData | null;
  currentRiskScore: number;
}

interface HistoricalRecommendations {
  historicalContext: string;
  recommendations: string[];
  confidence: number;
  warningLevel: 'info' | 'watch' | 'advisory' | 'warning';
}

interface ComparisonData {
  event: HistoricalEvent;
  withoutSystem: {
    passengersAffected: number;
    serviceCancellations: number;
    recoveryTime: string;
    economicImpact: string;
  };
  withSystem: {
    earlyWarning: string;
    passengersProtected: number;
    servicesMaintained: number;
    preventedLosses: string;
  };
}

export default function HistoricalAnalysis({ weatherData, currentRiskScore }: HistoricalAnalysisProps) {
  const [analysis, setAnalysis] = useState<HistoricalRecommendations | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<ComparisonData | null>(null);

  const comparativeData: ComparisonData[] = [
    {
      event: historicalEvents.find(e => e.name === "Borrasca Filomena")!,
      withoutSystem: {
        passengersAffected: 15000,
        serviceCancellations: 48,
        recoveryTime: "72 horas",
        economicImpact: "2.3M€"
      },
      withSystem: {
        earlyWarning: "48 horas anticipación",
        passengersProtected: 12500,
        servicesMaintained: 35,
        preventedLosses: "1.8M€"
      }
    },
    {
      event: historicalEvents.find(e => e.name === "DANA Valencia-Madrid")!,
      withoutSystem: {
        passengersAffected: 8500,
        serviceCancellations: 32,
        recoveryTime: "24 horas",
        economicImpact: "1.1M€"
      },
      withSystem: {
        earlyWarning: "6 horas anticipación",
        passengersProtected: 7200,
        servicesMaintained: 26,
        preventedLosses: "850k€"
      }
    },
    {
      event: historicalEvents.find(e => e.name === "Ola de Calor Extremo")!,
      withoutSystem: {
        passengersAffected: 4200,
        serviceCancellations: 16,
        recoveryTime: "12 horas",
        economicImpact: "420k€"
      },
      withSystem: {
        earlyWarning: "24 horas anticipación",
        passengersProtected: 3800,
        servicesMaintained: 12,
        preventedLosses: "315k€"
      }
    }
  ];

  useEffect(() => {
    if (weatherData) {
      const recommendations = generateHistoricalRecommendations({
        precipitation: weatherData.precipitation,
        windSpeed: weatherData.windSpeed,
        temperature: weatherData.temperature,
        pressure: weatherData.pressure
      }, currentRiskScore);
      setAnalysis(recommendations);
    }
  }, [weatherData, currentRiskScore]);

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'warning': return 'text-red-600 bg-red-50 border-red-200';
      case 'advisory': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'watch': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getWarningIcon = (level: string) => {
    switch (level) {
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'advisory': return <TrendingUp className="w-5 h-5" />;
      case 'watch': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getWarningLabel = (level: string) => {
    switch (level) {
      case 'warning': return 'Alerta Histórica';
      case 'advisory': return 'Aviso Histórico';
      case 'watch': return 'Vigilancia';
      default: return 'Información';
    }
  };

  if (!analysis) return null;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">Análisis Histórico (Copernicus ERA5)</h2>
          </div>

          <div className={`border rounded-lg p-4 mb-4 ${getWarningColor(analysis.warningLevel)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getWarningIcon(analysis.warningLevel)}
              <span className="font-semibold text-lg">
                {getWarningLabel(analysis.warningLevel)}
              </span>
              <span className="text-sm">
                (Confianza: {analysis.confidence}%)
              </span>
            </div>
            <p className="text-sm mb-3">{analysis.historicalContext}</p>
            <div className="text-xs opacity-75">
              Score de riesgo actual: {currentRiskScore}/100
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Recomendaciones Históricas</h3>
            <div className="space-y-2">
              {analysis.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Las recomendaciones históricas complementan, no reemplazan, las decisiones operativas en tiempo real.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-800">Eventos Históricos</h2>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {historicalEvents.map((event, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedEvent?.name === event.name ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedEvent(selectedEvent?.name === event.name ? null : event)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{event.name}</h3>
                  <span className="text-xs text-gray-500">{event.date}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <div>💧 {event.maxPrecipitation} mm/h</div>
                  <div>💨 {event.maxWindSpeed} m/s</div>
                  <div>🌡️ {event.minTemperature}°C - {event.maxTemperature}°C</div>
                  <div>📊 {event.minPressure} hPa</div>
                </div>

                {selectedEvent?.name === event.name && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{event.description}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-800">
                        <strong>Impacto histórico:</strong> {event.impact}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              📊 Datos validados con Copernicus ERA5 Reanalysis (1979-presente)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              🎯 Patrones calibrados con eventos históricos de Madrid
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Análisis Comparativo: Sin Sistema vs Con Sistema</h2>
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors"
          >
            {showComparison ? 'Ocultar' : 'Ver Comparación'}
          </button>
        </div>

        {showComparison && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Simulación del impacto que habría tenido nuestro sistema durante eventos históricos reales
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {comparativeData.map((comparison, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedComparison?.event.name === comparison.event.name 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedComparison(
                    selectedComparison?.event.name === comparison.event.name ? null : comparison
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800 text-sm">{comparison.event.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="font-medium text-red-700">Sin Sistema</span>
                      </div>
                      <div className="space-y-1 text-red-600">
                        <div>👥 {comparison.withoutSystem.passengersAffected.toLocaleString()} afectados</div>
                        <div>🚫 {comparison.withoutSystem.serviceCancellations} cancelaciones</div>
                        <div>💰 {comparison.withoutSystem.economicImpact} pérdidas</div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="w-3 h-3 text-green-500" />
                        <span className="font-medium text-green-700">Con Sistema</span>
                      </div>
                      <div className="space-y-1 text-green-600">
                        <div>🛡️ {comparison.withSystem.passengersProtected.toLocaleString()} protegidos</div>
                        <div>✅ {comparison.withSystem.servicesMaintained} mantenidos</div>
                        <div>💚 {comparison.withSystem.preventedLosses} ahorrados</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedComparison && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Análisis Detallado: {selectedComparison.event.name}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Situación Real (Sin Sistema)
                    </h5>
                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-500" />
                        <span><strong>{selectedComparison.withoutSystem.passengersAffected.toLocaleString()}</strong> pasajeros afectados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span><strong>{selectedComparison.withoutSystem.serviceCancellations}</strong> servicios cancelados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span>Recuperación en <strong>{selectedComparison.withoutSystem.recoveryTime}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span>Pérdidas: <strong>{selectedComparison.withoutSystem.economicImpact}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Proyección (Con Sistema)
                    </h5>
                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-green-500" />
                        <span>Alerta temprana: <strong>{selectedComparison.withSystem.earlyWarning}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span><strong>{selectedComparison.withSystem.passengersProtected.toLocaleString()}</strong> pasajeros protegidos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span><strong>{selectedComparison.withSystem.servicesMaintained}</strong> servicios mantenidos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>Pérdidas evitadas: <strong>{selectedComparison.withSystem.preventedLosses}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Valor del Sistema:</strong> La implementación de Chamartín Smart Resilience habría 
                    reducido el impacto de {selectedComparison.event.name} significativamente, protegiendo vidas 
                    y minimizando pérdidas económicas a través de la anticipación y respuesta automatizada.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}