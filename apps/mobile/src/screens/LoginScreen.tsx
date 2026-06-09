import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/auth';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ login?: string; senha?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!login.trim()) e.login = 'Informe seu e-mail ou CPF';
    if (!senha.trim()) e.senha = 'Informe sua senha';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.login({ login: login.trim(), senha });
      // TODO: salvar token e navegar para Home
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Não foi possível fazer login. Tente novamente.';
      Alert.alert('Erro', msg);
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
        <View className="bg-primary items-center pt-16 pb-10 px-6">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
          />
        </View>

        {/* Body */}
        <View className="px-6 pt-8 pb-10">
          <Text className="text-2xl font-bold text-primary mb-1">Bem-vindo(a)</Text>
          <Text className="text-muted text-sm mb-6">Acesse sua conta para continuar</Text>

          <InputField
            label="E-mail ou CPF"
            placeholder="Digite seu e-mail ou CPF"
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.login}
          />

          <InputField
            label="Senha"
            placeholder="Digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            secureToggle
            error={errors.senha}
          />

          <TouchableOpacity
            className="items-end mb-6"
            onPress={() => navigation.navigate('EsqueceuSenha')}
          >
            <Text className="text-primary text-sm">Esqueci minha senha</Text>
          </TouchableOpacity>

          <PrimaryButton label="Entrar" onPress={handleLogin} loading={loading} />

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted text-sm mx-3">ou</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <PrimaryButton
            label="Cadastre-se"
            onPress={() => navigation.navigate('SelectProfile')}
            variant="outlined"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
