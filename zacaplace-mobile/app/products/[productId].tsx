import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Dimensions,
  TouchableOpacity, FlatList, Image, Linking, Platform, Modal, TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, ApiError } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Heart, MessageCircle, Share2, Tag, Store, ChevronLeft,
  CheckCircle2, ShoppingCart, Shield, Zap, Truck, Star, Package,
  Camera, X
} from 'lucide-react-native';
import { ProductScrollArea } from '../../components/ProductScrollArea';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlert } from '../../components/ui/CustomAlert';

interface RelatedProduct {
  id: string; name: string; price: number; images: string[];
  user: { storeName?: string | null; name?: string | null; };
}

interface ProductReview {
  id: string; rating: number; comment: string | null; images: string[]; createdAt: string;
  user: { id: string; name: string | null; image: string | null; storeName: string | null; };
}

interface ReviewsData {
  reviews: ProductReview[]; averageRating: number; totalReviews: number;
  distribution: Record<number, number>;
}

interface ProductDetail {
  id: string; name: string; description: string; price: number;
  originalPrice?: number | null; images: string[]; quantity: number;
  condition: string; onPromotion: boolean; isService: boolean;
  averageRating?: number; totalReviews?: number;
  user?: { id: string; name: string | null; storeName: string | null; image: string | null; whatsappLink: string | null; };
  category?: { id: string; name: string; } | null;
}

interface RelatedData { relatedProducts: RelatedProduct[]; moreFromSeller: RelatedProduct[]; }

const { width: SW } = Dimensions.get('window');
const conditionLabels: Record<string, string> = {
  NEW: 'Novo', GOOD_CONDITION: 'Excelente', USED: 'Usado', REFURBISHED: 'Recondicionado', OTHER: 'Outro',
};

const ProductDetailScreen = () => {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const imageScrollRef = useRef<ScrollView>(null);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isReserving, setIsReserving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMedia, setReviewMedia] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<{uri: string, type: 'image' | 'video'} | null>(null);

  const isVideo = (uri: string) => /\.(mp4|mov|m4v)$/i.test(uri);

  // Countdown timer state
  const [countdown, setCountdown] = useState({ h: 2, m: 45, s: 31 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 0; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!productId) return;
    const fetchAll = async () => {
      try {
        setLoading(true); setError(null);
        const res = await apiClient.get<ProductDetail>(`/api/products/${productId}`);
        setProduct(res.data);
        const [rel, rev] = await Promise.all([
          apiClient.get<RelatedData>(`/api/products/${productId}/related`),
          apiClient.get<ReviewsData>(`/api/products/${productId}/reviews`),
        ]);
        setRelatedData(rel.data);
        setReviewsData(rev.data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar produto');
      } finally { setLoading(false); }
    };
    fetchAll();
  }, [productId]);

  const handleAuthCheck = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      CustomAlert.alert("Login Necessário", "Faça login para continuar.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Login", onPress: () => router.push('/auth/login') }
      ]);
      return false;
    }
    return true;
  };

  const handleReserve = async () => {
    if (!await handleAuthCheck()) return;
    setIsReserving(true);
    try {
      await apiClient.post<any>('/api/reservations', { productId: product?.id, quantity });
      CustomAlert.alert('Sucesso!', 'Produto reservado com sucesso!');
    } catch (e: any) {
      CustomAlert.alert('Erro', e instanceof ApiError ? (e.data.message || e.message) : (e.message || 'Falha ao reservar.'));
    } finally { setIsReserving(false); }
  };

  const handleFavorite = async () => {
    if (!await handleAuthCheck()) return;
    try {
      await apiClient.post('/api/favorites', { productId: product?.id });
      setIsFavorited(!isFavorited);
    } catch (e: any) {
      CustomAlert.alert('Erro', e.message || 'Falha ao favoritar.');
    }
  };

  const handleShare = async () => {
    try {
      const appUrl = 'https://zacaplace.vercel.app';
      const res = await apiClient.post<{ shortCode: string }>('/api/shortener', {
        productId: product?.id, originalUrl: `${appUrl}/products/${product?.id}`,
        title: product?.name, description: product?.description, imageUrl: product?.images?.[0] || null,
      });
      CustomAlert.alert("Link copiado!", `${appUrl}/s/${res.data.shortCode}`);
    } catch (e: any) {
      CustomAlert.alert('Erro', e.message || 'Não foi possível gerar o link.');
    }
  };

  const handleContact = () => {
    if (!product?.user?.whatsappLink) { CustomAlert.alert("Erro", "WhatsApp não disponível."); return; }
    const msg = `Olá! Vi o "${product.name}" no Zacaplace por ${formatPrice(product.price)}. Tenho interesse!`;
    Linking.openURL(`https://wa.me/${product.user.whatsappLink.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);

  const scrollToImage = (idx: number) => {
    setActiveImgIdx(idx);
    imageScrollRef.current?.scrollTo({ x: idx * SW, animated: true });
  };

  const handleReviewSubmit = async () => {
    if (reviewRating < 1 || reviewRating > 5) return;
    try {
      setIsSubmittingReview(true);
      await apiClient.post(`/api/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        images: reviewMedia
      });
      CustomAlert.alert('Sucesso', 'Avaliação enviada com sucesso!');
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(5);
      setReviewMedia([]);

      // Refresh reviews
      const rev = await apiClient.get<ReviewsData>(`/api/products/${productId}/reviews`);
      setReviewsData(rev.data);
    } catch (err: any) {
      CustomAlert.alert('Erro', err.message || 'Erro ao enviar avaliação.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const pickReviewMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      CustomAlert.alert('Permissão necessária', 'Precisamos da permissão para acessar sua galeria.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 4,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setReviewMedia(prev => [...prev, ...newUris].slice(0, 4)); // Max 4 items
    }
  };

  const removeReviewMedia = (uriToRemove: string) => {
    setReviewMedia(prev => prev.filter(uri => uri !== uriToRemove));
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FC' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Carregando...</Text>
    </View>
  );

  if (error || !product) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FC', padding: 20 }}>
      <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>{error || 'Produto não encontrado.'}</Text>
      <TouchableOpacity style={{ backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 }} onPress={() => router.back()}>
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const isOnSale = product.onPromotion && product.originalPrice && product.originalPrice > product.price;
  const discount = isOnSale ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;
  const installment = (product.price / 12).toFixed(2).replace('.', ',');
  const images = product.images?.length > 0 ? product.images : ['https://via.placeholder.com/400'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FC' }}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

        {/* ═══ 1. HERO IMAGE GALLERY ═══ */}
        <View style={{ height: 420, backgroundColor: '#E8E0F0', position: 'relative' }}>
          {/* Gradient background */}
          <LinearGradient colors={['#D8D0E8', '#E8E0F0', '#F0EBF8']} style={StyleSheet.absoluteFill} />

          {/* Full-width image carousel */}
          <ScrollView
            ref={imageScrollRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveImgIdx(Math.round(e.nativeEvent.contentOffset.x / SW))}
            style={{ flex: 1 }}
          >
            {images.map((img, i) => (
              <View key={i} style={{ width: SW, height: 420, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: img }} style={{ width: SW, height: 420 }} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>

          {/* Floating Header Buttons */}
          <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <ChevronLeft size={24} color="#1E1B4B" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={handleShare} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
                <Share2 size={20} color="#1E1B4B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFavorite} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
                <Heart size={20} color={isFavorited ? '#EF4444' : '#1E1B4B'} fill={isFavorited ? '#EF4444' : 'none'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Discount Badge */}
          {isOnSale && (
            <View style={{ position: 'absolute', top: insets.top + 64, left: 16, backgroundColor: '#7C3AED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, zIndex: 10 }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>-{discount}%</Text>
            </View>
          )}

          {/* Image Counter */}
          <View style={{ position: 'absolute', bottom: 80, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>{activeImgIdx + 1} / {images.length}</Text>
          </View>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                {images.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => scrollToImage(i)}
                    style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', borderWidth: 2.5, borderColor: activeImgIdx === i ? '#7C3AED' : 'rgba(255,255,255,0.6)', backgroundColor: '#FFF' }}>
                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ═══ 2. CONTENT CARD (White rounded top) ═══ */}
        <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24, paddingTop: 24, paddingHorizontal: 20 }}>

          {/* Seller Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: product.user?.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100' }}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' }}
            />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1B4B' }}>
                  {product.user?.storeName || product.user?.name || 'Loja'}
                </Text>
                <CheckCircle2 size={16} color="#3B82F6" fill="#3B82F6" />
              </View>
              <Text style={{ fontSize: 12, color: '#7C3AED', fontWeight: '600' }}>Loja oficial</Text>
            </View>
          </View>

          {/* Product Name */}
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1E1B4B', marginBottom: 16, letterSpacing: -0.3 }}>
            {product.name}
          </Text>

          {/* Price Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#7C3AED' }}>
                {formatPrice(product.price)}
              </Text>
              {isOnSale && (
                <Text style={{ fontSize: 16, color: '#9CA3AF', textDecorationLine: 'line-through', fontWeight: '600' }}>
                  {formatPrice(product.originalPrice!)}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={16} color="#FBBF24" fill="#FBBF24" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E1B4B' }}>{(product.averageRating || 0).toFixed(1)}</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>({product.totalReviews || 0})</Text>
            </View>
          </View>

          {/* Installments */}
          <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
            ou 12x de <Text style={{ color: '#7C3AED', fontWeight: '700' }}>R$ {installment}</Text> sem juros
          </Text>

          {/* Limited Time Banner */}
          {isOnSale && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3F0FF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color="#7C3AED" fill="#7C3AED" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#4C1D95' }}>Preço especial por tempo limitado!</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#7C3AED' }}>
                {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:{String(countdown.s).padStart(2, '0')}
              </Text>
            </View>
          )}

          {/* Condition & Stock */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {product.condition && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F0FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 }}>
                <Tag size={12} color="#7C3AED" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C3AED' }}>{conditionLabels[product.condition] || product.condition}</Text>
              </View>
            )}
            {product.quantity > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 }}>
                <Package size={12} color="#10B981" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>{product.quantity} em estoque</Text>
              </View>
            )}
          </View>

          {/* Delivery Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Truck size={20} color="#1E1B4B" />
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B' }}>Entrega</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Receba entre 14 e 16 de Maio</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>Frete grátis</Text>
            </View>
          </View>

          {/* Description */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 }}>Descrição</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#64748B' }}>{product.description}</Text>
          </View>

          {/* Security Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 }}>
            <Shield size={18} color="#7C3AED" />
            <Text style={{ fontSize: 12, color: '#64748B', flex: 1, lineHeight: 18 }}>
              A reserva garante prioridade de negociação direta com o vendedor. Compra 100% segura.
            </Text>
          </View>
        </View>

        {/* ═══ REVIEWS SECTION ═══ */}
        {reviewsData && (
          <View style={{ backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 8, borderBottomColor: '#F8F9FC' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Avaliações do Produto</Text>
              <Text style={{ fontSize: 14, color: '#7C3AED', fontWeight: '700' }}>Ver todas</Text>
            </View>

            {reviewsData.totalReviews > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 40, fontWeight: '900', color: '#1E1B4B' }}>{reviewsData.averageRating.toFixed(1)}</Text>
                  <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} color={star <= Math.round(reviewsData.averageRating) ? '#FBBF24' : '#E5E7EB'} fill={star <= Math.round(reviewsData.averageRating) ? '#FBBF24' : '#E5E7EB'} />
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>{reviewsData.totalReviews} avaliações</Text>
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewsData.distribution?.[star] || 0;
                    const percent = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                    return (
                      <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#64748B', width: 10 }}>{star}</Text>
                        <View style={{ flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <View style={{ width: `${percent}%`, height: '100%', backgroundColor: '#FBBF24', borderRadius: 3 }} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: '#64748B', marginBottom: 16 }}>Este produto ainda não tem avaliações.</Text>
              </View>
            )}

            {reviewsData.reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Image source={{ uri: review.user.image || 'https://via.placeholder.com/40' }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B' }}>{review.user.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} size={12} color={star <= review.rating ? '#FBBF24' : '#E5E7EB'} fill={star <= review.rating ? '#FBBF24' : '#E5E7EB'} />
                        ))}
                      </View>
                      <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</Text>
                    </View>
                  </View>
                </View>
                {review.comment && <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 }}>{review.comment}</Text>}
                {review.images && review.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {review.images.map((img, i) => {
                      const video = isVideo(img);
                      return (
                        <TouchableOpacity key={i} onPress={() => setFullScreenMedia({ uri: img, type: video ? 'video' : 'image' })} style={{ position: 'relative' }}>
                          {video ? (
                            <View style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                              <Video source={{ uri: img }} resizeMode={ResizeMode.COVER} style={{ width: '100%', height: '100%', opacity: 0.7 }} />
                              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                                  <View style={{ width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 8, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#000', marginLeft: 3 }} />
                                </View>
                              </View>
                            </View>
                          ) : (
                            <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#F8FAFC' }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ))}

            <TouchableOpacity onPress={() => setIsReviewModalOpen(true)} style={{ backgroundColor: '#F3F0FF', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#7C3AED', fontWeight: '800', fontSize: 14 }}>Avaliar este produto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ 3. RELATED PRODUCTS ═══ */}
        <View style={{ backgroundColor: '#FFF' }}>
          {relatedData?.moreFromSeller && relatedData.moreFromSeller.length > 0 && (
            <ProductScrollArea
              title={`Mais de ${product.user?.storeName || product.user?.name}`}
              products={relatedData.moreFromSeller}
              href={`/seller/${product.user?.id}` as any}
              isDark={false}
            />
          )}
          {relatedData?.relatedProducts && relatedData.relatedProducts.length > 0 && (
            <ProductScrollArea
              title="Produtos Relacionados"
              products={relatedData.relatedProducts}
              href={`/categories/${product.category?.id}` as any}
              isDark={false}
            />
          )}
        </View>
      </ScrollView>

      {/* ═══ 4. STICKY BOTTOM ACTION BAR ═══ */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        paddingTop: 12, paddingBottom: insets.bottom + 12, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
      }}>
        {/* Store icon */}
        <TouchableOpacity onPress={() => product?.user?.id && router.push(`/sellers/${product.user.id}` as any)} style={{ alignItems: 'center', paddingHorizontal: 4 }}>
          <Store size={20} color="#64748B" />
          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Loja</Text>
        </TouchableOpacity>

        {/* Chat icon */}
        <TouchableOpacity onPress={handleContact} style={{ alignItems: 'center', paddingHorizontal: 4 }}>
          <MessageCircle size={20} color="#64748B" />
          <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 2 }}>Chat</Text>
        </TouchableOpacity>

        {/* Buy Now */}
        <TouchableOpacity onPress={handleReserve} disabled={isReserving} style={{ flex: 1, height: 50, borderRadius: 25, overflow: 'hidden' }}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {isReserving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Zap size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>Comprar agora</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Add to Cart */}
        <TouchableOpacity style={{ height: 50, paddingHorizontal: 16, borderRadius: 25, backgroundColor: '#F3F0FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E9E5F5' }}>
          <ShoppingCart size={18} color="#7C3AED" />
          <Text style={{ color: '#7C3AED', fontSize: 12, fontWeight: '800' }} numberOfLines={1}>Carrinho</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ REVIEW MODAL ═══ */}
      <Modal visible={isReviewModalOpen} transparent animationType="slide" onRequestClose={() => setIsReviewModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: insets.bottom + 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E1B4B' }}>Avaliar Produto</Text>
              <TouchableOpacity onPress={() => setIsReviewModalOpen(false)}>
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: '#475569', marginBottom: 12, textAlign: 'center' }}>Toque nas estrelas para avaliar</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <Star size={36} color={star <= reviewRating ? '#FBBF24' : '#E5E7EB'} fill={star <= reviewRating ? '#FBBF24' : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 8 }}>Seu comentário (opcional)</Text>
            <TextInput
              style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 14, color: '#1E1B4B', marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}
              placeholder="O que você achou do produto?"
              placeholderTextColor="#9CA3AF"
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B' }}>Adicionar fotos ou vídeos</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>{reviewMedia.length}/4</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {reviewMedia.length < 4 && (
                  <TouchableOpacity onPress={pickReviewMedia} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
                    <Camera size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {reviewMedia.map((uri, idx) => {
                    const video = isVideo(uri);
                    return (
                      <View key={idx} style={{ position: 'relative' }}>
                        {video ? (
                          <View style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                            <Video source={{ uri }} resizeMode={ResizeMode.COVER} style={{ width: '100%', height: '100%', opacity: 0.7 }} />
                          </View>
                        ) : (
                          <Image source={{ uri }} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: '#F1F5F9' }} />
                        )}
                        <TouchableOpacity onPress={() => removeReviewMedia(uri)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              disabled={isSubmittingReview}
              onPress={handleReviewSubmit}
              style={{ backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 16, alignItems: 'center', opacity: isSubmittingReview ? 0.7 : 1 }}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Enviar Avaliação</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* ═══ FULL SCREEN MEDIA VIEWER ═══ */}
      <Modal visible={!!fullScreenMedia} transparent animationType="fade" onRequestClose={() => setFullScreenMedia(null)}>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setFullScreenMedia(null)} style={{ position: 'absolute', top: insets.top + 20, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          {fullScreenMedia?.type === 'video' ? (
            <Video
              source={{ uri: fullScreenMedia.uri }}
              style={{ width: SW, height: SW * 1.5 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
            />
          ) : (
            <Image 
              source={{ uri: fullScreenMedia?.uri || '' }} 
              style={{ width: SW, height: SW * 1.5 }} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>

    </View>
  );
};

export default ProductDetailScreen;