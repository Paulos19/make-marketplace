import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'userToken';

/**
 * Salva o token de autenticação no AsyncStorage.
 * @param token O token a ser salvo.
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Erro ao salvar o token:', error);
    throw new Error('Não foi possível salvar a sessão do usuário.');
  }
};

/**
 * Carrega o token de autenticação do AsyncStorage.
 * @returns O token, ou null se não for encontrado.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao carregar o token:', error);
    return null;
  }
};

/**
 * Remove o token de autenticação do AsyncStorage (logout).
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Erro ao remover o token:', error);
  }
};

/**
 * Monta o cabeçalho de autorização com o token.
 * @returns Um objeto com o cabeçalho 'Authorization' se o token existir.
 */
export const getAuthHeader = async (): Promise<HeadersInit | undefined> => {
  const token = await getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return undefined;
};