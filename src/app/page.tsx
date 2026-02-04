'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/layout/Header';
import { Sidebar } from '@/components//dashboard/layout/Sidebar';
import { NodeMonitoringTab } from '@/components/dashboard/tabs/NodeMonitoringTab';
import { GrafanaDashboardTab } from '@/components/dashboard/tabs/GrafanaDashboardTab';
import { NodeManagementTab } from '@/components/dashboard/tabs/NodeManagementTab';
import { ApiManagementTab } from '@/components/dashboard/tabs/ApiManagementTab';
import { TestHistoryTab } from '@/components/dashboard/tabs/TestHistoryTab';

export default function MonitoringDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL 쿼리 파라미터에서 탭 읽기
  const tabFromUrl = searchParams.get('tab');
  const [mainTab, setMainTab] = useState(tabFromUrl || 'monitoring');

  // URL 파라미터가 변경되면 탭 업데이트
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== mainTab) {
      setMainTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: string) => {
    setMainTab(tab);
    // URL 업데이트 (쿼리 파라미터 유지)
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar activeTab={mainTab} onTabChange={handleTabChange} />

        <main className="flex-1 p-6">
          {mainTab === 'monitoring' && <NodeMonitoringTab />}
          {mainTab === 'grafana' && <GrafanaDashboardTab />}
          {mainTab === 'nodes' && <NodeManagementTab />}
          {mainTab === 'apis' && <ApiManagementTab />}
          {mainTab === 'test-history' && <TestHistoryTab />}
        </main>
      </div>
    </div>
  );
}
