import { classFormSchema, ClassFormValues } from './classForm.schema';
import { useForm } from './useForm';

const INITIAL_VALUES: ClassFormValues = {
  name: '',
  days: [],
  startTime: '',
  durationMin: 50,
  capacity: '',
  ageGroups: [],
  level: '',
  goals: [],
};

interface UseRegisterClassFormOptions {
  onSuccess?: () => void;
}

export const useRegisterClassForm = (options?: UseRegisterClassFormOptions) => {
  const form = useForm<ClassFormValues>({
    initialValues: INITIAL_VALUES,
    schema: classFormSchema,
    onSubmit: async (parsedData) => {
      // API 전송 DTO 변환 및 Server Mutation 호출
      // await classroomApi.createClass(parsedData);
      console.log('Server Payload:', parsedData);
      options?.onSuccess?.();
    },
  });

  return form;
};
