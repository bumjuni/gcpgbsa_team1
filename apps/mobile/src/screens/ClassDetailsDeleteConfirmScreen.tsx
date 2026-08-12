import React from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

export const ClassDetailsDeleteConfirmScreen = ({ navigation, route }: any) => {
  const { classId } = route?.params ?? {};

  const handleCancel = () => {
    navigation?.goBack();
  };

  const handleConfirm = () => {
    // TODO: 반 삭제 API 연동 필요 (classroomApi.deleteClass 등)
    navigation?.navigate('ClassList', { deletedClassId: classId });
  };

  return (
    <ConfirmModal
      visible
      title="이 반을 삭제할까요?"
      description={'삭제하면 홈 목록에서 사라지며\n이 작업은 취소할 수 없어요.'}
      confirmText="삭제하기"
      cancelText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};
