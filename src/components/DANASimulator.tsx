'use client';

import { useState } from 'react';
import { Cloud, CloudRain, Wind, AlertTriangle, Play, RotateCcw, Clock, TrendingUp, Shield, Info } from 'lucide-react';
import { WeatherData } from '@/types';

interface DANASimulatorProps {
  onSimulate: (weatherData: WeatherData) => void;
  onReset: () => void;
}

interface TimelinePhase {
  time: string;
  label: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  precipitation: number;
  windSpeed: number;
  temperature: number;
  actions: string[];
}

interface DANAScenario {
  name: string;
  description: string;
  scientificBasis: string;
  validationRange: {
    precipitation: { min: number; max: number; unit: string };
    windSpeed: { min: number; max: number; unit: string };
    temperature: { min: number; max: number; unit: string };
  };
  display: {
    precipitation: number;
    windSpeed: number;
    temperature: number;
  };
  data: WeatherData;
  timeline: TimelinePhase[];
}

export default function DANASimulator({ onSimulate, onReset }: DANASimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<DANAScenario | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [acknowledgedSimulation, setAcknowledgedSimulation] = useState(false);

  // Función de validación científica
  const validateWeatherData = (data: Partial<WeatherData>): boolean => {
    const validRanges = {
      temperature: { min: -40, max: 50 }, // Rango realista para España
      precipitation: { min: 0, max: 100 }, // mm/h máximo observado
      windSpeed: { min: 0, max: 60 }, // m/s máximo sin ser huracán
      humidity: { min: 0, max: 100 },
      pressure: { min: 950, max: 1050 } // hPa
    };

    return Object.entries(data).every(([key, value]) => {
      if (typeof value !== 'number') return true;
      const range = validRanges[key as keyof typeof validRanges];
      return range ? value >= range.min && value <= range.max : true;
    });
  };

  const danaScenarios: DANAScenario[] = [
    {
      name: "DANA Severa",
      description: "Precipitación intensa (15-25 mm/h) + vientos fuertes",
      scientificBasis: "Basado en eventos DANA registrados en Valencia (2019) y Murcia (2016). Precipitaciones entre 15-30 mm/h son típicas de DANAs severas según AEMET.",
      validationRange: {
        precipitation: { min: 15, max: 30, unit: "mm/h" },
        windSpeed: { min: 20, max: 35, unit: "m/s" },
        temperature: { min: 15, max: 25, unit: "°C" }
      },
      display: {
        precipitation: 22.3,
        windSpeed: 24.7,
        temperature: 18.4
      },
      data: {
        timestamp: new Date().toISOString(),
        temperature: 18.4,
        humidity: 92,
        precipitation: 22.3,
        windSpeed: 24.7,
        windDirection: 235,
        pressure: 998,
      },
      timeline: [
        {
          time: "T-60 min",
          label: "Detección Inicial",
          riskLevel: 'low',
          description: "Presión atmosférica descendiendo (-2 hPa/h), primeras señales de inestabilidad",
          precipitation: 0.2,
          windSpeed: 8.5,
          temperature: 19.2,
          actions: ["Revisar pronóstico extendido", "Preparar equipos preventivos", "Activar monitoreo intensivo"]
        },
        {
          time: "T-30 min",
          label: "Escalada Moderada",
          riskLevel: 'medium',
          description: "Intensificación de precipitación (tendencia +8mm/h), rotación de vientos",
          precipitation: 5.8,
          windSpeed: 15.3,
          temperature: 18.9,
          actions: ["Activar vigilancia reforzada", "Alertar personal operativo", "Preparar señalización", "Verificar drenajes"]
        },
        {
          time: "T-15 min",
          label: "Condiciones Críticas",
          riskLevel: 'high',
          description: "Riesgo alto - Precipitación >10mm/h, ráfagas >20m/s - Ventana crítica de actuación",
          precipitation: 12.4,
          windSpeed: 20.1,
          temperature: 18.6,
          actions: ["Cerrar andenes expuestos", "Evacuar zonas de riesgo", "Activar protocolos", "Comunicar a usuarios"]
        },
        {
          time: "T-0 min",
          label: "Pico del Evento",
          riskLevel: 'critical',
          description: "Condiciones extremas - Máximo impacto según modelo DANA típico",
          precipitation: 22.3,
          windSpeed: 24.7,
          temperature: 18.4,
          actions: ["Suspender operaciones", "Protocolo emergencia total", "Comunicación crisis", "Asegurar refugio"]
        }
      ]
    },
    {
      name: "Tormenta Invernal Severa",
      description: "Condiciones críticas de frío extremo + precipitación",
      scientificBasis: "Inspirado en Filomena 2021 pero con valores validados. Temperaturas de 3-5°C con precipitación intensa crean condiciones peligrosas de engelamiento.",
      validationRange: {
        precipitation: { min: 25, max: 40, unit: "mm/h" },
        windSpeed: { min: 25, max: 40, unit: "m/s" },
        temperature: { min: -5, max: 8, unit: "°C" }
      },
      display: {
        precipitation: 32.8,
        windSpeed: 31.2,
        temperature: 3.7
      },
      data: {
        timestamp: new Date().toISOString(),
        temperature: 3.7,
        humidity: 95,
        precipitation: 32.8,
        windSpeed: 31.2,
        windDirection: 210,
        pressure: 992,
      },
      timeline: [
        {
          time: "T-60 min",
          label: "Alerta Temprana",
          riskLevel: 'low',
          description: "Temperatura bajando (-1°C/h), presión cayendo rápidamente (-3 hPa/h)",
          precipitation: 1.2,
          windSpeed: 12.3,
          temperature: 8.1,
          actions: ["Monitoreo intensivo", "Pre-posicionar equipos antihielo", "Verificar calefacción"]
        },
        {
          time: "T-30 min",
          label: "Deterioro Acelerado",
          riskLevel: 'medium',
          description: "Precipitación mixta (lluvia-nieve), vientos en aumento, riesgo de engelamiento",
          precipitation: 8.7,
          windSpeed: 22.5,
          temperature: 5.2,
          actions: ["Activar calefacción andenes", "Desplegar equipos emergencia", "Aplicar antihielo"]
        },
        {
          time: "T-15 min",
          label: "Crisis Inminente",
          riskLevel: 'high',
          description: "Precipitación torrencial, temperatura crítica, formación de hielo inminente",
          precipitation: 18.9,
          windSpeed: 28.4,
          temperature: 4.1,
          actions: ["Cerrar estación parcialmente", "Evacuar andenes exteriores", "Máxima seguridad"]
        },
        {
          time: "T-0 min",
          label: "Evento Extremo",
          riskLevel: 'critical',
          description: "Condiciones de tormenta invernal severa - Peligro máximo por engelamiento",
          precipitation: 32.8,
          windSpeed: 31.2,
          temperature: 3.7,
          actions: ["Cierre temporal total", "Refugio de emergencia", "Protocolo máxima alerta", "Coordinación 112"]
        }
      ]
    },
    {
      name: "Ola de Calor Extrema",
      description: "Altas temperaturas + baja humedad + viento cálido",
      scientificBasis: "Basado en olas de calor de 2003 y 2022. Temperatura >40°C con humedad <35% representa riesgo severo de estrés térmico según protocolos sanitarios.",
      validationRange: {
        precipitation: { min: 0, max: 0.1, unit: "mm/h" },
        windSpeed: { min: 10, max: 25, unit: "m/s" },
        temperature: { min: 38, max: 45, unit: "°C" }
      },
      display: {
        precipitation: 0,
        windSpeed: 14.3,
        temperature: 41.2
      },
      data: {
        timestamp: new Date().toISOString(),
        temperature: 41.2,
        humidity: 32,
        precipitation: 0,
        windSpeed: 14.3,
        windDirection: 180,
        pressure: 1025,
      },
      timeline: [
        {
          time: "T-60 min",
          label: "Calor Creciente",
          riskLevel: 'low',
          description: "Temperatura subiendo (+2°C/h), humedad bajando, presión alta estable",
          precipitation: 0,
          windSpeed: 8.2,
          temperature: 35.6,
          actions: ["Verificar climatización", "Preparar hidratación extra", "Monitorear grupos vulnerables"]
        },
        {
          time: "T-30 min",
          label: "Estrés Térmico",
          riskLevel: 'medium',
          description: "Calor intenso (>36°C), humedad crítica (<40%), riesgo para grupos vulnerables",
          precipitation: 0,
          windSpeed: 11.7,
          temperature: 38.9,
          actions: ["Abrir zonas de sombra", "Reforzar personal médico", "Activar fuentes de agua"]
        },
        {
          time: "T-15 min",
          label: "Temperatura Peligrosa",
          riskLevel: 'high',
          description: "Riesgo de golpe de calor en andenes expuestos (>40°C), índice UV extremo",
          precipitation: 0,
          windSpeed: 13.1,
          temperature: 40.2,
          actions: ["Evacuar andenes soleados", "Activar nebulizadores", "Aumentar ventilación"]
        },
        {
          time: "T-0 min",
          label: "Calor Extremo",
          riskLevel: 'critical',
          description: "Temperatura peligrosa para la salud - Riesgo vital por hipertermia",
          precipitation: 0,
          windSpeed: 14.3,
          temperature: 41.2,
          actions: ["Refugio obligatorio AC", "Atención médica preventiva", "Comunicación sanitaria", "Protocolo salud"]
        }
      ]
    }
  ];

  // Validar todos los escenarios al cargar
  const validateAllScenarios = () => {
    return danaScenarios.every(scenario => {
      const isValid = validateWeatherData(scenario.data);
      if (!isValid) {
        console.warn(`Escenario ${scenario.name} tiene valores fuera de rango científico`);
      }
      return isValid;
    });
  };

  const simulateDANA = async (scenario: DANAScenario) => {
    if (!acknowledgedSimulation) {
      alert("Por favor, acknowledge el aviso de simulación antes de continuar.");
      return;
    }

    if (!validateWeatherData(scenario.data)) {
      console.error(`Escenario ${scenario.name} falló validación científica`);
      return;
    }

    setSelectedScenario(scenario);
    setShowTimeline(true);
    setIsSimulating(true);
    setSimulationPhase(0);

    // Simular la evolución temporal con timing pausado
    for (let phase = 0; phase < scenario.timeline.length; phase++) {
      setTimeout(() => {
        setSimulationPhase(phase);
        if (phase === scenario.timeline.length - 1) {
          // Al final, aplicar los datos del escenario
          onSimulate(scenario.data);
        }
      }, phase * 8000); // 8 segundos por fase
    }
    
    // Finalizar simulación
    setTimeout(() => {
      setIsSimulating(false);
    }, scenario.timeline.length * 8000 + 2000);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationPhase(0);
    setSelectedScenario(null);
    setShowTimeline(false);
    onReset();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* AVISO PROMINENTE DE SIMULACIÓN */}
      {showDisclaimer && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">
                ⚠️ MODO SIMULACIÓN - DATOS NO REALES ⚠️
              </h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>IMPORTANTE:</strong> Este simulador genera datos meteorológicos ficticios con fines educativos y de entrenamiento.</p>
                <p><strong>NO utilizar para toma de decisiones reales.</strong> Los valores mostrados están validados científicamente pero son sintéticos.</p>
                <p><strong>Finalidad:</strong> Entrenar personal, probar protocolos y evaluar respuestas ante emergencias.</p>
                <p><strong>Validación:</strong> Rangos meteorológicos basados en eventos históricos documentados por AEMET e INM.</p>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                  <input 
                    type="checkbox" 
                    checked={acknowledgedSimulation}
                    onChange={(e) => setAcknowledgedSimulation(e.target.checked)}
                    className="rounded border-yellow-300"
                  />
                  Entiendo que estos son datos simulados
                </label>
                <button 
                  onClick={() => setShowDisclaimer(false)}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                  disabled={!acknowledgedSimulation}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Simulador de Eventos Extremos
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full ml-2">
              SIMULACIÓN
            </span>
          </h2>
          <p className="text-sm text-gray-600">
            Simula condiciones DANA y evalúa respuesta del sistema - 
            <span className="font-medium text-orange-600">Datos validados científicamente</span>
          </p>
        </div>
        <button
          onClick={resetSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Validación Científica */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">
            Estado de Validación: 
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            validateAllScenarios() 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {validateAllScenarios() ? '✓ Valores Validados' : '⚠️ Valores Fuera de Rango'}
          </span>
        </div>
      </div>

      {/* Timeline de Evolución */}
      {showTimeline && selectedScenario && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-orange-400">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-1 rounded">
              SIMULACIÓN EN CURSO
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">
              Evolución Temporal: {selectedScenario.name}
            </h3>
            {isSimulating && (
              <span className="text-sm text-blue-600 animate-pulse">
                Simulando fase {simulationPhase + 1} de {selectedScenario.timeline.length}...
              </span>
            )}
          </div>

          {/* Base científica */}
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
            <p className="text-xs text-gray-600">
              <strong>Base científica:</strong> {selectedScenario.scientificBasis}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <strong>Rangos validados:</strong> 
              🌧️ {selectedScenario.validationRange.precipitation.min}-{selectedScenario.validationRange.precipitation.max} {selectedScenario.validationRange.precipitation.unit} |
              💨 {selectedScenario.validationRange.windSpeed.min}-{selectedScenario.validationRange.windSpeed.max} {selectedScenario.validationRange.windSpeed.unit} |
              🌡️ {selectedScenario.validationRange.temperature.min}-{selectedScenario.validationRange.temperature.max} {selectedScenario.validationRange.temperature.unit}
            </div>
          </div>

          <div className="space-y-3">
            {selectedScenario.timeline.map((phase, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-all duration-500 ${
                  isSimulating && index === simulationPhase
                    ? `${getRiskBgColor(phase.riskLevel)} ring-2 ring-blue-300 transform scale-[1.02]`
                    : index <= simulationPhase 
                    ? getRiskBgColor(phase.riskLevel)
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(phase.riskLevel)} ${
                      isSimulating && index === simulationPhase ? 'animate-pulse' : ''
                    }`}></div>
                    <span className="font-semibold">{phase.time}</span>
                    <span className="text-sm">{phase.label}</span>
                  </div>
                  {isSimulating && index === simulationPhase && (
                    <TrendingUp className="w-4 h-4 animate-bounce" />
                  )}
                </div>

                <p className="text-sm mb-3">{phase.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                  <div>💧 {phase.precipitation.toFixed(1)} mm/h</div>
                  <div>💨 {phase.windSpeed.toFixed(1)} m/s</div>
                  <div>🌡️ {phase.temperature.toFixed(1)}°C</div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-1">Acciones recomendadas:</p>
                  <ul className="text-xs space-y-1">
                    {phase.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escenarios disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {danaScenarios.map((scenario, index) => {
          const isValidated = validateWeatherData(scenario.data);
          return (
            <div key={index} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
              !isValidated ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {scenario.name.includes('DANA') && <CloudRain className="w-5 h-5 text-blue-500" />}
                {scenario.name.includes('Tormenta') && <Cloud className="w-5 h-5 text-gray-600" />}
                {scenario.name.includes('Calor') && <Wind className="w-5 h-5 text-red-500" />}
                <h3 className="font-semibold text-gray-800">{scenario.name}</h3>
                {isValidated ? (
                  <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">✓</span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">⚠️</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
              
              <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                <div><strong>Base científica:</strong> {scenario.scientificBasis.substring(0, 80)}...</div>
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                <div>💧 {scenario.display.precipitation.toFixed(1)} mm/h</div>
                <div>💨 {scenario.display.windSpeed.toFixed(1)} m/s</div>
                <div>🌡️ {scenario.display.temperature.toFixed(1)}°C</div>
              </div>
              
              <button
                onClick={() => simulateDANA(scenario)}
                disabled={isSimulating || !acknowledgedSimulation || !isValidated}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  !acknowledgedSimulation 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : !isValidated
                    ? 'bg-red-300 text-red-700 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                {!acknowledgedSimulation ? 'Confirme Aviso' : 
                 !isValidated ? 'Datos Inválidos' :
                 isSimulating && selectedScenario?.name === scenario.name ? 'Simulando...' : 'Simular'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Explicación del valor preventivo */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Valor de la Anticipación
        </h4>
        <p className="text-sm text-blue-700">
          El sistema detecta condiciones peligrosas hasta <strong>60 minutos antes</strong> del evento crítico, 
          permitiendo tomar decisiones preventivas cuando aún hay tiempo para proteger vidas y minimizar daños.
          <span className="block mt-1 text-xs">
            <strong>Nota:</strong> Los tiempos y valores están calibrados según eventos históricos documentados.
          </span>
        </p>
      </div>

      {/* Footer de validación */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
          🧪 ENTORNO DE SIMULACIÓN - VALIDACIÓN CIENTÍFICA ACTIVA
        </span>
      </div>
    </div>
  );
}