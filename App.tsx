import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { GameScreen } from './src/screens/GameScreen';
import { theme } from './src/styles/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.agedVellum,
            borderBottomWidth: theme.layout.borderWidth.normal,
            borderBottomColor: theme.colors.graphiteBlack,
            shadowOpacity: 0, // Remove default shadow
            elevation: 0, // Remove default shadow on Android
          },
          headerTitleStyle: {
            fontFamily: theme.typography.primary.fontFamily,
            fontWeight: theme.typography.primary.fontWeight,
            fontSize: theme.typography.sizes.lg,
            color: theme.colors.graphiteBlack,
            textTransform: theme.typography.primary.textTransform,
            letterSpacing: 1,
          },
          headerBackTitleStyle: {
            fontFamily: theme.typography.secondary.fontFamily,
            fontWeight: theme.typography.secondary.fontWeight,
            color: theme.colors.fadedInkBlue,
          },
          headerTintColor: theme.colors.fadedInkBlue,
          cardStyle: {
            backgroundColor: theme.colors.agedVellum,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
