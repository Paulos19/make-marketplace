import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Save, User, Store, MessageSquare, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlert } from '../../components/ui/CustomAlert';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    whatsappLink: '',
    profileDescription: '',
    state: '',
    city: '',
    showInSellersPage: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const router = useRouter();

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/user');
      if (response.data) {
        setFormData({
          name: response.data.name || '',
          storeName: response.data.storeName || '',
          whatsappLink: response.data.whatsappLink || '',
          profileDescription: response.data.profileDescription || '',
          state: response.data.state || '',
          city: response.data.city || '',
          showInSellersPage: !!response.data.showInSellersPage,
        });
      }
    } catch (error: any) {
      console.error('Failed to load user', error);
      if (error?.status === 401) {
        CustomAlert.alert('Sessão expirada', 'Por favor, faça login novamente.');
        router.replace('/auth/login');
      } else {
        CustomAlert.alert('Erro', 'Não foi possível carregar seus dados.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.put('/api/user', formData);
      CustomAlert.alert('Sucesso', 'Configurações atualizadas!');
    } catch (error) {
      console.error('Failed to save settings', error);
      CustomAlert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top + 20 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Gerencie suas preferências e dados públicos da loja.</Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <User size={18} color="#A78BFA" />
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput 
            style={styles.input}
            placeholder="Seu nome"
            placeholderTextColor="#64748B"
            value={formData.name}
            onChangeText={(t) => setFormData(p => ({ ...p, name: t }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Link do WhatsApp</Text>
          <View style={styles.inputWithIcon}>
            <MessageSquare size={16} color="#64748B" style={styles.inputIcon} />
            <TextInput 
              style={styles.inputIconned}
              placeholder="https://wa.me/..."
              placeholderTextColor="#64748B"
              value={formData.whatsappLink}
              onChangeText={(t) => setFormData(p => ({ ...p, whatsappLink: t }))}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Store size={18} color="#A78BFA" />
          <Text style={styles.sectionTitle}>Perfil da Loja</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome da Loja</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ex: Minha Loja"
            placeholderTextColor="#64748B"
            value={formData.storeName}
            onChangeText={(t) => setFormData(p => ({ ...p, storeName: t }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descrição da Loja</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Fale um pouco sobre o que você vende..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={formData.profileDescription}
            onChangeText={(t) => setFormData(p => ({ ...p, profileDescription: t }))}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Estado (UF)</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={16} color="#64748B" style={styles.inputIcon} />
              <TextInput 
                style={styles.inputIconned}
                placeholder="Ex: SP"
                placeholderTextColor="#64748B"
                value={formData.state}
                onChangeText={(t) => setFormData(p => ({ ...p, state: t }))}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 2, marginLeft: 8 }]}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ex: São Paulo"
              placeholderTextColor="#64748B"
              value={formData.city}
              onChangeText={(t) => setFormData(p => ({ ...p, city: t }))}
            />
          </View>
        </View>

        <View style={styles.switchGroup}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Exibir Loja no Catálogo</Text>
            <Text style={styles.switchSub}>Aparecer na página pública de vendedores.</Text>
          </View>
          <Switch
            trackColor={{ false: "#334155", true: "#8B5CF6" }}
            thumbColor={formData.showInSellersPage ? "#FFF" : "#94A3B8"}
            onValueChange={(val) => setFormData(p => ({ ...p, showInSellersPage: val }))}
            value={formData.showInSellersPage}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.saveBtn} 
        onPress={handleSave}
        disabled={isSaving}
      >
        <LinearGradient
          colors={['#7C3AED', '#4C1D95']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveBtnGradient}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  inputIconned: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  switchInfo: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
    marginBottom: 4,
  },
  switchSub: {
    fontSize: 12,
    color: '#64748B',
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
