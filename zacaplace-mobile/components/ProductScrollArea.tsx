import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  user: {
    storeName?: string | null;
    name?: string | null;
  };
  averageRating?: number;
  totalReviews?: number;
}

interface ProductScrollAreaProps {
  title: string;
  products: Product[];
  href?: string;
  isDark?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.4;

const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const ProductCard = ({ product, isDark }: { product: Product; isDark?: boolean }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isDark && { backgroundColor: '#111', borderColor: '#222' }
      ]} 
      onPress={() => router.push(`/products/${product.id}`)}
    >
      <Image source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, isDark && { color: '#FFF' }]} numberOfLines={2}>{product.name}</Text>
        <Text style={[styles.cardPrice, isDark && { color: '#F43F5E' }]}>{formatPrice(product.price)}</Text>
        <Text style={[styles.cardSeller, isDark && { color: '#AAA' }]} numberOfLines={1}>
          {product.user?.storeName || product.user?.name || 'Vendedor'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
          <Star size={12} color="#FBBF24" fill="#FBBF24" />
          <Text style={[{ fontSize: 12, fontWeight: 'bold', color: Colors.textDark }, isDark && { color: '#FFF' }]}>
            {(product.averageRating || 0).toFixed(1)}
          </Text>
          <Text style={[{ fontSize: 10, color: Colors.textMuted }, isDark && { color: '#AAA' }]}>
            ({product.totalReviews || 0})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ProductScrollArea = ({ title, products, href, isDark }: ProductScrollAreaProps) => {
  const router = useRouter();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <View style={[
      styles.container, 
      isDark && { backgroundColor: '#050505', borderColor: '#222', borderTopWidth: 1, borderBottomWidth: 1 }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && { color: '#FFF' }]}>{title}</Text>
        {href && (
          <TouchableOpacity onPress={() => router.push(href as any)}>
            <Text style={[styles.seeMore, isDark && { color: '#F43F5E' }]}>Ver mais</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={products}
        horizontal
        renderItem={({ item }) => <ProductCard product={item} isDark={isDark} />}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: Colors.background,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  seeMore: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: cardWidth,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  cardImage: {
    width: '100%',
    height: cardWidth,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    minHeight: 34,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
  },
  cardSeller: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});