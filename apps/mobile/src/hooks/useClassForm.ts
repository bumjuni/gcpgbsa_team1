import { classroomApi } from '../api/classroom';
import { classFormSchema, ClassFormValues } from './classForm.schema';
import { useForm } from './useForm';
import { formatList, stringToList } from '../utils/parser';
import { useClassStore } from '../stores/useClassStore';
import { useEffect } from 'react';

const DEFAULT_VALUES: ClassFormValues = {
  name: '',
  days_of_week: [],
  start_time: '00:00',
  end_time: '00:00',
  capacity: '',
  age_group: '', // age_groups(배열) -> age_group(단일값)
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
            capacity: String(currentClass.capacity),
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

  // 수정 모드일 때 기존 데이터 불러와서 폼 채우기
  // useEffect(() => {
  //   if (!options?.classId) return;
  //   const fetchAndFillForm = async () => {
  //     try {
  //       const detail = await classroomApi.getClassDetail(options.classId!);
  //       form.setInitValues({
  //         name: detail.name,
  //         days_of_week: stringToList(detail.days_of_week),
  //         start_time: detail.start_time,
  //         end_time: detail.end_time,
  //         capacity: String(detail.capacity),
  //         age_group: detail.age_group,
  //         level: detail.level,
  //         goals: stringToList(detail.goals),
  //       });
  //     } catch (error) {
  //       console.error('강습반 정보 조회 실패:', error);
  //     }
  //   };
  //   fetchAndFillForm();
  // }, [options?.classId]);

  return { ...form, isEditMode };
};
