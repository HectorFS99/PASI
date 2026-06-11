import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import { formulariosAdminService, FormularioAdmin, PerguntaAdmin } from '../../services/formularios';
import { MaterialIcons } from '@expo/vector-icons';
import { useFeedback } from '../../context/FeedbackContext';
import { formatData } from '../../utils/format';

type RouteT = RouteProp<ProfissionalStackParamList, 'DetalhesFormulario'>;

const TIPO_LABELS: Record<number, string> = {
  1: 'Texto longo',
  2: 'Número',
  3: 'Sim/Não',
  4: 'Seleção única',
  5: 'Múltipla escolha',
};

const TIPO_COLORS: Record<number, string> = {
  1: 'bg-blue-50 text-blue-600',
  2: 'bg-purple-50 text-purple-600',
  3: 'bg-green-50 text-green-600',
  4: 'bg-orange-50 text-orange-600',
  5: 'bg-pink-50 text-pink-600',
};

function PreviewInput({ pergunta }: { pergunta: PerguntaAdmin }) {
  const { id_tipo_pergunta: tipo, valor_minimo, valor_maximo, opcao_pergunta } = pergunta;

  if (tipo === 1) {
    return (
      <View className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3 mt-2">
        <Text className="text-gray-400 text-sm italic">Digite sua resposta...</Text>
      </View>
    );
  }
  if (tipo === 2) {
    const label =
      valor_minimo !== undefined && valor_maximo !== undefined
        ? `Escala de ${valor_minimo} a ${valor_maximo}`
        : 'Digite um número';
    return (
      <View className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 h-10 mt-2 justify-center">
        <Text className="text-gray-400 text-sm italic">{label}</Text>
      </View>
    );
  }
  if (tipo === 3) {
    return (
      <View className="flex-row gap-2 mt-2">
        {['Sim', 'Não'].map((label) => (
          <View key={label} className="flex-1 h-10 rounded-xl border border-dashed border-gray-300 items-center justify-center">
            <Text className="text-gray-400 text-sm">{label}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (tipo === 4 || tipo === 5) {
    return (
      <View className="mt-2 gap-1">
        {opcao_pergunta.map((op) => (
          <View key={op.id_opcao} className="flex-row items-center px-3 py-2 border border-dashed border-gray-300 rounded-xl">
            <View className={`w-4 h-4 ${tipo === 4 ? 'rounded-full' : 'rounded'} border border-gray-300 mr-2`} />
            <Text className="text-sm text-gray-600">{op.texto_opcao}</Text>
          </View>
        ))}
      </View>
    );
  }
  return null;
}

export function DetalhesFormularioScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const insets = useSafeAreaInsets();
  const { toast } = useFeedback();
  const { id } = useRoute<RouteT>().params;
  const [formulario, setFormulario] = useState<FormularioAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const f = await formulariosAdminService.buscar(id);
      setFormulario(f);
    } catch {
      toast('Não foi possível carregar o formulário.', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading || !formulario) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  const perguntas = formulario.pergunta ?? [];
  const tipo = formulario.tipo_formulario;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-6" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Visualizar Formulário</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Card de cabeçalho do formulário */}
        <View className="bg-white border border-border rounded-2xl p-4 mb-5" style={{ elevation: 1 }}>
          <View className="flex-row items-start">
            <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <MaterialIcons name="assignment" size={28} color="#0D2347" />
            </View>
            <View className="flex-1">
              <Text className="text-primary font-bold text-base">{formulario.nome}</Text>
              {tipo && (
                <View className="mt-1 self-start px-2 py-0.5 rounded-full bg-blue-50">
                  <Text className="text-blue-600 text-xs font-semibold">{tipo.nome}</Text>
                </View>
              )}
              {formulario.descricao ? (
                <Text className="text-sm text-gray-600 mt-2 leading-5">{formulario.descricao}</Text>
              ) : null}
              <Text className="text-xs text-muted mt-2">
                Criado em {formatData(formulario.dt_cadastro)}
                {!formulario.ativo && ' · Inativo'}
              </Text>
            </View>
          </View>
        </View>

        {/* Lista de perguntas */}
        <Text className="text-primary font-semibold text-sm mb-3">
          Perguntas ({perguntas.length})
        </Text>

        {perguntas.map((p, index) => {
          const tipoLabel = TIPO_LABELS[p.id_tipo_pergunta] ?? 'Desconhecido';
          const tipoColor = TIPO_COLORS[p.id_tipo_pergunta] ?? 'bg-gray-50 text-gray-600';
          const [bgColor, textColor] = tipoColor.split(' ');

          return (
            <View key={p.id_pergunta} className="bg-white border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-start">
                <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className={`px-2 py-0.5 rounded-full ${bgColor}`}>
                      <Text className={`text-xs font-medium ${textColor}`}>{tipoLabel}</Text>
                    </View>
                    {p.obrigatoria && (
                      <Text className="text-red-400 text-xs">Obrigatória</Text>
                    )}
                  </View>
                  <Text className="text-sm font-medium text-gray-800 leading-5">{p.pergunta}</Text>
                  <PreviewInput pergunta={p} />
                </View>
              </View>
            </View>
          );
        })}

        {perguntas.length === 0 && (
          <Text className="text-center text-muted mt-4">Nenhuma pergunta cadastrada.</Text>
        )}

        {/* Botão Voltar */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 h-12 border border-border rounded-2xl items-center justify-center"
        >
          <Text className="text-gray-600 font-medium">Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
