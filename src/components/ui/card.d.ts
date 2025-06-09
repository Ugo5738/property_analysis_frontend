import { ReactNode } from 'react';

export interface CardProps {
  className?: string;
  children: ReactNode;
}

export interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export interface CardTitleProps {
  className?: string;
  children: ReactNode;
}

export interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<CardHeaderProps>;
export declare const CardTitle: React.FC<CardTitleProps>;
export declare const CardContent: React.FC<CardContentProps>;
