import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Linking,
  Modal,
  RefreshControl,
} from 'react-native';
import { View, Text } from '@/components/tw';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiError } from '../../services/api';
import { UserStatusDisplay } from '../../components/dashboard/UserStatusDisplay';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  Edit3,
  Trash2,
  ShoppingBag,
  Plus,
  LogOut,
  Store,
  Rocket,
  Crown,
  Zap,
  Send,
  Eye,
  TrendingUp,
  ChevronRight,
  ExternalLink
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CustomAlert } from '../../components/ui/CustomAlert';

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number | null;
  priceType: string;
  isSold: boolean;
  isReserved: boolean;
  isService: boolean;
}

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

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch (e) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
};

const DashboardScreen = () => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status & Carousel States
  const [statusData, setStatusData] = useState<UserStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [selectedCarouselProductId, setSelectedCarouselProductId] = useState<string>('');
  const [isSubmittingCarousel, setIsSubmittingCarousel] = useState(false);
  const [isProductPickerVisible, setIsProductPickerVisible] = useState(false);
  const [boostingProductId, setBoostingProductId] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = false; // Forced to light theme
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Premium design color scheme
  const colors = {
    background: isDark ? '#0A0A0C' : '#F8FAFC',
    surface: isDark ? '#121216' : '#FFFFFF',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    primary: '#7C3AED',
    primaryLight: isDark ? 'rgba(124, 58, 237, 0.15)' : '#EDE9FE',
    white: '#FFFFFF',
    danger: '#EF4444',
    dangerLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
    success: '#22C55E',
    successLight: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
    blue: '#3B82F6',
    blueLight: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
    yellow: '#EAB308',
    yellowLight: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3',
  };

  const fetchUserData = async (token: string) => {
    try {
      const data = await apiClient.get<any>('/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(data.data);
    } catch (error: any) {
      console.error('Erro ao buscar dados do usuário:', error);
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao buscar dados do usuário.');
      }
    }
  };

  const fetchStatus = async (token: string) => {
    setIsLoadingStatus(true);
    try {
      const response = await apiClient.get<UserStatusData>('/api/user/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStatusData(response.data);
    } catch (error) {
      console.error("Falha ao buscar status do usuário:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchUserProducts = async () => {
    if (!userData?.id) return;
    setIsLoadingProducts(true);
    try {
      const response = await apiClient.get<{ products: Product[] }>(`/api/products?userId=${userData.id}`);
      setProducts(response.data.products || []);
      setProductError(null);
    } catch (error: any) {
      console.error('Falha ao buscar produtos do usuário:', error);
      setProductError(error.message || 'Não foi possível carregar seus produtos.');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const getData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
      if (token) {
        await Promise.all([
          fetchUserData(token),
          fetchStatus(token)
        ]);
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Erro ao recuperar token ou buscar dados:', error);
      router.replace('/auth/login');
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (userData?.id) {
      fetchUserProducts();
    }
  }, [userData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      await Promise.all([
        fetchUserData(token),
        fetchStatus(token),
        fetchUserProducts()
      ]);
    }
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    CustomAlert.alert(
      'Confirmar Saída',
      'Tem certeza que deseja sair de sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              setUserToken(null);
              setUserData(null);
              router.replace('/auth/login');
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          }
        }
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete<any>(`/api/products/${productToDelete.id}`);
      CustomAlert.alert('Sucesso!', `Item "${productToDelete.name}" excluído!`);
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao excluir o produto.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    CustomAlert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o item "${product.name}"? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel", onPress: () => setProductToDelete(null) },
        { text: "Confirmar Exclusão", style: "destructive", onPress: handleConfirmDelete },
      ],
      { cancelable: true }
    );
  };

  const handleCarouselSubmit = async () => {
    if (!selectedCarouselProductId) {
      CustomAlert.alert("Aviso", "Por favor, selecione um produto.");
      return;
    }
    const purchaseId = statusData?.availableCarouselPurchases?.[0]?.id;
    if (!purchaseId) {
      CustomAlert.alert("Erro", "Nenhum crédito de carrossel disponível.");
      return;
    }

    setIsSubmittingCarousel(true);
    try {
      await apiClient.post('/api/carousel-request', {
        productId: selectedCarouselProductId,
        purchaseId: purchaseId
      });
      CustomAlert.alert("Sucesso!", "Solicitação de divulgação enviada para aprovação do admin!");
      setSelectedCarouselProductId('');
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await fetchStatus(token);
      }
    } catch (error: any) {
      console.error("Erro ao enviar carrossel:", error);
      if (error instanceof ApiError) {
        CustomAlert.alert("Erro", error.data.message || error.message);
      } else {
        CustomAlert.alert("Erro", "Ocorreu um erro ao enviar solicitação.");
      }
    } finally {
      setIsSubmittingCarousel(false);
    }
  };

  const handleBoostCheckout = async (productId: string) => {
    setBoostingProductId(productId);
    try {
      // Create payment checkout session for the turbo price
      const response = await apiClient.post<{ url: string }>('/api/stripe/checkout-session', {
        priceId: 'price_1Rc8G5DKuwlnHiVMbNUr3SFK',
        productId,
        type: 'payment'
      });

      const checkoutUrl = response.data.url;
      if (checkoutUrl) {
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
        } else {
          CustomAlert.alert("Erro", "Não foi possível abrir o link de pagamento.");
        }
      } else {
        CustomAlert.alert("Erro", "URL de checkout inválida recebida.");
      }
    } catch (error: any) {
      console.error("Erro no checkout turbo:", error);
      if (error instanceof ApiError) {
        CustomAlert.alert("Erro", error.data.message || error.message);
      } else {
        CustomAlert.alert("Erro", "Ocorreu um erro ao iniciar pagamento.");
      }
    } finally {
      setBoostingProductId(null);
    }
  };

  const handleViewPlans = async () => {
    const url = 'https://zacaplace.vercel.app/planos';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      CustomAlert.alert("Erro", "Não foi possível abrir o link dos planos.");
    }
  };

  const activeProductsCount = products.filter(p => !p.isSold).length;
  const reservedProductsCount = products.filter(p => p.isReserved).length;
  const turboProductsCount = statusData?.boostedProducts?.length || 0;
  const hasAvailableCarousel = statusData?.availableCarouselPurchases && statusData.availableCarouselPurchases.length > 0;

  const renderHeader = () => (
    <View style={{ marginBottom: 16 }}>
      {/* HERO BANNER */}
      <LinearGradient
        colors={['#4F46E5', '#1E1B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={[styles.badge, { backgroundColor: statusData?.hasActiveSubscription ? '#EAB308' : 'rgba(255,255,255,0.15)' }]}>
            <Crown size={12} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>
              {statusData?.hasActiveSubscription ? 'Membro Pro' : 'Conta Grátis'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>Bem-vindo de volta, {userData?.name ? userData.name.split(' ')[0] : 'Vendedor'}!</Text>
          <Text style={styles.heroSubtitle}>Acompanhe suas métricas, impulsione seus achadinhos e impulsione suas vendas.</Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => router.push('/dashboard/add-product')}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#4F46E5" style={{ marginRight: 4 }} />
            <Text style={styles.heroBtnText}>Adicionar Item</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* METRICS ROW (2x2 GRID) */}
      <View style={styles.metricsGrid}>
        <GlassCard style={styles.metricCard} isLight={true}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Itens Ativos</Text>
            <Store size={16} color={colors.primary} />
          </View>
          <Text style={[styles.metricVal, { color: colors.text }]}>
            {isLoadingProducts ? '-' : activeProductsCount}
          </Text>
          <Text style={[styles.metricDesc, { color: colors.textMuted }]}>Prontos a vender</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard} isLight={true}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Reservas</Text>
            <ShoppingBag size={16} color="#EAB308" />
          </View>
          <Text style={[styles.metricVal, { color: colors.text }]}>
            {isLoadingProducts ? '-' : reservedProductsCount}
          </Text>
          <Text style={[styles.metricDesc, { color: '#EAB308', fontWeight: '600' }]}>Aguardando fecho</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard} isLight={true}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Impulsos</Text>
            <Rocket size={16} color="#3B82F6" />
          </View>
          <Text style={[styles.metricVal, { color: '#3B82F6' }]}>
            {isLoadingStatus ? '-' : turboProductsCount}
          </Text>
          <Text style={[styles.metricDesc, { color: colors.textMuted }]}>Produtos turbinados</Text>
        </GlassCard>

        <GlassCard style={[styles.metricCard, { opacity: 0.7 }]} isLight={true}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Visitas</Text>
            <Eye size={16} color={colors.textMuted} />
          </View>
          <Text style={[styles.metricVal, { color: colors.text }]}>--</Text>
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>BREVE</Text>
          </View>
        </GlassCard>
      </View>

      {/* CAROUSEL REQUEST CARD */}
      {hasAvailableCarousel && (
        <GlassCard style={[styles.carouselCard, { borderLeftWidth: 4, borderLeftColor: '#EF4444', backgroundColor: isDark ? 'rgba(239,68,68,0.06)' : '#FEF2F2' }]} isLight={true}>
          <View style={styles.carouselHeader}>
            <Zap size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={[styles.carouselTitle, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>Carrossel na Praça</Text>
          </View>
          <Text style={[styles.carouselDesc, { color: colors.textMuted }]}>
            Você tem <Text style={{ fontWeight: 'bold', color: colors.text }}>{statusData?.availableCarouselPurchases?.length}</Text> crédito(s). Divulgue seu produto no Instagram oficial do Zaca!
          </Text>

          <TouchableOpacity
            style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setIsProductPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerBtnText, { color: selectedCarouselProductId ? colors.text : colors.textMuted }]} numberOfLines={1}>
              {selectedCarouselProductId
                ? products.find(p => p.id === selectedCarouselProductId)?.name || 'Produto Selecionado'
                : 'Escolha um produto...'
              }
            </Text>
            <ChevronRight size={16} color={colors.textMuted} style={{ transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.carouselSubmitBtn, { backgroundColor: '#EF4444', opacity: selectedCarouselProductId ? 1 : 0.6 }]}
            onPress={handleCarouselSubmit}
            disabled={isSubmittingCarousel || !selectedCarouselProductId}
            activeOpacity={0.8}
          >
            {isSubmittingCarousel ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Send size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.carouselSubmitText}>Enviar para Divulgação</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* PLANS & STATUS DISPLAY */}
      <UserStatusDisplay isLight={true} />

      {/* INVENTORY HEADER */}
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inventário da Loja</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Gerencie seus achadinhos e impulsione vendas.</Text>
        </View>
      </View>

      {isLoadingProducts && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      )}

      {productError && (
        <View className="bg-red-50 border border-red-200 p-5 rounded-2xl items-center mt-4">
          <Text style={{ color: colors.danger }}>{productError}</Text>
        </View>
      )}

      {!isLoadingProducts && products.length === 0 && (
        <GlassCard style={{ padding: 32, alignItems: 'center', marginTop: 12 }} isLight={true}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <ShoppingBag size={32} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>Nenhum item cadastrado</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4, fontSize: 13 }}>Adicione seu primeiro produto ou serviço para começar a vender!</Text>
        </GlassCard>
      )}
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const isBoosted = statusData?.boostedProducts?.some(bp => bp.id === item.id);
    return (
      <GlassCard style={styles.productRowCard} isLight={true}>
        <View style={styles.rowLayout}>
          <Image
            source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
            style={styles.productRowImg}
            resizeMode="cover"
          />
          <View style={styles.productRowInfo}>
            <Text style={[styles.productRowName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.productRowPrice}>
              {item.priceType === 'ON_BUDGET' ? 'Sob Consulta' : formatCurrency(item.price || 0)}
            </Text>

            <View style={styles.badgeContainer}>
              {item.isSold && (
                <View style={[styles.itemBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                  <Text style={[styles.itemBadgeText, { color: colors.textMuted }]}>Vendido</Text>
                </View>
              )}
              {item.isReserved && (
                <View style={[styles.itemBadge, { backgroundColor: colors.yellowLight, borderColor: colors.yellow, borderWidth: 1 }]}>
                  <Text style={[styles.itemBadgeText, { color: '#CA8A04' }]}>Reservado</Text>
                </View>
              )}
              {isBoosted && (
                <View style={[styles.itemBadge, { backgroundColor: colors.blueLight }]}>
                  <Rocket size={10} color="#3B82F6" style={{ marginRight: 3 }} />
                  <Text style={[styles.itemBadgeText, { color: '#3B82F6' }]}>Turbo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Columns */}
          <View style={styles.rowActions}>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/products/${item.id}`)}
                activeOpacity={0.7}
              >
                <ExternalLink size={14} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/dashboard/edit-product/${item.id}`)}
                activeOpacity={0.7}
              >
                <Edit3 size={14} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconActionBtn, { backgroundColor: colors.dangerLight }]}
                onPress={() => openDeleteDialog(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Turbinar Action */}
            {!isBoosted && !item.isSold && (
              <TouchableOpacity
                style={[styles.rowBoostBtn, { backgroundColor: colors.blueLight }]}
                onPress={() => handleBoostCheckout(item.id)}
                disabled={boostingProductId === item.id}
                activeOpacity={0.8}
              >
                {boostingProductId === item.id ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <Rocket size={11} color="#3B82F6" style={{ marginRight: 3 }} />
                    <Text style={styles.rowBoostText}>Turbinar</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </GlassCard>
    );
  };

  if (isLoadingUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 12, fontSize: 15 }}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* TOP BLURRY HEADER */}
      <BlurView
        intensity={Platform.OS === 'android' ? 80 : 100}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.topHeader, { paddingTop: insets.top, borderBottomColor: colors.border }]}
      >
        <Image
          source={require('@/assets/images/zacalogo.png')}
          style={[styles.logoImage, isDark && { tintColor: '#FFFFFF' }]}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.logoutBtnText}>Sair</Text>
        </TouchableOpacity>
      </BlurView>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          <View style={{ marginTop: 24, paddingBottom: 40, alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.viewPlansBtn, { borderColor: colors.border }]}
              onPress={handleViewPlans}
              activeOpacity={0.7}
            >
              <Crown size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.viewPlansBtnText, { color: colors.text }]}>Ver todos os Planos</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 60 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={insets.top + 60}
          />
        }
      />

      {/* PRODUCT PICKER MODAL */}
      <Modal
        visible={isProductPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProductPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Produto</Text>
              <TouchableOpacity onPress={() => setIsProductPickerVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={products.filter(p => !p.isSold && !p.isReserved && !p.isService)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedCarouselProductId(item.id);
                    setIsProductPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
                    style={styles.pickerItemImg}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                      {item.priceType === 'ON_BUDGET' ? 'Sob Consulta' : formatCurrency(item.price || 0)}
                    </Text>
                  </View>
                  {selectedCarouselProductId === item.id && (
                    <View style={[styles.pickerCheck, { backgroundColor: colors.primaryLight }]}>
                      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Nenhum produto físico disponível para carrossel no momento.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  logoImage: {
    width: 100,
    height: 32,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scrollContainer: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  heroBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  heroContent: {
    zIndex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#4F46E5',
    fontWeight: 'bold',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricDesc: {
    fontSize: 10,
    fontWeight: '500',
  },
  soonBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soonText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748B',
  },
  carouselCard: {
    padding: 16,
    marginBottom: 20,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  pickerBtnText: {
    fontSize: 14,
    flex: 1,
  },
  carouselSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  carouselSubmitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  productRowCard: {
    padding: 12,
    marginBottom: 12,
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRowImg: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  productRowInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  productRowName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productRowPrice: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  rowActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 64,
  },
  topActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBoostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rowBoostText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  pickerItemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  pickerItemName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pickerCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPlansBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  viewPlansBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
