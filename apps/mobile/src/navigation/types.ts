import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SelectProfile: undefined;
  CadastroProfissional: undefined;
  CadastroPaciente: undefined;
  EsqueceuSenha: undefined;
};

export type ProfissionalStackParamList = {
  AtendimentosList: undefined;
  NovoAtendimento: undefined;
  EditarAtendimento: { id: number };
  DetalhesAtendimento: { id: number };
  FormulariosList: undefined;
  DetalhesFormulario: { id: number };
  CriarEditarFormulario: { id?: number; modo: 'criar' | 'editar' };
};

export type PacienteStackParamList = {
  MeusAtendimentos: undefined;
  FormulariosAtendimento: { idAtendimento: number; descricao: string };
  ResponderFormulario: {
    idAtendimento: number;
    idFormulario: number;
    nomeFormulario: string;
  };
};

export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type ProfissionalNavProp = NativeStackNavigationProp<ProfissionalStackParamList>;
export type PacienteNavProp = NativeStackNavigationProp<PacienteStackParamList>;

// Alias de compatibilidade para as telas de auth já existentes
export type NavigationProp = AuthNavProp;
