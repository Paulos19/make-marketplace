import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { View, Text, Pressable } from '@/components/tw';
import { Stack, useRouter } from 'expo-router';
import { apiClient, ApiError } from '../../services/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { Mail, Lock, User, Eye, EyeOff, ShoppingBag, Store, MapPin, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { CustomAlert } from '../../components/ui/CustomAlert';

interface RegisterResponse {
  success: boolean;
  message?: string;
}

interface StateUF {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'SELLER'>('USER'); 
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const [states, setStates] = useState<StateUF[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isWhatsappFocused, setIsWhatsappFocused] = useState(false);

  const router = useRouter();

  // Fetch States from IBGE
  useEffect(() => {
    let mounted = true;
    setLoadingStates(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setStates(data);
      })
      .catch((err) => {
        console.error('Erro ao buscar estados:', err);
      })
      .finally(() => {
        if (mounted) setLoadingStates(false);
      });
    return () => { mounted = false; };
  }, []);

  // Fetch Cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    let mounted = true;
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setCities(data);
      })
      .catch((err) => {
        console.error('Erro ao buscar cidades:', err);
      })
      .finally(() => {
        if (mounted) setLoadingCities(false);
      });
    return () => { mounted = false; };
  }, [selectedState]);

  const handleRegister = async () => {
    if (!email || !name || !password || !confirmPassword || !selectedState || !city) {
      CustomAlert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      CustomAlert.alert('Erro', 'As senhas não coincidem.');
      return;
    }
    if (role === 'SELLER' && !whatsappNumber) {
      CustomAlert.alert('Erro', 'O número de WhatsApp é obrigatório para vendedores.');
      return;
    }

    setLoading(true);
    const whatsappLink = role === 'SELLER' ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : null;

    try {
      const apiResponse = await apiClient.post<RegisterResponse>('/api/auth/register', { 
        email, 
        name,
        password, 
        confirmPassword, 
        role: role,
        whatsappLink,
        state: selectedState,
        city: city
      });
      const response = apiResponse.data;
      
      if (response.success) { 
        CustomAlert.alert('Sucesso', 'Cadastro realizado com sucesso!');
        router.replace('/auth/login'); 
      } else {
        CustomAlert.alert('Erro', response.message || 'Ocorreu um erro ao tentar registrar.');
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao tentar registrar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/screenphoto.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['rgba(9, 13, 26, 0.4)', 'rgba(4, 6, 15, 0.95)', '#04060F']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View className="px-6 w-full pt-20">
            <View className="mb-6 items-center">
              <Text className="text-white text-3xl font-extrabold tracking-widest mb-2">CRIAR CONTA</Text>
              <Text className="text-white text-base opacity-80 text-center px-4">
                Junte-se ao marketplace que mais cresce!
              </Text>
            </View>

            <GlassCard 
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 24,
                borderRadius: 32,
              }}
              className="w-full"
            >
              {/* Profile Selector */}
              <View className="flex-row bg-[rgba(15,23,42,0.6)] rounded-2xl p-1 mb-6 border border-white/10">
                <TouchableOpacity 
                  onPress={() => setRole('USER')}
                  style={{
                    flex: 1,
                    backgroundColor: role === 'USER' ? '#3B82F6' : 'transparent',
                    borderRadius: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShoppingBag color={role === 'USER' ? '#FFF' : 'rgba(255,255,255,0.5)'} size={16} style={{ marginRight: 6 }} />
                  <Text style={{ color: role === 'USER' ? '#FFF' : 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 }}>
                    Quero Comprar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setRole('SELLER')}
                  style={{
                    flex: 1,
                    backgroundColor: role === 'SELLER' ? '#3B82F6' : 'transparent',
                    borderRadius: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Store color={role === 'SELLER' ? '#FFF' : 'rgba(255,255,255,0.5)'} size={16} style={{ marginRight: 6 }} />
                  <Text style={{ color: role === 'SELLER' ? '#FFF' : 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 }}>
                    Quero Vender
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Name Input */}
              <View className="mb-4">
                <View 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: isNameFocused ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    height: 56,
                  }}
                >
                  <User color="rgba(255, 255, 255, 0.5)" size={20} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Seu Nome Completo"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <View 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: isEmailFocused ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    height: 56,
                  }}
                >
                  <Mail color="rgba(255, 255, 255, 0.5)" size={20} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="seu@email.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                  />
                </View>
              </View>
              
              {/* Password Input */}
              <View className="mb-4">
                <View 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: isPasswordFocused ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    height: 56,
                  }}
                >
                  <Lock color="rgba(255, 255, 255, 0.5)" size={20} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Sua senha"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    {showPassword ? <EyeOff color="rgba(255, 255, 255, 0.6)" size={20} /> : <Eye color="rgba(255, 255, 255, 0.6)" size={20} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View className="mb-4">
                <View 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: isConfirmPasswordFocused ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    height: 56,
                  }}
                >
                  <Lock color="rgba(255, 255, 255, 0.5)" size={20} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Confirme sua senha"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                    {showConfirmPassword ? <EyeOff color="rgba(255, 255, 255, 0.6)" size={20} /> : <Eye color="rgba(255, 255, 255, 0.6)" size={20} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Selectors */}
              <View className="flex-row justify-between mb-4">
                <View 
                  style={{
                    flex: 0.48,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    height: 56,
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {loadingStates ? (
                     <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ alignSelf: 'center' }} />
                  ) : (
                    <Picker
                      selectedValue={selectedState}
                      onValueChange={(itemValue) => setSelectedState(itemValue)}
                      style={{ color: '#FFFFFF' }}
                      dropdownIconColor="#FFFFFF"
                    >
                      <Picker.Item label="Estado" value="" color="rgba(255,255,255,0.5)" />
                      {states.map((s) => (
                        <Picker.Item key={s.id} label={s.sigla} value={s.sigla} />
                      ))}
                    </Picker>
                  )}
                </View>

                <View 
                  style={{
                    flex: 0.48,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    height: 56,
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {loadingCities ? (
                     <ActivityIndicator color="rgba(255,255,255,0.5)" style={{ alignSelf: 'center' }} />
                  ) : (
                    <Picker
                      selectedValue={city}
                      onValueChange={(itemValue) => setCity(itemValue)}
                      style={{ color: '#FFFFFF' }}
                      dropdownIconColor="#FFFFFF"
                      enabled={!!selectedState}
                    >
                      <Picker.Item label="Cidade" value="" color="rgba(255,255,255,0.5)" />
                      {cities.map((c) => (
                        <Picker.Item key={c.id} label={c.nome} value={c.nome} />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>

              {/* WhatsApp Input for Sellers */}
              {role === 'SELLER' && (
                <View className="mb-4">
                  <View 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderWidth: 1,
                      borderColor: isWhatsappFocused ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Phone color="rgba(255, 255, 255, 0.5)" size={20} style={{ marginRight: 12 }} />
                    <TextInput
                      placeholder="WhatsApp (ex: 55119...)"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={whatsappNumber}
                      onChangeText={setWhatsappNumber}
                      keyboardType="phone-pad"
                      onFocus={() => setIsWhatsappFocused(true)}
                      onBlur={() => setIsWhatsappFocused(false)}
                      style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                    />
                  </View>
                </View>
              )}

              <View className="mt-2 items-center">
                {loading ? (
                  <View className="h-[56px] w-full justify-center items-center rounded-[16px] bg-[#1D4ED8] opacity-80">
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={handleRegister}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#2563EB',
                      height: 56,
                      width: '100%',
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Finalizar Cadastro</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row justify-center mt-4 pb-2">
                <Text className="text-white opacity-60 text-sm">Já tem uma conta? </Text>
                <Pressable onPress={() => router.replace('/auth/login')}>
                  <Text className="text-[#3B82F6] font-bold text-sm">Faça login</Text>
                </Pressable>
              </View>

            </GlassCard>

            <View className="items-center mt-4 px-4">
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                Ao criar sua conta, você aceita nossos{'\n'}
                <Text style={{ color: '#3B82F6' }}>Termos</Text> e <Text style={{ color: '#3B82F6' }}>Política de Privacidade</Text>.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  }
});