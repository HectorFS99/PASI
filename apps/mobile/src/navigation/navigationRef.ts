import { createNavigationContainerRef } from '@react-navigation/native';

// Ref global para permitir navegação fora de componentes de tela
// (ex.: a partir do AppDrawer, que é renderizado como overlay).
export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-expect-error — nomes de rota resolvidos em runtime
    navigationRef.navigate(name, params);
  }
}
