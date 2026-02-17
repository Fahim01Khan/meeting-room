import React from 'react';
import styles from './LoadingState.module.css';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
}) => {
  const spinnerClassName = `${styles.spinner} ${styles[size]}`;
  const messageClassName = `${styles.message} ${size === 'small' ? styles.small : ''}`;

  return (
    <div className={styles.container}>
      <div className={spinnerClassName} />
      {message && <p className={messageClassName}>{message}</p>}
    </div>
  );
};

export default LoadingState;
