import { useState, useCallback } from 'react';
import { ZodSchema } from 'zod';
import { dateToTimeString, timeStringToDate } from '../utils/timeUtils';

interface UseFormProps<T> {
  initialValues: T;
  schema?: ZodSchema<any>;
  onSubmit: (values: any) => Promise<void> | void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  schema,
  onSubmit,
}: UseFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    console.log(field, ": ", value);
    setValues((prev) => ({ ...prev, [field]: value }));
    // 입력 발생 시 해당 필드의 에러 메세지 초기화
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validate = useCallback(() => {
    if (!schema) return true;
    const result = schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof T;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return result.data; // 검증 및 변환 완료된 데이터 반환
  }, [schema, values]);

  const handleSubmit = async () => {
    const validatedData = validate();
    if (!validatedData) return;

    setIsSubmitting(true);
    try {
      await onSubmit(validatedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferTimeType = (field: keyof T) => ({
    // picker에게 보여줄 땐 Date로 잠깐 변환
    dateValue: values[field] ? timeStringToDate(values[field] as string) : undefined,
    // picker에서 선택 완료되면 다시 string으로 저장
    onConfirm: (date: Date) => setFieldValue(field, dateToTimeString(date) as T[keyof T]),
  });

  return {
    values,
    errors,
    isSubmitting,
    setFieldValue,
    handleSubmit,
    transferTimeType
  };
}
