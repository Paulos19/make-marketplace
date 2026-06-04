import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Image,
  Linking,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Trash2, 
  User, 
  Calendar 
} from 'lucide-react-native';
import { apiClient } from '../../services/api';
import { useRouter } from 'expo-router';
import { CustomAlert } from '../../components/ui/CustomAlert';

type ReservationWithDetails = {
  id: string;
  status: 'PENDING' | 'SOLD' | 'CANCELED';
  createdAt: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  user: {
    name: string | null;
    whatsappLink: string | null;
  };
};

export default function ReservationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/sales');
      if (response.data && Array.isArray(response.data)) {
        setReservations(response.data);
      }
    } catch (error) {
      console.error('Failed to load reservations', error);
      CustomAlert.alert('Erro', 'Não foi possível carregar as reservas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      const response = await apiClient.patch(`/api/sales/${id}`, { status: newStatus });
      if (response.data) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
        CustomAlert.alert('Sucesso', 'Status da reserva atualizado!');
      }
    } catch (error) {
      console.error('Failed to update status', error);
      CustomAlert.alert('Erro', 'Não foi possível atualizar o status.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const confirmDelete = (id: string) => {
    CustomAlert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta reserva? O item retornará ao estoque.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setActionLoading(prev => ({ ...prev, [id]: true }));
              await apiClient.delete(`/api/sales/${id}`);
              setReservations(prev => prev.filter(r => r.id !== id));
              CustomAlert.alert('Sucesso', 'Reserva excluída.');
            } catch (error) {
              console.error('Failed to delete', error);
              CustomAlert.alert('Erro', 'Não foi possível excluir a reserva.');
            } finally {
              setActionLoading(prev => ({ ...prev, [id]: false }));
            }
          }
        }
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendente', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', Icon: Clock };
      case 'SOLD':
        return { label: 'Concluída', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', Icon: CheckCircle2 };
      case 'CANCELED':
        return { label: 'Cancelada', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', Icon: XCircle };
      default:
        return { label: status, color: '#6B7280', bg: '#F3F4F6', Icon: Clock };
    }
  };

  const totalReservations = reservations.length;
  const pendingCount = reservations.filter(r => r.status === 'PENDING').length;
  const soldCount = reservations.filter(r => r.status === 'SOLD').length;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top + 20 }}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={['#064E3B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Gestão de Pedidos</Text>
          </View>
          <Text style={styles.title}>As Suas Vendas</Text>
          <Text style={styles.subtitle}>
            Acompanhe o interesse nos seus produtos e atualize o estado das transações.
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Reservas</Text>
          <Text style={styles.metricValue}>{totalReservations}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pendentes</Text>
          <Text style={[styles.metricValue, { color: '#D97706' }]}>{pendingCount}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Concluídas</Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>{soldCount}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Histórico de Pedidos</Text>

      {reservations.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={48} color="#475569" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Caixa de Entrada Vazia</Text>
          <Text style={styles.emptySubtitle}>Quando um cliente demonstrar interesse num produto seu, o pedido aparecerá aqui.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reservations.map((reservation) => {
            const statusConfig = getStatusConfig(reservation.status);
            const StatusIcon = statusConfig.Icon;

            return (
              <View key={reservation.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Image 
                    source={{ uri: reservation.product.images?.[0] || 'https://via.placeholder.com/150' }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{reservation.product.name}</Text>
                    <View style={styles.infoRow}>
                      <User size={12} color="#94A3B8" />
                      <Text style={styles.infoText}>{reservation.user.name || 'Cliente'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Calendar size={12} color="#94A3B8" />
                      <Text style={styles.infoText}>{new Date(reservation.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <View style={styles.statusSection}>
                    <Text style={styles.actionLabel}>Status:</Text>
                    <View style={styles.statusButtonsRow}>
                      {['PENDING', 'SOLD', 'CANCELED'].map((s) => {
                        const isSelected = reservation.status === s;
                        const conf = getStatusConfig(s);
                        const isWorking = actionLoading[reservation.id];

                        return (
                          <TouchableOpacity 
                            key={s}
                            disabled={isWorking}
                            onPress={() => handleUpdateStatus(reservation.id, s)}
                            style={[
                              styles.statusBtn,
                              isSelected ? { backgroundColor: conf.bg, borderColor: conf.color } : {}
                            ]}
                          >
                            {isWorking && isSelected ? (
                              <ActivityIndicator size="small" color={conf.color} />
                            ) : (
                              <Text style={[styles.statusBtnText, isSelected ? { color: conf.color, fontWeight: 'bold' } : {}]}>
                                {conf.label}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.bottomActions}>
                    {reservation.user.whatsappLink ? (
                      <TouchableOpacity 
                        style={styles.whatsappBtn}
                        onPress={() => Linking.openURL(reservation.user.whatsappLink!)}
                      >
                        <MessageSquare size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.whatsappBtn, { backgroundColor: '#334155' }]}>
                        <Text style={styles.whatsappBtnText}>Sem Contato</Text>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(reservation.id)}
                      disabled={actionLoading[reservation.id]}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0F172A',
  },
  productInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  actionsRow: {
    padding: 16,
  },
  actionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  whatsappBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  }
});
