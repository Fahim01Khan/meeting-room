/**
 * Meeting Room Panel App
 * 
 * React Native application for SUNMI M2 MAX tablet
 * Displays room status and allows meeting check-in/management
 * 
 * Screen navigation is handled via state/context (no navigation library)
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoomStateProvider, useRoomState } from './src/context/RoomStateContext';
import { PairingScreen } from './src/screens/PairingScreen';
import { IdleScreen } from './src/screens/IdleScreen';
import { MeetingScreen } from './src/screens/MeetingScreen';
import { CheckInScreen } from './src/screens/CheckInScreen';
import { EndEarlyScreen } from './src/screens/EndEarlyModal';
import { AdHocBookingScreen } from './src/screens/AdHocBookingScreen';

// Screen renderer based on current state
const ScreenRenderer: React.FC = () => {
  const { currentScreen, handlePaired } = useRoomState();

  switch (currentScreen) {
    case 'pairing':
      return <PairingScreen onPaired={handlePaired} />;
    case 'meeting':
      return <MeetingScreen />;
    case 'checkin':
      return <CheckInScreen />;
    case 'endEarly':
      return <EndEarlyScreen />;
    case 'adHocBooking':
      return <AdHocBookingScreen />;
    case 'idle':
    default:
      return <IdleScreen />;
  }
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <RoomStateProvider>
        {/* Hide status bar for full-screen kiosk mode */}
        <StatusBar hidden />
        <ScreenRenderer />
      </RoomStateProvider>
    </SafeAreaProvider>
  );
};

export default App;
