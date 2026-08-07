import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CardVariant } from './Card.types';
import { CARD_CONTAINER_STYLES } from './Card.variants';


interface CardProps {
  variant?: CardVariant;
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  onPress,
  children,
  className = '',
}) => {
  const isClickable = Boolean(onPress);
  const Container = isClickable ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={isClickable ? 0.8 : 1}
      className={`${CARD_CONTAINER_STYLES[variant]} ${className}`}
    >
      {children}
    </Container>
  );
};
