import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useProfilePhoto } from '../context/ProfilePhotoContext';
import { useFeedback } from '../context/FeedbackContext';
import { useScrollToError } from '../hooks/useScrollToError';
import { usuariosService, AtualizarPerfilPayload } from '../services/usuarios';
import { apoioService, buscarCep } from '../services/apoio';
import { formatTelefone, cleanMask } from '../utils/masks';
import { isEmailValido } from '../utils/validation';
import { maskCpf } from '../utils/format';

const SEXO_OPTIONS = ['Masculino', 'Feminino', 'Outro'] as const;
const SEXO_TO_VALUE: Record<string, string> = { Masculino: 'M', Feminino: 'F', Outro: 'O' };
const VALUE_TO_SEXO: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' };

type Genero = { id_genero: number; nome: string };

function isoParaBr(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

function brParaIso(br: string): string | null {
  if (br.length !== 10) return null;
  const [d, m, y] = br.split('/');
  return `${y}-${m}-${d}`;
}

function iniciais(nome?: string) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function PerfilScreen() {
  const navigation = useNavigation();
  const { usuario, updateUsuario } = useAuth();
  const { foto, setFoto } = useProfilePhoto();
  const { toast } = useFeedback();
  const { scrollRef, registrarBase, registrar, scrollPara } = useScrollToError();

  const isProfissional = usuario?.tipo === 1;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Campos
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [dtNascimento, setDtNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [idGenero, setIdGenero] = useState<number | null>(null);
  const [nacEstrangeira, setNacEstrangeira] = useState(false);
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [pais, setPais] = useState('');

  useEffect(() => {
    apoioService.getGeneros().then(setGeneros).catch(() => null);
    usuariosService
      .me()
      .then((u) => {
        setNome(u.nome ?? '');
        setCpf(u.cpf ?? '');
        setEmail(u.email ?? '');
        setTel(u.tel_celular ? formatTelefone(u.tel_celular) : '');
        setDtNascimento(isoParaBr(u.dt_nascimento));
        setSexo(VALUE_TO_SEXO[u.sexo] ?? '');
        setIdGenero(u.id_genero ?? null);
        setNacEstrangeira(!!u.nac_estrangeira);
        setCep(u.cep ? (u.cep.length > 5 ? `${u.cep.slice(0, 5)}-${u.cep.slice(5)}` : u.cep) : '');
        setLogradouro(u.logradouro ?? '');
        setNumero(u.numero ?? '');
        setComplemento(u.complemento ?? '');
        setBairro(u.bairro ?? '');
        setCidade(u.cidade ?? '');
        setEstado(u.estado ?? '');
        setPais(u.pais ?? '');
      })
      .catch(() => {
        toast('Não foi possível carregar seu perfil.', 'error');
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCepChange = async (value: string) => {
    const masked = value.replace(/\D/g, '').slice(0, 8);
    const formatted = masked.length > 5 ? `${masked.slice(0, 5)}-${masked.slice(5)}` : masked;
    setCep(formatted);
    if (masked.length === 8) {
      setCepLoading(true);
      const data = await buscarCep(masked).catch(() => null);
      if (data) {
        setLogradouro(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        setEstado(data.uf);
      }
      setCepLoading(false);
    }
  };

  // Pode ser chamada quantas vezes o usuário quiser.
  const escolherFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast('Permita o acesso às fotos para escolher uma imagem.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await setFoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      toast('Foto de perfil atualizada.', 'success');
    }
  };

  const removerFoto = async () => {
    await setFoto(null);
    toast('Foto de perfil removida.', 'info');
  };

  const handleSalvar = async () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Informe o nome completo';
    if (!isEmailValido(email)) e.email = 'E-mail inválido (ex.: nome@dominio.com)';
    if (cleanMask(tel).length < 10) e.tel = 'Telefone inválido';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollPara(['nome', 'email', 'tel'].filter((k) => e[k]));
      return;
    }

    setSaving(true);
    try {
      const payload: AtualizarPerfilPayload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        tel_celular: cleanMask(tel),
        sexo: SEXO_TO_VALUE[sexo] ?? 'O',
        id_genero: idGenero ?? undefined,
        // Endereço e nascimento só fazem parte do perfil do paciente.
        ...(isProfissional
          ? {}
          : {
              dt_nascimento: dtNascimento ? brParaIso(dtNascimento) : null,
              nac_estrangeira: nacEstrangeira,
              cep: cleanMask(cep) || undefined,
              logradouro: logradouro.trim() || undefined,
              numero: numero.trim() || undefined,
              complemento: complemento.trim() || undefined,
              bairro: bairro.trim() || undefined,
              cidade: cidade.trim() || undefined,
              estado: estado.trim() || undefined,
              pais: pais.trim() || undefined,
            }),
      };
      await usuariosService.atualizarPerfil(payload);
      await updateUsuario({ nome: payload.nome, email: payload.email });
      toast('Seus dados foram atualizados.', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Não foi possível salvar as alterações.';
      toast(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3 self-start">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Meu Perfil</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={escolherFoto} activeOpacity={0.8} className="relative">
            <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center overflow-hidden">
              {foto ? (
                <Image source={{ uri: foto }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              ) : (
                <Text className="text-primary text-2xl font-bold">{iniciais(nome)}</Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-white">
              <MaterialIcons name="photo-camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-primary font-bold text-base mt-3">{nome}</Text>
          <Text className="text-muted text-xs">{isProfissional ? 'Profissional' : 'Paciente'}</Text>
          {foto && (
            <TouchableOpacity onPress={removerFoto} className="mt-2">
              <Text className="text-red-500 text-xs font-medium">Remover foto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dados pessoais */}
        <View onLayout={registrarBase}>
          <Text className="text-primary font-bold text-sm mb-3">Dados pessoais</Text>

          <View onLayout={registrar('nome')}>
            <InputField label="Nome completo" value={nome} onChangeText={setNome} error={errors.nome} />
          </View>

          {/* CPF — somente leitura */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">CPF</Text>
            <View className="flex-row items-center bg-gray-100 border border-border rounded-xl px-4 h-12">
              <Text className="flex-1 text-sm text-gray-500">{maskCpf(cpf)}</Text>
              <MaterialIcons name="lock" size={16} color="#9CA3AF" />
            </View>
            <Text className="text-muted text-xs mt-1">O CPF não pode ser alterado.</Text>
          </View>

          <View onLayout={registrar('email')}>
            <InputField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          </View>
          <View onLayout={registrar('tel')}>
            <InputField
              label="Telefone"
              value={tel}
              onChangeText={(t) => setTel(formatTelefone(t))}
              keyboardType="phone-pad"
              maxLength={15}
              error={errors.tel}
            />
          </View>

          {/* Data de nascimento — apenas paciente */}
          {!isProfissional && (
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
          )}

          {/* Sexo */}
          <Text className="text-sm font-medium text-gray-700 mb-2">Sexo</Text>
          <View className="flex-row gap-2 mb-4">
            {SEXO_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSexo(s)}
                className={`flex-1 h-11 rounded-xl border items-center justify-center ${
                  sexo === s ? 'bg-primary border-primary' : 'bg-white border-border'
                }`}
              >
                <Text className={`text-sm font-medium ${sexo === s ? 'text-white' : 'text-gray-600'}`}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gênero — apenas paciente */}
          {!isProfissional && generos.length > 0 && (
            <>
              <Text className="text-sm font-medium text-gray-700 mb-1">Gênero</Text>
              <View className="bg-input-bg border border-border rounded-xl mb-4">
                <Picker selectedValue={idGenero} onValueChange={(v) => setIdGenero(v)}>
                  <Picker.Item label="Selecione" value={null} />
                  {generos.map((g) => (
                    <Picker.Item key={g.id_genero} label={g.nome} value={g.id_genero} />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </View>

        {/* Endereço — apenas paciente */}
        {!isProfissional && (
          <>
            <Text className="text-primary font-bold text-sm mb-3 mt-2">Endereço</Text>

            <InputField
              label="CEP"
              placeholder="00000-000"
              value={cep}
              onChangeText={handleCepChange}
              keyboardType="numeric"
              maxLength={9}
            />
            {cepLoading && <Text className="text-muted text-xs -mt-3 mb-3">Buscando endereço...</Text>}

            <InputField label="Logradouro" value={logradouro} onChangeText={setLogradouro} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField label="Número" value={numero} onChangeText={setNumero} keyboardType="numeric" maxLength={10} />
              </View>
              <View className="flex-1">
                <InputField label="Complemento" value={complemento} onChangeText={setComplemento} maxLength={15} />
              </View>
            </View>
            <InputField label="Bairro" value={bairro} onChangeText={setBairro} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField label="Cidade" value={cidade} onChangeText={setCidade} />
              </View>
              <View className="w-20">
                <InputField
                  label="Estado"
                  value={estado}
                  onChangeText={(t) => setEstado(t.toUpperCase().slice(0, 2))}
                  maxLength={2}
                />
              </View>
            </View>
            <InputField label="País" value={pais} onChangeText={setPais} />
          </>
        )}

        {/* Botões */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1">
            <PrimaryButton label="Cancelar" onPress={() => navigation.goBack()} variant="outlined" />
          </View>
          <View className="flex-1">
            <PrimaryButton label="Salvar" onPress={handleSalvar} loading={saving} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
