import React, { useEffect, useState } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { View, Text } from '@/components/tw';
import { Stack, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../services/api';
import { SearchX } from 'lucide-react-native';
import { ProductCard, Product } from '../components/ProductCard';

const SearchScreen = () => {
  const { q } = useLocalSearchParams<{ q: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
        setLoading(false);
        return;
    };

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<Product[]>(`/api/search?q=${encodeURIComponent(q)}`);
        setProducts(response.data);
      } catch (error) {
        console.error("Erro ao buscar resultados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [q]);

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ 
        title: `Resultados para "${q}"`,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1E1B4B',
        headerShadowVisible: false,
      }} />

      {products.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
            <View className="w-24 h-24 rounded-full bg-primary-light items-center justify-center mb-6">
              <SearchX size={48} color="#7C3AED" />
            </View>
            <Text className="text-xl font-bold text-text-dark mt-4">Nenhum achadinho encontrado</Text>
            <Text className="text-sm text-text-muted mt-2 text-center">Tente buscar por um termo diferente.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingTop: 16 }}
        />
      )}
    </View>
  );
};

export default SearchScreen;