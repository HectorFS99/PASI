import React, { createContext, useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface FeedbackContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

const useNative = Platform.OS !== 'web';

const TOAST_STYLE: Record<ToastType, { bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  success: { bg: '#16A34A', icon: 'check-circle' },
  error: { bg: '#DC2626', icon: 'error' },
  info: { bg: '#0D2347', icon: 'info' },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  // ---- Toast (exibido na parte inferior, acima dos botões de navegação) ----
  const [toastState, setToastState] = useState<{ message: string; type: ToastType } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: useNative }),
      Animated.timing(translateY, { toValue: 24, duration: 180, useNativeDriver: useNative }),
    ]).start(({ finished }) => {
      if (finished) setToastState(null);
    });
  };

  const toast = (message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToastState({ message, type });
    opacity.setValue(0);
    translateY.setValue(24);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: useNative }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: useNative }),
    ]).start();
    timer.current = setTimeout(hideToast, 3000);
  };

  // ---- Confirm ----
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });

  const responder = (resultado: boolean) => {
    confirmState?.resolve(resultado);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast host */}
      {toastState && (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            // Acima da barra fixa de botões de navegação (FormFooter).
            bottom: Math.max(insets.bottom, 12) + 76,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            alignItems: 'center',
            zIndex: 1000,
            opacity,
            transform: [{ translateY }],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: TOAST_STYLE[toastState.type].bg,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 14,
              maxWidth: 480,
              width: '100%',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <MaterialIcons
              name={TOAST_STYLE[toastState.type].icon}
              size={20}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500', flex: 1 }}>
              {toastState.message}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Confirm host */}
      <Modal visible={!!confirmState} transparent animationType="fade" onRequestClose={() => responder(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className="bg-white rounded-2xl p-5 w-full" style={{ maxWidth: 380 }}>
            <Text className="text-primary font-bold text-base mb-2">
              {confirmState?.options.title}
            </Text>
            {confirmState?.options.message ? (
              <Text className="text-gray-600 text-sm mb-5 leading-5">
                {confirmState.options.message}
              </Text>
            ) : (
              <View className="mb-3" />
            )}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => responder(false)}
                className="flex-1 h-11 border border-border rounded-xl items-center justify-center"
              >
                <Text className="text-gray-600 font-medium">
                  {confirmState?.options.cancelLabel ?? 'Cancelar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => responder(true)}
                className={`flex-1 h-11 rounded-xl items-center justify-center ${
                  confirmState?.options.destructive ? 'bg-red-600' : 'bg-primary'
                }`}
              >
                <Text className="text-white font-semibold">
                  {confirmState?.options.confirmLabel ?? 'Confirmar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  return ctx;
}
