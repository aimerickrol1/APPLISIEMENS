import { Stack } from 'expo-router';

export default function BuildingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}