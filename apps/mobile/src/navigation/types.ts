import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SelectProfile: undefined;
  CadastroProfissional: undefined;
  CadastroPaciente: undefined;
  EsqueceuSenha: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
