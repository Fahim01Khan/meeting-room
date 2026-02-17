import React from 'react';
import type { KPIData } from '../types/analytics';
import styles from './KPIStat.module.css';

interface KPIStatProps {
  data: KPIData;
}

export const KPIStat: React.FC<KPIStatProps> = ({ data }) => {
  const getChangeClassName = () => {
    if (!data.changeType) return styles.neutral;
    switch (data.changeType) {
      case 'positive':
        return styles.positive;
      case 'negative':
        return styles.negative;
      default:
        return styles.neutral;
    }
  };

  const getChangeIcon = () => {
    if (data.change === undefined || data.change === 0) return null;
    if (data.change > 0) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  };

  const changeClassName = `${styles.change} ${getChangeClassName()}`;

  return (
    <div className={styles.card}>
      <p className={styles.label}>{data.label}</p>
      <div className={styles.valueContainer}>
        <span className={styles.value}>{data.value}</span>
        {data.unit && <span className={styles.unit}>{data.unit}</span>}
      </div>
      {data.change !== undefined && (
        <div className={changeClassName}>
          {getChangeIcon()}
          <span>
            {Math.abs(data.change)}% vs last period
          </span>
        </div>
      )}
    </div>
  );
};

export default KPIStat;
