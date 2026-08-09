import { Text, View } from "react-native"
import { Card } from "../../components/card/Card"
import { Badge } from "../../components/badge/Badge"
import { FormField } from "../../components/form/FormField"
import { Button } from "../../components/button/Button"
import { useState } from "react"

interface MemberFormState {
  name: string;
  birthYear: string;
  phone: string;
  notes: string;
}

const initialFormState: MemberFormState = Object.freeze({
  name: '',
  birthYear: '',
  phone: '',
  notes: '',
});

export const MemberRegisterForm = () => {
  const [formData, setFormData] = useState<MemberFormState>(initialFormState);
  const [isEntryComplete, setIsEntryComplete] = useState(false);

  const isEntryValid =
    formData.name.trim().length > 0 &&
    formData.birthYear.trim().length > 0 &&
    formData.phone.trim().length > 0;

  const handleDeleteMember = () => { };

  const handleCompleteEntry = () => {
    setIsEntryComplete(true);
  };

  return (
    <Card className="p-md mb-md">
      <View className="flex-row items-center justify-between mb-md">
        <Text className="text-base font-bold text-ink">회원 1</Text>
        <Badge variant='danger' onPress={handleDeleteMember} text='삭제' />
      </View>

      <View className="flex-row gap-sm">
          <FormField className='flex-auto'>
            <FormField.Label label="이름"/>
            <FormField.TextInput placeholder='예: 김수영' />
          </FormField>

          <FormField className='flex-auto'>
            <FormField.Label label="출생년도"/>
            <FormField.TextInput placeholder='1990' keyboardType='numeric'/>
        </FormField>
      </View>
      <FormField>
        <FormField.Label label='전화번호'/>
        <FormField.TextInput placeholder='010-0000-0000' />
      </FormField>

      <FormField>
        <FormField.Label label='비고'/>
        <FormField.TextInput placeholder='예: 통원치료 중, 자유형 호흡이 잘 안됨' />
      </FormField>

      <Button
        label={isEntryComplete ? '입력 완료됨' : '입력 완료'}
        variant="secondary"
        onPress={handleCompleteEntry}
        disabled={isEntryComplete || !isEntryValid}
      />
    </Card>
  )

}
