import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, ScrollView, Switch, 
  Dimensions, Platform, ActivityIndicator
} from 'react-native';
import { 
  X, LayoutGrid, Smartphone, Shirt, Car, Wrench, Home, ShoppingBag, 
  Sparkles, Star, Truck, Zap, MapPin, ChevronRight
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, Easing 
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Condition options from Prisma enum ──
const CONDITIONS = [
  { id: '', label: 'Todos' },
  { id: 'NEW', label: 'Novo' },
  { id: 'USED', label: 'Usado' },
  { id: 'GOOD_CONDITION', label: 'Excelente' },
  { id: 'REFURBISHED', label: 'Recondicionado' },
];

// ── Sort options ──
const SORT_OPTIONS = [
  { id: 'createdAt:desc', label: 'Mais recentes' },
  { id: 'price:asc', label: 'Menor preço' },
  { id: 'price:desc', label: 'Maior preço' },
  { id: 'name:asc', label: 'A-Z' },
];

// ── Rating options ──
const RATINGS = [
  { id: 0, label: '1+' },
  { id: 2, label: '2+' },
  { id: 3, label: '3+' },
  { id: 4, label: '4+' },
  { id: 4.5, label: '4.5+' },
];

// ── Delivery options ──
const DELIVERY_OPTIONS = [
  { id: 'any', label: 'Qualquer', icon: Truck },
  { id: 'free', label: 'Frete grátis', icon: Truck },
  { id: 'fast', label: 'Envio rápido', icon: Zap },
];

// ── Price ranges ──
const PRICE_RANGES = [
  { id: '', label: 'Todos' },
  { id: '0-50', label: 'Até R$50' },
  { id: '50-200', label: 'R$50 - R$200' },
  { id: '200-500', label: 'R$200 - R$500' },
  { id: '500-1000', label: 'R$500 - R$1.000' },
  { id: '1000-5000', label: 'R$1.000 - R$5.000' },
  { id: '5000+', label: 'R$5.000+' },
];

const getCategoryIcon = (name: string, color: string, size: number = 24) => {
  const c = name.toLowerCase();
  if (c.includes('celular') || c.includes('eletrôn')) return <Smartphone size={size} color={color} strokeWidth={1.5} />;
  if (c.includes('serviço') || c.includes('consert')) return <Wrench size={size} color={color} strokeWidth={1.5} />;
  if (c.includes('carro') || c.includes('moto') || c.includes('veícul')) return <Car size={size} color={color} strokeWidth={1.5} />;
  if (c.includes('moda') || c.includes('roupa') || c.includes('calçad') || c.includes('vestuário') || c.includes('camiset') || c.includes('tênis') || c.includes('acessóri')) return <Shirt size={size} color={color} strokeWidth={1.5} />;
  if (c.includes('casa') || c.includes('imóve')) return <Home size={size} color={color} strokeWidth={1.5} />;
  if (c.includes('beleza') || c.includes('cosmét')) return <Sparkles size={size} color={color} strokeWidth={1.5} />;
  return <ShoppingBag size={size} color={color} strokeWidth={1.5} />;
};

export interface FilterState {
  categoryId: string;
  sort: string;
  condition: string;
  priceRange: string;
  minRating: number;
  delivery: string;
  onlyPromo: boolean;
  onlyInStock: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  categories: { id: string; name: string }[];
  initialFilters?: Partial<FilterState>;
  totalResults?: number;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible, onClose, onApply, categories, initialFilters, totalResults
}) => {
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(SW);

  const [filters, setFilters] = useState<FilterState>({
    categoryId: initialFilters?.categoryId || '',
    sort: initialFilters?.sort || 'createdAt:desc',
    condition: initialFilters?.condition || '',
    priceRange: initialFilters?.priceRange || '',
    minRating: initialFilters?.minRating || 0,
    delivery: initialFilters?.delivery || 'any',
    onlyPromo: initialFilters?.onlyPromo || false,
    onlyInStock: initialFilters?.onlyInStock || false,
  });

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      translateX.value = withTiming(SW, { duration: 250, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setFilters({
      categoryId: '', sort: 'createdAt:desc', condition: '', priceRange: '',
      minRating: 0, delivery: 'any', onlyPromo: false, onlyInStock: false,
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const activeCount = [
    filters.categoryId, filters.condition, filters.priceRange,
    filters.minRating > 0, filters.delivery !== 'any',
    filters.onlyPromo, filters.onlyInStock,
    filters.sort !== 'createdAt:desc'
  ].filter(Boolean).length;

  // ── Section Title Component ──
  const SectionTitle = ({ title, action }: { title: string; action?: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E1B4B' }}>{title}</Text>
      {action && <Text style={{ fontSize: 13, fontWeight: '600', color: '#7C3AED' }}>{action}</Text>}
    </View>
  );

  // ── Chip Component ──
  const Chip = ({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: React.ReactNode }) => (
    <TouchableOpacity onPress={onPress} style={{
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
      backgroundColor: active ? '#7C3AED' : '#FFF',
      borderWidth: 1, borderColor: active ? '#7C3AED' : '#E5E7EB',
      flexDirection: 'row', alignItems: 'center', gap: 6,
    }}>
      {icon}
      <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? '#FFF' : '#374151' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <TouchableOpacity
        activeOpacity={1} onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        {/* Filter Panel (right side) */}
        <Animated.View style={[{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: SW * 0.88, backgroundColor: '#F8F9FC',
          shadowColor: '#000', shadowOffset: { width: -10, height: 0 },
          shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
        }, animatedStyle]}>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
            >
              {/* Handle bar */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#1E1B4B' }}>Filtros</Text>
                <TouchableOpacity onPress={handleClear}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#7C3AED' }}>Limpar tudo</Text>
                </TouchableOpacity>
              </View>

              {/* ═══ CATEGORIAS ═══ */}
              <SectionTitle title="Categorias" action="Ver todas" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {/* "Todos" option */}
                <TouchableOpacity onPress={() => updateFilter('categoryId', '')} style={{
                  width: 72, height: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: filters.categoryId === '' ? '#7C3AED' : '#FFF',
                  borderWidth: 1, borderColor: filters.categoryId === '' ? '#7C3AED' : '#E5E7EB',
                }}>
                  <LayoutGrid size={24} color={filters.categoryId === '' ? '#FFF' : '#1E1B4B'} strokeWidth={1.5} />
                  <Text style={{ fontSize: 11, fontWeight: filters.categoryId === '' ? '800' : '600', color: filters.categoryId === '' ? '#FFF' : '#374151', marginTop: 6 }}>Todos</Text>
                </TouchableOpacity>
                {categories.map((cat) => {
                  const isActive = filters.categoryId === cat.id;
                  return (
                    <TouchableOpacity key={cat.id} onPress={() => updateFilter('categoryId', isActive ? '' : cat.id)} style={{
                      width: 72, height: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isActive ? '#7C3AED' : '#FFF',
                      borderWidth: 1, borderColor: isActive ? '#7C3AED' : '#E5E7EB',
                    }}>
                      {getCategoryIcon(cat.name, isActive ? '#FFF' : '#1E1B4B')}
                      <Text style={{ fontSize: 11, fontWeight: isActive ? '800' : '600', color: isActive ? '#FFF' : '#374151', marginTop: 6 }} numberOfLines={1}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ═══ FAIXA DE PREÇO ═══ */}
              <SectionTitle title="Faixa de preço" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PRICE_RANGES.map((pr) => (
                  <Chip
                    key={pr.id}
                    label={pr.label}
                    active={filters.priceRange === pr.id}
                    onPress={() => updateFilter('priceRange', filters.priceRange === pr.id ? '' : pr.id)}
                  />
                ))}
              </View>

              {/* ═══ ORDENAR ═══ */}
              <SectionTitle title="Ordenar por" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SORT_OPTIONS.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    active={filters.sort === s.id}
                    onPress={() => updateFilter('sort', s.id)}
                  />
                ))}
              </View>

              {/* ═══ AVALIAÇÃO MÍNIMA ═══ */}
              <SectionTitle title="Avaliação mínima" action="Qualquer" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {RATINGS.map((r) => (
                  <TouchableOpacity key={r.id} onPress={() => updateFilter('minRating', filters.minRating === r.id ? 0 : r.id)} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
                    backgroundColor: filters.minRating === r.id ? '#7C3AED' : '#FFF',
                    borderWidth: 1, borderColor: filters.minRating === r.id ? '#7C3AED' : '#E5E7EB',
                  }}>
                    <Star size={14} color={filters.minRating === r.id ? '#FFF' : '#FBBF24'} fill={filters.minRating === r.id ? '#FFF' : '#FBBF24'} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: filters.minRating === r.id ? '#FFF' : '#374151' }}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ═══ CONDIÇÃO ═══ */}
              <SectionTitle title="Condição" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CONDITIONS.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.label}
                    active={filters.condition === c.id}
                    onPress={() => updateFilter('condition', filters.condition === c.id ? '' : c.id)}
                  />
                ))}
              </ScrollView>

              {/* ═══ LOCALIZAÇÃO ═══ */}
              <SectionTitle title="Localização" />
              <TouchableOpacity style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                borderWidth: 1, borderColor: '#E5E7EB',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} color="#7C3AED" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Brasil</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {/* ═══ ENTREGA ═══ */}
              <SectionTitle title="Entrega" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DELIVERY_OPTIONS.map((d) => {
                  const Icon = d.icon;
                  return (
                    <Chip
                      key={d.id}
                      label={d.label}
                      active={filters.delivery === d.id}
                      onPress={() => updateFilter('delivery', d.id)}
                      icon={<Icon size={14} color={filters.delivery === d.id ? '#FFF' : '#64748B'} />}
                    />
                  );
                })}
              </ScrollView>

              {/* ═══ TOGGLES ═══ */}
              <View style={{ marginTop: 24, gap: 16 }}>
                {/* Promo Toggle */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: 1, borderColor: '#E5E7EB',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Somente com desconto</Text>
                  <Switch
                    value={filters.onlyPromo}
                    onValueChange={(v) => updateFilter('onlyPromo', v)}
                    trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
                    thumbColor={'#FFF'}
                  />
                </View>

                {/* In Stock Toggle */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: 1, borderColor: '#E5E7EB',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E1B4B' }}>Somente itens em estoque</Text>
                  <Switch
                    value={filters.onlyInStock}
                    onValueChange={(v) => updateFilter('onlyInStock', v)}
                    trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
                    thumbColor={'#FFF'}
                  />
                </View>
              </View>

            </ScrollView>

            {/* ═══ STICKY BOTTOM BUTTONS ═══ */}
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
              paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12,
              flexDirection: 'row', gap: 12,
              shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
            }}>
              <TouchableOpacity onPress={onClose} style={{
                flex: 0.4, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB',
                alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleApply} style={{ flex: 0.6, height: 52, borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{
                  width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>
                    Ver resultados{totalResults != null ? ` (${totalResults.toLocaleString('pt-BR')})` : ''}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default FilterModal;