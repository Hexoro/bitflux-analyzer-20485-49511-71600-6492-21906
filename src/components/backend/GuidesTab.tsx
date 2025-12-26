/**
 * Comprehensive Guides Tab for Backend Mode
 * Contains detailed guides and examples for writing strategies, anomalies, operations, metrics
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen,
  Code,
  FileCode,
  Zap,
  Activity,
  AlertTriangle,
  Cog,
  Calculator,
  Brain,
} from 'lucide-react';

export const GuidesTab = () => {
  const [activeGuide, setActiveGuide] = useState('scheduler');

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Comprehensive Strategy Writing Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This guide covers everything you need to know about writing strategies, anomalies, operations, and metrics for BSEE.
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeGuide} onValueChange={setActiveGuide}>
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="training">ML Training</TabsTrigger>
          </TabsList>

          {/* Scheduler Guide */}
          <TabsContent value="scheduler" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Scheduler Files Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedulers orchestrate the execution flow of your strategy. They determine which algorithms to run and in what order.
                </p>
                
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="ex1">
                    <AccordionTrigger>Example 1: Simple Sequential Scheduler</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Simple Sequential Scheduler
# Runs algorithms one after another

def schedule(bits, context):
    """
    Main scheduler entry point
    Args:
        bits: Current binary string
        context: Execution context with helpers
    Returns:
        List of algorithm calls to execute
    """
    return [
        {"algorithm": "entropy_reducer", "params": {}},
        {"algorithm": "pattern_optimizer", "params": {"min_length": 4}},
        {"algorithm": "cleanup", "params": {}}
    ]`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex2">
                    <AccordionTrigger>Example 2: Conditional Scheduler</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Conditional Scheduler
# Chooses algorithms based on data analysis

def schedule(bits, context):
    entropy = context.get_metric("entropy", bits)
    
    algorithms = []
    
    if entropy > 0.9:
        # High entropy - need aggressive reduction
        algorithms.append({"algorithm": "aggressive_reducer", "params": {"iterations": 5}})
    elif entropy > 0.5:
        # Medium entropy - standard approach
        algorithms.append({"algorithm": "standard_optimizer", "params": {}})
    else:
        # Low entropy - light touch
        algorithms.append({"algorithm": "pattern_enhancer", "params": {}})
    
    # Always run cleanup at the end
    algorithms.append({"algorithm": "cleanup", "params": {}})
    
    return algorithms`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex3">
                    <AccordionTrigger>Example 3: Iterative Scheduler</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Iterative Scheduler
# Runs until a condition is met

def schedule(bits, context):
    algorithms = []
    max_iterations = 10
    target_entropy = 0.3
    
    for i in range(max_iterations):
        algorithms.append({
            "algorithm": "entropy_step",
            "params": {"step": i, "target": target_entropy},
            "condition": f"entropy > {target_entropy}"
        })
    
    return algorithms`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex4">
                    <AccordionTrigger>Example 4: Parallel Scheduler</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Parallel Scheduler
# Runs multiple algorithms on different segments

def schedule(bits, context):
    segment_size = len(bits) // 4
    
    parallel_tasks = []
    for i in range(4):
        start = i * segment_size
        end = start + segment_size
        parallel_tasks.append({
            "algorithm": "segment_optimizer",
            "params": {"start": start, "end": end},
            "parallel_group": "segments"
        })
    
    return [
        {"parallel": parallel_tasks},
        {"algorithm": "merge_segments", "params": {}}
    ]`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex5">
                    <AccordionTrigger>Example 5: Budget-Aware Scheduler</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Budget-Aware Scheduler
# Manages algorithm execution within budget constraints

def schedule(bits, context):
    budget = context.get_budget()
    algorithms = []
    
    # High-cost but effective algorithm
    if budget > 500:
        algorithms.append({
            "algorithm": "deep_analysis",
            "params": {},
            "estimated_cost": 300
        })
        budget -= 300
    
    # Medium-cost algorithms
    while budget > 50:
        algorithms.append({
            "algorithm": "quick_optimize",
            "params": {},
            "estimated_cost": 50
        })
        budget -= 50
    
    # Use remaining budget for cleanup
    algorithms.append({
        "algorithm": "final_cleanup",
        "params": {"budget": budget}
    })
    
    return algorithms`}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Algorithm Guide */}
          <TabsContent value="algorithm" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Algorithm Files Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Algorithm files contain the transformation logic that modifies binary data. They use operations from the operations router.
                </p>
                
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="ex1">
                    <AccordionTrigger>Example 1: Entropy Reducer</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Entropy Reducer Algorithm
# Reduces entropy by identifying and compressing patterns

def run(bits, params, context):
    """
    Main algorithm entry point
    Args:
        bits: Current binary string
        params: Parameters from scheduler
        context: Execution context with operation helpers
    Returns:
        Modified binary string
    """
    result = bits
    
    # Find repeating patterns
    patterns = context.find_patterns(result, min_length=4)
    
    for pattern in patterns:
        if pattern.count > 3:
            # Apply XOR to reduce pattern entropy
            mask = pattern.sequence * (len(result) // len(pattern.sequence))
            result = context.execute_op("XOR", result, {"mask": mask})
    
    return result`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex2">
                    <AccordionTrigger>Example 2: Run Length Optimizer</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Run Length Optimizer
# Optimizes sequences of consecutive bits

def run(bits, params, context):
    min_run = params.get("min_run", 8)
    result = bits
    
    # Find long runs of 1s or 0s
    runs = context.find_runs(result, min_length=min_run)
    
    for run in runs:
        # Apply NOT to alternating sections to break up runs
        if run.length > min_run * 2:
            mid = run.start + run.length // 2
            segment_length = run.length // 4
            result = context.execute_op_range(
                "NOT",
                result,
                {"start": mid, "end": mid + segment_length}
            )
    
    return result`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex3">
                    <AccordionTrigger>Example 3: Balance Normalizer</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Balance Normalizer
# Balances the ratio of 0s to 1s

def run(bits, params, context):
    target_ratio = params.get("target", 0.5)
    tolerance = params.get("tolerance", 0.05)
    
    ones = bits.count("1")
    total = len(bits)
    current_ratio = ones / total
    
    result = bits
    
    while abs(current_ratio - target_ratio) > tolerance:
        if current_ratio > target_ratio:
            # Too many 1s, flip some to 0s
            for i in range(len(result)):
                if result[i] == "1":
                    result = result[:i] + "0" + result[i+1:]
                    break
        else:
            # Too many 0s, flip some to 1s
            for i in range(len(result)):
                if result[i] == "0":
                    result = result[:i] + "1" + result[i+1:]
                    break
        
        ones = result.count("1")
        current_ratio = ones / total
    
    return result`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex4">
                    <AccordionTrigger>Example 4: Transition Smoother</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Transition Smoother
# Reduces rapid bit transitions

def run(bits, params, context):
    window_size = params.get("window", 8)
    threshold = params.get("threshold", 6)
    
    result = list(bits)
    
    for i in range(0, len(result) - window_size, window_size):
        window = result[i:i + window_size]
        transitions = sum(1 for j in range(len(window)-1) if window[j] != window[j+1])
        
        if transitions > threshold:
            # Too many transitions, smooth by majority voting
            ones = window.count("1")
            majority = "1" if ones > window_size // 2 else "0"
            for j in range(i, i + window_size):
                result[j] = majority
    
    return "".join(result)`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex5">
                    <AccordionTrigger>Example 5: Pattern Replacer</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Pattern Replacer
# Replaces specific patterns with optimized versions

def run(bits, params, context):
    replacements = params.get("replacements", {
        "1111": "1010",
        "0000": "0101",
        "11110000": "10101010"
    })
    
    result = bits
    
    # Sort by length to replace longer patterns first
    sorted_patterns = sorted(replacements.keys(), key=len, reverse=True)
    
    for pattern in sorted_patterns:
        replacement = replacements[pattern]
        result = result.replace(pattern, replacement)
        
        # Log the replacement
        context.log(f"Replaced {pattern} with {replacement}")
    
    return result`}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scoring Guide */}
          <TabsContent value="scoring" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Scoring Files Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Scoring files define the budget system, operation costs, and success metrics for your strategy.
                </p>
                
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="ex1">
                    <AccordionTrigger>Example 1: Simple Budget System</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Simple Budget System
# Basic cost tracking with fixed operation costs

config = {
    "initial_budget": 1000,
    "operation_costs": {
        "NOT": 1,
        "AND": 2,
        "OR": 2,
        "XOR": 2,
        "SHL": 1,
        "SHR": 1
    },
    "success_threshold": 100  # Remaining budget for success
}

def calculate_score(context):
    budget_used = context.get_total_cost()
    budget_remaining = config["initial_budget"] - budget_used
    entropy_reduction = context.get_entropy_change()
    
    return {
        "score": entropy_reduction * budget_remaining,
        "budget_remaining": budget_remaining,
        "success": budget_remaining >= config["success_threshold"]
    }`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex2">
                    <AccordionTrigger>Example 2: Dynamic Cost Scaling</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Dynamic Cost Scaling
# Costs increase as budget depletes

config = {
    "initial_budget": 1000,
    "base_costs": {
        "NOT": 1,
        "AND": 2,
        "XOR": 2,
    },
    "cost_multiplier_thresholds": [
        (0.75, 1.0),   # >75% budget: normal cost
        (0.50, 1.5),   # 50-75% budget: 1.5x cost
        (0.25, 2.0),   # 25-50% budget: 2x cost
        (0.0, 3.0),    # <25% budget: 3x cost
    ]
}

def get_cost(operation, context):
    budget_ratio = context.get_remaining_budget() / config["initial_budget"]
    
    multiplier = 1.0
    for threshold, mult in config["cost_multiplier_thresholds"]:
        if budget_ratio >= threshold:
            multiplier = mult
            break
    
    base_cost = config["base_costs"].get(operation, 1)
    return int(base_cost * multiplier)`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex3">
                    <AccordionTrigger>Example 3: Multi-Objective Scoring</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Multi-Objective Scoring
# Balances multiple optimization goals

config = {
    "initial_budget": 1000,
    "weights": {
        "entropy_reduction": 0.4,
        "compression_ratio": 0.3,
        "budget_efficiency": 0.2,
        "pattern_regularity": 0.1
    }
}

def calculate_score(context):
    metrics = {
        "entropy_reduction": max(0, context.initial_entropy - context.final_entropy),
        "compression_ratio": context.get_compression_ratio(),
        "budget_efficiency": context.get_remaining_budget() / config["initial_budget"],
        "pattern_regularity": context.get_pattern_score()
    }
    
    weighted_score = sum(
        metrics[key] * config["weights"][key] 
        for key in config["weights"]
    )
    
    return {
        "score": weighted_score,
        "metrics": metrics,
        "success": weighted_score > 0.5
    }`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex4">
                    <AccordionTrigger>Example 4: Penalty System</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Penalty System
# Applies penalties for undesirable outcomes

config = {
    "initial_budget": 1000,
    "penalties": {
        "entropy_increase": 50,       # Per 0.1 entropy increase
        "size_increase": 10,          # Per bit added
        "failed_operation": 25,       # Per failed operation
        "timeout": 100                # If execution too slow
    },
    "bonuses": {
        "entropy_decrease": 20,       # Per 0.1 entropy decrease
        "pattern_found": 10,          # Per new pattern optimized
        "perfect_balance": 50         # If 50/50 bit ratio
    }
}

def calculate_final_score(context):
    base_score = config["initial_budget"] - context.get_total_cost()
    
    # Apply penalties
    if context.entropy_increased():
        penalty = int(context.entropy_change * 10) * config["penalties"]["entropy_increase"]
        base_score -= penalty
    
    # Apply bonuses
    if context.entropy_decreased():
        bonus = int(abs(context.entropy_change) * 10) * config["bonuses"]["entropy_decrease"]
        base_score += bonus
    
    return max(0, base_score)`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex5">
                    <AccordionTrigger>Example 5: Time-Based Scoring</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Time-Based Scoring
# Factors in execution time

config = {
    "initial_budget": 1000,
    "time_budget_ms": 5000,
    "time_penalty_per_ms": 0.1
}

def calculate_score(context):
    operation_cost = context.get_total_cost()
    time_ms = context.get_execution_time_ms()
    
    # Time penalty if over budget
    time_penalty = 0
    if time_ms > config["time_budget_ms"]:
        overtime = time_ms - config["time_budget_ms"]
        time_penalty = overtime * config["time_penalty_per_ms"]
    
    # Efficiency bonus if under time budget
    time_bonus = 0
    if time_ms < config["time_budget_ms"] * 0.5:
        time_bonus = (config["time_budget_ms"] - time_ms) * 0.05
    
    final_score = config["initial_budget"] - operation_cost - time_penalty + time_bonus
    
    return {
        "score": max(0, final_score),
        "time_used": time_ms,
        "operation_cost": operation_cost,
        "time_penalty": time_penalty,
        "time_bonus": time_bonus
    }`}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Guide */}
          <TabsContent value="policies" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Policies Files Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Policy files define constraints and rules that must be followed during strategy execution.
                </p>
                
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="ex1">
                    <AccordionTrigger>Example 1: Size Constraint Policy</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Size Constraint Policy
# Ensures data size stays within limits

policy = {
    "max_size_multiplier": 1.5,  # Max 1.5x original size
    "min_size_ratio": 0.1,       # Min 10% of original size
}

def validate(bits, original_bits, context):
    original_size = len(original_bits)
    current_size = len(bits)
    
    max_allowed = int(original_size * policy["max_size_multiplier"])
    min_allowed = int(original_size * policy["min_size_ratio"])
    
    if current_size > max_allowed:
        return {"valid": False, "error": f"Size {current_size} exceeds max {max_allowed}"}
    
    if current_size < min_allowed:
        return {"valid": False, "error": f"Size {current_size} below min {min_allowed}"}
    
    return {"valid": True}`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex2">
                    <AccordionTrigger>Example 2: Operation Whitelist Policy</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Operation Whitelist Policy
# Only allows specific operations

policy = {
    "allowed_operations": ["NOT", "AND", "OR", "XOR", "SHL", "SHR"],
    "max_operations_per_step": 10,
    "forbidden_sequences": [
        ["NOT", "NOT"],  # Redundant
        ["SHL", "SHR"],  # Potentially lossy
    ]
}

def validate_operation(operation, context):
    if operation not in policy["allowed_operations"]:
        return {"valid": False, "error": f"Operation {operation} not allowed"}
    
    recent_ops = context.get_recent_operations(2)
    for seq in policy["forbidden_sequences"]:
        if recent_ops == seq:
            return {"valid": False, "error": f"Forbidden sequence: {seq}"}
    
    return {"valid": True}`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex3">
                    <AccordionTrigger>Example 3: Quality Threshold Policy</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Quality Threshold Policy
# Maintains minimum quality standards

policy = {
    "min_entropy": 0.1,
    "max_entropy": 0.95,
    "min_balance": 0.3,  # Min 30% of either bit
    "max_run_length": 64
}

def validate(bits, context):
    entropy = context.calculate_entropy(bits)
    if entropy < policy["min_entropy"]:
        return {"valid": False, "error": "Entropy too low - data may be degenerate"}
    if entropy > policy["max_entropy"]:
        return {"valid": False, "error": "Entropy too high - no compression achieved"}
    
    ones_ratio = bits.count("1") / len(bits)
    if ones_ratio < policy["min_balance"] or ones_ratio > (1 - policy["min_balance"]):
        return {"valid": False, "error": "Bit balance outside acceptable range"}
    
    max_run = context.find_longest_run(bits)
    if max_run > policy["max_run_length"]:
        return {"valid": False, "error": f"Run length {max_run} exceeds max {policy['max_run_length']}"}
    
    return {"valid": True}`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex4">
                    <AccordionTrigger>Example 4: Reversibility Policy</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Reversibility Policy
# Ensures all transformations can be reversed

policy = {
    "reversible_operations": ["NOT", "XOR", "ROL", "ROR", "REVERSE", "SWAP"],
    "track_history": True
}

def validate_operation(operation, params, context):
    if operation not in policy["reversible_operations"]:
        # Check if inverse operation is also recorded
        if not context.has_inverse_recorded():
            return {
                "valid": False,
                "error": f"Non-reversible operation {operation} without inverse"
            }
    
    return {"valid": True}

def get_inverse(operation, params):
    inverses = {
        "NOT": ("NOT", {}),
        "XOR": ("XOR", params),  # XOR is self-inverse
        "ROL": ("ROR", params),
        "ROR": ("ROL", params),
        "REVERSE": ("REVERSE", {}),
    }
    return inverses.get(operation)`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex5">
                    <AccordionTrigger>Example 5: Resource Limit Policy</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`# Resource Limit Policy
# Enforces computational resource limits

policy = {
    "max_execution_time_ms": 10000,
    "max_memory_bytes": 100 * 1024 * 1024,  # 100MB
    "max_iterations": 1000,
    "checkpoint_interval": 100
}

def check_resources(context):
    if context.get_execution_time() > policy["max_execution_time_ms"]:
        return {"valid": False, "error": "Execution time limit exceeded"}
    
    if context.get_memory_usage() > policy["max_memory_bytes"]:
        return {"valid": False, "error": "Memory limit exceeded"}
    
    if context.get_iteration_count() > policy["max_iterations"]:
        return {"valid": False, "error": "Iteration limit exceeded"}
    
    # Create checkpoint if needed
    if context.get_iteration_count() % policy["checkpoint_interval"] == 0:
        context.create_checkpoint()
    
    return {"valid": True}`}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anomalies Guide */}
          <TabsContent value="anomalies" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Anomalies Detection Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Anomaly detectors identify unusual patterns or structures in binary data. You can create custom detectors in the Anomalies tab.
                </p>
                
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="structure">
                    <AccordionTrigger>Anomaly Definition Structure</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`// Anomaly Definition Structure
{
  "id": "unique_identifier",
  "name": "Human Readable Name",
  "description": "What this anomaly detects",
  "category": "Pattern|Run|Density|Structure",
  "severity": "low|medium|high",
  "minLength": 5,  // Minimum length to consider
  "enabled": true,
  "detectFn": "function detect(bits, minLength) { ... }"
}`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex1">
                    <AccordionTrigger>Example 1: Custom Palindrome Detector</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`function detect(bits, minLength) {
  const results = [];
  
  for (let i = 0; i < bits.length; i++) {
    // Check for palindromes centered at position i
    let len = 1;
    while (i - len >= 0 && i + len < bits.length) {
      if (bits[i - len] !== bits[i + len]) break;
      len++;
    }
    
    if (len * 2 - 1 >= minLength) {
      results.push({
        position: i - len + 1,
        length: len * 2 - 1,
        type: "odd-palindrome"
      });
    }
  }
  
  return results;
}`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex2">
                    <AccordionTrigger>Example 2: Entropy Spike Detector</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`function detect(bits, windowSize) {
  const results = [];
  const threshold = 0.3; // Entropy change threshold
  
  for (let i = windowSize; i < bits.length - windowSize; i++) {
    const before = bits.substring(i - windowSize, i);
    const after = bits.substring(i, i + windowSize);
    
    const entropyBefore = calcEntropy(before);
    const entropyAfter = calcEntropy(after);
    
    if (Math.abs(entropyAfter - entropyBefore) > threshold) {
      results.push({
        position: i,
        length: windowSize,
        entropyChange: entropyAfter - entropyBefore
      });
    }
  }
  
  return results;
}

function calcEntropy(bits) {
  const ones = (bits.match(/1/g) || []).length;
  const p1 = ones / bits.length;
  const p0 = 1 - p1;
  if (p0 === 0 || p1 === 0) return 0;
  return -(p0 * Math.log2(p0) + p1 * Math.log2(p1));
}`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ex3">
                    <AccordionTrigger>Example 3: Periodic Pattern Detector</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`function detect(bits, minPeriod) {
  const results = [];
  
  for (let period = minPeriod; period <= 32; period++) {
    for (let start = 0; start < bits.length - period * 3; start++) {
      const pattern = bits.substring(start, start + period);
      let matches = 0;
      
      for (let j = start; j < bits.length - period; j += period) {
        if (bits.substring(j, j + period) === pattern) {
          matches++;
        } else {
          break;
        }
      }
      
      if (matches >= 3) {
        results.push({
          position: start,
          length: period * matches,
          period: period,
          repetitions: matches,
          pattern: pattern
        });
        start += period * matches - 1; // Skip found region
      }
    }
  }
  
  return results;
}`}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Guide */}
          <TabsContent value="operations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cog className="w-4 h-4" />
                  Operations Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Operations are the building blocks that strategies use to transform binary data.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Available Operations</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <Badge>NOT</Badge> - Inverts all bits
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>AND</Badge> - Bitwise AND with mask
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>OR</Badge> - Bitwise OR with mask
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>XOR</Badge> - Bitwise XOR with mask
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>SHL</Badge> - Shift left by count
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>SHR</Badge> - Shift right by count
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>ROL</Badge> - Rotate left by count
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Badge>ROR</Badge> - Rotate right by count
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Adding Custom Operations</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the Operations tab to add custom operations. Each operation needs:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Unique ID (e.g., "CUSTOM_OP")</li>
                      <li>Display name</li>
                      <li>Description of what it does</li>
                      <li>Parameters it accepts</li>
                      <li>Category for organization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Guide */}
          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Metrics Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Metrics measure properties of binary data and are used to evaluate strategy performance.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Core Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <strong>Entropy</strong>: Measures randomness (0 = completely predictable, 1 = maximum randomness)
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Hamming Weight</strong>: Count of 1 bits in the data
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Balance</strong>: Ratio of 1s to 0s (0.5 = perfectly balanced)
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Transition Count</strong>: Number of bit changes (0→1 or 1→0)
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Compression Ratio</strong>: How well the data compresses
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <strong>Autocorrelation</strong>: Self-similarity at different offsets
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Adding Custom Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the Metrics tab to add custom metrics with formulas and descriptions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Training Guide */}
          <TabsContent value="training" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  ML Training Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  BSEE supports training neural networks on binary data using TensorFlow.js.
                </p>
                
                <Accordion type="multiple" className="space-y-2">
                  <AccordionItem value="basics">
                    <AccordionTrigger>Training Basics</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p>1. Navigate to ML Mode from the toolbar</p>
                        <p>2. Configure training parameters (learning rate, epochs, batch size)</p>
                        <p>3. Select input features and target metric</p>
                        <p>4. Start training and monitor progress</p>
                        <p>5. Export trained model for later use</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="console">
                    <AccordionTrigger>TensorFlow.js Console</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`// Example: Create a simple model
const model = tf.sequential();
model.add(tf.layers.dense({units: 32, activation: 'relu', inputShape: [8]}));
model.add(tf.layers.dense({units: 16, activation: 'relu'}));
model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));

model.compile({
  optimizer: 'adam',
  loss: 'binaryCrossentropy',
  metrics: ['accuracy']
});

// Train on binary data
const xs = tf.tensor2d(binaryToFeatures(bits));
const ys = tf.tensor2d(targetValues);

await model.fit(xs, ys, {
  epochs: 100,
  callbacks: {
    onEpochEnd: (epoch, logs) => {
      log(\`Epoch \${epoch}: loss = \${logs.loss}\`);
    }
  }
});`}</pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="export">
                    <AccordionTrigger>Model Export/Import</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">{`// Export model
await model.save('downloads://my-model');

// Import model
const loadedModel = await tf.loadLayersModel('path/to/model.json');

// Use for inference
const prediction = loadedModel.predict(tf.tensor2d([inputFeatures]));
console.log(prediction.dataSync());`}</pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
