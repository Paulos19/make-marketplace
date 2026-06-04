import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { apiClient, ApiError } from '../../services/api'; // Reutilizando apiClient
import { CustomAlert } from '../../components/ui/CustomAlert';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email) {
      CustomAlert.alert('Erro', 'Por favor, digite seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      // Adapte o endpoint e o corpo da requisição conforme sua API de recuperação de senha
      const apiResponse = await apiClient.post<{ success: boolean; message?: string }>('/api/auth/send-password-reset', { email });
      const response: { success: boolean; message?: string } = apiResponse.data;
      
      if (response.success) {
        CustomAlert.alert('Sucesso', response.message || 'Um link para redefinir sua senha foi enviado para o seu e-mail.');
        router.replace('/auth/login'); 
      } else {
        CustomAlert.alert('Erro', response.message || 'Ocorreu um erro ao tentar redefinir a senha.');
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao tentar redefinir a senha.');
      }
      console.error('Erro de recuperação de senha:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Redefinir Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enviar</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/auth/login')}>
        <Text style={styles.link}>Lembrou da senha? Faça login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1a202c',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#4f46e5',
    fontSize: 16,
    marginTop: 10,
  },
});