import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { InputField } from './InputField';
import { buscarCep } from '../services/apoio';

const CORREIOS_URL = 'https://buscacepinter.correios.com.br/app/endereco/index.php';

export interface EnderecoValues {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}

interface Props {
  values: EnderecoValues;
  onChange: (patch: Partial<EnderecoValues>) => void;
  errors?: { cep?: string; numero?: string };
}

export function EnderecoFields({ values, onChange, errors = {} }: Props) {
  const [cepLoading, setCepLoading] = useState(false);
  // Quando o serviço de CEP está indisponível, liberamos os campos para
  // preenchimento manual.
  const [manual, setManual] = useState(false);
  const [apiIndisponivel, setApiIndisponivel] = useState(false);

  const handleCepChange = async (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    onChange({ cep: formatted });

    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const data = await buscarCep(digits);
      if (data) {
        onChange({
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          pais: 'Brasil',
        });
        setManual(false);
        setApiIndisponivel(false);
      } else {
        // CEP não encontrado — libera preenchimento manual.
        setManual(true);
        setApiIndisponivel(false);
      }
    } catch {
      // Serviço de consulta indisponível — libera preenchimento manual.
      setManual(true);
      setApiIndisponivel(true);
    } finally {
      setCepLoading(false);
    }
  };

  // Campos preenchidos automaticamente pelo CEP ficam bloqueados, exceto
  // quando o serviço estiver indisponível (modo manual).
  const bloqueado = !manual;

  return (
    <>
      <InputField
        label="CEP *"
        placeholder="00000-000"
        value={values.cep}
        onChangeText={handleCepChange}
        keyboardType="numeric"
        maxLength={9}
        error={errors.cep}
      />
      <TouchableOpacity
        onPress={() => Linking.openURL(CORREIOS_URL)}
        className="-mt-3 mb-3 self-start flex-row items-center"
      >
        <MaterialIcons name="help-outline" size={14} color="#0D2347" style={{ marginRight: 4 }} />
        <Text className="text-primary text-xs underline">Não sei meu CEP</Text>
      </TouchableOpacity>

      {cepLoading && <Text className="text-muted text-xs -mt-1 mb-3">Buscando endereço...</Text>}
      {apiIndisponivel && (
        <Text className="text-orange-600 text-xs -mt-1 mb-3">
          Serviço de CEP indisponível. Preencha o endereço manualmente.
        </Text>
      )}

      <InputField
        label="Logradouro"
        placeholder="Rua, Av., etc."
        value={values.logradouro}
        onChangeText={(t) => onChange({ logradouro: t })}
        disabled={bloqueado}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <InputField
            label="Número *"
            placeholder="Nº"
            value={values.numero}
            onChangeText={(t) => onChange({ numero: t })}
            keyboardType="numeric"
            maxLength={10}
            error={errors.numero}
          />
        </View>
        <View className="flex-1">
          <InputField
            label="Complemento"
            placeholder="Apto, bloco..."
            value={values.complemento}
            onChangeText={(t) => onChange({ complemento: t })}
            maxLength={15}
            counter
          />
        </View>
      </View>

      <InputField
        label="Bairro"
        placeholder="Bairro"
        value={values.bairro}
        onChangeText={(t) => onChange({ bairro: t })}
        disabled={bloqueado}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <InputField
            label="Cidade"
            placeholder="Cidade"
            value={values.cidade}
            onChangeText={(t) => onChange({ cidade: t })}
            disabled={bloqueado}
          />
        </View>
        <View className="w-20">
          <InputField
            label="Estado"
            placeholder="UF"
            value={values.estado}
            onChangeText={(t) => onChange({ estado: t.toUpperCase().slice(0, 2) })}
            maxLength={2}
            disabled={bloqueado}
          />
        </View>
      </View>

      <InputField
        label="País"
        placeholder="País"
        value={values.pais}
        onChangeText={(t) => onChange({ pais: t })}
        disabled={bloqueado}
      />
    </>
  );
}
