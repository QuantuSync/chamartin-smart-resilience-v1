export interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
}

export interface Platform {
  id: string;
  name: string;
  isRoofed: boolean;
  riskScore: number;
  exposure: number;
}

export interface Alert {
  id: string;
  platformId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}