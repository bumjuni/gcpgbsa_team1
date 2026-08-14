import React, { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { ScreenLayout } from '../../components/ScreenLayout';
import { FormField } from '../../components/form/FormField';
import { useClassStore } from '../../stores/useClassStore';
import { stringToList } from '../../utils/parser';

type ClassDetailsTab = '수업진행' | '반정보' | '명단' | '리포트';

const TABS: ClassDetailsTab[] = ['수업진행', '반정보', '명단', '리포트'];

const noop = () => {};

const ReadOnlyBox = ({ value }: { value: string }) => (
  <View className="h-14 justify-center bg-surface-muted border border-hairline-border-strong rounded-md px-md">
    <Text className="text-base text-ink">{value}</Text>
  </View>
);

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

  const handleEdit = () => {
    navigation?.navigate('ClassDetailsInfoEdit');
  };

  const handleTabRowLayout = (e: LayoutChangeEvent) => {
    setTabRowWidth(e.nativeEvent.layout.width);
  };

  const handleActiveTabLayout = (e: LayoutChangeEvent) => {
    setActiveTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width });
  };

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
              <Text className={`text-body-strong ${active ? 'text-primary' : 'text-ink-secondary'}`}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
        {tabRowWidth > 0 && (
          <View
            className="h-1 bg-primary absolute bottom-0"
            style={{ width: indicatorWidth, left: indicatorLeft }}
          />
        )}
      </View>

      <View className="items-end mb-sm">
        <Pressable onPress={handleEdit}>
          <Text className="text-primary text-sm font-medium">수정하기</Text>
        </Pressable>
      </View>

      <View className="pb-xl">
        <FormField>
          <FormField.Label label="반 이름" required />
          <ReadOnlyBox value={currentClass.name} />
        </FormField>

        <FormField>
          <FormField.Label label="수업 요일" required />
          <FormField.HelperText type="guide" text="여러 개 선택할 수 있어요" />
          <FormField.ChipGroup
            variant="rounded-square"
            multiple
            options={[
              { label: '월', value: 'Mon' },
              { label: '화', value: 'Tue' },
              { label: '수', value: 'Wed' },
              { label: '목', value: 'Thu' },
              { label: '금', value: 'Fri' },
              { label: '토', value: 'Sat' },
              { label: '일', value: 'Sun' },
            ]}
            value={stringToList(currentClass.days_of_week)}
            onChange={noop}
          />
        </FormField>

        <View className="flex-row w-full gap-sm">
          <FormField className="flex-auto">
            <FormField.Label label="시작 시각" required />
            <ReadOnlyBox value={currentClass.start_time.substring(0,5)} />
          </FormField>
          <FormField className="flex-auto">
            <FormField.Label label="종료 시각" required />
            <ReadOnlyBox value={currentClass.end_time.substring(0,5)} />
          </FormField>
        </View>

        <FormField>
          <FormField.Label label="나이대" required />
          <FormField.ChipGroup
            variant="rounded-square"
            multiple
            options={[
              { label: '어린이 (5~7세)', value: 'PRESCHOOL' },
              { label: '초등 (8~13세)', value: 'ELEMENTARY' },
              { label: '청소년 (14~19세)', value: 'TEEN' },
              { label: '성인 (20~59세)', value: 'ADULT' },
              { label: '시니어 (60세~)', value: 'SENIOR' },
            ]}
            value={currentClass.age_group}
            onChange={noop}
          />
        </FormField>

        <FormField>
          <FormField.Label
            label="수준"
            required
            rightAction={
              <Pressable onPress={() => navigation?.navigate('LevelGuide')}>
                <Text className="text-primary text-sm font-medium">레벨 설명 보기 ›</Text>
              </Pressable>
            }
          />
          <FormField.CardGroup
            options={[
              { label: '신규', description: '1개월 미만', value: 'BEGINNER' },
              { label: '초급', description: '자유형 · 배영 가능', value: 'ELEMENTARY' },
              { label: '중급', description: '평영 가능', value: 'INTERMEDIATE' },
              { label: '상급', description: '접영 · 배영 가능', value: 'ADVANCED' },
              { label: '마스터즈', description: '접영까지 숙달', value: 'MASTER' },
            ]}
            value={currentClass.level}
            onChange={noop}
          />
        </FormField>

        <FormField>
          <FormField.Label label="특성(수업목표)" required />
          <FormField.HelperText type="guide" text="여러 개 선택할 수 있어요" />
          <FormField.ChipGroup
            variant="rounded-square"
            multiple
            options={[
              { label: '완영 목표', value: 'COMPLETE_SWIM' },
              { label: '자세 교정', value: 'POSTURE_CORRECTION' },
              { label: '체력 증진', value: 'FITNESS_IMPROVEMENT' },
              { label: '기초 적응', value: 'BASIC_ADAPTATION' },
              { label: '기타', value: 'ETC' },
            ]}
            value={stringToList(currentClass.goals) ?? 'ETC'}
            onChange={noop}
          />

          {currentClass.goals.includes('ETC') ? (
            <>
              <FormField.HelperText type="guide" text="'기타'를 선택하면 아래에 적어주세요" className="mt-xs" />
              <FormField.TextInput placeholder="예: 수중 재활, 다이빙 연습" editable={false} />
            </>
            ) : (
              null
            )}

        </FormField>
      </View>
    </ScreenLayout>
  );
};
