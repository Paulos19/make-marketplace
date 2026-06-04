import React from 'react';
import { FlatList } from 'react-native';
import { View, Text, Pressable } from '@/components/tw';
import { Truck, Store, Tag, BadgePercent } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const actions = [
  { name: 'Frete Grátis', icon: Truck, route: '/shipping-info', color: '#7C3AED' },
  { name: 'Lojas Oficiais', icon: Store, route: '/sellers', color: '#6D28D9' },
  { name: 'Cupons', icon: Tag, route: '/coupons', color: '#A855F7' },
  { name: 'Promoções', icon: BadgePercent, route: '/deals', color: '#7C3AED' },
];

export const QuickActions = () => {
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof actions[0] }) => (
    <Pressable 
      className="flex-1 items-center p-2" 
      onPress={() => router.push(item.route as any)}
    >
      <View
        className="w-16 h-16 rounded-2xl bg-primary-light items-center justify-center mb-3"
      >
        <item.icon color={item.color} size={28} strokeWidth={1.5} />
      </View>
      <Text className="text-xs text-text-dark text-center font-medium" numberOfLines={2}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View className="py-6 px-4 bg-transparent border-b border-border">
      <FlatList
        data={actions}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        horizontal={false}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </View>
  );
};