import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/api';
import { getToken } from '../services/auth';
import { Frown, ListPlus } from 'lucide-react-native';

// A reserva inclui o produto completo
interface Reservation {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  user?: {
    name?: string | null;
  };
}

const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const ReservationCard = ({ reservation }: { reservation: Reservation }) => {
    const router = useRouter();
    const { product, user } = reservation;
  
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/products/${product.id}`)}>
        <Image source={{ uri: product.images[0] || 'https://via.placeholder.com/100' }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.cardPrice}>{formatPrice(product.price)}</Text>
          <Text style={styles.cardSeller} numberOfLines={1}>
            Vendido por {user?.name || 'Vendedor'}
          </Text>
        </View>
      </TouchableOpacity>
    );
};

const MyReservationsScreen = () => {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const fetchReservations = async () => {
    const token = await getToken();
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      setReservations([]);
      return;
    }

    setIsLoggedIn(true);
    setLoading(true);
    try {
      const response = await apiClient.get<Reservation[]>('/api/my-reservations');
      setReservations(response.data);
    } catch (error) {
      console.error("Erro ao buscar reservas:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // useFocusEffect para recarregar os dados sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [])
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Meus Achadinhos' }} />
        <Frown size={48} color="#6b7280" />
        <Text style={styles.emptyTitle}>Você não está logado</Text>
        <Text style={styles.emptySubtitle}>Faça login para ver seus achadinhos salvos.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>Fazer Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (reservations.length === 0) {
    return (
        <View style={styles.centered}>
            <Stack.Screen options={{ title: 'Meus Achadinhos' }} />
            <ListPlus size={48} color="#6b7280" />
            <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
            <Text style={styles.emptySubtitle}>Salve um achadinho para vê-lo aqui.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.buttonText}>Ver Achadinhos</Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Meus Achadinhos' }} />
      <FlatList
        data={reservations}
        renderItem={({ item }) => <ReservationCard reservation={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    alignItems: 'center'
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginTop: 4,
  },
  cardSeller: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyReservationsScreen;
