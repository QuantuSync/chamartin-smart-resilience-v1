import { Platform } from '@/types';
import { Shield, AlertTriangle, Umbrella } from 'lucide-react';

interface PlatformCardProps {
  platform: Platform;
}

export default function PlatformCard({ platform }: PlatformCardProps) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskText = (score: number) => {
    if (score >= 70) return 'Crítico';
    if (score >= 50) return 'Alto';
    if (score >= 30) return 'Medio';
    return 'Bajo';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{platform.name}</h3>
        <div className="flex items-center gap-2">
          {platform.isRoofed ? (
            <Umbrella className="w-5 h-5 text-blue-500" />
          ) : (
            <Shield className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getRiskColor(platform.riskScore)}`}></div>
          <span className="text-sm text-gray-600">
            Riesgo: {getRiskText(platform.riskScore)}
          </span>
        </div>
        <span className="text-2xl font-bold text-gray-800">{platform.riskScore}</span>
      </div>
      
      {platform.riskScore >= 50 && (
        <div className="mt-2 flex items-center gap-1 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Requiere atención</span>
        </div>
      )}
    </div>
  );
}