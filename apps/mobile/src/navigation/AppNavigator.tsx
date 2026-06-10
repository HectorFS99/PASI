import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ProfissionalStackParamList, PacienteStackParamList } from './types';

import { AtendimentosListScreen } from '../screens/profissional/AtendimentosListScreen';
import { NovoAtendimentoScreen } from '../screens/profissional/NovoAtendimentoScreen';
import { EditarAtendimentoScreen } from '../screens/profissional/EditarAtendimentoScreen';
import { DetalhesAtendimentoScreen } from '../screens/profissional/DetalhesAtendimentoScreen';
import { FormulariosListScreen } from '../screens/profissional/FormulariosListScreen';
import { DetalhesFormularioScreen } from '../screens/profissional/DetalhesFormularioScreen';
import { CriarEditarFormularioScreen } from '../screens/profissional/CriarEditarFormularioScreen';

import { MeusAtendimentosScreen } from '../screens/paciente/MeusAtendimentosScreen';
import { FormulariosAtendimentoScreen } from '../screens/paciente/FormulariosAtendimentoScreen';
import { ResponderFormularioScreen } from '../screens/paciente/ResponderFormularioScreen';

const ProfStack = createNativeStackNavigator<ProfissionalStackParamList>();
const PacStack = createNativeStackNavigator<PacienteStackParamList>();

function ProfissionalNavigator() {
  return (
    <ProfStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfStack.Screen name="AtendimentosList" component={AtendimentosListScreen} />
      <ProfStack.Screen name="NovoAtendimento" component={NovoAtendimentoScreen} />
      <ProfStack.Screen name="EditarAtendimento" component={EditarAtendimentoScreen} />
      <ProfStack.Screen name="DetalhesAtendimento" component={DetalhesAtendimentoScreen} />
      <ProfStack.Screen name="FormulariosList" component={FormulariosListScreen} />
      <ProfStack.Screen name="DetalhesFormulario" component={DetalhesFormularioScreen} />
      <ProfStack.Screen name="CriarEditarFormulario" component={CriarEditarFormularioScreen} />
    </ProfStack.Navigator>
  );
}

function PacienteNavigator() {
  return (
    <PacStack.Navigator screenOptions={{ headerShown: false }}>
      <PacStack.Screen name="MeusAtendimentos" component={MeusAtendimentosScreen} />
      <PacStack.Screen name="FormulariosAtendimento" component={FormulariosAtendimentoScreen} />
      <PacStack.Screen name="ResponderFormulario" component={ResponderFormularioScreen} />
    </PacStack.Navigator>
  );
}

export function AppNavigator() {
  const { usuario } = useAuth();
  return usuario?.tipo === 1 ? <ProfissionalNavigator /> : <PacienteNavigator />;
}
