import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cpu, 
  Lightbulb, 
  Settings2, 
  BarChart2, 
  Target, 
  ListChecks, 
  Shield, 
  Cog, 
  History, 
  Upload 
} from 'lucide-react';

type AlgorithmTab = 'strategy' | 'presets' | 'results' | 'scoring' | 'metrics' | 'policies' | 'operations' | 'history' | 'uploads';

export const AlgorithmPanel = () => {
  const [activeTab, setActiveTab] = useState<AlgorithmTab>('strategy');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlgorithmTab)} className="flex-1 flex flex-col">
        <div className="border-b border-border p-2">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50">
            <TabsTrigger value="strategy" className="text-xs px-2 py-1">
              <Lightbulb className="w-3 h-3 mr-1" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="presets" className="text-xs px-2 py-1">
              <Settings2 className="w-3 h-3 mr-1" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs px-2 py-1">
              <BarChart2 className="w-3 h-3 mr-1" />
              Results
            </TabsTrigger>
            <TabsTrigger value="scoring" className="text-xs px-2 py-1">
              <Target className="w-3 h-3 mr-1" />
              Scoring
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs px-2 py-1">
              <ListChecks className="w-3 h-3 mr-1" />
              Metrics List
            </TabsTrigger>
            <TabsTrigger value="policies" className="text-xs px-2 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-xs px-2 py-1">
              <Cog className="w-3 h-3 mr-1" />
              Operation Lists
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-2 py-1">
              <History className="w-3 h-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="uploads" className="text-xs px-2 py-1">
              <Upload className="w-3 h-3 mr-1" />
              Uploads
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="strategy" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="w-4 h-4" />
                  Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Define your algorithm strategy here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presets" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings2 className="w-4 h-4" />
                  Presets
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Load and save algorithm presets.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart2 className="w-4 h-4" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>View algorithm execution results.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Configure scoring parameters.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ListChecks className="w-4 h-4" />
                  Metrics List
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Available metrics for analysis.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4" />
                  Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Define algorithm policies.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Cog className="w-4 h-4" />
                  Operation Lists
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Manage operation sequences.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="w-4 h-4" />
                  History
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Algorithm execution history.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploads" className="m-0 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  Uploads
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Manage uploaded files and data.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
