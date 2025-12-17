'use client';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodeManagement } from '@/components/dashboard/management/NodeManagement';
import { NodeGroupManagement } from '@/components/dashboard/management/NodeGroupManagement';
import { Node, NodeGroup } from '@/types';

export function NodeManagementTab() {
  const [subTab, setSubTab] = useState('nodes');

  return (
    <Tabs value={subTab} onValueChange={setSubTab}>
      <TabsList>
        <TabsTrigger value="nodes">노드 관리</TabsTrigger>
        <TabsTrigger value="groups">노드 그룹 관리</TabsTrigger>
      </TabsList>

      <TabsContent value="nodes" className="mt-4">
        <NodeManagement />
      </TabsContent>

      <TabsContent value="groups" className="mt-4">
        <NodeGroupManagement />
      </TabsContent>
    </Tabs>
  );
}