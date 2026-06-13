import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { maskDataBr, dateParaBr, brParaDate } from '../utils/date';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface Props {
  label?: string;
  value: string; // dd/mm/aaaa (pode estar incompleta)
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * Campo de data com máscara dd/mm/aaaa e seleção por calendário
 * (modal próprio, funciona em web e nativo).
 */
export function DateField({ label, value, onChange, placeholder = 'dd/mm/aaaa' }: Props) {
  const [showCal, setShowCal] = useState(false);
  const hoje = new Date();
  const selecionada = brParaDate(value);
  const [mesVisivel, setMesVisivel] = useState<{ ano: number; mes: number }>({
    ano: (selecionada ?? hoje).getFullYear(),
    mes: (selecionada ?? hoje).getMonth(),
  });

  const abrirCalendario = () => {
    const base = brParaDate(value) ?? hoje;
    setMesVisivel({ ano: base.getFullYear(), mes: base.getMonth() });
    setShowCal(true);
  };

  const mudarMes = (delta: number) => {
    setMesVisivel((p) => {
      const d = new Date(p.ano, p.mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  };

  const selecionarDia = (dia: number) => {
    onChange(dateParaBr(new Date(mesVisivel.ano, mesVisivel.mes, dia)));
    setShowCal(false);
  };

  // Grade do mês: células vazias até o 1º dia + dias do mês.
  const primeiroDiaSemana = new Date(mesVisivel.ano, mesVisivel.mes, 1).getDay();
  const diasNoMes = new Date(mesVisivel.ano, mesVisivel.mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const ehSelecionado = (dia: number) =>
    !!selecionada &&
    selecionada.getDate() === dia &&
    selecionada.getMonth() === mesVisivel.mes &&
    selecionada.getFullYear() === mesVisivel.ano;

  const ehHoje = (dia: number) =>
    hoje.getDate() === dia &&
    hoje.getMonth() === mesVisivel.mes &&
    hoje.getFullYear() === mesVisivel.ano;

  return (
    <View>
      {label ? <Text className="text-xs text-gray-500 mb-1">{label}</Text> : null}
      <View className="flex-row items-center bg-gray-50 border border-border rounded-xl pl-3 pr-1 h-11">
        <TextInput
          className="flex-1 text-sm text-gray-800"
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          value={value}
          onChangeText={(t) => onChange(maskDataBr(t))}
          keyboardType="numeric"
          maxLength={10}
        />
        <TouchableOpacity onPress={abrirCalendario} className="w-9 h-9 items-center justify-center">
          <MaterialIcons name="calendar-today" size={18} color="#0D2347" />
        </TouchableOpacity>
      </View>

      {/* Calendário */}
      <Modal visible={showCal} transparent animationType="fade" onRequestClose={() => setShowCal(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCal(false)}
          className="flex-1 items-center justify-center bg-black/50 px-8"
        >
          <TouchableOpacity activeOpacity={1} className="bg-white rounded-2xl p-4 w-full" style={{ maxWidth: 340 }}>
            {/* Navegação do mês */}
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={() => mudarMes(-1)} className="w-9 h-9 items-center justify-center">
                <MaterialIcons name="chevron-left" size={24} color="#0D2347" />
              </TouchableOpacity>
              <Text className="text-primary font-bold text-sm">
                {MESES[mesVisivel.mes]} {mesVisivel.ano}
              </Text>
              <TouchableOpacity onPress={() => mudarMes(1)} className="w-9 h-9 items-center justify-center">
                <MaterialIcons name="chevron-right" size={24} color="#0D2347" />
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}
            <View className="flex-row mb-1">
              {DIAS_SEMANA.map((d, i) => (
                <View key={i} className="flex-1 items-center">
                  <Text className="text-xs font-semibold text-gray-400">{d}</Text>
                </View>
              ))}
            </View>

            {/* Grade de dias */}
            <View className="flex-row flex-wrap">
              {celulas.map((dia, i) => (
                <View key={i} style={{ width: `${100 / 7}%` }} className="items-center py-0.5">
                  {dia !== null ? (
                    <TouchableOpacity
                      onPress={() => selecionarDia(dia)}
                      className={`w-9 h-9 rounded-full items-center justify-center ${
                        ehSelecionado(dia)
                          ? 'bg-primary'
                          : ehHoje(dia)
                            ? 'border border-primary'
                            : ''
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          ehSelecionado(dia) ? 'text-white font-bold' : 'text-gray-700'
                        }`}
                      >
                        {dia}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="w-9 h-9" />
                  )}
                </View>
              ))}
            </View>

            {/* Ações rápidas */}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity onPress={() => { onChange(''); setShowCal(false); }} className="px-3 py-2">
                <Text className="text-red-500 text-sm font-medium">Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { onChange(dateParaBr(hoje)); setShowCal(false); }} className="px-3 py-2">
                <Text className="text-primary text-sm font-medium">Hoje</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
