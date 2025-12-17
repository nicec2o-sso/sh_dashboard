'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface GrafanaDashboardTabProps {
  grafanaUrl?: string;
}

export function GrafanaDashboardTab({ grafanaUrl = 'https://play.grafana.org/' }: GrafanaDashboardTabProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-0">
        <iframe src={grafanaUrl} className="w-full h-screen border-0" title="Grafana Dashboard" />
      </CardContent>
    </Card>
  );
}