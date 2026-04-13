import React from 'react';

interface AlertProps {
  message: string;
  type: string;
}

export const Alert: React.FC<AlertProps> = ({ message, type }) => {
  return (
    <div className={`alert alert-${type} alert-dismissible fade show shadow-sm`} role="alert">
      {message}
    </div>
  );
};
