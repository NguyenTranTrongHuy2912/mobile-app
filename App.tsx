import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from './tamagui.config'
import RootNavigator from './src/navigation/RootNavigator';
import SessionBootstrap from './src/features/session/SessionBootstrap';

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Provider store={store}>
        <SafeAreaProvider>
          <SessionBootstrap>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </SessionBootstrap>
        </SafeAreaProvider>
      </Provider>
    </TamaguiProvider>
  );
}
