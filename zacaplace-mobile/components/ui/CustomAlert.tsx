import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react-native';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  type?: AlertType;
  cancelable?: boolean;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

class AlertService {
  private static instance: AlertService;
  private listener: ((state: AlertState) => void) | null = null;

  private constructor() {}

  static getInstance() {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  setListener(listener: (state: AlertState) => void) {
    this.listener = listener;
  }

  show(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    if (this.listener) {
      this.listener({ visible: true, title, message, buttons, options });
    }
  }

  hide() {
    if (this.listener) {
      this.listener({ visible: false, title: '' });
    }
  }
}

export const CustomAlertService = AlertService.getInstance();

export const CustomAlertProvider = () => {
  const [state, setState] = useState<AlertState>({ visible: false, title: '' });
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    CustomAlertService.setListener((newState) => {
      if (newState.visible) {
        setState(newState);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true })
        ]).start(() => {
          setState({ visible: false, title: '' });
        });
      }
    });
  }, []);

  if (!state.visible) return null;

  const getIcon = () => {
    const type = state.options?.type || 'info';
    // Determine type automatically from title if options.type is not provided
    let inferredType = type;
    if (!state.options?.type) {
      const lowerTitle = state.title.toLowerCase();
      if (lowerTitle.includes('erro') || lowerTitle.includes('falha')) inferredType = 'error';
      else if (lowerTitle.includes('sucesso') || lowerTitle.includes('copiado')) inferredType = 'success';
      else if (lowerTitle.includes('aviso') || lowerTitle.includes('atenção')) inferredType = 'warning';
    }

    switch (inferredType) {
      case 'success': return <CheckCircle2 size={32} color="#10B981" />;
      case 'error': return <AlertCircle size={32} color="#EF4444" />;
      case 'warning': return <AlertTriangle size={32} color="#F59E0B" />;
      default: return <Info size={32} color="#3B82F6" />;
    }
  };

  const buttons = state.buttons || [{ text: 'OK', onPress: () => {} }];

  return (
    <Modal transparent visible={state.visible} animationType="none" onRequestClose={() => CustomAlertService.hide()}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <Text style={styles.title}>{state.title}</Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}
          
          <View style={[styles.buttonContainer, buttons.length > 2 ? styles.buttonContainerVertical : styles.buttonContainerHorizontal]}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel && index === buttons.length - 1;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttons.length <= 2 && { flex: 1 },
                    isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
                    isDestructive ? styles.buttonDestructive : null
                  ]}
                  onPress={() => {
                    CustomAlertService.hide();
                    setTimeout(() => {
                      if (btn.onPress) btn.onPress();
                    }, 200); // Wait for hide animation
                  }}
                >
                  <Text style={[
                    styles.buttonText,
                    isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary,
                    isDestructive ? styles.buttonTextDestructive : null
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    CustomAlertService.show(title, message, buttons, options);
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  buttonContainerHorizontal: {
    flexDirection: 'row',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#7C3AED',
  },
  buttonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  buttonDestructive: {
    backgroundColor: '#FEF2F2',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#475569',
  },
  buttonTextDestructive: {
    color: '#EF4444',
  },
});
