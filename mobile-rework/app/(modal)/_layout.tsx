import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      {/* T404: fullScreenModal so the camera view fills the entire screen */}
      <Stack.Screen name="photobooth" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
