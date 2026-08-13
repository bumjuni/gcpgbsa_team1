import { classroomApi } from '../api/classroom';
import { classFormSchema, ClassFormValues } from './classForm.schema';
import { useForm } from './useForm';
import { formatList } from '../utils/listToString';

const INITIAL_VALUES: ClassFormValues = {
  name: '',
  days_of_week: [],
  start_time: '00:00',
  end_time: '00:00',
  capacity: '',
  age_groups: [],
  level: '',
  goals: [],
};

interface UseRegisterClassFormOptions {
  onSuccess?: (value: any) => void;
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
        age_groups: formatList(validatedData.age_groups),
        goals: formatList(validatedData.goals),
      };
      const response = await classroomApi.createClass(parsedData);
      options?.onSuccess?.(response.id);
    },
  });

  return form;
};
