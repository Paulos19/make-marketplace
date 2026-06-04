import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import { View, Text, Pressable } from '@/components/tw';
import { useRouter } from 'expo-router';
import { apiClient } from '../services/api';
import { getToken } from '../services/auth';

interface UserProfile {
  name: string;
  image?: string;
}

export const WelcomeHeader = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await apiClient.get<UserProfile>('/api/user');
        setUser(userData.data);
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View className="flex-row items-center px-6 py-4 bg-transparent z-10 h-20">
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-row items-center px-6 py-4 bg-transparent z-10 h-20">
        <Text className="text-text-dark text-2xl font-light">Olá, <Text className="font-bold text-primary">Explorador!</Text></Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center px-6 py-4 bg-transparent z-10 h-20">
      <Pressable onPress={() => router.push('/dashboard')} className="mr-4">
        <Image 
          source={{ uri: user.image || 'https://via.placeholder.com/50' }} 
          className="w-12 h-12 rounded-full border-2 border-primary" 
          resizeMode="cover"
        />
      </Pressable>
      <View className="flex-row items-baseline">
        <Text className="text-text-dark text-2xl font-light mr-1">Olá,</Text>
        <Text className="text-2xl font-bold text-primary">
          {(user.name || '').split(' ')[0] || 'Usuário'}!
        </Text>
      </View>
    </View>
  );
};