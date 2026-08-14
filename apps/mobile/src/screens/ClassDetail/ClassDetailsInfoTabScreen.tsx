import React, { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ClassInfoForm } from '../../components/ClassInfoForm';
import { useClassStore } from '../../stores/useClassStore';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';
const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

export const ClassDetailsInfoTabScreen = ({ navigation }: any) => {
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [activeTabLayout, setActiveTabLayout] = useState({ x: 0, width: 0 });
  const { currentClass } = useClassStore();

  if (!currentClass) return null;

  const handleTabPress = (tab: ClassDetailsTab) => {
    if (tab === '반정보') return;
    if (tab === '수업진행') navigation?.navigate('ClassDetailsLessonTab');
    if (tab === '명단') navigation?.navigate('ClassDetailsMemberTab');
    if (tab === '리포트') navigation?.navigate('ClassDetailsReportTab');
  };

  const handleTabRowLayout = (e: LayoutChangeEvent) => setTabRowWidth(e.nativeEvent.layout.width);
  const handleActiveTabLayout = (e: LayoutChangeEvent) =>
    setActiveTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });

  const indicatorWidth = tabRowWidth * 0.25;
  const indicatorLeft = activeTabLayout.x + activeTabLayout.width / 2 - indicatorWidth / 2;

  return (
    <ScreenLayout title={currentClass.name} showBackButton>
      <View
        className="relative -mx-md px-md pt-md flex-row justify-between border-b border-hairline mb-md"
        onLayout={handleTabRowLayout}
      >
        {TABS.map((tab) => {
          const active = tab === '반정보';
          return (
            <Pressable
              key={tab}
              onPress={() => handleTabPress(tab)}
              onLayout={active ? handleActiveTabLayout : undefined}
              className="items-center pb-md"
            >
              <Text className={`text-body-strong ${active ? 'text-primary' : 'text-ink-secondary'}`}>{tab}</Text>
            </Pressable>
          );
        })}
        {tabRowWidth > 0 && (
          <View className="h-1 bg-primary absolute bottom-0" style={{ width: indicatorWidth, left: indicatorLeft }} />
        )}
      </View>

      <ClassInfoForm mode="view" navigation={navigation} />
    </ScreenLayout>
  );
};
