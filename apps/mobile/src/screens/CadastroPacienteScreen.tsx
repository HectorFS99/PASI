import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationProp } from '../navigation/types';
import { StepIndicator } from '../components/StepIndicator';
import { InputField } from '../components/InputField';
import { SelectField } from '../components/SelectField';
import { SegmentedControl } from '../components/SegmentedControl';
import { Checkbox } from '../components/Checkbox';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { FormFooter } from '../components/FormFooter';
import { EnderecoFields, EnderecoValues } from '../components/EnderecoFields';
import { authService } from '../services/auth';
import { apoioService } from '../services/apoio';
import { useFeedback } from '../context/FeedbackContext';
import { useScrollToError } from '../hooks/useScrollToError';
import { SEXO_OPCOES, Sexo } from '../constants/dominio';
import { formatCPF, formatTelefone, cleanMask } from '../utils/masks';
import { isCpfValido, isEmailValido, isSenhaForte, SENHA_MENSAGEM } from '../utils/validation';
import { mensagemErroApi } from '../utils/errors';
import { colors } from '../constants/colors';

const STEPS = ['Pessoal', 'Endereço', 'Acesso'];

type Genero = { id_genero: number; nome: string };

export function CadastroPacienteScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { toast } = useFeedback();
  const { scrollRef, registrarBase, registrar, scrollPara } = useScrollToError();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Pessoal
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [dtNascimento, setDtNascimento] = useState('');
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [idGenero, setIdGenero] = useState<number | null>(null);
  const [nacEstrangeira, setNacEstrangeira] = useState(false);

  // Step 2 — Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [pais, setPais] = useState('Brasil');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const endereco: EnderecoValues = { cep, logradouro, numero, complemento, bairro, cidade, estado, pais };
  const setEndereco = (patch: Partial<EnderecoValues>) => {
    if (patch.cep !== undefined) setCep(patch.cep);
    if (patch.logradouro !== undefined) setLogradouro(patch.logradouro);
    if (patch.numero !== undefined) setNumero(patch.numero);
    if (patch.complemento !== undefined) setComplemento(patch.complemento);
    if (patch.bairro !== undefined) setBairro(patch.bairro);
    if (patch.cidade !== undefined) setCidade(patch.cidade);
    if (patch.estado !== undefined) setEstado(patch.estado);
    if (patch.pais !== undefined) setPais(patch.pais);
  };

  // Step 3
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    apoioService.getGeneros().then(setGeneros).catch(() => null);
  }, []);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Informe o nome completo';
    if (!isCpfValido(cpf)) e.cpf = 'CPF inválido';
    if (!isEmailValido(email)) e.email = 'E-mail inválido (ex.: nome@dominio.com)';
    if (cleanMask(tel).length < 10) e.tel = 'Telefone inválido';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollPara(['nome', 'cpf', 'email', 'tel'].filter((k) => e[k]));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (cep.replace(/\D/g, '').length !== 8) e.cep = 'Informe um CEP válido';
    if (!numero.trim()) e.numero = 'Informe o número';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!isSenhaForte(senha)) e.senha = SENHA_MENSAGEM;
    if (senha !== confirmarSenha) e.confirmarSenha = 'As senhas não coincidem';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      let dtFormatted: string | undefined;
      if (dtNascimento.length === 10) {
        const [d, m, y] = dtNascimento.split('/');
        dtFormatted = `${y}-${m}-${d}`;
      }

      await authService.cadastrarPaciente({
        nome,
        cpf: cleanMask(cpf),
        email: email.toLowerCase().trim(),
        tel_celular: cleanMask(tel),
        sexo: sexo ?? 'O',
        dt_nascimento: dtFormatted,
        nac_estrangeira: nacEstrangeira,
        id_genero: idGenero ?? undefined,
        cep: cleanMask(cep),
        logradouro,
        numero,
        complemento: complemento || undefined,
        bairro,
        cidade,
        estado,
        pais,
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
          title="Cadastro Paciente"
          subtitle="Preencha seus dados pessoais"
          onBack={() => navigation.goBack()}
        />

        <StepIndicator steps={STEPS} current={step} />

        <View className="px-6 pb-10" onLayout={registrarBase}>
          {/* ── Step 1: Pessoal ── */}
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
              <InputField
                label="Data de nascimento"
                placeholder="dd/mm/aaaa"
                value={dtNascimento}
                onChangeText={(t) => {
                  const d = t.replace(/\D/g, '').slice(0, 8);
                  let fmt = d;
                  if (d.length > 4) fmt = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
                  else if (d.length > 2) fmt = `${d.slice(0, 2)}/${d.slice(2)}`;
                  setDtNascimento(fmt);
                }}
                keyboardType="numeric"
                maxLength={10}
              />

              <SegmentedControl label="Sexo" options={SEXO_OPCOES} value={sexo} onChange={setSexo} />

              <SelectField
                label="Gênero"
                value={idGenero}
                onChange={setIdGenero}
                options={generos.map((g) => ({ value: g.id_genero, label: g.nome }))}
              />

              <View className="mb-6">
                <Checkbox
                  label="Nacionalidade estrangeira"
                  checked={nacEstrangeira}
                  onToggle={() => setNacEstrangeira((v) => !v)}
                />
              </View>
            </>
          )}

          {/* ── Step 2: Endereço ── */}
          {step === 2 && (
            <EnderecoFields
              values={endereco}
              onChange={setEndereco}
              errors={{ cep: errors.cep, numero: errors.numero }}
            />
          )}

          {/* ── Step 3: Acesso ── */}
          {step === 3 && (
            <>
              <View className="bg-success-bg border border-success-border rounded-xl p-4 mb-6 flex-row items-start">
                <MaterialIcons name="info-outline" size={16} color={colors.successText} style={{ marginRight: 8, marginTop: 1 }} />
                <Text className="text-success-text text-xs leading-relaxed flex-1">
                  Você receberá nível de acesso <Text className="font-bold">Mínimo</Text> —
                  poderá visualizar e responder seus próprios formulários de atendimento.
                </Text>
              </View>

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
        {step === 1 && (
          <PrimaryButton label="Próximo" onPress={() => validateStep1() && setStep(2)} />
        )}
        {step === 2 && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton label="Voltar" onPress={() => setStep(1)} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Próximo" onPress={() => validateStep2() && setStep(3)} />
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
