/**
 * Result Exporter - Export execution results as ZIP with CSV and benchmarks
 */

import JSZip from 'jszip';
import { ExecutionResult, ExecutionStep } from './algorithmExecutor';

interface ExportOptions {
  includeOperationsCSV: boolean;
  includeMetricsCSV: boolean;
  includeCostCSV: boolean;
  includeBenchmarks: boolean;
  includeRawData: boolean;
}

class ResultExporter {
  /**
   * Generate operations CSV
   */
  generateOperationsCSV(result: ExecutionResult): string {
    const headers = [
      'Step',
      'Timestamp',
      'Operation',
      'Parameters',
      'Cost',
      'Budget Before',
      'Budget After',
      'Size Before',
      'Size After',
      'Size Delta',
      'Bits Sample Before',
      'Bits Sample After',
    ];

    const rows = result.steps.map((step, index) => {
      const budgetBefore = index === 0 
        ? result.initialBudget 
        : result.steps[index - 1].budgetRemaining + step.cost;
      
      return [
        step.stepNumber,
        step.timestamp.toISOString(),
        step.operation,
        JSON.stringify(step.parameters),
        step.cost,
        budgetBefore.toFixed(2),
        step.budgetRemaining.toFixed(2),
        step.sizeBefore,
        step.sizeAfter,
        step.sizeAfter - step.sizeBefore,
        `"${step.bitsBefore}"`,
        `"${step.bitsAfter}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate metrics CSV - how each step affected metrics
   */
  generateMetricsCSV(result: ExecutionResult): string {
    // Get all metric names from first step
    const metricNames = result.steps.length > 0 
      ? Object.keys(result.steps[0].metricsBefore) 
      : [];

    const headers = [
      'Step',
      'Timestamp',
      'Operation',
      ...metricNames.flatMap(m => [`${m} Before`, `${m} After`, `${m} Delta`]),
    ];

    const rows = result.steps.map(step => {
      const metricCols = metricNames.flatMap(m => {
        const before = step.metricsBefore[m] ?? 0;
        const after = step.metricsAfter[m] ?? 0;
        return [before.toFixed(4), after.toFixed(4), (after - before).toFixed(4)];
      });

      return [
        step.stepNumber,
        step.timestamp.toISOString(),
        step.operation,
        ...metricCols,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate cost/economy CSV
   */
  generateCostCSV(result: ExecutionResult): string {
    const headers = [
      'Step',
      'Time (ms)',
      'Edit Number',
      'Operation',
      'Cost',
      'Cumulative Cost',
      'Budget Remaining',
      'Budget %',
    ];

    let cumulativeCost = 0;
    const rows = result.steps.map((step, index) => {
      cumulativeCost += step.cost;
      const timeFromStart = step.timestamp.getTime() - result.startTime.getTime();
      
      return [
        step.stepNumber,
        timeFromStart,
        index + 1,
        step.operation,
        step.cost,
        cumulativeCost,
        step.budgetRemaining.toFixed(2),
        ((step.budgetRemaining / result.initialBudget) * 100).toFixed(1) + '%',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate benchmarks text file
   */
  generateBenchmarksText(result: ExecutionResult): string {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                    EXECUTION BENCHMARK REPORT                  ',
      '═══════════════════════════════════════════════════════════════',
      '',
      '── EXECUTION SUMMARY ──────────────────────────────────────────',
      `Strategy: ${result.strategyName}`,
      `Execution ID: ${result.id}`,
      `Status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
      result.error ? `Error: ${result.error}` : '',
      '',
      '── TIMING METRICS ─────────────────────────────────────────────',
      `Start Time: ${result.startTime.toISOString()}`,
      `End Time: ${result.endTime.toISOString()}`,
      `Total Duration: ${result.duration}ms`,
      `CPU Time: ${result.cpuTimeMs}ms`,
      `Avg Step Duration: ${(result.duration / Math.max(result.steps.length, 1)).toFixed(2)}ms`,
      '',
      '── MEMORY METRICS ─────────────────────────────────────────────',
      `Peak Memory Usage: ${result.peakMemoryMB.toFixed(2)} MB`,
      '',
      '── ECONOMY METRICS ────────────────────────────────────────────',
      `Initial Budget: ${result.initialBudget}`,
      `Final Budget: ${result.finalBudget.toFixed(2)}`,
      `Total Cost: ${result.totalCost.toFixed(2)}`,
      `Budget Utilization: ${((result.totalCost / result.initialBudget) * 100).toFixed(1)}%`,
      '',
      '── SIZE ANALYSIS ──────────────────────────────────────────────',
      `Initial Size: ${result.initialSize} bits (${(result.initialSize / 8).toFixed(0)} bytes)`,
      `Final Size: ${result.finalSize} bits (${(result.finalSize / 8).toFixed(0)} bytes)`,
      `Size Change: ${result.finalSize - result.initialSize} bits`,
      `Compression Ratio: ${result.compressionRatio.toFixed(4)}x`,
      '',
      '── OPERATION STATISTICS ───────────────────────────────────────',
      `Total Operations: ${result.steps.length}`,
    ];

    // Count operations by type
    const opCounts: Record<string, { count: number; totalCost: number }> = {};
    for (const step of result.steps) {
      if (!opCounts[step.operation]) {
        opCounts[step.operation] = { count: 0, totalCost: 0 };
      }
      opCounts[step.operation].count++;
      opCounts[step.operation].totalCost += step.cost;
    }

    lines.push('');
    lines.push('Operation Breakdown:');
    for (const [op, data] of Object.entries(opCounts).sort((a, b) => b[1].count - a[1].count)) {
      lines.push(`  ${op}: ${data.count} times, total cost: ${data.totalCost}`);
    }

    lines.push('');
    lines.push('── METRIC CHANGES ─────────────────────────────────────────────');
    
    if (result.steps.length > 0) {
      const firstStep = result.steps[0];
      const lastStep = result.steps[result.steps.length - 1];
      
      for (const metricName of Object.keys(firstStep.metricsBefore)) {
        const initial = firstStep.metricsBefore[metricName];
        const final = lastStep.metricsAfter[metricName];
        lines.push(`${metricName}: ${initial.toFixed(4)} → ${final.toFixed(4)} (Δ ${(final - initial).toFixed(4)})`);
      }
    }

    lines.push('');
    lines.push('── SYSTEM INFORMATION ─────────────────────────────────────────');
    lines.push(`User Agent: ${navigator.userAgent}`);
    lines.push(`Platform: ${navigator.platform}`);
    lines.push(`Cores: ${navigator.hardwareConcurrency || 'Unknown'}`);
    // @ts-ignore
    lines.push(`Device Memory: ${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown'}`);
    lines.push(`Report Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.filter(l => l !== undefined).join('\n');
  }

  /**
   * Export result as ZIP file
   */
  async exportAsZip(result: ExecutionResult, options: Partial<ExportOptions> = {}): Promise<Blob> {
    const opts: ExportOptions = {
      includeOperationsCSV: true,
      includeMetricsCSV: true,
      includeCostCSV: true,
      includeBenchmarks: true,
      includeRawData: true,
      ...options,
    };

    const zip = new JSZip();
    const folder = zip.folder(`execution_${result.strategyName}_${result.id.slice(0, 8)}`);

    if (!folder) {
      throw new Error('Failed to create ZIP folder');
    }

    if (opts.includeOperationsCSV) {
      folder.file('operations.csv', this.generateOperationsCSV(result));
    }

    if (opts.includeMetricsCSV) {
      folder.file('metrics_changes.csv', this.generateMetricsCSV(result));
    }

    if (opts.includeCostCSV) {
      folder.file('cost_timeline.csv', this.generateCostCSV(result));
    }

    if (opts.includeBenchmarks) {
      folder.file('benchmarks.txt', this.generateBenchmarksText(result));
    }

    if (opts.includeRawData) {
      folder.file('raw_result.json', JSON.stringify(result, null, 2));
    }

    // Summary file
    const summary = {
      strategy: result.strategyName,
      success: result.success,
      duration_ms: result.duration,
      total_operations: result.steps.length,
      total_cost: result.totalCost,
      compression_ratio: result.compressionRatio,
      exported_at: new Date().toISOString(),
    };
    folder.file('summary.json', JSON.stringify(summary, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Export preset as ZIP file (containing all related files)
   */
  async exportPresetAsZip(
    presetName: string,
    files: {
      strategy?: { name: string; content: string };
      scoring?: { name: string; content: string };
      policies?: Array<{ name: string; content: string }>;
      metrics?: { name: string; content: string };
      operations?: { name: string; content: string };
    }
  ): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder(presetName);

    if (!folder) {
      throw new Error('Failed to create ZIP folder');
    }

    if (files.strategy) {
      folder.file(files.strategy.name, files.strategy.content);
    }

    if (files.scoring) {
      folder.file(files.scoring.name, files.scoring.content);
    }

    if (files.policies) {
      const policiesFolder = folder.folder('policies');
      if (policiesFolder) {
        files.policies.forEach(p => {
          policiesFolder.file(p.name, p.content);
        });
      }
    }

    if (files.metrics) {
      folder.file(files.metrics.name, files.metrics.content);
    }

    if (files.operations) {
      folder.file(files.operations.name, files.operations.content);
    }

    // Create preset.json
    const preset = {
      name: presetName,
      strategy: files.strategy?.name || null,
      scoring: files.scoring?.name || null,
      policies: files.policies?.map(p => `policies/${p.name}`) || [],
      metrics: files.metrics?.name || null,
      operations: files.operations?.name || null,
      created: new Date().toISOString(),
    };
    folder.file('preset.json', JSON.stringify(preset, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const resultExporter = new ResultExporter();
