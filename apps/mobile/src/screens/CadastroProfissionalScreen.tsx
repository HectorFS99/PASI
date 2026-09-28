import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationProp } from '../navigation/types';
import { StepIndicator } from '../components/StepIndicator';
import { InputField } from '../components/InputField';
import { SelectField } from '../components/SelectField';
import { SegmentedControl } from '../components/SegmentedControl';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { FormFooter } from '../components/FormFooter';
import { authService } from '../services/auth';
import { apoioService } from '../services/apoio';
import { useFeedback } from '../context/FeedbackContext';
import { useScrollToError } from '../hooks/useScrollToError';
import { SEXO_OPCOES, Sexo } from '../constants/dominio';
import { colors } from '../constants/colors';
import { formatCPF, formatTelefone, cleanMask } from '../utils/masks';
import { isCpfValido, isEmailValido, isSenhaForte, SENHA_MENSAGEM } from '../utils/validation';
import { mensagemErroApi } from '../utils/errors';

const STEPS = ['Dados', 'Profissão', 'Senha'];

type Profissao = { id_profissao: number; nome: string };
type Unidade = { id_unidade_atendimento: number; nome: string };

export function CadastroProfissionalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { toast } = useFeedback();
  const { scrollRef, registrarBase, registrar, scrollPara } = useScrollToError();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [sexo, setSexo] = useState<Sexo | null>(null);

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
    if (!isCpfValido(cpf)) e.cpf = 'CPF inválido';
    if (!isEmailValido(email)) e.email = 'E-mail inválido (ex.: nome@dominio.com)';
    if (cleanMask(tel).length < 10) e.tel = 'Telefone inválido';
    if (!sexo) e.sexo = 'Selecione o sexo';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollPara(['nome', 'cpf', 'email', 'tel', 'sexo'].filter((k) => e[k]));
      return false;
    }
    return true;
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
    if (!isSenhaForte(senha)) e.senha = SENHA_MENSAGEM;
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
        sexo: sexo!,
        id_profissao: idProfissao!,
        id_unidade_atendimento: idUnidade!,
        senha,
      });
      toast('Cadastro realizado! Faça login para continuar.', 'success');
      navigation.navigate('Login');
    } catch (err) {
      toast(mensagemErroApi(err, 'Erro ao cadastrar. Tente novamente.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scrollRef} className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
        <ScreenHeader
          variant="large"
          title="Cadastro Profissional"
          subtitle="Preencha seus dados para criar sua conta"
          onBack={() => navigation.goBack()}
        />

        <StepIndicator steps={STEPS} current={step} />

        <View className="px-6 pb-10" onLayout={registrarBase}>
          {step === 1 && (
            <>
              <View onLayout={registrar('nome')}>
                <InputField
                  label="Nome completo"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChangeText={setNome}
                  error={errors.nome}
                  maxLength={70}
                  counter
                />
              </View>
              <View onLayout={registrar('cpf')}>
                <InputField
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChangeText={(t) => setCpf(formatCPF(t))}
                  keyboardType="numeric"
                  maxLength={14}
                  error={errors.cpf}
                />
              </View>
              <View onLayout={registrar('email')}>
                <InputField
                  label="E-mail"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  maxLength={50}
                  counter
                />
              </View>
              <View onLayout={registrar('tel')}>
                <InputField
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  value={tel}
                  onChangeText={(t) => setTel(formatTelefone(t))}
                  keyboardType="phone-pad"
                  maxLength={15}
                  error={errors.tel}
                />
              </View>
              <View onLayout={registrar('sexo')}>
                <SegmentedControl
                  label="Sexo"
                  options={SEXO_OPCOES}
                  value={sexo}
                  onChange={setSexo}
                  error={errors.sexo}
                />
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <SelectField
                label="Profissão"
                placeholder="Selecione sua profissão"
                value={idProfissao}
                onChange={setIdProfissao}
                options={profissoes.map((p) => ({ value: p.id_profissao, label: p.nome }))}
                error={errors.profissao}
              />

              <SelectField
                label="Unidade de atendimento"
                placeholder="Selecione a unidade"
                value={idUnidade}
                onChange={setIdUnidade}
                options={unidades.map((u) => ({ value: u.id_unidade_atendimento, label: u.nome }))}
                error={errors.unidade}
              />

              <View className="bg-info-bg border border-info-border rounded-xl p-4 mb-6 flex-row items-start">
                <MaterialIcons name="info-outline" size={16} color={colors.infoText} style={{ marginRight: 8, marginTop: 1 }} />
                <Text className="text-info-text text-xs leading-relaxed flex-1">
                  O ID de Acesso institucional concede privilégios de nível Máximo ou
                  Intermediário conforme sua categoria profissional.
                </Text>
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
            </>
          )}
        </View>
      </ScrollView>

      {/* Botões de navegação fixos */}
      <FormFooter>
        {step === 1 && <PrimaryButton label="Próximo" onPress={handleNext} />}
        {step === 2 && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton label="Voltar" onPress={() => setStep(1)} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Próximo" onPress={handleNext} />
            </View>
          </View>
        )}
        {step === 3 && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton label="Voltar" onPress={() => setStep(2)} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Cadastrar" onPress={handleSubmit} loading={loading} />
            </View>
          </View>
        )}
      </FormFooter>
    </KeyboardAvoidingView>
  );
}
