import React, { useRef, useEffect } from 'react';
import { FlatList, Dimensions, Platform, Image } from 'react-native';
import { View, Text, Pressable } from '@/components/tw';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface Product {
  id: string;
  images: string[];
}

interface BannerCarouselProps {
  products: Product[];
}

export const BannerCarousel = ({ products }: BannerCarouselProps) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Product>>(null);
  let currentIndex = 0;

  useEffect(() => {
    if (products.length > 1) {
      const interval = setInterval(() => {
        if (flatListRef.current) {
          currentIndex = (currentIndex + 1) % products.length;
          flatListRef.current.scrollToIndex({
            index: currentIndex,
            animated: true,
          });
        }
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable
      className="w-full h-full"
      style={{ width: screenWidth - 32 }}
      onPress={() => router.push(`/products/${item.id}`)}
    >
      <View 
        className="flex-1 rounded-3xl overflow-hidden mx-2 bg-white border border-border"
        style={Platform.select({
          ios: {
            shadowColor: '#1E1B4B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          },
          android: { elevation: 4 },
        })}
      >
        <Image
          source={{ uri: item.images[0] || 'https://via.placeholder.com/400x200' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(30,27,75,0.75)']}
          className="absolute inset-0 justify-end p-6"
        >
          <View className="bg-primary self-start px-3 py-1 rounded-full mb-2">
            <Text className="text-white text-xs font-bold uppercase tracking-wider">Destaque</Text>
          </View>
          <Text className="text-white text-2xl font-bold">
            Turbinados do Zaca
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );

  return (
    <View className="mt-4" style={{ height: screenWidth * 0.55 }}>
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        snapToInterval={screenWidth - 16}
        decelerationRate="fast"
      />
    </View>
  );
};