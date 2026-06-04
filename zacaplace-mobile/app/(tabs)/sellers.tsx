import React, { useState, useEffect } from 'react';
import { View, Text, TextInput as RNTextInput, Pressable, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Image as RNImage, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Store, MapPin, Star, ChevronRight, Menu, ShoppingBag, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Seller {
  id: string;
  name: string | null;
  image: string | null;
  storeName: string | null;
  whatsappLink: string | null;
  sellerBannerImageUrl: string | null;
  profileDescription: string | null;
}

export default function SellersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Seller[]>('/api/sellers');
        setSellers(response.data);
      } catch (err: any) {
        console.error('Erro ao buscar vendedores:', err);
        setError('Não foi possível carregar a lista de vendedores.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter(seller => {
    const term = searchQuery.toLowerCase();
    return (
      (seller.storeName && seller.storeName.toLowerCase().includes(term)) ||
      (seller.name && seller.name.toLowerCase().includes(term)) ||
      (seller.profileDescription && seller.profileDescription.toLowerCase().includes(term))
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FC' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER TOP (White) */}
      <View style={{ backgroundColor: '#FFF', paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Menu size={24} color="#1E1B4B" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E1B4B', letterSpacing: 1 }}>ZACAPLACE</Text>
        <TouchableOpacity style={{ padding: 4, position: 'relative' }}>
          <ShoppingBag size={24} color="#1E1B4B" />
          <View style={{ position: 'absolute', top: 0, right: -2, backgroundColor: '#7C3AED', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFF' }}>
            <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HERO BANNER */}
        <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60, position: 'relative', overflow: 'hidden' }}>
          {/* Decorative blobs */}
          <View style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: '#BFDBFE', opacity: 0.6 }} />
          <View style={{ position: 'absolute', bottom: -20, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#93C5FD', opacity: 0.4 }} />
          
          <Store size={80} color="#3B82F6" strokeWidth={1} style={{ position: 'absolute', right: 20, bottom: 20, opacity: 0.2 }} />
          
          <View style={{ width: '80%', zIndex: 10 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#1E1B4B', marginBottom: 4 }}>Vendedores</Text>
            <View style={{ height: 6, width: 40, backgroundColor: '#3B82F6', borderRadius: 3, marginTop: 4, marginBottom: 12, transform: [{ rotate: '-2deg' }] }} />
            <Text style={{ fontSize: 13, color: '#1E3A8A', lineHeight: 18, fontWeight: '500' }}>
              Descubra as melhores lojas e parceiros oficiais na plataforma.
            </Text>
          </View>
        </View>

        {/* SEARCH AND CONTENT */}
        <View style={{ backgroundColor: '#F8F9FC', borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -36, paddingHorizontal: 16, paddingTop: 24 }}>
          
          {/* SEARCH BAR */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 28, paddingHorizontal: 20, height: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, marginBottom: 24 }}>
            <Search size={22} color="#9CA3AF" />
            <RNTextInput 
              style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#1E1B4B' }} 
              placeholder="Buscar vendedores..." 
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* SELLERS LIST */}
          <View style={{ gap: 16 }}>
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: '#64748B', marginTop: 12 }}>Buscando vendedores...</Text>
              </View>
            ) : error ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : filteredSellers.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Store size={48} color="#CBD5E1" />
                <Text style={{ color: '#64748B', marginTop: 12, fontWeight: 'bold' }}>Nenhum vendedor encontrado.</Text>
              </View>
            ) : (
              filteredSellers.map(seller => (
                <TouchableOpacity key={seller.id} onPress={() => router.push(`/sellers/${seller.id}` as any)} activeOpacity={0.9} style={{ backgroundColor: '#FFF', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: seller.sellerBannerImageUrl ? 16 : 0 }}>
                    <RNImage source={{ uri: seller.image || 'https://via.placeholder.com/150' }} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9' }} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E1B4B' }}>{seller.storeName || seller.name || 'Loja Parceira'}</Text>
                      {seller.profileDescription && (
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }} numberOfLines={2}>
                          {seller.profileDescription}
                        </Text>
                      )}
                      
                      {seller.whatsappLink && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <MessageCircle size={14} color="#10B981" />
                          <Text style={{ fontSize: 12, color: '#10B981', fontWeight: 'bold', marginLeft: 4 }}>Suporte via WhatsApp</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight size={20} color="#1E1B4B" />
                    </View>
                  </View>

                  {/* FEATURED BANNER */}
                  {seller.sellerBannerImageUrl && (
                    <View style={{ height: 100, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                      <RNImage source={{ uri: seller.sellerBannerImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
