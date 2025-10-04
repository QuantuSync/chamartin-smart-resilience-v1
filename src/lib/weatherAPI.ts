import { WeatherData } from '@/types';

export async function fetchWeatherData(): Promise<WeatherData> {
  try {
    const response = await fetch('/api/weather');
    
    if (!response.ok) {
      throw new Error(`API route error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convertir al formato WeatherData (sin el campo source)
    return {
      timestamp: data.timestamp,
      temperature: data.temperature,
      humidity: data.humidity,
      precipitation: data.precipitation,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      pressure: data.pressure
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Fallback local
    return {
      timestamp: new Date().toISOString(),
      temperature: 18 + Math.random() * 8,
      humidity: 50 + Math.random() * 30,
      precipitation: Math.random() * 3,
      windSpeed: 3 + Math.random() * 12,
      windDirection: Math.random() * 360,
      pressure: 1010 + Math.random() * 10,
    };
  }
}