import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { DrawerProvider } from '../context/DrawerContext';
import { ProfilePhotoProvider } from '../context/ProfilePhotoContext';
import { AppDrawer } from '../components/AppDrawer';
import { ProfissionalStackParamList, PacienteStackParamList } from './types';

import { AtendimentosListScreen } from '../screens/profissional/AtendimentosListScreen';
import { NovoAtendimentoScreen } from '../screens/profissional/NovoAtendimentoScreen';
import { EditarAtendimentoScreen } from '../screens/profissional/EditarAtendimentoScreen';
import { DetalhesAtendimentoScreen } from '../screens/profissional/DetalhesAtendimentoScreen';
import { FormulariosListScreen } from '../screens/profissional/FormulariosListScreen';
import { DetalhesFormularioScreen } from '../screens/profissional/DetalhesFormularioScreen';
import { CriarEditarFormularioScreen } from '../screens/profissional/CriarEditarFormularioScreen';
import { AvaliarFormularioScreen } from '../screens/profissional/AvaliarFormularioScreen';

import { MeusAtendimentosScreen } from '../screens/paciente/MeusAtendimentosScreen';
import { FormulariosAtendimentoScreen } from '../screens/paciente/FormulariosAtendimentoScreen';
import { ResponderFormularioScreen } from '../screens/paciente/ResponderFormularioScreen';

import { PerfilScreen } from '../screens/PerfilScreen';

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
      <ProfStack.Screen name="AvaliarFormulario" component={AvaliarFormularioScreen} />
      <ProfStack.Screen name="Perfil" component={PerfilScreen} />
    </ProfStack.Navigator>
  );
}

function PacienteNavigator() {
  return (
    <PacStack.Navigator screenOptions={{ headerShown: false }}>
      <PacStack.Screen name="MeusAtendimentos" component={MeusAtendimentosScreen} />
      <PacStack.Screen name="FormulariosAtendimento" component={FormulariosAtendimentoScreen} />
      <PacStack.Screen name="ResponderFormulario" component={ResponderFormularioScreen} />
      <PacStack.Screen name="Perfil" component={PerfilScreen} />
    </PacStack.Navigator>
  );
}

export function AppNavigator() {
  const { usuario } = useAuth();
  return (
    <ProfilePhotoProvider>
      <DrawerProvider>
        <View style={{ flex: 1 }}>
          {usuario?.tipo === 1 ? <ProfissionalNavigator /> : <PacienteNavigator />}
          <AppDrawer />
        </View>
      </DrawerProvider>
    </ProfilePhotoProvider>
  );
}
