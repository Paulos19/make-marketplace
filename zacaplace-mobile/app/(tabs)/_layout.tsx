import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, User, Search, Heart, Store, LucideIcon } from 'lucide-react-native';
import { useSidebarStore } from '../../store/useSidebarStore';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  useSharedValue,
  Easing
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H = 70; // Tab bar height
const W = SCREEN_WIDTH * 3;
const Cx = W / 2;

// Caminho do SVG para criar o efeito de "buraco" curvo perfeito
const pathD = `
  M 0 0
  L ${Cx - 40} 0
  C ${Cx - 20} 0, ${Cx - 25} 35, ${Cx} 35
  C ${Cx + 25} 35, ${Cx + 20} 0, ${Cx + 40} 0
  L ${W} 0
  L ${W} ${H}
  L 0 ${H}
  Z
`;

const TabBarItem = ({ 
  isFocused, 
  onPress, 
  icon: Icon, 
  label 
}: { 
  isFocused: boolean; 
  onPress: () => void; 
  icon: LucideIcon;
  label: string;
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      // Sobe 24px para centralizar dentro do círculo flutuante
      translateY.value = withSpring(-24, { damping: 22, stiffness: 150 });
      opacity.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withSpring(0, { damping: 22, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
    }
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={onPress} 
      style={styles.tabItem}
    >
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Icon size={24} color={isFocused ? '#FFF' : '#94A3B8'} strokeWidth={isFocused ? 2.5 : 2} />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, labelStyle, { color: '#94A3B8' }]}>
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { isOpen } = useSidebarStore();
  
  // Filtra as rotas que não devem aparecer (ex: href: null)
  const visibleRoutes = useMemo(() => {
    return state.routes.filter((route: any) => {
      const { options } = descriptors[route.key];
      return options.href !== null;
    });
  }, [state.routes, descriptors]);

  const TAB_COUNT = visibleRoutes.length;
  const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;

  const activeRoute = state.routes[state.index];
  const activeVisibleIndex = visibleRoutes.findIndex((r: any) => r.key === activeRoute.key);

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (activeVisibleIndex >= 0) {
      // Calcula o centro da aba ativa e move a "deformidade" do SVG para ela
      const xTab = (activeVisibleIndex * TAB_WIDTH) + (TAB_WIDTH / 2);
      translateX.value = withTiming(xTab - Cx, { 
        duration: 350, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) // Suave, sem o rebote exagerado do spring
      });
    }
  }, [activeVisibleIndex, TAB_WIDTH]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (isOpen) return null;

  return (
    <View style={styles.container}>
      {/* Bloco branco para a Safe Area do iOS na parte inferior */}
      {Platform.OS === 'ios' && (
        <View style={{ position: 'absolute', bottom: 0, width: SCREEN_WIDTH, height: 25, backgroundColor: '#FFFFFF' }} />
      )}

      {/* Camada animada com o Fundo SVG curvo e o Círculo Flutuante */}
      <Animated.View style={[styles.movingBackground, animatedBackgroundStyle]}>
        <Svg width={W} height={H} fill="none">
          <Path d={pathD} fill="#FFFFFF" />
        </Svg>
        <View style={styles.floatingCircle} />
      </Animated.View>

      {/* Camada de Ícones Estática */}
      <View style={styles.tabsRow}>
        {visibleRoutes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = activeVisibleIndex === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Mapeia as rotas para ícones reais
          let Icon = Home;
          let label = '';
          if (route.name === 'index') { Icon = Home; label = 'Início'; }
          else if (route.name === 'sellers') { Icon = Store; label = 'Lojas'; }
          else if (route.name === 'products') { Icon = Search; label = 'Explorar'; }
          else if (route.name === 'favorites') { Icon = Heart; label = 'Favoritos'; }
          else if (route.name === 'dashboard') { Icon = User; label = 'Perfil'; }

          return (
            <TabBarItem 
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              icon={Icon}
              label={label}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sellers" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="dashboard" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
    height: H + (Platform.OS === 'ios' ? 25 : 0),
    backgroundColor: 'transparent',
    elevation: 20,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  movingBackground: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 0,
    width: W,
    height: H,
    flexDirection: 'row',
  },
  floatingCircle: {
    position: 'absolute',
    left: Cx - 25,
    top: -22,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7C3AED', // Roxo principal Zaca
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    height: H,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 0,
    width: SCREEN_WIDTH,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    height: H,
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 15, 
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    bottom: 12,
  }
});
