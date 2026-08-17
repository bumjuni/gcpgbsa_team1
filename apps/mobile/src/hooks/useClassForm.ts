import { classroomApi } from '../api/classroom';
import { classFormSchema, ClassFormValues } from './classForm.schema';
import { useForm } from './useForm';
import { formatList, stringToList } from '../utils/parser';
import { useClassStore } from '../stores/useClassStore';

const DEFAULT_VALUES: ClassFormValues = {
  name: '',
  days_of_week: [],
  start_time: '00:00',
  end_time: '00:00',
  age_group: '',
  level: '',
  goals: [],
  goal_etc: '',
};

interface UseClassFormOptions {
  classId?: number; // 있으면 수정 모드, 없으면 등록 모드
  onSuccess?: (value: any) => void;
}

export const useClassForm = (options?: UseClassFormOptions) => {
  const setClass = useClassStore((s) => s.setClass);
  const currentClass = useClassStore((s) => s.currentClass);
  const isEditMode = !!options?.classId;

  const initialValues: ClassFormValues =
      isEditMode && currentClass
        ? {
            name: currentClass.name,
            days_of_week: stringToList(currentClass.days_of_week),
            start_time: currentClass.start_time,
            end_time: currentClass.end_time,
            age_group: currentClass.age_group,
            level: currentClass.level,
            goals: stringToList(currentClass.goals),
            goal_etc: currentClass.goal_etc ?? '',
          }
        : DEFAULT_VALUES;

  const form = useForm<ClassFormValues>({
    initialValues,
    schema: classFormSchema,
    onSubmit: async (validatedData) => {
      const parsedData = {
        ...validatedData,
        days_of_week: formatList(validatedData.days_of_week),
        goals: formatList(validatedData.goals),
      };
      const response = isEditMode
        ? await classroomApi.updateClass(options!.classId!, parsedData)
        : await classroomApi.createClass(parsedData);
      setClass(response);
      options?.onSuccess?.(response.id);
    },
  });

  return { ...form, isEditMode };
};
