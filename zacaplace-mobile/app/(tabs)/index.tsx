import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Alert,
  Image as RNImage,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { View, Text, TextInput as RNTextInput, Pressable, ScrollView } from '@/components/tw';
import { Stack, useRouter } from 'expo-router';
import { apiClient } from '../../services/api';
import { ProductCard, Product as ProductType } from '../../components/ProductCard';
import {
  ShoppingCart,
  Heart,
  MapPin,
  ChevronDown,
  Search,
  Send,
  X,
  Sparkles,
  Compass,
  ArrowRight,
  User,
  MessageSquare,
  Rocket,
  Star,
  Store,
  TrendingUp,
  ShoppingBag,
  Smartphone,
  Wrench,
  Car,
  Shirt,
  Home,
  Play,
  Menu,
  SlidersHorizontal,
  LayoutGrid,
  Coffee,
  Dumbbell,
  Sofa,
  Zap,
  Check,
  Truck
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useSidebarStore } from '../../store/useSidebarStore';
import { CustomAlert } from '../../components/ui/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Weather SVG Animation Components ───────────────────────────
const WeatherSunny = () => {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="5" fill="#EAB308" />
        <Path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="#EAB308"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const WeatherCloudy = () => {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 2500, easing: Easing.ease }),
        withTiming(-3, { duration: 2500, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#94A3B8" />
      </Svg>
    </Animated.View>
  );
};

const WeatherRainy = () => {
  const rainY = useSharedValue(0);
  useEffect(() => {
    rainY.value = withRepeat(
      withTiming(4, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  const animatedRainStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rainY.value }],
  }));
  return (
    <View style={{ width: 18, height: 18 }}>
      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute' }}>
        <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#64748B" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', top: 10, left: 3 }, animatedRainStyle]}>
        <Svg width="12" height="8" viewBox="0 0 24 24" fill="none">
          <Path d="M8 22l-1-3M12 22l-1-3M16 22l-1-3" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const WeatherStormy = () => {
  const flash = useSharedValue(0);
  useEffect(() => {
    const interval = setInterval(() => {
      flash.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 120 }),
        withTiming(0.8, { duration: 80 }),
        withTiming(0, { duration: 150 })
      );
    }, 4500);
    return () => clearInterval(interval);
  }, []);
  const animatedFlashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));
  return (
    <View style={{ width: 18, height: 18 }}>
      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute' }}>
        <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#475569" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', top: 10, left: 6 }, animatedFlashStyle]}>
        <Svg width="6" height="10" viewBox="0 0 24 24" fill="none">
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#EAB308" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// ─── Location Mapping & Translation Helpers ───────────────────────
const STATE_TO_UF: { [key: string]: string } = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
  'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
  'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
  'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
  'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
  'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
  'Sergipe': 'SE', 'Tocantins': 'TO'
};

const mapStateToUF = (stateName: string): string => {
  if (!stateName) return 'MT';
  const clean = stateName.trim();
  if (clean.length === 2) return clean.toUpperCase();
  return STATE_TO_UF[clean] || 'MT';
};

// ─── Main Interface Typings ─────────────────────────────────────
interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
}

interface MobileProduct extends ProductType {
  categoryId?: string;
  priceType?: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface CustomSection {
  id: string;
  title: string;
  bannerImageUrl: string;
  bannerFontColor: string;
  products: MobileProduct[];
}

interface Seller {
  id: string;
  name: string;
  storeName?: string | null;
  image?: string | null;
  averageRating?: number;
  totalReviews?: number;
}

interface Category {
  id: string;
  name: string;
}

interface HomepageData {
  banners: Banner[];
  boostedProducts: MobileProduct[];
  sections: CustomSection[];
  discoveries: MobileProduct[];
  sellers?: Seller[];
  categories?: Category[];
}

// ─── Helper Helpers ─────────────────────────────────────────────
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

const getCategoryConfig = (name: string) => {
  const clean = name.toLowerCase();
  if (clean.includes('celular') || clean.includes('fone') || clean.includes('eletrôn')) {
    return { Icon: Smartphone };
  }
  if (clean.includes('serviço') || clean.includes('consert') || clean.includes('mão')) {
    return { Icon: Wrench };
  }
  if (clean.includes('carro') || clean.includes('moto') || clean.includes('veícul')) {
    return { Icon: Car };
  }
  if (clean.includes('moda') || clean.includes('roupa') || clean.includes('calçad') || clean.includes('vestuário')) {
    return { Icon: Shirt };
  }
  if (clean.includes('casa') || clean.includes('imóve') || clean.includes('apart')) {
    return { Icon: Home };
  }
  if (clean.includes('beleza') || clean.includes('cosmét') || clean.includes('maquia')) {
    return { Icon: Sparkles };
  }
  return { Icon: ShoppingBag };
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSidebar } = useSidebarStore();

  // Geolocation & Weather States
  const [cityName, setCityName] = useState('Cuiabá');
  const [stateUF, setStateUF] = useState('MT');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // User Profile Info
  const [userName, setUserName] = useState<string | null>(null);

  // Homepage Data
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  const filteredDiscoveries = useMemo(() => {
    const list = data?.discoveries || [];
    if (selectedCategoryTab === 'all') return list;
    return list.filter(item => item.categoryId === selectedCategoryTab);
  }, [data?.discoveries, selectedCategoryTab]);

  // Selector Modal States
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Ana Chat Modal States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSessionId] = useState(() => `mobile-chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const chatScrollRef = useRef<any>(null);

  // Active banner index & Ref
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const bannerScrollRef = useRef<any>(null);

  // Greetings based on local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // First name extraction
  const firstName = useMemo(() => {
    if (!userName) return 'visitante';
    return userName.trim().split(' ')[0];
  }, [userName]);

  // Weather condition mapping
  const weatherType = useMemo(() => {
    if (weatherCode === 0) return 'sunny';
    if ([1, 2, 3, 45, 48].includes(weatherCode)) return 'cloudy';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 71, 73, 75].includes(weatherCode)) return 'rainy';
    if ([95, 96, 99].includes(weatherCode)) return 'stormy';
    return 'sunny';
  }, [weatherCode]);

  // Load Saved Location or request permission on mount & Load User profile
  useEffect(() => {
    const initializeHome = async () => {
      // 1. Fetch User Profile
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const res = await apiClient.get<any>('/api/user', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.data && res.data.name) {
            setUserName(res.data.name);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do usuário na Home:', err);
      }

      // 2. Fetch Location
      try {
        const savedCity = await AsyncStorage.getItem('zaca_selected_city');
        const savedState = await AsyncStorage.getItem('zaca_selected_state');

        if (savedCity) {
          setCityName(savedCity);
          const stateVal = savedState !== null ? savedState : '';
          setStateUF(stateVal);

          if (savedCity === 'Todo o Brasil') {
            fetchWeatherForCity('Brasília', 'DF');
          } else {
            fetchWeatherForCity(savedCity, stateVal || 'MT');
          }
        } else {
          setIsLoadingLocation(true);
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const geocode = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            });
            if (geocode && geocode.length > 0) {
              const first = geocode[0];
              const city = first.subregion || first.city || first.district || 'Cuiabá';
              const state = mapStateToUF(first.region || 'MT');
              setCityName(city);
              setStateUF(state);
              await AsyncStorage.setItem('zaca_selected_city', city);
              await AsyncStorage.setItem('zaca_selected_state', state);
              fetchWeather(loc.coords.latitude, loc.coords.longitude);
            } else {
              fetchWeatherForCity('Cuiabá', 'MT');
            }
          } else {
            fetchWeatherForCity('Cuiabá', 'MT');
          }
        }
      } catch (err) {
        console.error('Falha ao inicializar localização:', err);
        fetchWeatherForCity('Cuiabá', 'MT');
      } finally {
        setIsLoadingLocation(false);
      }
    };

    initializeHome();
  }, []);

  // Auto-swipe banners every 10 seconds
  useEffect(() => {
    const banners = data?.banners || [];
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      const nextIdx = (activeBannerIdx + 1) % banners.length;
      bannerScrollRef.current?.scrollTo({
        x: nextIdx * SCREEN_WIDTH,
        animated: true,
      });
      setActiveBannerIdx(nextIdx);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [activeBannerIdx, data?.banners]);

  // Fetch Homepage Data when location state changes
  useEffect(() => {
    fetchHomepageData();
  }, [cityName, stateUF]);

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<HomepageData>(`/api/homepage?state=${encodeURIComponent(stateUF)}&city=${encodeURIComponent(cityName)}`);
      setData(res.data);
    } catch (error: any) {
      console.error('Erro ao buscar dados do consolidador da home:', error);
      CustomAlert.alert('Erro ao Carregar', 'Não foi possível carregar os dados da página inicial.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchHomepageData();
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const res = await apiClient.get<any>('/api/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data && res.data.name) {
          setUserName(res.data.name);
        }
      }
    } catch (err) {
      console.error('Erro ao recarregar dados na home:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      if (!res.ok) return;
      const text = await res.text();
      try {
        const weather = JSON.parse(text);
        if (weather && weather.current_weather) {
          setTemperature(weather.current_weather.temperature);
          setWeatherCode(weather.current_weather.weathercode);
        }
      } catch (parseError) {
        // Ignorar falha no parse silenciosamente
      }
    } catch (e) {
      // Ignorar erros de rede do clima silenciosamente
    }
  };

  const fetchWeatherForCity = async (city: string, state: string) => {
    try {
      const query = `${city}, ${state}, Brazil`;
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
      if (!res.ok) {
        fetchWeather(-15.601, -56.097);
        return;
      }
      const text = await res.text();
      try {
        const geocode = JSON.parse(text);
        if (geocode && geocode.results && geocode.results.length > 0) {
          const first = geocode.results[0];
          fetchWeather(first.latitude, first.longitude);
        } else {
          fetchWeather(-15.601, -56.097);
        }
      } catch (parseError) {
        fetchWeather(-15.601, -56.097);
      }
    } catch (e) {
      fetchWeather(-15.601, -56.097);
    }
  };

  // Location Selector Logic (IBGE)
  const openLocationModal = async () => {
    setIsLocModalOpen(true);
    setLoadingStates(true);
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      const data = await res.json();
      setStatesList(data);
    } catch (e) {
      console.error('Erro ao buscar estados do IBGE:', e);
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    if (!selectedState) {
      setCitiesList([]);
      return;
    }
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`);
        const data = await res.json();
        setCitiesList(data);
      } catch (e) {
        console.error('Erro ao buscar cidades do IBGE:', e);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedState]);

  const handleSaveLocation = async () => {
    if (!selectedState || !selectedCity) {
      CustomAlert.alert('Atenção', 'Selecione o estado e a cidade para prosseguir.');
      return;
    }
    setCityName(selectedCity);
    setStateUF(selectedState);
    await AsyncStorage.setItem('zaca_selected_city', selectedCity);
    await AsyncStorage.setItem('zaca_selected_state', selectedState);
    setIsLocModalOpen(false);
    fetchWeatherForCity(selectedCity, selectedState);
  };

  // Ana Chat Assistant logic
  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Olá! 👋 Eu sou a **Ana**, sua assistente inteligente no Zaca! Como posso te ajudar hoje? Pode me perguntar sobre produtos, preços ou lojas disponíveis!'
        }
      ]);
    }
  };

  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await apiClient.post<{ response: string }>('/api/chat', {
        chatInput: text,
        sessionId: chatSessionId
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.response
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error('Erro no assistente Ana:', error);
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpe, tive um probleminha de conexão com meu servidor. Tente novamente em alguns segundos!'
        }
      ]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderWeatherIcon = () => {
    switch (weatherType) {
      case 'sunny': return <WeatherSunny />;
      case 'cloudy': return <WeatherCloudy />;
      case 'rainy': return <WeatherRainy />;
      case 'stormy': return <WeatherStormy />;
      default: return <WeatherSunny />;
    }
  };

  const renderMasonryCard = (prod: MobileProduct, index: number) => {
    const isPromo = prod.onPromotion && prod.originalPrice && prod.originalPrice > prod.price;
    const discount = isPromo ? Math.round(((prod.originalPrice! - prod.price) / prod.originalPrice!) * 100) : 0;
    const priceFormatted = prod.priceType === 'ON_BUDGET' ? 'A combinar' : formatPrice(prod.price);
    
    // Pinterest style Masonry grid logic
    let imageHeight = 150;
    if (index % 4 === 0) imageHeight = 180;
    else if (index % 4 === 1) imageHeight = 140;
    else if (index % 4 === 2) imageHeight = 160;
    else imageHeight = 190;

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
        key={prod.id}
        onPress={() => router.push(`/products/${prod.id}`)}
        activeOpacity={0.9}
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 16,
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
        <View style={{ width: '100%', height: imageHeight, borderRadius: 16, backgroundColor: theme.imgBg, overflow: 'hidden', position: 'relative' }}>
          <LinearGradient 
            colors={isDark ? ['rgba(124,58,237,0.2)', 'transparent'] : ['rgba(224,231,255,0.8)', 'transparent']} 
            style={{ position: 'absolute', top: -20, left: -20, width: 120, height: 120, borderRadius: 60 }} 
          />
          <RNImage
            source={{ uri: prod.images[0] || 'https://via.placeholder.com/150' }}
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
              {(prod.user?.storeName || prod.user?.name || 'ZacaPlace').split(' ')[0]}
            </Text>
            <View style={{ backgroundColor: '#3B82F6', borderRadius: 6, width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={8} color="#FFF" strokeWidth={3} />
            </View>
          </View>

          <Text style={{ fontSize: 15, fontWeight: '900', color: theme.title, lineHeight: 18 }} numberOfLines={1}>
            {prod.name}
          </Text>
          <Text style={{ fontSize: 11, color: theme.subtitle, marginTop: 2 }} numberOfLines={1}>
            {(prod as any).category?.name || 'Mais Vendidos'} • Oficial
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: theme.price }}>
                {priceFormatted}
              </Text>
              {isPromo && (
                <Text style={{ fontSize: 10, color: theme.oldPrice, textDecorationLine: 'line-through', marginTop: 1 }}>
                  {formatPrice(prod.originalPrice!)}
                </Text>
              )}
            </View>
            
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {(prod as any).averageRating && (prod as any).averageRating > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.title }}>{(prod as any).averageRating.toFixed(1)}</Text>
                  <Text style={{ fontSize: 8, color: theme.subtitle }}>({(prod as any).totalReviews})</Text>
                </View>
              ) : null}
              <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.btnBg, alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={16} color={theme.btnIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.footerBorder }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 4 }}>
                <RNImage source={{ uri: (prod.user as any)?.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=100&auto=format&fit=crop' }} style={{ width: 16, height: 16, borderRadius: 8 }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: theme.title }} numberOfLines={1}>{prod.user?.storeName || prod.user?.name || 'Zaca Oficial'}</Text>
                <View style={{ backgroundColor: '#3B82F6', borderRadius: 6, width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={6} color="#FFF" strokeWidth={3} />
                </View>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                {index % 2 === 0 ? (
                  <>
                    <Zap size={10} color="#10B981" fill="#10B981" />
                    <Text style={{ fontSize: 9, color: '#10B981', fontWeight: '800' }}>Envio rápido</Text>
                  </>
                ) : (
                  <>
                    <Truck size={10} color="#10B981" />
                    <Text style={{ fontSize: 9, color: '#10B981', fontWeight: '800' }}>Frete grátis</Text>
                  </>
                )}
             </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionItem = ({ item }: { item: CustomSection }) => {
    if (!item.products || item.products.length === 0) return null;
    const featured = item.products[0];

    return (
      <View style={{ marginBottom: 32, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#121826' }}>{item.title}</Text>
          <TouchableOpacity onPress={() => router.push('/products')}>
            <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '600' }}>Ver tudo</Text>
          </TouchableOpacity>
        </View>
        
        {/* Banner */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push(`/products/${featured.id}`)}
          style={{ width: '100%', height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 16, position: 'relative' }}
        >
          <RNImage source={{ uri: item.bannerImageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }} />
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <Text style={{ color: item.bannerFontColor || '#FFF', fontSize: 18, fontWeight: 'bold' }}>{featured.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
              {featured.priceType === 'ON_BUDGET' ? 'A combinar' : formatPrice(featured.price)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Horizontal list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {item.products.map(prod => (
            <TouchableOpacity
              key={prod.id}
              onPress={() => router.push(`/products/${prod.id}`)}
              style={{ width: 140, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
            >
              <View style={{ width: '100%', height: 140 }}>
                <RNImage source={{ uri: prod.images[0] || 'https://via.placeholder.com/150' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#121826' }} numberOfLines={1}>{prod.name}</Text>
                {(prod as any).averageRating && (prod as any).averageRating > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Star size={10} color="#FBBF24" fill="#FBBF24" />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#6B7280' }}>
                      {(prod as any).averageRating.toFixed(1)} ({(prod as any).totalReviews})
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 4, height: 14 }} />
                )}
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#7C3AED', marginTop: 6 }}>
                  {prod.priceType === 'ON_BUDGET' ? 'A combinar' : formatPrice(prod.price)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderListHeader = () => {
    const banners = data?.banners || [];
    return (
      <View style={{ paddingBottom: 16 }}>
        {/* PREMIUM HEADER */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 16 }}>
          <TouchableOpacity style={{ padding: 4 }} onPress={openSidebar}>
            <Menu size={24} color="#121826" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#1E1B4B', letterSpacing: 1 }}>ZACAPLACE</Text>
          <TouchableOpacity onPress={() => console.log('Cart')} style={{ position: 'relative', padding: 4 }}>
            <ShoppingBag size={24} color="#121826" />
            <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#7C3AED', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* LOCALITY AND GREETING SUB-HEADER */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
           <View>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>{greeting}, {firstName}!</Text>
              <TouchableOpacity onPress={openLocationModal} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                 <MapPin size={14} color="#7C3AED" />
                 <Text style={{ color: '#121826', fontSize: 14, fontWeight: 'bold' }}>{stateUF ? `${cityName}, ${stateUF}` : 'Todo o Brasil'}</Text>
                 <ChevronDown size={14} color="#121826" />
              </TouchableOpacity>
           </View>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
              {renderWeatherIcon()}
              <Text style={{ color: '#121826', fontSize: 13, fontWeight: 'bold' }}>{temperature !== null ? `${temperature}°C` : '--°C'}</Text>
           </View>
        </View>

        {/* ROUNDED SEARCH BAR */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, paddingLeft: 16, paddingRight: 6, height: 56, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <Search size={20} color="#94A3B8" />
            <RNTextInput
              style={{ flex: 1, marginLeft: 12, fontSize: 14, color: '#121826' }}
              placeholder="Buscar produtos, marcas e mais..."
              placeholderTextColor="#94A3B8"
              onFocus={handleOpenChat}
            />
            <TouchableOpacity style={{ width: 44, height: 44, backgroundColor: '#7C3AED', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
              <SlidersHorizontal size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CIRCULAR CATEGORIES */}
        {data?.categories && data.categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 24 }}>
            <TouchableOpacity onPress={() => setSelectedCategoryTab('all')} style={{ alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: selectedCategoryTab === 'all' ? '#7C3AED' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                <LayoutGrid size={24} color={selectedCategoryTab === 'all' ? '#FFF' : '#121826'} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: selectedCategoryTab === 'all' ? 'bold' : '600', color: selectedCategoryTab === 'all' ? '#7C3AED' : '#6B7280' }}>Todos</Text>
            </TouchableOpacity>
            
            {data.categories.map((cat) => {
              const config = getCategoryConfig(cat.name);
              const IconComponent = config.Icon;
              const isSelected = selectedCategoryTab === cat.id;
              return (
                <TouchableOpacity key={cat.id} onPress={() => setSelectedCategoryTab(cat.id)} style={{ alignItems: 'center', width: 64 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isSelected ? '#7C3AED' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                    <IconComponent size={24} color={isSelected ? '#FFF' : '#121826'} strokeWidth={1.5} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: isSelected ? 'bold' : '600', color: isSelected ? '#7C3AED' : '#6B7280', textAlign: 'center' }} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* HERO BANNER (Promotion) */}
        {banners.length > 0 && (
          <View style={{ marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', position: 'relative', height: 180, backgroundColor: '#FCE7F3' }}>
             <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                  setActiveBannerIdx(idx);
                }}
             >
                {banners.map((b) => (
                  <View key={b.id} style={{ width: SCREEN_WIDTH - 32, height: 180, position: 'relative' }}>
                    <RNImage source={{ uri: b.imageUrl }} style={{ width: '100%', height: '100%', opacity: 0.3 }} resizeMode="cover" />
                    <LinearGradient colors={['rgba(252,231,243,0.9)', 'rgba(233,213,255,0.8)']} style={{ ...StyleSheet.absoluteFillObject }} />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 24, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: '#1E1B4B', width: '70%', lineHeight: 28 }}>{b.title}</Text>
                      <Text style={{ color: '#4C1D95', fontSize: 13, marginTop: 8, width: '70%' }}>Descubra produtos incríveis com os melhores preços.</Text>
                      <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#7C3AED', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, marginRight: 8 }}>Ver novidades</Text>
                        <ArrowRight size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
             </ScrollView>
             {/* Pagination Dots */}
             <View style={{ position: 'absolute', bottom: 12, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
               {banners.map((_, i) => (
                 <View key={i} style={{ width: activeBannerIdx === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: activeBannerIdx === i ? '#7C3AED' : 'rgba(124, 58, 237, 0.3)' }} />
               ))}
             </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && !data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FC' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const allSections = data?.sections || [];
  const leftCol = filteredDiscoveries.filter((_, idx) => idx % 2 === 0);
  const rightCol = filteredDiscoveries.filter((_, idx) => idx % 2 !== 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FC' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={allSections}
        keyExtractor={item => item.id}
        renderItem={renderSectionItem}
        ListHeaderComponent={renderListHeader()}
        ListFooterComponent={() => (
          <View style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#121826' }}>Destaques para você</Text>
              <TouchableOpacity onPress={() => router.push('/products')}>
                <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '600' }}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {filteredDiscoveries.length > 0 ? (
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  {leftCol.map((item, index) => renderMasonryCard(item, index * 2))}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {rightCol.map((item, index) => renderMasonryCard(item, index * 2 + 1))}
                </View>
              </View>
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ShoppingBag size={32} color="#9CA3AF" />
                <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: 'bold', marginTop: 12 }}>Nenhum item encontrado.</Text>
              </View>
            )}

            {/* Footer Features Banner */}
            <View style={{ marginTop: 24, backgroundColor: '#F3F4F6', borderRadius: 20, padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
               <View style={{ width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                 <View style={{ padding: 8, backgroundColor: '#E0E7FF', borderRadius: 12, marginRight: 8 }}>
                    <Search size={16} color="#4F46E5" />
                 </View>
                 <View>
                   <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937' }}>Compra segura</Text>
                   <Text style={{ fontSize: 10, color: '#6B7280' }}>Seus dados protegidos</Text>
                 </View>
               </View>
               <View style={{ width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                 <View style={{ padding: 8, backgroundColor: '#E0E7FF', borderRadius: 12, marginRight: 8 }}>
                    <Car size={16} color="#4F46E5" />
                 </View>
                 <View>
                   <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937' }}>Frete rápido</Text>
                   <Text style={{ fontSize: 10, color: '#6B7280' }}>Entrega para todo o Brasil</Text>
                 </View>
               </View>
               <View style={{ width: '48%', flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ padding: 8, backgroundColor: '#E0E7FF', borderRadius: 12, marginRight: 8 }}>
                    <Compass size={16} color="#4F46E5" />
                 </View>
                 <View>
                   <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937' }}>Troca fácil</Text>
                   <Text style={{ fontSize: 10, color: '#6B7280' }}>Até 7 dias após o recebimento</Text>
                 </View>
               </View>
               <View style={{ width: '48%', flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ padding: 8, backgroundColor: '#E0E7FF', borderRadius: 12, marginRight: 8 }}>
                    <Sparkles size={16} color="#4F46E5" />
                 </View>
                 <View>
                   <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937' }}>Melhores ofertas</Text>
                   <Text style={{ fontSize: 10, color: '#6B7280' }}>Descontos exclusivos para você</Text>
                 </View>
               </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={handleRefresh}
      />

      {/* LOCATION OVERRIDE MODAL */}
      <Modal
        visible={isLocModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsLocModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A' }}>Alterar Região</Text>
              <TouchableOpacity onPress={() => setIsLocModalOpen(false)} style={{ padding: 4 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={async () => {
                setCityName('Todo o Brasil');
                setStateUF('');
                setSelectedState('');
                setSelectedCity('');
                await AsyncStorage.setItem('zaca_selected_city', 'Todo o Brasil');
                await AsyncStorage.setItem('zaca_selected_state', '');
                setIsLocModalOpen(false);
                fetchWeatherForCity('Brasília', 'DF');
              }}
              style={{ 
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
                backgroundColor: '#EDE9FE', paddingVertical: 12, borderRadius: 14, gap: 8, marginBottom: 16,
                borderWidth: 1, borderColor: '#C084FC'
              }}
            >
              <Compass size={16} color="#7C3AED" />
              <Text style={{ color: '#7C3AED', fontWeight: 'bold', fontSize: 14 }}>Ver Todo o Brasil</Text>
            </TouchableOpacity>

            {loadingStates ? (
              <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 20 }} />
            ) : (
              <View style={{ gap: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Selecione o Estado (UF):</Text>
                <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 8 }}>
                  {statesList.map((state) => (
                    <TouchableOpacity 
                      key={state.id} 
                      onPress={() => setSelectedState(state.sigla)}
                      style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: selectedState === state.sigla ? '#EDE9FE' : 'transparent' }}
                    >
                      <Text style={{ fontSize: 14, color: selectedState === state.sigla ? '#7C3AED' : '#334155', fontWeight: selectedState === state.sigla ? 'bold' : 'normal' }}>
                        {state.nome} ({state.sigla})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedState ? (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569' }}>Selecione a Cidade:</Text>
                    {loadingCities ? (
                      <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 10 }} />
                    ) : (
                      <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 8 }}>
                        {citiesList.map((city) => (
                          <TouchableOpacity 
                            key={city.id} 
                            onPress={() => setSelectedCity(city.nome)}
                            style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: selectedCity === city.nome ? '#EDE9FE' : 'transparent' }}
                          >
                            <Text style={{ fontSize: 14, color: selectedCity === city.nome ? '#7C3AED' : '#334155', fontWeight: selectedCity === city.nome ? 'bold' : 'normal' }}>
                              {city.nome}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </>
                ) : (
                  <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginVertical: 12 }}>Escolha um estado para listar as cidades.</Text>
                )}

                <TouchableOpacity
                  style={{ backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 12 }}
                  onPress={handleSaveLocation}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Confirmar Localização</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ANA DO ZACA AI CHAT MODAL */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsChatOpen(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <BlurView intensity={80} tint="dark" style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.85)' }}>
            <LinearGradient
              colors={['rgba(124,58,237,0.15)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
            />
            
            <View style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <View style={{ position: 'relative' }}>
                <LinearGradient colors={['#7C3AED', '#4C1D95']} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                   <Sparkles size={18} color="#FFF" />
                </LinearGradient>
                <View style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#0F172A' }} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Ana do Zaca</Text>
                <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '600' }}>Assistente de Busca • Online</Text>
              </View>

              <TouchableOpacity onPress={() => setIsChatOpen(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView ref={chatScrollRef} style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '85%' : '90%',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                      {!isUser && (
                         <LinearGradient colors={['#7C3AED', '#4C1D95']} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                           <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>A</Text>
                         </LinearGradient>
                      )}
                      <View style={{
                        backgroundColor: isUser ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomRightRadius: isUser ? 4 : 20,
                        borderBottomLeftRadius: !isUser ? 4 : 20,
                        borderWidth: isUser ? 0 : 1,
                        borderColor: 'rgba(255,255,255,0.05)',
                        shadowColor: isUser ? '#7C3AED' : '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isUser ? 0.3 : 0.1,
                        shadowRadius: 8,
                        elevation: 4
                      }}>
                        {/* Parse $$PRODUCT::id::name::price::image$$ */}
                        {(() => {
                          if (isUser) {
                            return <Text style={{ color: '#FFF', fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>;
                          }
                          
                          const parts = msg.content.split(/(\$\$PRODUCT::.*?::.*?::.*?::.*?\$\$)/g);
                          return (
                            <View style={{ gap: 12 }}>
                              {parts.map((part, index) => {
                                if (part.startsWith('$$PRODUCT::')) {
                                  const [, id, name, price, image] = part.split('::');
                                  const cleanImage = image ? image.replace('$$', '') : '';
                                  
                                  return (
                                    <TouchableOpacity
                                      key={index}
                                      activeOpacity={0.9}
                                      onPress={() => {
                                        setIsChatOpen(false);
                                        router.push(`/products/${id}`);
                                      }}
                                      style={{
                                        backgroundColor: 'rgba(15,23,42,0.6)',
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        borderWidth: 1,
                                        borderColor: 'rgba(124, 58, 237, 0.4)',
                                        marginTop: 4,
                                        width: SCREEN_WIDTH * 0.65
                                      }}
                                    >
                                      <View style={{ width: '100%', height: 140, position: 'relative' }}>
                                        <RNImage source={{ uri: cleanImage || 'https://via.placeholder.com/150' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                        <LinearGradient colors={['transparent', 'rgba(15,23,42,0.9)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }} />
                                        <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                           <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Disponível</Text>
                                        </View>
                                      </View>
                                      <View style={{ padding: 12 }}>
                                        <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' }} numberOfLines={2}>{name}</Text>
                                        <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: '900', marginTop: 4 }}>
                                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price) || 0)}
                                        </Text>
                                        <View style={{ backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 10, marginTop: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                                          <ShoppingBag size={14} color="#FFF" />
                                          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>Ver Produto</Text>
                                        </View>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                }
                                
                                if (part.trim()) {
                                  const boldParts = part.split(/(\*\*.*?\*\*)/g);
                                  return (
                                    <Text key={index} style={{ color: '#E2E8F0', fontSize: 15, lineHeight: 22 }}>
                                      {boldParts.map((bPart, bIndex) => {
                                        if (bPart.startsWith('**') && bPart.endsWith('**')) {
                                          return <Text key={bIndex} style={{ fontWeight: '900', color: '#FFF' }}>{bPart.replace(/\*\*/g, '')}</Text>;
                                        }
                                        return bPart;
                                      })}
                                    </Text>
                                  );
                                }
                                return null;
                              })}
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                  </View>
                );
              })}

              {isChatLoading && (
                <View style={{ alignSelf: 'flex-start', maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                  <LinearGradient colors={['#7C3AED', '#4C1D95']} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                     <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>A</Text>
                  </LinearGradient>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color="#A78BFA" />
                    <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '500' }}>Procurando os melhores...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={{ padding: 16, paddingBottom: Platform.OS === 'ios' ? insets.bottom + 12 : 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.8)' }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <RNTextInput
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Busque produtos em promoção..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    style={{ flex: 1, color: '#FFF', fontSize: 15, maxHeight: 100, minHeight: 24, padding: 0 }}
                    onSubmitEditing={handleSendChatMessage}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: chatInput.trim() ? '#7C3AED' : 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', opacity: chatInput.trim() ? 1 : 0.5, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: chatInput.trim() ? 0.3 : 0, shadowRadius: 8, elevation: chatInput.trim() ? 4 : 0 }}
                >
                  <Send size={20} color={chatInput.trim() ? "#FFF" : "rgba(255,255,255,0.4)"} style={{ marginLeft: chatInput.trim() ? 2 : 0 }} />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}