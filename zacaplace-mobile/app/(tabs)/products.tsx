import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, ActivityIndicator, Alert, TouchableOpacity, Image as RNImage, Dimensions, Platform, StyleSheet } from 'react-native';
import { View, Text, TextInput as RNTextInput, Pressable, ScrollView } from '@/components/tw';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../services/api';
import FilterModal from '../../components/FilterModal';
import { Search, MapPin, Star, ShoppingBag, SlidersHorizontal, LayoutGrid, X, Heart, Menu, Compass, Car, Sparkles, Filter, ChevronDown, ChevronRight, Ticket, Zap, Check, ShoppingCart, Truck, Smartphone, Wrench, Shirt, Home } from 'lucide-react-native';
import { Product } from '../../components/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSidebarStore } from '../../store/useSidebarStore';
import { CustomAlert } from '../../components/ui/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

const getCategoryIcon = (name: string, color: string) => {
  const clean = name.toLowerCase();
  if (clean.includes('celular') || clean.includes('eletrôn')) return <Smartphone size={24} color={color} strokeWidth={1.5} />;
  if (clean.includes('serviço') || clean.includes('consert')) return <Wrench size={24} color={color} strokeWidth={1.5} />;
  if (clean.includes('carro') || clean.includes('moto')) return <Car size={24} color={color} strokeWidth={1.5} />;
  if (clean.includes('moda') || clean.includes('roupa') || clean.includes('acessóri') || clean.includes('camiset') || clean.includes('calça') || clean.includes('tênis')) return <Shirt size={24} color={color} strokeWidth={1.5} />;
  if (clean.includes('casa') || clean.includes('imóve')) return <Home size={24} color={color} strokeWidth={1.5} />;
  if (clean.includes('beleza') || clean.includes('cosmét')) return <Sparkles size={24} color={color} strokeWidth={1.5} />;
  return <ShoppingBag size={24} color={color} strokeWidth={1.5} />;
};

const ProductsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebarStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>(params.q ? String(params.q) : '');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category ? String(params.category) : '');
  const [selectedSort, setSelectedSort] = useState<string>('createdAt:desc');
  const [isFilterModalVisible, setFilterModalVisible] = useState<boolean>(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const categoriesData = await apiClient.get<{ id: string; name: string }[]>('/api/categories');
        setCategories(categoriesData.data);
        await fetchProducts(1, searchQuery, selectedCategory, selectedSort);
      } catch (err: any) {
        console.error('Erro ao carregar dados iniciais:', err);
        setError(err.message || 'Erro ao carregar dados iniciais.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchProducts = useCallback(async (page: number, query: string, category: string, sort: string) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const urlParams = new URLSearchParams();
      if (query) urlParams.append('q', query);
      if (category) urlParams.append('categoryId', category);
      if (sort) urlParams.append('sort', sort);
      urlParams.append('page', page.toString());
      urlParams.append('limit', '10');

      const response = await apiClient.get<{ products: Product[], totalPages: number, currentPage: number }>(`/api/products?${urlParams.toString()}`);
      const responseData = response.data;
      
      if (page === 1) setProducts(responseData.products);
      else setProducts(prevProducts => [...prevProducts, ...responseData.products]);
      
      setTotalPages(responseData.totalPages);
      setCurrentPage(responseData.currentPage);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos');
      CustomAlert.alert('Erro', err.message || 'Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1, searchQuery, selectedCategory, selectedSort);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchProducts(currentPage + 1, searchQuery, selectedCategory, selectedSort);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    const newCat = selectedCategory === categoryId ? '' : categoryId;
    setSelectedCategory(newCat);
    setCurrentPage(1);
    fetchProducts(1, searchQuery, newCat, selectedSort);
  };

  // Extrair o nome da categoria selecionada ou padrão "Moda" para a UI de topo
  const displayCategoryName = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)?.name || 'Explorar'
    : 'Moda';

  const renderProductCard = ({ item, index }: { item: Product, index: number }) => {
    const isPromo = item.onPromotion && item.originalPrice && item.originalPrice > item.price;
    const discount = isPromo ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : 0;
    const priceFormatted = (item as any).priceType === 'ON_BUDGET' ? 'A combinar' : formatPrice(item.price);
    
    const isDark = index % 3 === 0;
    
    const theme = {
      cardBg: isDark ? '#1C1B2B' : '#FFFFFF',
      imgBg: isDark ? '#161522' : '#F8F9FC',
      title: isDark ? '#FFFFFF' : '#1E1B4B',
      subtitle: isDark ? '#9CA3AF' : '#64748B',
      price: isDark ? '#A78BFA' : '#6C5CE7',
      oldPrice: isDark ? '#6B7280' : '#9CA3AF',
      btnBg: isDark ? '#2D2B42' : '#F3F0FF',
      btnIcon: isDark ? '#A78BFA' : '#6C5CE7',
      footerBorder: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'
    };

    let badgeType = 'none';
    if (isPromo) badgeType = 'promo';
    else if (index % 4 === 0) badgeType = 'novo';
    else if (index % 5 === 0) badgeType = 'destaque';

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => router.push(`/products/${item.id}`)}
        activeOpacity={0.9}
        style={{
          flex: 1,
          backgroundColor: theme.cardBg,
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 16,
          marginHorizontal: 8,
          elevation: isDark ? 6 : 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: isDark ? 6 : 2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: isDark ? 12 : 8,
          borderWidth: 1,
          borderColor: isDark ? '#2D2B42' : '#F8F9FC',
          padding: 12
        }}
      >
        <View style={{ width: '100%', height: 160, borderRadius: 16, backgroundColor: theme.imgBg, overflow: 'hidden', position: 'relative' }}>
          <LinearGradient 
            colors={isDark ? ['rgba(124,58,237,0.2)', 'transparent'] : ['rgba(224,231,255,0.8)', 'transparent']} 
            style={{ position: 'absolute', top: -20, left: -20, width: 120, height: 120, borderRadius: 60 }} 
          />
          <RNImage
            source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          
          {badgeType !== 'none' && (
            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: badgeType === 'promo' ? '#7C3AED' : badgeType === 'novo' ? '#10B981' : '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>
                {badgeType === 'promo' ? `-${discount}%` : badgeType === 'novo' ? 'Novo' : 'Promo'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
            <Heart size={14} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.title }} numberOfLines={1}>
              {(item.user?.storeName || item.user?.name || 'ZacaPlace').split(' ')[0]}
            </Text>
            <View style={{ backgroundColor: '#3B82F6', borderRadius: 6, width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={8} color="#FFF" strokeWidth={3} />
            </View>
          </View>

          <Text style={{ fontSize: 14, fontWeight: '900', color: theme.title, lineHeight: 18 }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 10, color: theme.subtitle, marginTop: 2 }} numberOfLines={1}>
            {(item as any).category?.name || 'Explorar'} • Oferta
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: theme.price }}>
                {priceFormatted}
              </Text>
              {isPromo && (
                <Text style={{ fontSize: 10, color: theme.oldPrice, textDecorationLine: 'line-through', marginTop: 1 }}>
                  {formatPrice(item.originalPrice!)}
                </Text>
              )}
            </View>
            
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {item.averageRating && item.averageRating > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.title }}>{item.averageRating.toFixed(1)}</Text>
                  <Text style={{ fontSize: 8, color: theme.subtitle }}>({item.totalReviews})</Text>
                </View>
              ) : null}
              <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.btnBg, alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={14} color={theme.btnIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.footerBorder }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, paddingRight: 4 }}>
                <RNImage source={{ uri: (item.user as any)?.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=100&auto=format&fit=crop' }} style={{ width: 14, height: 14, borderRadius: 7 }} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: theme.title }} numberOfLines={1}>{item.user?.storeName || item.user?.name || 'Zaca Oficial'}</Text>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                {index % 2 === 0 ? (
                  <>
                    <Zap size={8} color="#10B981" fill="#10B981" />
                    <Text style={{ fontSize: 8, color: '#10B981', fontWeight: '800' }}>Envio rápido</Text>
                  </>
                ) : (
                  <>
                    <Truck size={8} color="#10B981" />
                    <Text style={{ fontSize: 8, color: '#10B981', fontWeight: '800' }}>Frete grátis</Text>
                  </>
                )}
             </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={{ backgroundColor: '#F8F9FC' }}>
      {/* 1. CLEAN TOP HEADER */}
      <View style={{ backgroundColor: '#FFF', paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={openSidebar} style={{ padding: 4 }}>
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

      {/* 2. PURPLE WAVE BANNER */}
      <View style={{ backgroundColor: '#EDE9FE', position: 'relative', overflow: 'hidden', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 80 }}>
        {/* Dynamic decorative blobs for the wave effect */}
        <View style={{ position: 'absolute', top: -40, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: '#D8B4FE', opacity: 0.6 }} />
        <View style={{ position: 'absolute', bottom: -20, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#C084FC', opacity: 0.4 }} />
        
        {/* Model Image - Using Unsplash placeholder for fidelity */}
        <RNImage 
          source={{ uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop' }} 
          style={{ position: 'absolute', right: -30, bottom: 0, width: 220, height: 260 }} 
          resizeMode="cover" 
        />
        
        {/* Banner Text Content */}
        <View style={{ width: '55%', zIndex: 10 }}>
          <Text style={{ fontSize: 40, fontWeight: '900', color: '#1E1B4B', marginBottom: -4 }}>{displayCategoryName}</Text>
          <View style={{ height: 6, width: 40, backgroundColor: '#7C3AED', borderRadius: 3, marginTop: 4, marginBottom: 12, transform: [{ rotate: '-2deg' }] }} />
          <Text style={{ fontSize: 13, color: '#4C1D95', lineHeight: 18, fontWeight: '500' }}>
            Estilo que combina com você. Descubra, escolha e se destaque.
          </Text>
        </View>
      </View>

      {/* 3. OVERLAPPED SEMI-CARD */}
      <View style={{ backgroundColor: '#F8F9FC', borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -36, paddingHorizontal: 16, paddingTop: 24 }}>
        
        {/* SEARCH BAR (Floating) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 28, paddingHorizontal: 20, height: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, marginBottom: 28 }}>
          <Search size={22} color="#9CA3AF" />
          <RNTextInput 
            style={{ flex: 1, marginLeft: 12, fontSize: 15, color: '#1E1B4B' }} 
            placeholder="Buscar produtos..." 
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ padding: 4 }}>
            <SlidersHorizontal size={22} color="#1E1B4B" />
          </TouchableOpacity>
        </View>

        {/* CIRCULAR CATEGORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
          <TouchableOpacity onPress={() => handleCategorySelect('')} style={{ alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: selectedCategory === '' ? '#7C3AED' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
              <LayoutGrid size={24} color={selectedCategory === '' ? '#FFF' : '#1E1B4B'} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: selectedCategory === '' ? 'bold' : '600', color: selectedCategory === '' ? '#7C3AED' : '#6B7280' }}>Todos</Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity key={cat.id} onPress={() => handleCategorySelect(cat.id)} style={{ alignItems: 'center', width: 64 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isSelected ? '#7C3AED' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                  {getCategoryIcon(cat.name, isSelected ? '#FFF' : '#1E1B4B')}
                </View>
                <Text style={{ fontSize: 12, fontWeight: isSelected ? 'bold' : '600', color: isSelected ? '#7C3AED' : '#6B7280', textAlign: 'center' }} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* SECTION TITLE */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B' }}>Destaques para você</Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 13, color: '#7C3AED', fontWeight: 'bold' }}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );

  const renderListFooter = () => (
    <View style={{ paddingBottom: 100 }}>
      {loadingMore && <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 20 }} />}
      
      {/* 4. PROMOTIONAL BANNER */}
      <View style={{ marginHorizontal: 16, marginVertical: 24 }}>
        <TouchableOpacity activeOpacity={0.9} style={{ backgroundColor: '#7C3AED', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }}>
          <View style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Ticket size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>Frete grátis para todo o Brasil</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>em compras acima de R$199</Text>
          </View>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 5. COLLECTIONS SECTION */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#1E1B4B' }}>Coleções</Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 13, color: '#7C3AED', fontWeight: 'bold' }}>Ver tudo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {/* Collection 1 */}
          <TouchableOpacity activeOpacity={0.9} style={{ width: 110, height: 140, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <RNImage source={{ uri: 'https://images.unsplash.com/photo-1523398002811-999aa8d9512e?q=80&w=300&auto=format&fit=crop' }} style={{ width: '100%', height: '100%' }} />
            <LinearGradient colors={['transparent', 'rgba(15,23,42,0.9)']} style={{ ...StyleSheet.absoluteFillObject }} />
            <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>Streetwear</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>120 itens</Text>
            </View>
          </TouchableOpacity>
          {/* Collection 2 */}
          <TouchableOpacity activeOpacity={0.9} style={{ width: 110, height: 140, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <RNImage source={{ uri: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop' }} style={{ width: '100%', height: '100%' }} />
            <LinearGradient colors={['transparent', 'rgba(15,23,42,0.9)']} style={{ ...StyleSheet.absoluteFillObject }} />
            <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>Básicos</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>85 itens</Text>
            </View>
          </TouchableOpacity>
          {/* Collection 3 */}
          <TouchableOpacity activeOpacity={0.9} style={{ width: 110, height: 140, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <RNImage source={{ uri: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=300&auto=format&fit=crop' }} style={{ width: '100%', height: '100%' }} />
            <LinearGradient colors={['transparent', 'rgba(15,23,42,0.9)']} style={{ ...StyleSheet.absoluteFillObject }} />
            <View style={{ position: 'absolute', bottom: 12, left: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>Premium</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>56 itens</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FC' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {loading && currentPage === 1 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ color: '#64748B', marginTop: 12, fontSize: 14 }}>Buscando produtos...</Text>
        </View>
      ) : error && products.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchProducts(1, searchQuery, selectedCategory, selectedSort)} style={{ backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderProductCard}
          contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 16 }}
          ListHeaderComponent={renderListHeader()}
          ListFooterComponent={renderListFooter()}
          ListEmptyComponent={
            !loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Search size={28} color="#94A3B8" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B' }}>Nenhum produto encontrado</Text>
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Tente buscar por outros termos.</Text>
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => {
          setSelectedCategory(filters.categoryId);
          setSelectedSort(filters.sort);
          setCurrentPage(1);
          fetchProducts(1, searchQuery, filters.categoryId, filters.sort);
        }}
        categories={categories}
        initialFilters={{ categoryId: selectedCategory, sort: selectedSort }}
        totalResults={products.length}
      />
    </View>
  );
};

export default ProductsScreen;