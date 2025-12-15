/**
 * Test Strategies - Sample algorithms for testing the execution system
 */

export const TEST_LUA_STRATEGY = `-- Simple Entropy Reduction Strategy
-- This strategy tries to reduce entropy by applying simple operations

function execute()
  log("Starting entropy reduction strategy")
  
  -- Get initial metrics
  local initial_entropy = get_metric("entropy")
  log("Initial entropy: " .. tostring(initial_entropy))
  
  -- Apply operations while budget allows
  local ops_applied = 0
  local max_ops = 10
  
  while ops_applied < max_ops do
    -- Check if we can apply XOR
    if is_operation_allowed("XOR") then
      local cost = get_cost("XOR")
      if cost <= budget then
        apply_operation("XOR", {mask = "10101010"})
        ops_applied = ops_applied + 1
        log("Applied XOR, cost: " .. cost)
      else
        log("Insufficient budget for XOR")
        break
      end
    end
    
    -- Check if we can apply NOT
    if is_operation_allowed("NOT") then
      local cost = get_cost("NOT")
      if cost <= budget then
        apply_operation("NOT")
        ops_applied = ops_applied + 1
        log("Applied NOT, cost: " .. cost)
      else
        break
      end
    end
    
    -- Check entropy after operations
    local current_entropy = get_metric("entropy")
    if current_entropy < 0.5 then
      log("Target entropy reached!")
      break
    end
  end
  
  local final_entropy = get_metric("entropy")
  log("Final entropy: " .. tostring(final_entropy))
  log("Operations applied: " .. ops_applied)
end

execute()
`;

export const TEST_PYTHON_STRATEGY = `# AI-based Pattern Detection Strategy
# Uses numpy for pattern analysis

import numpy as np
from bitwise_api import apply_operation, get_metric, get_cost, log, halt

def analyze_patterns(bits_array):
    """Analyze bit patterns using sliding window"""
    window_size = 8
    patterns = {}
    
    for i in range(len(bits_array) - window_size):
        pattern = tuple(bits_array[i:i+window_size])
        patterns[pattern] = patterns.get(pattern, 0) + 1
    
    return patterns

def execute():
    log("Starting AI pattern detection strategy")
    
    # Get current metrics
    entropy = get_metric("entropy")
    hamming = get_metric("hamming_weight")
    log(f"Initial: entropy={entropy:.4f}, hamming={hamming}")
    
    # Convert bits to numpy array for analysis
    bits_str = bits  # Global variable from context
    bits_array = np.array([int(b) for b in bits_str])
    
    # Analyze patterns
    patterns = analyze_patterns(bits_array)
    unique_patterns = len(patterns)
    log(f"Unique 8-bit patterns: {unique_patterns}")
    
    # Apply operations based on analysis
    ops_count = 0
    
    if entropy > 0.9:
        # High entropy - apply XOR to reduce randomness
        if get_cost("XOR") <= budget:
            apply_operation("XOR", {"mask": "11110000"})
            ops_count += 1
            log("Applied XOR to reduce entropy")
    
    if hamming > len(bits_str) * 0.6:
        # Too many 1s - shift right
        if get_cost("SHR") <= budget:
            apply_operation("SHR", {"count": 1})
            ops_count += 1
            log("Applied SHR to reduce 1-count")
    
    # Apply rotation for pattern mixing
    for _ in range(3):
        cost = get_cost("ROL")
        if cost <= budget:
            apply_operation("ROL", {"count": 2})
            ops_count += 1
    
    final_entropy = get_metric("entropy")
    log(f"Final entropy: {final_entropy:.4f}")
    log(f"Total operations: {ops_count}")

execute()
`;

export const TEST_SCORING_LUA = `-- Scoring Configuration
-- Defines operation costs and economy rules

costs = {
  -- Logic gates (cheap)
  NOT = 2,
  AND = 3,
  OR = 3,
  XOR = 4,
  NAND = 5,
  NOR = 5,
  XNOR = 6,
  
  -- Shifts (medium)
  SHL = 5,
  SHR = 5,
  ROL = 6,
  ROR = 6,
  
  -- Manipulation (expensive)
  INSERT = 10,
  DELETE = 10,
  MOVE = 15,
  
  -- Encoding (variable)
  GRAY = 8,
  ENDIAN = 7,
  
  -- Arithmetic (most expensive)
  ADD = 12,
  SUB = 12,
  PAD = 4,
}

-- Initial budget for new executions
initial_budget = 1000

-- Combo discounts (consecutive operations)
combos = {
  {"NOT", "NOT", 0},  -- Double NOT is free (cancels out)
  {"XOR", "XOR", 0},  -- Double XOR cancels
  {"SHL", "SHR", 3},  -- Discount for shift pairs
  {"ROL", "ROR", 4},  -- Discount for rotation pairs
}

-- Get cost for an operation
function get_operation_cost(op_name)
  return costs[op_name] or 10  -- Default cost
end

-- Check if combo applies
function check_combo(prev_op, current_op)
  for _, combo in ipairs(combos) do
    if combo[1] == prev_op and combo[2] == current_op then
      return combo[3]
    end
  end
  return nil
end
`;

export const TEST_POLICY_LUA = `-- Policy Configuration
-- Defines rules and constraints for operations

-- Allowed operations (whitelist)
allowed_operations = {
  "NOT", "AND", "OR", "XOR",
  "NAND", "NOR", "XNOR",
  "SHL", "SHR", "ROL", "ROR",
  "PAD", "GRAY", "ENDIAN"
}

-- Blocked operations (never allowed)
blocked_operations = {
  "DELETE"  -- Prevent data loss
}

-- Maximum operations per execution
max_operations = 100

-- Maximum budget spend per step
max_cost_per_step = 50

-- Constraints
constraints = {
  min_file_size = 8,        -- Minimum bits required
  max_file_size = 1000000,  -- Maximum bits allowed
  preserve_length = false,  -- Whether operations must preserve bit count
}

-- Check if operation is allowed
function is_allowed(op_name)
  -- Check blocklist first
  for _, blocked in ipairs(blocked_operations) do
    if blocked == op_name then
      return false, "Operation is blocked by policy"
    end
  end
  
  -- Check allowlist
  for _, allowed in ipairs(allowed_operations) do
    if allowed == op_name then
      return true
    end
  end
  
  return false, "Operation not in allowed list"
end

-- Validate parameters
function validate_params(op_name, params)
  if op_name == "SHL" or op_name == "SHR" then
    local count = params.count or 1
    if count > 32 then
      return false, "Shift count cannot exceed 32"
    end
  end
  return true
end
`;

export const TEST_PRESET_JSON = {
  name: "Standard Analysis Preset",
  description: "A balanced preset for general binary analysis",
  strategy: "entropy_reduction.lua",
  scoring: "standard_costs.lua", 
  policies: ["safety_policy.lua"],
  metrics: {
    enabled: ["entropy", "hamming_weight", "transition_count", "compression_ratio"],
    disabled: ["ideality"]
  },
  operations: {
    enabled: ["NOT", "AND", "OR", "XOR", "SHL", "SHR", "ROL", "ROR"],
    disabled: ["DELETE", "MOVE"]
  },
  config: {
    initialBudget: 1000,
    maxOperations: 100,
    autoSave: true
  }
};

/**
 * Load test files into the algorithm manager
 */
export function loadTestStrategies(algorithmManager: any): void {
  // Check if test files already exist
  const strategies = algorithmManager.getStrategies();
  if (strategies.some((s: any) => s.name === 'test_entropy.lua')) {
    return; // Already loaded
  }

  // Add test Lua strategy
  algorithmManager.addFile('test_entropy.lua', TEST_LUA_STRATEGY, 'strategy');
  
  // Add test scoring
  algorithmManager.addFile('test_scoring.lua', TEST_SCORING_LUA, 'scoring');
  
  // Add test policy
  algorithmManager.addFile('test_policy.lua', TEST_POLICY_LUA, 'policies');
  
  // Add test preset
  algorithmManager.addFile('test_preset.json', JSON.stringify(TEST_PRESET_JSON, null, 2), 'preset');
}
