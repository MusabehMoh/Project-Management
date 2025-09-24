import React, { useState } from 'react';
import { DatePicker } from '@heroui/date-picker';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';

// Simple test component to verify DatePicker works
export const TestDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const minDate = today(getLocalTimeZone());

  const handleDateChange = (date: CalendarDate) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
    
    if (date) {
      const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
      console.log('Formatted date string:', dateString);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>HeroUI DatePicker Test</h3>
      <DatePicker
        label="Select Date"
        value={selectedDate}
        onChange={handleDateChange}
        minValue={minDate}
        isRequired
        showMonthAndYearPickers
        description="Select a date from the calendar"
      />
      
      {selectedDate && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h4>Selected Date Info:</h4>
          <p>Year: {selectedDate.year}</p>
          <p>Month: {selectedDate.month}</p>
          <p>Day: {selectedDate.day}</p>
          <p>Formatted: {`${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`}</p>
        </div>
      )}
    </div>
  );
};