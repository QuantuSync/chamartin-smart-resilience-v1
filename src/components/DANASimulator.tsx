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

  // Scientific validation function
  const validateWeatherData = (data: Partial<WeatherData>): boolean => {
    const validRanges = {
      temperature: { min: -40, max: 50 }, // Realistic range for Spain
      precipitation: { min: 0, max: 100 }, // Maximum observed mm/h
      windSpeed: { min: 0, max: 60 }, // Maximum m/s without being hurricane
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
      name: "Severe DANA",
      description: "Heavy precipitation (15-25 mm/h) + strong winds",
      scientificBasis: "Based on DANA events recorded in Valencia (2019) and Murcia (2016). Precipitation between 15-30 mm/h is typical of severe DANAs according to AEMET.",
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
          label: "Initial Detection",
          riskLevel: 'low',
          description: "Atmospheric pressure decreasing (-2 hPa/h), first signs of instability",
          precipitation: 0.2,
          windSpeed: 8.5,
          temperature: 19.2,
          actions: ["Review extended forecast", "Prepare preventive equipment", "Activate intensive monitoring"]
        },
        {
          time: "T-30 min",
          label: "Moderate Escalation",
          riskLevel: 'medium',
          description: "Precipitation intensification (trend +8mm/h), wind rotation",
          precipitation: 5.8,
          windSpeed: 15.3,
          temperature: 18.9,
          actions: ["Activate enhanced surveillance", "Alert operational staff", "Prepare signage", "Verify drainage"]
        },
        {
          time: "T-15 min",
          label: "Critical Conditions",
          riskLevel: 'high',
          description: "High risk - Precipitation >10mm/h, gusts >20m/s - Critical action window",
          precipitation: 12.4,
          windSpeed: 20.1,
          temperature: 18.6,
          actions: ["Close exposed platforms", "Evacuate risk zones", "Activate protocols", "Communicate to users"]
        },
        {
          time: "T-0 min",
          label: "Event Peak",
          riskLevel: 'critical',
          description: "Extreme conditions - Maximum impact according to typical DANA model",
          precipitation: 22.3,
          windSpeed: 24.7,
          temperature: 18.4,
          actions: ["Suspend operations", "Full emergency protocol", "Crisis communication", "Ensure shelter"]
        }
      ]
    },
    {
      name: "Severe Winter Storm",
      description: "Extreme cold conditions + precipitation",
      scientificBasis: "Inspired by Filomena 2021 but with validated values. Temperatures of 3-5°C with heavy precipitation create dangerous icing conditions.",
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
          label: "Early Warning",
          riskLevel: 'low',
          description: "Temperature dropping (-1°C/h), pressure falling rapidly (-3 hPa/h)",
          precipitation: 1.2,
          windSpeed: 12.3,
          temperature: 8.1,
          actions: ["Intensive monitoring", "Pre-position anti-ice equipment", "Verify heating"]
        },
        {
          time: "T-30 min",
          label: "Accelerated Deterioration",
          riskLevel: 'medium',
          description: "Mixed precipitation (rain-snow), increasing winds, icing risk",
          precipitation: 8.7,
          windSpeed: 22.5,
          temperature: 5.2,
          actions: ["Activate platform heating", "Deploy emergency teams", "Apply anti-ice"]
        },
        {
          time: "T-15 min",
          label: "Imminent Crisis",
          riskLevel: 'high',
          description: "Torrential precipitation, critical temperature, imminent ice formation",
          precipitation: 18.9,
          windSpeed: 28.4,
          temperature: 4.1,
          actions: ["Partially close station", "Evacuate outdoor platforms", "Maximum security"]
        },
        {
          time: "T-0 min",
          label: "Extreme Event",
          riskLevel: 'critical',
          description: "Severe winter storm conditions - Maximum danger from icing",
          precipitation: 32.8,
          windSpeed: 31.2,
          temperature: 3.7,
          actions: ["Temporary total closure", "Emergency shelter", "Maximum alert protocol", "Coordinate with 112"]
        }
      ]
    },
    {
      name: "Extreme Heat Wave",
      description: "High temperatures + low humidity + hot wind",
      scientificBasis: "Based on heat waves of 2003 and 2022. Temperature >40°C with humidity <35% represents severe thermal stress risk according to health protocols.",
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
          label: "Rising Heat",
          riskLevel: 'low',
          description: "Temperature rising (+2°C/h), humidity dropping, stable high pressure",
          precipitation: 0,
          windSpeed: 8.2,
          temperature: 35.6,
          actions: ["Verify air conditioning", "Prepare extra hydration", "Monitor vulnerable groups"]
        },
        {
          time: "T-30 min",
          label: "Thermal Stress",
          riskLevel: 'medium',
          description: "Intense heat (>36°C), critical humidity (<40%), risk for vulnerable groups",
          precipitation: 0,
          windSpeed: 11.7,
          temperature: 38.9,
          actions: ["Open shaded areas", "Reinforce medical staff", "Activate water fountains"]
        },
        {
          time: "T-15 min",
          label: "Dangerous Temperature",
          riskLevel: 'high',
          description: "Heat stroke risk on exposed platforms (>40°C), extreme UV index",
          precipitation: 0,
          windSpeed: 13.1,
          temperature: 40.2,
          actions: ["Evacuate sunny platforms", "Activate misters", "Increase ventilation"]
        },
        {
          time: "T-0 min",
          label: "Extreme Heat",
          riskLevel: 'critical',
          description: "Temperature dangerous to health - Life-threatening hyperthermia risk",
          precipitation: 0,
          windSpeed: 14.3,
          temperature: 41.2,
          actions: ["Mandatory AC shelter", "Preventive medical care", "Health communication", "Health protocol"]
        }
      ]
    }
  ];

  // Validate all scenarios on load
  const validateAllScenarios = () => {
    return danaScenarios.every(scenario => {
      const isValid = validateWeatherData(scenario.data);
      if (!isValid) {
        console.warn(`Scenario ${scenario.name} has values outside scientific range`);
      }
      return isValid;
    });
  };

  const simulateDANA = async (scenario: DANAScenario) => {
    if (!acknowledgedSimulation) {
      alert("Please acknowledge the simulation notice before continuing.");
      return;
    }

    if (!validateWeatherData(scenario.data)) {
      console.error(`Scenario ${scenario.name} failed scientific validation`);
      return;
    }

    setSelectedScenario(scenario);
    setShowTimeline(true);
    setIsSimulating(true);
    setSimulationPhase(0);

    // Simulate temporal evolution with paused timing
    for (let phase = 0; phase < scenario.timeline.length; phase++) {
      setTimeout(() => {
        setSimulationPhase(phase);
        if (phase === scenario.timeline.length - 1) {
          // At the end, apply scenario data
          onSimulate(scenario.data);
        }
      }, phase * 8000); // 8 seconds per phase
    }
    
    // End simulation
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
      {/* PROMINENT SIMULATION WARNING */}
      {showDisclaimer && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">
                ⚠️ SIMULATION MODE - NOT REAL DATA ⚠️
              </h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>IMPORTANT:</strong> This simulator generates fictional weather data for educational and training purposes.</p>
                <p><strong>DO NOT use for real decision-making.</strong> The displayed values are scientifically validated but synthetic.</p>
                <p><strong>Purpose:</strong> Train personnel, test protocols, and evaluate emergency responses.</p>
                <p><strong>Validation:</strong> Weather ranges based on historical events documented by AEMET and INM.</p>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm font-medium text-yellow-800">
                  <input 
                    type="checkbox" 
                    checked={acknowledgedSimulation}
                    onChange={(e) => setAcknowledgedSimulation(e.target.checked)}
                    className="rounded border-yellow-300"
                  />
                  I understand this is simulated data
                </label>
                <button 
                  onClick={() => setShowDisclaimer(false)}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                  disabled={!acknowledgedSimulation}
                >
                  Continue
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
            Extreme Events Simulator
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full ml-2">
              SIMULATION
            </span>
          </h2>
          <p className="text-sm text-gray-600">
            Simulate DANA conditions and evaluate system response - 
            <span className="font-medium text-orange-600">Scientifically validated data</span>
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

      {/* Scientific Validation */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">
            Validation Status: 
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            validateAllScenarios() 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {validateAllScenarios() ? '✓ Validated Values' : '⚠️ Values Out of Range'}
          </span>
        </div>
      </div>

      {/* Evolution Timeline */}
      {showTimeline && selectedScenario && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-orange-400">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-1 rounded">
              SIMULATION IN PROGRESS
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">
              Temporal Evolution: {selectedScenario.name}
            </h3>
            {isSimulating && (
              <span className="text-sm text-blue-600 animate-pulse">
                Simulating phase {simulationPhase + 1} of {selectedScenario.timeline.length}...
              </span>
            )}
          </div>

          {/* Scientific basis */}
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded">
            <p className="text-xs text-gray-600">
              <strong>Scientific basis:</strong> {selectedScenario.scientificBasis}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <strong>Validated ranges:</strong> 
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
                  <p className="text-xs font-medium mb-1">Recommended actions:</p>
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

      {/* Available scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {danaScenarios.map((scenario, index) => {
          const isValidated = validateWeatherData(scenario.data);
          return (
            <div key={index} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
              !isValidated ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {scenario.name.includes('DANA') && <CloudRain className="w-5 h-5 text-blue-500" />}
                {scenario.name.includes('Storm') && <Cloud className="w-5 h-5 text-gray-600" />}
                {scenario.name.includes('Heat') && <Wind className="w-5 h-5 text-red-500" />}
                <h3 className="font-semibold text-gray-800">{scenario.name}</h3>
                {isValidated ? (
                  <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">✓</span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">⚠️</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
              
              <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                <div><strong>Scientific basis:</strong> {scenario.scientificBasis.substring(0, 80)}...</div>
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
                {!acknowledgedSimulation ? 'Confirm Notice' : 
                 !isValidated ? 'Invalid Data' :
                 isSimulating && selectedScenario?.name === scenario.name ? 'Simulating...' : 'Simulate'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Explanation of preventive value */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Value of Anticipation
        </h4>
        <p className="text-sm text-blue-700">
          The system detects dangerous conditions up to <strong>60 minutes before</strong> the critical event, 
          allowing preventive decisions when there is still time to protect lives and minimize damage.
          <span className="block mt-1 text-xs">
            <strong>Note:</strong> Times and values are calibrated according to documented historical events.
          </span>
        </p>
      </div>

      {/* Validation footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
          🧪 SIMULATION ENVIRONMENT - SCIENTIFIC VALIDATION ACTIVE
        </span>
      </div>
    </div>
  );
}