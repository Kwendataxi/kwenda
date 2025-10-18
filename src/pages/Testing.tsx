import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phase6TestingDashboard } from '@/components/testing/Phase6TestingDashboard';
import { PartnerSystemValidationDashboard } from '@/components/testing/PartnerSystemValidationDashboard';
import { Users, TestTube } from 'lucide-react';

const TestingPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="partner" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Système Partenaire
          </TabsTrigger>
          <TabsTrigger value="phase6" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Tests Phase 6
          </TabsTrigger>
        </TabsList>

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