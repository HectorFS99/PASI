import { useRef } from 'react';
import { ScrollView, LayoutChangeEvent } from 'react-native';

/**
 * Ajuda a rolar a tela até o primeiro campo inválido de um formulário.
 *
 * Uso:
 *  const { scrollRef, registrarBase, registrar, scrollPara } = useScrollToError();
 *  <ScrollView ref={scrollRef}>
 *    <View onLayout={registrarBase}>            // container dos campos
 *      <View onLayout={registrar('email')}>...</View>
 *    </View>
 *  </ScrollView>
 *  // ao validar: scrollPara(['email', 'tel'])
 */
export function useScrollToError() {
  const scrollRef = useRef<ScrollView>(null);
  const base = useRef(0);
  const positions = useRef<Record<string, number>>({});

  const registrarBase = (e: LayoutChangeEvent) => {
    base.current = e.nativeEvent.layout.y;
  };

  const registrar = (key: string) => (e: LayoutChangeEvent) => {
    positions.current[key] = e.nativeEvent.layout.y;
  };

  const scrollPara = (keys: string[]) => {
    const ys = keys
      .map((k) => positions.current[k])
      .filter((y): y is number => y !== undefined);
    if (ys.length > 0) {
      const destino = Math.max(0, base.current + Math.min(...ys) - 24);
      scrollRef.current?.scrollTo({ y: destino, animated: true });
    }
  };

  return { scrollRef, registrarBase, registrar, scrollPara };
}
