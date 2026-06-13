import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types';
import { MaterialIcons } from '@expo/vector-icons';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/auth';
import { useFeedback } from '../context/FeedbackContext';
import { isEmailValido } from '../utils/validation';

export function EsqueceuSenhaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { toast } = useFeedback();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnviar = async () => {
    if (!isEmailValido(email)) {
      setError('Informe um e-mail válido (ex.: nome@dominio.com)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.esqueceuSenha(email.trim().toLowerCase());
      toast('Se o e-mail estiver cadastrado, você receberá as instruções em breve.', 'success');
      navigation.goBack();
    } catch {
      toast('Não foi possível processar a solicitação. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary px-6 pt-14 pb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4 self-start p-1">
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="items-center">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 130, height: 130 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Body */}
        <View className="px-6 pt-8 pb-10">
          <Text className="text-2xl font-bold text-primary mb-3">Esqueceu sua senha?</Text>
          <Text className="text-primary text-sm leading-5 mb-8">
            Não se preocupe. Digite seu e-mail abaixo e enviaremos instruções para redefinir sua
            senha.
          </Text>

          <InputField
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
            leftIcon={<MaterialIcons name="email" size={18} color="#A0AEC0" />}
          />

          <PrimaryButton
            label="Enviar link de recuperação"
            onPress={handleEnviar}
            loading={loading}
          />

          <View className="mt-3">
            <PrimaryButton label="Voltar" onPress={() => navigation.goBack()} variant="outlined" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
