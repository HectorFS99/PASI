import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SelectProfileScreen } from '../screens/SelectProfileScreen';
import { CadastroProfissionalScreen } from '../screens/CadastroProfissionalScreen';
import { CadastroPacienteScreen } from '../screens/CadastroPacienteScreen';
import { EsqueceuSenhaScreen } from '../screens/EsqueceuSenhaScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SelectProfile" component={SelectProfileScreen} />
      <Stack.Screen name="CadastroProfissional" component={CadastroProfissionalScreen} />
      <Stack.Screen name="CadastroPaciente" component={CadastroPacienteScreen} />
      <Stack.Screen name="EsqueceuSenha" component={EsqueceuSenhaScreen} />
    </Stack.Navigator>
  );
}
