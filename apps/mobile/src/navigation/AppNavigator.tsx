const Stack = createNativeStackNavigator();

export const ApNavigator = () => {
  return (
    <Stack.Navigator>
      {/* 1. 하단 탭 네비게이터를 스크린으로 등록 */}
      <Stack.Screen name="MainTab" component={MainTabNavigator} options={{ headerShown: false }} />

      {/* 2. 탭을 가리고 상단으로 띄울 스택 화면들 */}
      <Stack.Screen name="ClassRegister" component={ClassRegisterScreen} />
      <Stack.Screen name="ClassDetail" component={ClassDetailScreen} />
    </Stack.Navigator>
  );
};
