// src/components/StatusChip.jsx
import React from 'react';
import Chip from '@mui/material/Chip';

const STATUS_COLORS = {
  Active: 'success', Expired: 'warning', Suspended: 'error',
  Created: 'default', Matched: 'info', Confirmed: 'info',
  Completed: 'success', Cancelled: 'error',
  Paid: 'success', Pending: 'warning', Disputed: 'error',
  ReceivedAtFacility: 'info', Processing: 'info',
};

const STATUS_LABELS = {
  Active: 'Active ✓', Expired: 'Expired ⚠', Suspended: 'Suspended ✗',
  Created: 'New', Matched: 'Matched', Confirmed: 'Confirmed',
  Completed: 'Completed ✓', Cancelled: 'Cancelled',
  Paid: 'Paid ✓', Pending: 'Pending', Disputed: 'Disputed ⚠',
  ReceivedAtFacility: 'Received', Processing: 'Processing',
};

export default function StatusChip({ status, size = 'small' }) {
  const color = STATUS_COLORS[status] || 'default';
  const label = STATUS_LABELS[status] || status;
  return <Chip label={label} color={color} size={size} variant="filled" />;
}
