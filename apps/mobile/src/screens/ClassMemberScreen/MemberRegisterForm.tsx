import { Text, View } from "react-native"
import { Card } from "../../components/card/Card"
import { Badge } from "../../components/badge/Badge"
import { FormField } from "../../components/form/FormField"
import { Button } from "../../components/button/Button"
import { useMemo } from "react"
import { useForm } from "../../hooks/useForm"
import { memberFormSchema, MemberFormValues } from "../../hooks/memberForm.schema"
import { GenderType } from "../../types/member"
import { formatPhoneNumber } from "../../utils/phone"

const INITIAL_VALUES: MemberFormValues = {
  name: '',
  gender: undefined,
  birth_year: '',
  phone: '',
  notes: '',
};

interface MemberRegisterFormProps {
  memberIndex: number;
  onComplete: (formData: MemberFormValues) => void;
  onDelete: () => void;
}

export const MemberRegisterForm = ({ memberIndex, onComplete, onDelete }: MemberRegisterFormProps) => {
  const { values, setFieldValue, handleSubmit } = useForm<MemberFormValues>({
    initialValues: INITIAL_VALUES,
    schema: memberFormSchema,
    onSubmit: async (validatedData) => {
      onComplete(validatedData);
    }
  });

  // 버튼 활성화 여부만 실시간으로 필요해서 별도 safeParse (useForm 내부 상태는 건드리지 않음)
  const isEntryValid = useMemo(
    () => memberFormSchema.safeParse(values).success,
    [values]
  );

  return (
    <Card className="p-md mb-md">
      <View className="flex-row items-center justify-between mb-md">
        <Text className="text-base font-bold text-ink">회원 {memberIndex}</Text>
        <Badge variant='danger' onPress={onDelete} text='삭제' />
      </View>
      <View className="flex-row gap-sm">
        <FormField className='flex-auto'>
          <FormField.Label label="이름" />
          <FormField.TextInput
            placeholder='예: 김수영'
            value={values.name}
            onChangeText={(text) => setFieldValue('name', text)}
          />
        </FormField>
        <FormField className='flex-auto'>
          <FormField.Label label="출생년도" />
          <FormField.TextInput
            placeholder='1990'
            keyboardType='numeric'
            value={values.birth_year}
            onChangeText={(text) => setFieldValue('birth_year', text)}
          />
        </FormField>
      </View>
      <View className="flex-row gap-sm">

        <FormField className="flex-auto">
          <FormField.Label label='전화번호' />
          <FormField.TextInput
            placeholder='010-0000-0000'
            value={values.phone}
            onChangeText={(text) => setFieldValue('phone', formatPhoneNumber(text))}
            keyboardType="phone-pad"
            maxLength={13}
          />
        </FormField>
        <FormField className="flex-auto">
          <FormField.Label label="성별" />
          <FormField.ChipGroup
            variant="rounded-square"
            options={[
              { label: '남', value: 'MALE' },
              { label: '여', value: 'FEMALE' },
            ]}
            value={values.gender as string}
            onChange={(val) => setFieldValue('gender', val as GenderType)}
          />
        </FormField>
      </View>
      <FormField>
        <FormField.Label label='비고' />
        <FormField.TextInput
          placeholder='예: 통원치료 중, 자유형 호흡이 잘 안됨'
          value={values.notes}
          onChangeText={(text) => setFieldValue('notes', text)}
        />
      </FormField>
      <Button
        label='입력 완료'
        variant="secondary"
        onPress={handleSubmit}
        disabled={!isEntryValid}
      />
    </Card>
  )
}
