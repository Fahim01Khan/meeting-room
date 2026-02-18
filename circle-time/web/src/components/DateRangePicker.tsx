'use client';

import React, { useState } from 'react';
import type { DateRange } from '../types/analytics';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: { label: string; value: DateRange }[];
}

const defaultPresets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: 0 },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePresetClick = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();

    if (days === 0) {
      startDate.setDate(1);
    } else {
      startDate.setDate(startDate.getDate() - days);
    }

    onChange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
    setIsOpen(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, endDate: e.target.value });
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>
          {formatDate(value.startDate)} - {formatDate(value.endDate)}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {defaultPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={styles.presetButton}
              onClick={() => handlePresetClick(preset.days)}
            >
              {preset.label}
            </button>
          ))}

          <div className={styles.inputGroup}>
            <div className={styles.inputContainer}>
              <label className={styles.label}>Start Date</label>
              <input
                type="date"
                className={styles.input}
                value={value.startDate}
                onChange={handleStartDateChange}
              />
            </div>
            <div className={styles.inputContainer}>
              <label className={styles.label}>End Date</label>
              <input
                type="date"
                className={styles.input}
                value={value.endDate}
                onChange={handleEndDateChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
