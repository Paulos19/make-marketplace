import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Image as RNImage } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
} from 'react-native-reanimated';
import { 
  Home, Compass, Heart, MessageSquare, ShoppingBag, TrendingUp, Wallet, 
  PlusSquare, Tag, User, Settings, Bell, Shield, HelpCircle, LogOut, Check,
  Link as LinkIcon, PenSquare
} from 'lucide-react-native';
import { useSidebarStore } from '../store/useSidebarStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

const MENU_SECTIONS = [
  {
    title: 'NAVEGAÇÃO',
    items: [
      { id: 'home', label: 'Página inicial', icon: Home, route: '/' },
      { id: 'explore', label: 'Explorar', icon: Compass, route: '/products' },
      { id: 'favorites', label: 'Favoritos', icon: Heart, route: '/my-reservations' },
      { id: 'messages', label: 'Mensagens', icon: MessageSquare, route: '/messages', badge: '3' },
      { id: 'orders', label: 'Pedidos', icon: ShoppingBag, route: '/orders' },
      { id: 'sales', label: 'Vendas', icon: TrendingUp, route: '/dashboard/reservations' },
      { id: 'wallet', label: 'Carteira', icon: Wallet, route: '/wallet' },
    ]
  },
  {
    title: 'ANUNCIAR',
    items: [
      { id: 'add_product', label: 'Anunciar produto', icon: PlusSquare, route: '/dashboard/add-product' },
      { id: 'my_ads', label: 'Meus anúncios', icon: Tag, route: '/dashboard' },
      { id: 'shortener', label: 'Encurtador', icon: LinkIcon, route: '/dashboard/link-shortener' },
    ]
  },
  {
    title: 'CONTA',
    items: [
      { id: 'profile', label: 'Perfil', icon: User, route: '/profile' },
      { id: 'settings', label: 'Configurações', icon: Settings, route: '/dashboard/settings' },
      { id: 'notifications', label: 'Notificações', icon: Bell, route: '/notifications' },
      { id: 'security', label: 'Segurança', icon: Shield, route: '/security' },
      { id: 'help', label: 'Ajuda e suporte', icon: HelpCircle, route: '/help' },
    ]
  }
];

export const Sidebar = () => {
  const { isOpen, closeSidebar } = useSidebarStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [user, setUser] = useState<any>(null);
  
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await apiClient.get('/api/user');
        if (response.data) setUser(response.data);
      } catch (e) {
        console.log('Error loading user in sidebar');
      }
    };
    if (isOpen && !user) {
      loadUser();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  const animatedSidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const handleNavigate = (route: string) => {
    closeSidebar();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleLogout = async () => {
    closeSidebar();
    await AsyncStorage.removeItem('userToken');
    setUser(null);
    router.replace('/auth/login' as any);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }, animatedOverlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSidebar} />
      </Animated.View>

      <Animated.View style={[{ 
          width: SIDEBAR_WIDTH, 
          height: '100%', 
          backgroundColor: '#2A1B54', 
          zIndex: 101,
          position: 'absolute',
          left: 0,
          top: 0,
          shadowColor: '#000',
          shadowOffset: { width: 10, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 30,
          elevation: 20
        }, animatedSidebarStyle]}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: Math.max(insets.top, 24) }} showsVerticalScrollIndicator={false}>
          
          {/* Top Logo */}
          <View style={{ paddingHorizontal: 28, marginBottom: 32 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 1 }}>ZACAPLACE</Text>
          </View>

          {/* User Profile Card - Premium Purple Gradient */}
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <LinearGradient
              colors={['#3B2773', '#2A1B54']}
              style={{ borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
            >
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#4C358D', marginBottom: 16, position: 'relative', borderWidth: 2, borderColor: '#6D28D9' }}>
                <RNImage 
                  source={{ uri: user?.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop' }} 
                  style={{ width: '100%', height: '100%', borderRadius: 40 }} 
                />
                <TouchableOpacity onPress={() => handleNavigate('/dashboard/settings')} style={{ position: 'absolute', top: 0, right: -4, backgroundColor: '#FFF', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                  <PenSquare size={12} color="#2A1B54" />
                </TouchableOpacity>
              </View>
              
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 2 }}>
                {user?.name || 'Visitante'}
              </Text>
              <Text style={{ fontSize: 13, color: '#A78BFA', marginBottom: 12 }}>
                {user?.email || 'Faça login para continuar'}
              </Text>

              {user?.role === 'SELLER' || user?.role === 'ADMIN' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#6D28D9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                  <Check size={12} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFF' }}>Verificado</Text>
                </View>
              ) : null}
            </LinearGradient>
          </View>

          {/* Navigation Sections */}
          {MENU_SECTIONS.map((section, idx) => (
            <View key={idx} style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#A78BFA', paddingHorizontal: 28, marginBottom: 12, letterSpacing: 1 }}>
                {section.title}
              </Text>
              
              {section.items.map((item, itemIdx) => {
                const isActive = item.id === 'home';
                return (
                  <TouchableOpacity 
                    key={itemIdx} 
                    onPress={() => handleNavigate(item.route)}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      paddingVertical: 14, 
                      paddingHorizontal: 28,
                      backgroundColor: isActive ? '#3B2773' : 'transparent',
                      borderRightWidth: isActive ? 4 : 0,
                      borderRightColor: '#A78BFA',
                      marginRight: isActive ? 0 : 16,
                      borderTopRightRadius: isActive ? 0 : 20,
                      borderBottomRightRadius: isActive ? 0 : 20,
                    }}
                  >
                    <item.icon size={22} color={isActive ? '#FFF' : '#A78BFA'} style={{ marginRight: 16 }} />
                    <Text style={{ fontSize: 15, fontWeight: isActive ? '700' : '500', color: isActive ? '#FFF' : '#C4B5FD', flex: 1 }}>
                      {item.label}
                    </Text>
                    
                    {item.badge && (
                      <View style={{ backgroundColor: '#6D28D9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>{item.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Logout Button */}
          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <TouchableOpacity 
              onPress={handleLogout}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1140', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16 }}
            >
              <LogOut size={22} color="#FCA5A5" style={{ marginRight: 14 }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FCA5A5' }}>Sair da conta</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
};
