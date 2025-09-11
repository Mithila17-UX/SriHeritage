import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Animated, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  TouchableWithoutFeedback,
  Vibration 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface CustomAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  autoClose = false,
  autoCloseDelay = 3000
}: CustomAlertProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Add haptic feedback
      if (type === 'error') {
        Vibration.vibrate([0, 100, 50, 100]);
      } else if (type === 'warning') {
        Vibration.vibrate(100);
      } else if (type === 'success') {
        Vibration.vibrate([0, 50]);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close if enabled
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      slideAnim.setValue(height);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const handleButtonPress = (button: CustomAlertButton) => {
    button.onPress?.();
    handleClose();
  };

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: styles.successContainer,
          icon: '✅',
          iconBg: '#10B981',
          borderColor: '#34D399',
          titleColor: '#065F46',
          messageColor: '#047857',
        };
      case 'error':
        return {
          container: styles.errorContainer,
          icon: '❌',
          iconBg: '#EF4444',
          borderColor: '#F87171',
          titleColor: '#7F1D1D',
          messageColor: '#991B1B',
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          icon: '⚠️',
          iconBg: '#F59E0B',
          borderColor: '#FCD34D',
          titleColor: '#78350F',
          messageColor: '#92400E',
        };
      default:
        return {
          container: styles.infoContainer,
          icon: 'ℹ️',
          iconBg: '#3B82F6',
          borderColor: '#93C5FD',
          titleColor: '#1E3A8A',
          messageColor: '#1E40AF',
        };
    }
  };

  const alertStyles = getAlertStyles();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.alertContainer,
                alertStyles.container,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim }
                  ],
                },
              ]}
            >
              {/* Icon Section */}
              <View style={[styles.iconContainer, { backgroundColor: alertStyles.iconBg }]}>
                <Text style={styles.iconText}>{alertStyles.icon}</Text>
              </View>

              {/* Content Section */}
              <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: alertStyles.titleColor }]}>
                  {title}
                </Text>
                {message && (
                  <Text style={[styles.message, { color: alertStyles.messageColor }]}>
                    {message}
                  </Text>
                )}
              </View>

              {/* Buttons Section */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'cancel' && styles.cancelButton,
                      button.style === 'destructive' && styles.destructiveButton,
                      buttons.length === 1 && styles.singleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === 'cancel' && styles.cancelButtonText,
                        button.style === 'destructive' && styles.destructiveButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Progress indicator for auto-close */}
              {autoClose && (
                <View style={styles.progressContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: alertStyles.iconBg,
                        width: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Hook for easier usage
export function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    buttons?: CustomAlertButton[];
    autoClose?: boolean;
    autoCloseDelay?: number;
  }>({
    visible: false,
    type: 'info',
    title: '',
  });

  const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Convenience methods
  const showSuccess = (title: string, message?: string, autoClose = true) => {
    showAlert({
      type: 'success',
      title,
      message,
      autoClose,
      autoCloseDelay: 2500,
    });
  };

  const showError = (title: string, message?: string, buttons?: CustomAlertButton[]) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const showWarning = (title: string, message?: string, buttons?: CustomAlertButton[]) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const showInfo = (title: string, message?: string, buttons?: CustomAlertButton[]) => {
    showAlert({
      type: 'info',
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const AlertComponent = () => (
    <CustomAlert
      visible={alertConfig.visible}
      type={alertConfig.type}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onClose={hideAlert}
      autoClose={alertConfig.autoClose}
      autoCloseDelay={alertConfig.autoCloseDelay}
    />
  );

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
    AlertComponent,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    minWidth: width * 0.8,
    maxWidth: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
  },
  successContainer: {
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
  },
  errorContainer: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  warningContainer: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  infoContainer: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 28,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  singleButton: {
    backgroundColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
