'use client';
import React, { useState } from 'react';
import { Header } from '@/components/dashboard/layout/Header';
import { Sidebar } from '@/components//dashboard/layout/Sidebar';
import { NodeMonitoringTab } from '@/components/dashboard/tabs/NodeMonitoringTab';
import { GrafanaDashboardTab } from '@/components/dashboard/tabs/GrafanaDashboardTab';
import { NodeManagementTab } from '@/components/dashboard/tabs/NodeManagementTab';
import { ApiManagementTab } from '@/components/dashboard/tabs/ApiManagementTab';

export default function MonitoringDashboard() {
  const [mainTab, setMainTab] = useState('monitoring');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar activeTab={mainTab} onTabChange={setMainTab} />

        <main className="flex-1 p-6">
          {mainTab === 'monitoring' && <NodeMonitoringTab />}
          {mainTab === 'grafana' && <GrafanaDashboardTab />}
          {mainTab === 'nodes' && <NodeManagementTab />}
          {mainTab === 'apis' && <ApiManagementTab />}
        </main>
      </div>
    </div>
  );
}