import { classroomApi } from '../api/classroom';
import { classFormSchema, ClassFormValues } from './classForm.schema';
import { useForm } from './useForm';
import { formatList } from '../utils/listToString';

const INITIAL_VALUES: ClassFormValues = {
  name: '',
  days_of_week: [],
  startTime: '',
  endTime: '',
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
    onSubmit: async (validatedData) => {
      console.log('Server Payload:', validatedData);
      const parsedData = {
        ...validatedData,
        days_of_week: formatList(validatedData.days_of_week),
        ageGroups: formatList(validatedData.ageGroups),
        goals: formatList(validatedData.goals),
      };
      await classroomApi.createClass(parsedData);
      options?.onSuccess?.();
    },
  });

  return form;
};
