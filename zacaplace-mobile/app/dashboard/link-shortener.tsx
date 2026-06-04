import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  TextInput,
  Alert,
  Linking
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link as LinkIcon, Copy, Plus, Scissors, ExternalLink, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlert } from '../../components/ui/CustomAlert';

export default function LinkShortenerScreen() {
  const insets = useSafeAreaInsets();
  
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/shortener');
      if (response.data && Array.isArray(response.data)) {
        setLinks(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load links', error);
      if (error?.status === 401) {
        CustomAlert.alert('Sessão expirada', 'Por favor, faça login novamente.');
        router.replace('/auth/login');
      } else {
        CustomAlert.alert('Erro', 'Não foi possível carregar seus links encurtados.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!originalUrl) {
      CustomAlert.alert('Atenção', 'Por favor, insira a URL original.');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiClient.post<{ shortCode: string }>('/api/shortener', {
        originalUrl,
        title: title || undefined,
      });
      
      if (response.data && response.data.shortCode) {
        CustomAlert.alert('Sucesso', 'Link encurtado com sucesso!');
        setOriginalUrl('');
        setTitle('');
        fetchLinks(); // Recarrega a lista
      }
    } catch (error: any) {
      console.error('Failed to create link', error);
      CustomAlert.alert('Erro', error?.data?.error || 'Não foi possível criar o link curto.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (shortCode: string) => {
    // A URL base deveria vir do ENV, mas vamos hardcodar temporariamente o app web
    const shortUrl = `https://zacaplace.vercel.app/s/${shortCode}`;
    await Clipboard.setStringAsync(shortUrl);
    CustomAlert.alert('Copiado', 'Link copiado para a área de transferência!');
  };

  if (isLoading && links.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
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
          colors={['#1E3A8A', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Ferramentas</Text>
          </View>
          <Text style={styles.title}>Encurtador de Links</Text>
          <Text style={styles.subtitle}>
            Crie links curtos e amigáveis para os seus produtos ou para sua loja.
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Scissors size={18} color="#60A5FA" />
          <Text style={styles.sectionTitle}>Criar Novo Link</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL Original (Destino)</Text>
          <TextInput 
            style={styles.input}
            placeholder="https://sua-loja.com/produto"
            placeholderTextColor="#64748B"
            value={originalUrl}
            onChangeText={setOriginalUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título (Opcional)</Text>
          <TextInput 
            style={styles.input}
            placeholder="Minha campanha de verão"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={handleCreateLink}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Plus size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.createBtnText}>Encurtar Link</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitleMain}>Seus Links Curtos</Text>
        <TouchableOpacity onPress={fetchLinks} style={{ padding: 8 }}>
          <RefreshCw size={16} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      {links.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <LinkIcon size={48} color="#334155" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Nenhum link gerado</Text>
          <Text style={styles.emptySubtitle}>Seus links curtos aparecerão aqui.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {links.map((link, idx) => (
            <View key={link.id || idx} style={styles.linkCard}>
              <View style={styles.linkCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle} numberOfLines={1}>
                    {link.title || link.shortCode}
                  </Text>
                  <Text style={styles.linkOriginal} numberOfLines={1}>
                    {link.originalUrl}
                  </Text>
                </View>
              </View>

              <View style={styles.linkCardFooter}>
                <View style={styles.shortCodeBadge}>
                  <Text style={styles.shortCodeText}>zacaplace.vercel.app/s/{link.shortCode}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.copyBtn}
                  onPress={() => handleCopy(link.shortCode)}
                >
                  <Copy size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {isLoading && (
            <ActivityIndicator size="small" color="#60A5FA" style={{ marginVertical: 20 }} />
          )}
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
    shadowColor: '#3B82F6',
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
  formSection: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginLeft: 8,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  linkCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  linkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  linkOriginal: {
    fontSize: 12,
    color: '#64748B',
  },
  linkCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortCodeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flex: 1,
    marginRight: 12,
  },
  shortCodeText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  copyBtn: {
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
