import React from 'react';
import { View, Text } from 'react-native';

interface StyleDef {
  bg: string;
  text: string;
  label: string;
}

const ATENDIMENTO: Record<string, StyleDef> = {
  '1': { bg: '#EFF6FF', text: '#1D4ED8', label: 'Criado' },
  '2': { bg: '#FFFBEB', text: '#D97706', label: 'Iniciado' },
  '3': { bg: '#FFF7ED', text: '#EA580C', label: 'Respondido' },
  '4': { bg: '#FAF5FF', text: '#7C3AED', label: 'Em avaliação' },
  '5': { bg: '#F0FDF4', text: '#16A34A', label: 'Avaliado' },
  '6': { bg: '#0D2347', text: '#FFFFFF', label: 'Encerrado' },
  '7': { bg: '#F3F4F6', text: '#6B7280', label: 'Inativo' },
};

const FORMULARIO: Record<string, StyleDef> = {
  '1': { bg: '#FFFBEB', text: '#D97706', label: 'Pendente' },
  '2': { bg: '#F0FDF4', text: '#16A34A', label: 'Respondido' },
};

interface Props {
  status: number;
  variant?: 'atendimento' | 'formulario';
}

export function StatusBadge({ status, variant = 'atendimento' }: Props) {
  const map = variant === 'formulario' ? FORMULARIO : ATENDIMENTO;
  const s = map[String(status)] ?? { bg: '#F3F4F6', text: '#6B7280', label: String(status) };

  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
      <Text style={{ color: s.text, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}
