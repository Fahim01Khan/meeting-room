/**
 * Meeting Room Panel App
 * 
 * React Native application for SUNMI M2 MAX tablet
 * Displays room status and allows meeting check-in/management
 * 
 * Screen navigation is handled via state/context (no navigation library)
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { RoomStateProvider, useRoomState } from './src/context/RoomStateContext';
import { IdleScreen } from './src/screens/IdleScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { CheckInScreen } from './src/screens/CheckInScreen';
import { EndEarlyScreen } from './src/screens/EndEarlyModal';
import { colors } from './src/styles/theme';

// Screen renderer based on current state
const ScreenRenderer: React.FC = () => {
  const { currentScreen } = useRoomState();

  switch (currentScreen) {
    case 'meeting':
      return <MeetingScreen />;
    case 'checkin':
      return <CheckInScreen />;
    case 'endEarly':
      return <EndEarlyScreen />;
    case 'idle':
    default:
      return <IdleScreen />;
  }
};

const App: React.FC = () => {
  return (
    <RoomStateProvider>
      <View style={styles.container}>
        {/* Hide status bar for full-screen kiosk mode */}
        <StatusBar hidden />
        <ScreenRenderer />
      </View>
    </RoomStateProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
