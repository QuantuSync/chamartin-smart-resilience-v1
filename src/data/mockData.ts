import { Platform, WeatherData, Alert } from '@/types';

export const platforms: Platform[] = [
  { id: 'P1', name: 'Platform 1', isRoofed: true, riskScore: 25, exposure: 0.2 },   // ODD = ROOFED
  { id: 'P2', name: 'Platform 2', isRoofed: false, riskScore: 45, exposure: 0.6 },  // EVEN = UNCOVERED
  { id: 'P3', name: 'Platform 3', isRoofed: true, riskScore: 35, exposure: 0.3 },   // ODD = ROOFED
  { id: 'P4', name: 'Platform 4', isRoofed: false, riskScore: 70, exposure: 0.9 },  // EVEN = UNCOVERED
  { id: 'P5', name: 'Platform 5', isRoofed: true, riskScore: 20, exposure: 0.1 },   // ODD = ROOFED
  { id: 'P6', name: 'Platform 6', isRoofed: false, riskScore: 55, exposure: 0.7 },  // EVEN = UNCOVERED
  { id: 'P7', name: 'Platform 7', isRoofed: true, riskScore: 30, exposure: 0.2 },   // ODD = ROOFED
  { id: 'P8', name: 'Platform 8', isRoofed: false, riskScore: 65, exposure: 0.8 },  // EVEN = UNCOVERED
];

export const currentWeather: WeatherData = {
  timestamp: new Date().toISOString(),
  temperature: 18.5,
  humidity: 75,
  precipitation: 2.3,
  windSpeed: 12,
  windDirection: 225,
  pressure: 1013.2,
};

export const alerts: Alert[] = [
  {
    id: 'A1',
    platformId: 'P4',
    severity: 'high',
    message: 'Strong wind gusts expected in 30 min',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'A2',
    platformId: 'P8',
    severity: 'medium',
    message: 'Increased precipitation expected',
    timestamp: new Date().toISOString(),
  },
];