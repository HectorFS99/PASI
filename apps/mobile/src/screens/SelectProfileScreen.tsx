import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationProp } from '../navigation/types';
import { FormFooter } from '../components/FormFooter';

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
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
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-primary font-semibold text-base">{title}</Text>
        <Text className="text-muted text-xs mt-0.5">{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#A0AEC0" />
    </TouchableOpacity>
  );
}

export function SelectProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View className="flex-1 bg-white">
      {/* Header azul com logo */}
      <View className="bg-primary pt-14 pb-8 rounded-b-3xl items-center">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </View>

      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-primary text-center mb-1">
          Selecione seu perfil
        </Text>
        <Text className="text-muted text-sm text-center mb-8">
          Como você deseja acessar a plataforma?
        </Text>

        <ProfileCard
          title="Sou profissional"
          description="Cadastre-se como profissional e tenha acesso às ferramentas de atendimento."
          icon={<MaterialIcons name="work" size={26} color="#0D2347" />}
          onPress={() => navigation.navigate('CadastroProfissional')}
        />

        <ProfileCard
          title="Sou paciente"
          description="Cadastre-se como paciente e acompanhe seus atendimentos e formulários."
          icon={<MaterialIcons name="person" size={26} color="#0D2347" />}
          onPress={() => navigation.navigate('CadastroPaciente')}
        />
      </View>

      {/* Botão Voltar fixo */}
      <FormFooter>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-border rounded-xl py-3 items-center"
        >
          <Text className="text-gray-700 text-sm font-medium">Voltar</Text>
        </TouchableOpacity>
      </FormFooter>
    </View>
  );
}
