import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { GameScreen } from './src/screens/GameScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { theme } from './src/styles/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.paperBeige,
            borderBottomWidth: theme.layout.borderWidth.normal,
            borderBottomColor: theme.colors.inkBlack,
            shadowOpacity: 0, // Remove default shadow
            elevation: 0, // Remove default shadow on Android
          },
          headerTitleStyle: {
            fontFamily: theme.typography.primary.fontFamily,
            fontWeight: theme.typography.primary.fontWeight,
            fontSize: theme.typography.sizes.lg,
            color: theme.colors.inkBlack,
            textTransform: 'uppercase',
            letterSpacing: 1,
          },
          headerBackTitleStyle: {
            fontFamily: theme.typography.secondary.fontFamily,
            fontWeight: theme.typography.secondary.fontWeight,
            color: theme.colors.fadedBlue,
          },
          headerTintColor: theme.colors.fadedBlue,
          cardStyle: {
            backgroundColor: theme.colors.paperBeige,
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'TWOVUE PROTOCOL',
            headerShown: false, // Hide header on home screen for full aesthetic control
          }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            title: 'OPERATOR IDENTIFICATION',
          }}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ 
            title: 'CONTROL DASHBOARD',
          }}
        />
        <Stack.Screen 
          name="Game" 
          component={GameScreen}
          options={{ 
            title: 'ANALYSIS SESSION',
          }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ 
            title: 'CAPTURE SYSTEM',
            headerShown: false, // Full-screen camera experience
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
