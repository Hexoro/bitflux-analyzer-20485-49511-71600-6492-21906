import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingDown, 
  Terminal, 
  Cpu, 
  Activity,
  Database,
} from 'lucide-react';
import { EntropyOptimizationTab } from './ml/EntropyOptimizationTab';
import { TensorFlowConsoleTab } from './ml/TensorFlowConsoleTab';
import { ResourcesTab } from './ml/ResourcesTab';
import { TrainingDashboardTab } from './ml/TrainingDashboardTab';
import { MLResultsTab } from './ml/MLResultsTab';

type MLTab = 'entropy' | 'console' | 'resources' | 'training' | 'results';

export const MLPanel = () => {
  const [activeTab, setActiveTab] = useState<MLTab>('entropy');

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MLTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-card px-2">
          <TabsTrigger value="entropy" className="gap-2">
            <TrendingDown className="w-4 h-4" />
            Entropy Optimization
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2">
            <Activity className="w-4 h-4" />
            Training Dashboard
          </TabsTrigger>
          <TabsTrigger value="console" className="gap-2">
            <Terminal className="w-4 h-4" />
            TF.js Console
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Cpu className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <Database className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="entropy" className="h-full m-0">
            <EntropyOptimizationTab />
          </TabsContent>

          <TabsContent value="training" className="h-full m-0">
            <TrainingDashboardTab />
          </TabsContent>

          <TabsContent value="console" className="h-full m-0">
            <TensorFlowConsoleTab />
          </TabsContent>

          <TabsContent value="resources" className="h-full m-0">
            <ResourcesTab />
          </TabsContent>

          <TabsContent value="results" className="h-full m-0">
            <MLResultsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
