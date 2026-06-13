import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../context/DrawerContext';
import { useAuth } from '../context/AuthContext';
import { useProfilePhoto } from '../context/ProfilePhotoContext';
import { navigate } from '../navigation/navigationRef';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface MenuItem {
  label: string;
  icon: IconName;
  route: string;
}

const MENU_PROFISSIONAL: MenuItem[] = [
  { label: 'Atendimentos', icon: 'event-note', route: 'AtendimentosList' },
  { label: 'Formulários', icon: 'description', route: 'FormulariosList' },
  { label: 'Meu Perfil', icon: 'person', route: 'Perfil' },
];

const MENU_PACIENTE: MenuItem[] = [
  { label: 'Meus Atendimentos', icon: 'event-note', route: 'MeusAtendimentos' },
  { label: 'Meu Perfil', icon: 'person', route: 'Perfil' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);
const useNative = Platform.OS !== 'web';

function iniciais(nome?: string) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function AppDrawer() {
  const insets = useSafeAreaInsets();
  const { isOpen, closeDrawer } = useDrawer();
  const { usuario, logout } = useAuth();
  const { foto } = useProfilePhoto();

  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: useNative }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: useNative }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -PANEL_WIDTH, duration: 220, useNativeDriver: useNative }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: useNative }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [isOpen]);

  if (!mounted) return null;

  const isProfissional = usuario?.tipo === 1;
  const itens = isProfissional ? MENU_PROFISSIONAL : MENU_PACIENTE;

  const irPara = (route: string) => {
    closeDrawer();
    // pequena espera para a animação de fechar não competir com a transição de tela
    setTimeout(() => navigate(route), 180);
  };

  const handleLogout = () => {
    closeDrawer();
    setTimeout(() => logout(), 180);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: overlayOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Painel */}
      <Animated.View
        style={{
          width: PANEL_WIDTH,
          height: '100%',
          backgroundColor: '#fff',
          transform: [{ translateX }],
        }}
      >
        {/* Cabeçalho do perfil */}
        <View className="bg-primary px-5" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 24 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              {isProfissional ? 'Profissional' : 'Paciente'}
            </Text>
            <TouchableOpacity onPress={closeDrawer} className="w-8 h-8 items-center justify-center">
              <MaterialIcons name="close" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => irPara('Perfil')}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center overflow-hidden mr-3">
              {foto ? (
                <Image source={{ uri: foto }} style={{ width: 56, height: 56 }} resizeMode="cover" />
              ) : (
                <Text className="text-white text-lg font-bold">{iniciais(usuario?.nome)}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-bold" numberOfLines={1}>
                {usuario?.nome}
              </Text>
              <Text className="text-white/60 text-xs" numberOfLines={1}>
                {usuario?.email}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Itens de menu */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 12 }}>
          {itens.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => irPara(item.route)}
              className="flex-row items-center px-5 py-4"
              activeOpacity={0.6}
            >
              <MaterialIcons name={item.icon} size={22} color="#0D2347" style={{ marginRight: 16 }} />
              <Text className="text-gray-800 text-sm font-medium">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rodapé — Sair */}
        <View className="border-t border-border px-5 py-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center"
            activeOpacity={0.6}
          >
            <MaterialIcons name="logout" size={22} color="#DC2626" style={{ marginRight: 16 }} />
            <Text className="text-red-600 text-sm font-medium">Sair</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
