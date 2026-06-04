import React from 'react';
import { View, Text, Pressable } from '@/components/tw';
import { useRouter } from 'expo-router';
import { Platform, Image } from 'react-native';
import { Star } from 'lucide-react-native';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  onPromotion?: boolean;
  isService?: boolean;
  images: string[];
  user: {
    storeName?: string | null;
    name?: string | null;
  };
  averageRating?: number;
  totalReviews?: number;
}

const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

export const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();
  
  const isOnSale = product.onPromotion && product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isOnSale ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

  return (
    <Pressable className="flex-1 m-2" onPress={() => router.push(`/products/${product.id}`)}>
      <View 
        className="flex-1 rounded-2xl overflow-hidden bg-white border border-border"
        style={Platform.select({
          ios: {
            shadowColor: '#1E1B4B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          android: { elevation: 3 },
        })}
      >
        <View className="relative w-full aspect-square bg-surface">
          <Image 
            source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }} 
            className="w-full h-full"
            resizeMode="cover" 
          />
          {isOnSale && (
            <View className="absolute top-2 right-2 bg-danger px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">-{discountPercent}%</Text>
            </View>
          )}
        </View>

        <View className="p-3">
          <Text className="text-sm font-semibold text-text-dark min-h-[40px]" numberOfLines={2}>
            {product.name}
          </Text>
          
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-lg font-bold text-primary">{formatPrice(product.price)}</Text>
            {isOnSale && (
              <Text className="text-xs text-text-muted line-through">{formatPrice(product.originalPrice!)}</Text>
            )}
          </View>
          
          <Text className="text-xs text-text-muted mt-1" numberOfLines={1}>
            {product.user?.storeName || product.user?.name || 'Vendedor'}
          </Text>

          {/* Ratings */}
          <View className="flex-row items-center mt-1 gap-1">
            <Star size={12} color="#FBBF24" fill="#FBBF24" />
            <Text className="text-xs font-bold text-text-dark">{(product.averageRating || 0).toFixed(1)}</Text>
            <Text className="text-[10px] text-text-muted">({product.totalReviews || 0})</Text>
          </View>
          
          <View className="mt-2 items-start">
            <View className={`px-2 py-1 rounded-full ${product.isService ? 'bg-green-50 border border-green-200' : 'bg-primary-light border border-purple-200'}`}>
              <Text className={`text-[10px] font-bold ${product.isService ? 'text-green-600' : 'text-primary'}`}>
                {product.isService ? 'SERVIÇO' : 'PRODUTO'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};