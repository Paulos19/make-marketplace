import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

const SalesScreen = () => {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Minhas Vendas' }} />
      <Text style={styles.title}>Minhas Vendas</Text>
      <Text style={styles.text}>Conteúdo da tela de vendas.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primaryBlue,
  },
  text: {
    fontSize: 16,
    color: Colors.textDark,
  },
});

export default SalesScreen;
