import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../navigation/types';
import { StepIndicator } from '../components/StepIndicator';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { authService } from '../services/auth';
import { apoioService } from '../services/apoio';
import { formatCPF, formatTelefone, cleanMask } from '../utils/masks';

const STEPS = ['Dados', 'Profissão', 'Senha'];

type Profissao = { id_profissao: number; nome: string };
type Unidade = { id_unidade_atendimento: number; nome: string };

export function CadastroProfissionalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');

  // Step 2
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [idProfissao, setIdProfissao] = useState<number | null>(null);
  const [idUnidade, setIdUnidade] = useState<number | null>(null);

  // Step 3
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apoioService.getProfissoes().then(setProfissoes).catch(() => null);
    apoioService.getUnidades().then(setUnidades).catch(() => null);
  }, []);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Informe o nome completo';
    if (cleanMask(cpf).length !== 11) e.cpf = 'CPF inválido';
    if (!email.trim() || !email.includes('@')) e.email = 'E-mail inválido';
    if (cleanMask(tel).length < 10) e.tel = 'Telefone inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!idProfissao) e.profissao = 'Selecione uma profissão';
    if (!idUnidade) e.unidade = 'Selecione uma unidade';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (senha.length < 8) e.senha = 'Mínimo 8 caracteres';
    if (senha !== confirmarSenha) e.confirmarSenha = 'As senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      await authService.cadastrarProfissional({
        nome,
        cpf: cleanMask(cpf),
        email: email.toLowerCase().trim(),
        tel_celular: cleanMask(tel),
        sexo: 'M',
        id_profissao: idProfissao!,
        id_unidade_atendimento: idUnidade!,
        senha,
      });
      Alert.alert('Sucesso', 'Cadastro realizado! Faça login para continuar.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao cadastrar. Tente novamente.';
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
        <View className="bg-primary px-6 pt-14 pb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3 self-start p-1">
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Cadastro Profissional</Text>
          <Text className="text-white/70 text-sm">Preencha seus dados para criar sua conta</Text>
        </View>

        <StepIndicator steps={STEPS} current={step} />

        <View className="px-6 pb-10">
          {step === 1 && (
            <>
              <InputField
                label="Nome completo"
                placeholder="Seu nome completo"
                value={nome}
                onChangeText={setNome}
                error={errors.nome}
              />
              <InputField
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(t) => setCpf(formatCPF(t))}
                keyboardType="numeric"
                maxLength={14}
                error={errors.cpf}
              />
              <InputField
                label="E-mail"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <InputField
                label="Telefone"
                placeholder="(00) 00000-0000"
                value={tel}
                onChangeText={(t) => setTel(formatTelefone(t))}
                keyboardType="phone-pad"
                maxLength={15}
                error={errors.tel}
              />
              <PrimaryButton label="Próximo" onPress={handleNext} />
            </>
          )}

          {step === 2 && (
            <>
              <Text className="text-sm font-medium text-gray-700 mb-1">Profissão</Text>
              <View
                className={`bg-input-bg border rounded-xl mb-1 ${
                  errors.profissao ? 'border-red-400' : 'border-border'
                }`}
              >
                <Picker
                  selectedValue={idProfissao}
                  onValueChange={(v) => setIdProfissao(v)}
                >
                  <Picker.Item label="Selecione sua profissão" value={null} />
                  {profissoes.map((p) => (
                    <Picker.Item key={p.id_profissao} label={p.nome} value={p.id_profissao} />
                  ))}
                </Picker>
              </View>
              {errors.profissao ? (
                <Text className="text-red-500 text-xs mb-4">{errors.profissao}</Text>
              ) : (
                <View className="mb-4" />
              )}

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Unidade de atendimento
              </Text>
              <View
                className={`bg-input-bg border rounded-xl mb-1 ${
                  errors.unidade ? 'border-red-400' : 'border-border'
                }`}
              >
                <Picker
                  selectedValue={idUnidade}
                  onValueChange={(v) => setIdUnidade(v)}
                >
                  <Picker.Item label="Selecione a unidade" value={null} />
                  {unidades.map((u) => (
                    <Picker.Item
                      key={u.id_unidade_atendimento}
                      label={u.nome}
                      value={u.id_unidade_atendimento}
                    />
                  ))}
                </Picker>
              </View>
              {errors.unidade ? (
                <Text className="text-red-500 text-xs mb-4">{errors.unidade}</Text>
              ) : (
                <View className="mb-4" />
              )}

              <View className="bg-info-bg border border-info-border rounded-xl p-4 mb-6">
                <Text className="text-info-text text-xs leading-relaxed">
                  ℹ️ O ID de Acesso institucional concede privilégios de nível Máximo ou
                  Intermediário conforme sua categoria profissional.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <PrimaryButton label="Voltar" onPress={() => setStep(1)} variant="outlined" />
                </View>
                <View className="flex-1">
                  <PrimaryButton label="Próximo" onPress={handleNext} />
                </View>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <InputField
                label="Senha"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                secureToggle
                error={errors.senha}
              />
              <InputField
                label="Confirmar senha"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                secureToggle
                error={errors.confirmarSenha}
              />

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1">
                  <PrimaryButton label="Voltar" onPress={() => setStep(2)} variant="outlined" />
                </View>
                <View className="flex-1">
                  <PrimaryButton label="Cadastrar" onPress={handleSubmit} loading={loading} />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
