import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { View, Text } from '@/components/tw';
import { apiClient, ApiError } from '../../services/api';
import { Crown, Rocket, Clock } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { CustomAlert } from '../ui/CustomAlert';

interface PurchaseInfo {
  id: string;
  createdAt: string;
}

interface BoostedProductInfo {
  id: string;
  name: string;
  boostedUntil: string;
}

interface UserStatusData {
  hasActiveSubscription: boolean;
  subscriptionEndDate: string | null;
  boostedProducts: BoostedProductInfo[];
  availableCarouselPurchases: PurchaseInfo[];
}

function getTimeRemaining(endDate: string | Date | null): string {
  if (!endDate) return "Sem data de expiração";
  const now = new Date();
  const end = new Date(endDate);
  const diffInMs = end.getTime() - now.getTime();

  if (diffInMs <= 0) return "Expirado";

  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays > 1) return `Expira em ${diffInDays} dias`;
  if (diffInDays === 1) return `Expira em 1 dia`;

  const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
  if (diffInHours > 1) return `Expira em ${diffInHours} horas`;
  return `Expira em 1 hora`;
}

interface UserStatusDisplayProps {
  isLight?: boolean;
}

export const UserStatusDisplay = ({ isLight }: UserStatusDisplayProps) => {
  const [statusData, setStatusData] = useState<UserStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = isLight ? false : (colorScheme === 'dark');

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<UserStatusData>('/api/user/status');
      setStatusData(response.data);
    } catch (error: any) {
      console.error("Falha ao buscar status do usuário:", error);
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao buscar o status do usuário.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (isLoading) {
    return (
      <GlassCard className="items-center justify-center min-h-[120px] mb-5 p-4" isLight={isLight}>
        <ActivityIndicator size="small" color="#7C3AED" />
        <Text className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-text-muted'}`}>Carregando status...</Text>
      </GlassCard>
    );
  }

  const noPlansActive = !statusData?.hasActiveSubscription && (!statusData?.boostedProducts || statusData.boostedProducts.length === 0);

  return (
    <GlassCard className="mb-5 p-5" isLight={isLight}>
      <Text className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-text-dark'}`}>Status dos Seus Planos Ativos</Text>
      <Text className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-text-muted'}`}>Veja aqui seus benefícios e o tempo restante de cada um.</Text>

      {noPlansActive && (
        <View className={`p-4 rounded-xl items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200/60'}`}>
          <Text className={`text-center text-sm font-medium ${isDark ? 'text-white/60' : 'text-text-muted'}`}>Você não possui nenhum plano ou boost ativo no momento.</Text>
        </View>
      )}

      {statusData?.hasActiveSubscription && (
        <View className={`flex-row items-center border-l-4 border-yellow-500 p-4 rounded-xl mb-3 ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-50/70'}`}>
          <Crown size={24} color="#eab308" />
          <View className="ml-4 flex-1">
            <Text className="font-bold text-yellow-600 dark:text-yellow-500 text-base">Plano &quot;Meu Catálogo no Zaca&quot;</Text>
            <View className="flex-row items-center mt-1">
              <Clock size={14} color="#ca8a04" />
              <Text className="text-xs text-yellow-700 dark:text-yellow-600 ml-1">
                Renova em: {statusData.subscriptionEndDate ? new Date(statusData.subscriptionEndDate).toLocaleDateString('pt-BR') : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {statusData?.boostedProducts && statusData.boostedProducts.length > 0 && (
        <View className={`border-l-4 border-blue-500 p-4 rounded-xl mb-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50/70'}`}>
          <View className="flex-row items-center mb-3">
            <Rocket size={24} color="#3b82f6" />
            <View className="ml-3">
              <Text className="font-bold text-blue-600 dark:text-blue-400 text-base">Achadinhos Turbinados Ativos</Text>
              <Text className="text-xs text-blue-700 dark:text-blue-400/80">Seus produtos com destaque na homepage.</Text>
            </View>
          </View>
          <View className="pl-3 border-l border-blue-500/30 ml-5">
            {statusData.boostedProducts.map(product => (
              <View key={product.id} className="mb-2">
                <Text className={`text-[15px] font-semibold ${isDark ? 'text-white' : 'text-text-dark'}`}>{product.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={14} color={isDark ? 'rgba(255,255,255,0.6)' : '#6B7280'} />
                  <Text className={`text-xs ml-1 ${isDark ? 'text-white/60' : 'text-text-muted'}`}>{getTimeRemaining(product.boostedUntil)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </GlassCard>
  );
};