import React from 'react';
import { Modal, View, Text, TouchableWithoutFeedback } from 'react-native';
import { Button } from './button/Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  visible,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-ink/60 justify-center items-center px-xl">
          <TouchableWithoutFeedback>
            <View className="w-full bg-canvas rounded-xl p-lg items-center shadow-xl">
              <Text className="text-xl font-bold text-ink mb-xs text-center">
                {title}
              </Text>
              <Text className="text-sm text-ink-secondary text-center leading-5 mb-lg px-xs">
                {description}
              </Text>

              <Button
                label={confirmText}
                onPress={onConfirm}
                variant="primary"
                className="mb-xs"
              />
              <Button
                label={cancelText}
                onPress={onCancel}
                variant="text"
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
