import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SelectProfileScreen } from './src/screens/SelectProfileScreen';
import { CadastroProfissionalScreen } from './src/screens/CadastroProfissionalScreen';
import { CadastroPacienteScreen } from './src/screens/CadastroPacienteScreen';
import { EsqueceuSenhaScreen } from './src/screens/EsqueceuSenhaScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SelectProfile" component={SelectProfileScreen} />
        <Stack.Screen name="CadastroProfissional" component={CadastroProfissionalScreen} />
        <Stack.Screen name="CadastroPaciente" component={CadastroPacienteScreen} />
        <Stack.Screen name="EsqueceuSenha" component={EsqueceuSenhaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
