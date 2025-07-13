import React from 'react';
import { ExpiryAttentionReportCard as ExpiryCard } from '../ExpiryAttentionReportCard';
import type { WidgetProps } from './widget-map';

export const ExpiryAttentionReportCard: React.FC<WidgetProps> = (props) => {
    return <ExpiryCard {...props} />;
}
