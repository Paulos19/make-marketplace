import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  View,
  Text,
  Pressable,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { apiClient, ApiError } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlert } from '../../components/ui/CustomAlert';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Subtle floating animation for decorative elements
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        router.replace('/(tabs)');
      }
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      CustomAlert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const apiResponse = await apiClient.post<LoginResponse>('/api/mobile-auth', { email, password });
      const response = apiResponse.data;

      if (response.token) {
        await AsyncStorage.setItem('userToken', response.token);
        router.replace('/(tabs)');
      } else {
        CustomAlert.alert('Erro', response.message || 'Login falhou.');
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao tentar fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Image */}
      <RNImage
        source={require('../../assets/images/screenphoto.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Dark Gradient Overlay — fades from transparent at top to solid dark at bottom */}
      <LinearGradient
        colors={[
          'rgba(8, 12, 30, 0.15)',
          'rgba(8, 12, 30, 0.4)',
          'rgba(8, 12, 30, 0.75)',
          'rgba(8, 12, 30, 0.95)',
          '#080C1E',
        ]}
        locations={[0, 0.25, 0.45, 0.65, 0.8]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative accent glow */}
      <Animated.View style={[styles.glowOrb, floatStyle]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>

          {/* ── BOTTOM CONTENT ─────────────────────────── */}
          <View style={[styles.bottomContent, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>

            {/* LOGO & TAGLINE */}
            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.brandBlock}>
              <View style={styles.logoRow}>
                <Text style={styles.logoText}>ZACA</Text>
                <Text style={styles.logoTextAccent}>PLACE</Text>
              </View>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.taglineText}>MARKETPLACE</Text>
                <View style={styles.taglineLine} />
              </View>
              <Text style={styles.subtitle}>
                O marketplace que conecta você ao que importa.
              </Text>
            </Animated.View>

            {/* GLASS FORM CARD */}
            <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.formCard}>
              {/* Blur background for glassmorphism */}
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 20, 40, 0.55)' }]} />
              </BlurView>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    isEmailFocused && styles.inputContainerFocused,
                  ]}
                >
                  <Mail
                    color={isEmailFocused ? '#60A5FA' : 'rgba(255,255,255,0.35)'}
                    size={18}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    placeholder="Seu e-mail"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    style={styles.input}
                    underlineColorAndroid="transparent"
                    cursorColor="#60A5FA"
                    selectionColor="rgba(96,165,250,0.3)"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.inputContainer,
                    isPasswordFocused && styles.inputContainerFocused,
                  ]}
                >
                  <Lock
                    color={isPasswordFocused ? '#60A5FA' : 'rgba(255,255,255,0.35)'}
                    size={18}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    placeholder="Sua senha"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    style={styles.input}
                    underlineColorAndroid="transparent"
                    cursorColor="#60A5FA"
                    selectionColor="rgba(96,165,250,0.3)"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff color="rgba(255,255,255,0.5)" size={18} />
                    ) : (
                      <Eye color="rgba(255,255,255,0.5)" size={18} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password link (positioned right) */}
              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </Pressable>

              {/* Login Button */}
              {loading ? (
                <View style={[styles.loginButton, { opacity: 0.7 }]}>
                  <ActivityIndicator color="#FFF" />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  style={styles.loginButton}
                >
                  <LinearGradient
                    colors={['#2563EB', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>Entrar</Text>
                    <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                activeOpacity={0.7}
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>Criar uma conta</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.footer}>
              <ShieldCheck size={12} color="rgba(255,255,255,0.35)" />
              <Text style={styles.footerText}>
                Protegido com criptografia de ponta a ponta
              </Text>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C1E',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  },
  glowOrb: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    left: SCREEN_WIDTH * 0.5 - 100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  bottomContent: {
    paddingHorizontal: 24,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  logoTextAccent: {
    fontSize: 38,
    fontWeight: '900',
    color: '#60A5FA',
    letterSpacing: 6,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  taglineLine: {
    height: 1,
    width: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  taglineText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputContainerFocused: {
    borderColor: 'rgba(96, 165, 250, 0.5)',
    backgroundColor: 'rgba(96, 165, 250, 0.04)',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 2,
  },
  forgotText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loginButtonGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingBottom: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
  },
});