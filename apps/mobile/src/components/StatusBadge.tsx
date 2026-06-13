import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Animated, Dimensions, Platform } from 'react-native';

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
  '3': { bg: '#FAF5FF', text: '#7C3AED', label: 'Em avaliação' },
  '4': { bg: '#EFF6FF', text: '#1D4ED8', label: 'Avaliado' },
};

// Explica em que momento cada status é atingido (exibido no tooltip).
const TOOLTIP_ATENDIMENTO: Record<string, string> = {
  '1': 'O atendimento foi criado pelo profissional e aguarda o paciente iniciar os formulários.',
  '2': 'O paciente iniciou o preenchimento de pelo menos um formulário.',
  '3': 'O paciente concluiu e enviou todos os formulários atribuídos.',
  '4': 'O profissional iniciou a avaliação dos formulários respondidos.',
  '5': 'Todos os formulários do atendimento foram avaliados pelo profissional.',
  '6': 'O atendimento foi encerrado pelo profissional após a avaliação.',
  '7': 'O atendimento foi inativado (criado indevidamente).',
};

const TOOLTIP_FORMULARIO: Record<string, string> = {
  '1': 'O formulário ainda não foi respondido por completo pelo paciente.',
  '2': 'O formulário foi respondido e enviado pelo paciente.',
  '3': 'O profissional iniciou a análise das respostas deste formulário.',
  '4': 'O profissional finalizou a avaliação e registrou a observação. Não permite nova avaliação.',
};

interface Props {
  status: number;
  variant?: 'atendimento' | 'formulario';
  /** Ao tocar no badge, exibe um balão explicando quando o status é atingido. */
  tooltip?: boolean;
}

const useNative = Platform.OS !== 'web';
const TOOLTIP_WIDTH = 240;

export function StatusBadge({ status, variant = 'atendimento', tooltip = false }: Props) {
  const map = variant === 'formulario' ? FORMULARIO : ATENDIMENTO;
  const tips = variant === 'formulario' ? TOOLTIP_FORMULARIO : TOOLTIP_ATENDIMENTO;
  const s = map[String(status)] ?? { bg: '#F3F4F6', text: '#6B7280', label: String(status) };
  const tipText = tips[String(status)];

  const badgeRef = useRef<View>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fecharTooltip = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: useNative }).start(
      ({ finished }) => {
        if (finished) setTipPos(null);
      },
    );
  };

  const abrirTooltip = () => {
    if (!tipText) return;
    badgeRef.current?.measureInWindow((x, y, w, h) => {
      const screenW = Dimensions.get('window').width;
      // Alinha o balão à direita do badge, sem sair da tela.
      const left = Math.min(Math.max(x + w - TOOLTIP_WIDTH, 8), screenW - TOOLTIP_WIDTH - 8);
      setTipPos({ top: y + h + 8, left });
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: useNative,
        friction: 7,
        tension: 120,
      }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(fecharTooltip, 4000);
    });
  };

  const badge = (
    <View
      ref={badgeRef}
      style={{
        backgroundColor: s.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: s.text,
      }}
    >
      <Text style={{ color: s.text, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );

  if (!tooltip) return badge;

  return (
    <>
      <Pressable onPress={abrirTooltip}>{badge}</Pressable>

      <Modal visible={!!tipPos} transparent animationType="none" onRequestClose={fecharTooltip}>
        <Pressable style={{ flex: 1 }} onPress={fecharTooltip}>
          {tipPos && (
            <Animated.View
              style={{
                position: 'absolute',
                top: tipPos.top,
                left: tipPos.left,
                width: TOOLTIP_WIDTH,
                backgroundColor: '#0D2347',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-6, 0],
                    }),
                  },
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <Text style={{ color: s.text === '#FFFFFF' ? '#fff' : s.text, fontSize: 11, fontWeight: '700', marginBottom: 3 }}>
                {s.label}
              </Text>
              <Text style={{ color: 'white', fontSize: 12, lineHeight: 17 }}>{tipText}</Text>
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}
