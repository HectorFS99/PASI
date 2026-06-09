import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types';

interface CardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

function ProfileCard({ title, description, icon, onPress }: CardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-white rounded-2xl p-5 mb-4 shadow-sm border border-border"
      style={{ elevation: 2 }}
    >
      <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-primary font-semibold text-base">{title}</Text>
        <Text className="text-muted text-xs mt-0.5">{description}</Text>
      </View>
      <Text className="text-muted text-lg">›</Text>
    </TouchableOpacity>
  );
}

export function SelectProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View className="flex-1 bg-white">
      {/* Header azul com logo */}
      <View className="bg-primary items-center pt-14 pb-8 rounded-b-3xl">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 160, height: 160 }}
          resizeMode="contain"
        />
      </View>

      <View className="px-6 pt-8">
      <Text className="text-2xl font-bold text-primary text-center mb-1">
        Selecione seu perfil
      </Text>
      <Text className="text-muted text-sm text-center mb-8">
        Como você deseja acessar a plataforma?
      </Text>

      <ProfileCard
        title="Sou profissional"
        description="Cadastre-se como profissional e tenha acesso às ferramentas de atendimento."
        icon="💼"
        onPress={() => navigation.navigate('CadastroProfissional')}
      />

      <ProfileCard
        title="Sou paciente"
        description="Cadastre-se como paciente e acompanhe seus atendimentos e formulários."
        icon="👤"
        onPress={() => navigation.navigate('CadastroPaciente')}
      />
      </View>
    </View>
  );
}
