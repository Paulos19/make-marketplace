import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image as RNImage, Dimensions, StyleSheet, Platform, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, MessageCircle, Star, ShieldCheck, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SellerProfile {
  id: string;
  name: string | null;
  storeName: string | null;
  image: string | null;
  whatsappLink: string | null;
  sellerBannerImageUrl: string | null;
  profileDescription: string | null;
}

interface Product {
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
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSellerProfile();
    fetchProducts(1);
  }, [id]);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<SellerProfile>(`/api/sellers/${id}`);
      setSeller(res.data);
    } catch (err: any) {
      console.error('Erro ao buscar perfil do vendedor:', err);
      setError('Não foi possível carregar as informações desta loja.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) setLoadingProducts(true);
      const res = await apiClient.get<{ products: Product[], totalPages: number }>(`/api/products?userId=${id}&page=${pageNumber}&limit=10`);
      
      if (pageNumber === 1) {
        setProducts(res.data.products);
      } else {
        setProducts(prev => [...prev, ...res.data.products]);
      }
      setTotalPages(res.data.totalPages);
      setPage(pageNumber);
    } catch (err) {
      console.error('Erro ao buscar produtos do vendedor:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingProducts) {
      fetchProducts(page + 1);
    }
  };

  const handleWhatsApp = () => {
    if (seller?.whatsappLink) {
      Linking.openURL(seller.whatsappLink).catch(() => {
        alert('Não foi possível abrir o WhatsApp.');
      });
    }
  };

  const renderProductCard = ({ item, index }: { item: Product, index: number }) => {
    const isPromo = item.onPromotion && item.originalPrice && item.originalPrice > item.price;
    const discount = isPromo ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
    const priceFormatted = (item as any).priceType === 'ON_BUDGET' ? 'A combinar' : formatPrice(item.price);
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/products/${item.id}`)}
        activeOpacity={0.9}
        style={{
          width: (SCREEN_WIDTH / 2) - 24,
          backgroundColor: '#FFF',
          borderRadius: 20,
          marginBottom: 16,
          marginHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
          overflow: 'hidden'
        }}
      >
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F8F9FC', position: 'relative' }}>
          <RNImage
            source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {isPromo && (
            <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#7C3AED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>-{discount}%</Text>
            </View>
          )}
        </View>
        
        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B4B', minHeight: 36 }} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#7C3AED' }}>{priceFormatted}</Text>
            {isPromo && (
              <Text style={{ fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' }}>{formatPrice(item.originalPrice!)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FC', justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !seller) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F9FC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ fontSize: 16, color: '#EF4444', textAlign: 'center', marginBottom: 16 }}>{error || 'Vendedor não encontrado'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#1E1B4B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = seller.storeName || seller.name || 'Loja Parceira';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FC' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loadingProducts && page > 1 ? <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 16 }} /> : null}
        ListHeaderComponent={() => (
          <View style={{ marginBottom: 24 }}>
            {/* HERO BANNER */}
            <View style={{ width: '100%', height: 220, position: 'relative', backgroundColor: '#E2E8F0' }}>
              {seller.sellerBannerImageUrl ? (
                <RNImage source={{ uri: seller.sellerBannerImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <LinearGradient colors={['#7C3AED', '#4C1D95']} style={{ width: '100%', height: '100%' }} />
              )}
              <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100 }} />
              
              {/* TOP ACTIONS */}
              <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                  <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                  <Share2 size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* PROFILE INFO CARD */}
            <View style={{ backgroundColor: '#FFF', marginHorizontal: 16, marginTop: -40, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', padding: 4, marginTop: -40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                  <RNImage source={{ uri: seller.image || 'https://via.placeholder.com/150' }} style={{ width: '100%', height: '100%', borderRadius: 36, backgroundColor: '#F1F5F9' }} />
                </View>
                {seller.whatsappLink && (
                  <TouchableOpacity onPress={handleWhatsApp} style={{ backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 }}>
                    <MessageCircle size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Contato</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E1B4B' }}>{displayName}</Text>
                  <ShieldCheck size={20} color="#3B82F6" />
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E1B4B' }}>4.9</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF' }}>(120)</Text>
                  </View>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} color="#9CA3AF" />
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Loja verificada</Text>
                  </View>
                </View>

                {seller.profileDescription && (
                  <Text style={{ fontSize: 14, color: '#475569', marginTop: 16, lineHeight: 20 }}>
                    {seller.profileDescription}
                  </Text>
                )}
              </View>
            </View>

            {/* TAB TITLES */}
            <View style={{ paddingHorizontal: 24, marginTop: 24, marginBottom: 8, flexDirection: 'row', gap: 24 }}>
              <View style={{ borderBottomWidth: 3, borderBottomColor: '#7C3AED', paddingBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E1B4B' }}>Produtos ({products.length})</Text>
              </View>
              <View style={{ paddingBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#9CA3AF' }}>Avaliações</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => !loadingProducts ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Esta loja ainda não possui produtos.</Text>
          </View>
        ) : null}
      />
    </View>
  );
}
