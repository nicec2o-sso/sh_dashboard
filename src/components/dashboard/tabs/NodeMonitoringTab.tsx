'use client';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiExecutionPanel } from '@/components/dashboard/monitoring/ApiExecutionPanel';
import { SyntheticTestPanel } from '@/components/dashboard/monitoring/SyntheticTestPanel';
import { AlertMonitoringPanel } from '@/components/dashboard/monitoring/AlertMonitoringPanel';
import { TagListPanel } from '@/components/dashboard/monitoring/TagListPanel';


export function NodeMonitoringTab() {
  const [subTab, setSubTab] = useState('execute');

  return (
    <Tabs value={subTab} onValueChange={setSubTab}>
      <TabsList>
        <TabsTrigger value="execute">API 실행</TabsTrigger>
        <TabsTrigger value="synthetic">Synthetic Tests</TabsTrigger>
        <TabsTrigger value="alerts">알럿 모니터링</TabsTrigger>
        <TabsTrigger value="tags">태그 사용현황</TabsTrigger>
      </TabsList>

      <TabsContent value="execute" className="mt-4">
        <ApiExecutionPanel />
      </TabsContent>

      <TabsContent value="synthetic" className="mt-4">
        <SyntheticTestPanel />
      </TabsContent>

      <TabsContent value="alerts" className="mt-4">
        <AlertMonitoringPanel />
      </TabsContent>

      <TabsContent value="tags" className="mt-4">
        <TagListPanel />
      </TabsContent>

    </Tabs>
  );
}