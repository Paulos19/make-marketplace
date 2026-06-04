/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme'; // Importação relativa correta

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors // Agora colorName é uma chave direta de Colors
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Retorna a cor diretamente do objeto Colors
    // Se a cor não for encontrada, retorna uma string vazia ou um fallback adequado
    return Colors[colorName] || ''; 
  }
}