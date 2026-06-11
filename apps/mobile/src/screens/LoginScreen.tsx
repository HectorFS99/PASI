import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { login: authLogin } = useAuth();
  const { toast } = useFeedback();
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
      const result = await authService.login({ login: login.trim(), senha });
      await authLogin(result.access_token, {
        id_usuario: result.usuario.id_usuario,
        nome: result.usuario.nome,
        email: result.usuario.email,
        tipo: result.usuario.id_tipo_usuario,
      });
      // RootNavigator detecta token e navega automaticamente
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 401
          ? 'E-mail/CPF ou senha incorretos.'
          : err?.response?.data?.message ?? 'Não foi possível fazer login. Tente novamente.';
      setErrors({ login: ' ', senha: msg });
      toast(msg, 'error');
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
