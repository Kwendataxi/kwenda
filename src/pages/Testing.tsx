import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phase6TestingDashboard } from '@/components/testing/Phase6TestingDashboard';
import { PartnerSystemValidationDashboard } from '@/components/testing/PartnerSystemValidationDashboard';
import { Users, TestTube, Zap, ShieldCheck } from 'lucide-react';
import DispatcherValidation from './test/DispatcherValidation';
import AdminValidationTest from './test/AdminValidationTest';

const TestingPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Validation Admin
          </TabsTrigger>
          <TabsTrigger value="dispatcher" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tests Dispatcher
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Système Partenaire
          </TabsTrigger>
          <TabsTrigger value="phase6" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Tests Phase 6
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <AdminValidationTest />
        </TabsContent>

        <TabsContent value="dispatcher">
          <DispatcherValidation />
        </TabsContent>

        <TabsContent value="partner">
          <PartnerSystemValidationDashboard />
        </TabsContent>

        <TabsContent value="phase6">
          <Phase6TestingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestingPage;
