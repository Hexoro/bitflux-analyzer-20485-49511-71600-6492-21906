import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
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
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AlgorithmTab)} className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b">
        <TabsTrigger value="strategy">Strategy</TabsTrigger>
        <TabsTrigger value="presets">Presets</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
        <TabsTrigger value="scoring">Scoring</TabsTrigger>
        <TabsTrigger value="metrics">Metrics List</TabsTrigger>
        <TabsTrigger value="policies">Policies</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="uploads">Uploads</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="strategy" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="presets" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="results" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="scoring" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="metrics" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="policies" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="operations" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="uploads" className="h-full m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            </div>
          </ScrollArea>
        </TabsContent>
      </div>
    </Tabs>
  );
};
