/**
 * Complete Working Example Algorithm Files
 * Scheduler, Algorithm, Scoring, Policy - all work together
 */

// ===== SCHEDULER =====
export const EXAMPLE_SCHEDULER = `"""
Master Scheduler - Orchestrates execution pipeline
Divides data into segments, tracks iterations, manages workflow
"""

from bitwise_api import get_bits, log, get_all_metrics

def schedule():
    """
    Generate execution batches for the algorithm.
    Returns list of segments to process.
    """
    bits = get_bits()
    total_length = len(bits)
    
    log("=" * 50)
    log("SCHEDULER: Starting execution planning")
    log(f"Total data size: {total_length} bits")
    
    # Get initial metrics
    metrics = get_all_metrics()
    log(f"Initial entropy: {metrics.get('entropy', 0):.4f}")
    
    # Calculate optimal segment size
    if total_length < 64:
        segment_size = total_length
        segments = 1
    elif total_length < 256:
        segment_size = 32
        segments = (total_length + segment_size - 1) // segment_size
    else:
        segment_size = 64
        segments = min(8, (total_length + segment_size - 1) // segment_size)
    
    log(f"Segment size: {segment_size}")
    log(f"Number of segments: {segments}")
    
    # Create batch list
    batches = []
    for i in range(segments):
        start = i * segment_size
        end = min(start + segment_size, total_length)
        batches.append({
            "segment_id": i,
            "start": start,
            "end": end,
            "priority": segments - i,  # Earlier segments have higher priority
            "max_iterations": 3
        })
    
    log(f"Scheduled {len(batches)} batches for processing")
    log("=" * 50)
    
    return batches

# Execute scheduler
result = schedule()
log(f"Scheduler complete. Batches: {len(result)}")
`;

// ===== ALGORITHM =====
export const EXAMPLE_ALGORITHM = `"""
Entropy Reduction Algorithm
Applies operations to minimize entropy within segments
Tracks all transformations for analysis
"""

from bitwise_api import (
    get_bits, set_bits, apply_operation, apply_operation_range,
    get_metric, get_all_metrics, get_available_operations,
    deduct_budget, get_budget, log
)

def analyze_segment(start, end):
    """Analyze a segment of the binary data"""
    bits = get_bits()
    segment = bits[start:end]
    
    ones = segment.count('1')
    zeros = segment.count('0')
    balance = ones / len(segment) if len(segment) > 0 else 0.5
    
    return {
        "length": len(segment),
        "ones": ones,
        "zeros": zeros,
        "balance": balance,
        "entropy": get_metric("entropy", segment)
    }

def find_best_operation(start, end):
    """Find the operation that best reduces entropy"""
    bits = get_bits()
    segment = bits[start:end]
    current_entropy = get_metric("entropy", segment)
    
    best_op = None
    best_improvement = 0
    
    # Test each operation
    ops = get_available_operations()
    test_ops = ['XOR', 'NOT', 'AND', 'OR', 'left_shift', 'right_shift', 'reverse']
    
    for op in test_ops:
        if op not in ops:
            continue
            
        if not deduct_budget(1):
            log("Budget exhausted during operation search")
            break
        
        try:
            # Test operation
            result = apply_operation(op, segment)
            new_entropy = get_metric("entropy", result)
            improvement = current_entropy - new_entropy
            
            if improvement > best_improvement:
                best_improvement = improvement
                best_op = op
        except Exception as e:
            log(f"Operation {op} failed: {e}")
    
    return best_op, best_improvement

def optimize_segment(start, end, max_iters=3):
    """Apply optimizations to a segment"""
    log(f"\\nOptimizing segment [{start}:{end}]")
    
    analysis = analyze_segment(start, end)
    log(f"  Initial: entropy={analysis['entropy']:.4f}, balance={analysis['balance']:.2f}")
    
    iterations = 0
    total_improvement = 0
    
    while iterations < max_iters and get_budget() > 5:
        best_op, improvement = find_best_operation(start, end)
        
        if best_op and improvement > 0.001:
            log(f"  Iteration {iterations + 1}: Applying {best_op} (improvement: {improvement:.4f})")
            apply_operation_range(best_op, start, end)
            total_improvement += improvement
            iterations += 1
        else:
            log(f"  No further improvement possible")
            break
    
    final_analysis = analyze_segment(start, end)
    log(f"  Final: entropy={final_analysis['entropy']:.4f}, balance={final_analysis['balance']:.2f}")
    log(f"  Total improvement: {total_improvement:.4f}")
    
    return {
        "iterations": iterations,
        "improvement": total_improvement,
        "final_entropy": final_analysis['entropy']
    }

def execute():
    """Main algorithm execution"""
    log("=" * 50)
    log("ALGORITHM: Starting entropy reduction")
    
    bits = get_bits()
    initial_entropy = get_metric("entropy")
    initial_budget = get_budget()
    
    log(f"Data size: {len(bits)} bits")
    log(f"Initial entropy: {initial_entropy:.4f}")
    log(f"Available budget: {initial_budget}")
    
    # Divide into segments
    segment_size = max(8, len(bits) // 4)
    segments = []
    
    for i in range(0, len(bits), segment_size):
        end = min(i + segment_size, len(bits))
        result = optimize_segment(i, end)
        segments.append(result)
    
    # Final analysis
    final_bits = get_bits()
    final_entropy = get_metric("entropy")
    bits_changed = sum(1 for a, b in zip(bits, final_bits) if a != b)
    
    log("")
    log("=" * 50)
    log("ALGORITHM: Execution complete")
    log(f"Final entropy: {final_entropy:.4f}")
    log(f"Entropy reduction: {initial_entropy - final_entropy:.4f}")
    log(f"Bits changed: {bits_changed}")
    log(f"Budget used: {initial_budget - get_budget()}")
    log("=" * 50)
    
    return {
        "initial_entropy": initial_entropy,
        "final_entropy": final_entropy,
        "reduction": initial_entropy - final_entropy,
        "bits_changed": bits_changed,
        "segments_processed": len(segments)
    }

# Run algorithm
result = execute()
`;

// ===== SCORING =====
export const EXAMPLE_SCORING = `"""
Performance Scoring System
Evaluates algorithm performance based on multiple metrics
Applies budget economy and efficiency bonuses
"""

from bitwise_api import (
    get_bits, get_metric, get_all_metrics,
    get_budget, log
)

# Scoring weights
WEIGHTS = {
    "entropy_reduction": 40,
    "compression_potential": 25,
    "bit_balance": 15,
    "budget_efficiency": 20
}

# Budget economy bonuses
BUDGET_THRESHOLDS = [
    (0.9, 1.5),   # 90%+ remaining = 1.5x bonus
    (0.7, 1.3),   # 70%+ remaining = 1.3x bonus
    (0.5, 1.1),   # 50%+ remaining = 1.1x bonus
    (0.3, 1.0),   # 30%+ remaining = no penalty
    (0.0, 0.8),   # <30% remaining = 0.8x penalty
]

def calculate_entropy_score(metrics):
    """Score based on entropy (lower is better)"""
    entropy = metrics.get('entropy', 1.0)
    # Convert entropy to score (0-100)
    score = (1.0 - entropy) * 100
    return max(0, min(100, score))

def calculate_compression_score(metrics):
    """Score based on compression potential"""
    bits = get_bits()
    unique_patterns = len(set(bits[i:i+8] for i in range(0, len(bits)-7, 8)))
    max_patterns = min(256, len(bits) // 8)
    
    if max_patterns == 0:
        return 50
    
    # Fewer unique patterns = better compression
    ratio = unique_patterns / max_patterns
    score = (1.0 - ratio) * 100
    return max(0, min(100, score))

def calculate_balance_score(metrics):
    """Score based on bit balance (50/50 is neutral)"""
    bits = get_bits()
    if len(bits) == 0:
        return 50
    
    ones_ratio = bits.count('1') / len(bits)
    # Score how far from 0.5 (either direction can be good)
    deviation = abs(ones_ratio - 0.5)
    
    # Lower deviation from extreme = higher score
    score = deviation * 200  # 0-100 scale
    return max(0, min(100, score))

def calculate_budget_score(initial_budget=1000):
    """Score based on budget efficiency"""
    remaining = get_budget()
    ratio = remaining / initial_budget if initial_budget > 0 else 0
    
    # Find applicable bonus
    multiplier = 1.0
    for threshold, bonus in BUDGET_THRESHOLDS:
        if ratio >= threshold:
            multiplier = bonus
            break
    
    # Base score from remaining budget
    base_score = ratio * 100
    return base_score * multiplier

def calculate_total_score():
    """Calculate weighted total score"""
    metrics = get_all_metrics()
    
    scores = {
        "entropy_reduction": calculate_entropy_score(metrics),
        "compression_potential": calculate_compression_score(metrics),
        "bit_balance": calculate_balance_score(metrics),
        "budget_efficiency": calculate_budget_score()
    }
    
    # Apply weights
    weighted_total = sum(
        scores[key] * (WEIGHTS[key] / 100)
        for key in scores
    )
    
    return scores, weighted_total

def execute():
    """Main scoring execution"""
    log("=" * 50)
    log("SCORING: Evaluating performance")
    
    scores, total = calculate_total_score()
    
    log("")
    log("Component Scores:")
    for key, score in scores.items():
        weight = WEIGHTS[key]
        weighted = score * (weight / 100)
        log(f"  {key}: {score:.2f} (weight: {weight}%, contribution: {weighted:.2f})")
    
    log("")
    log(f"TOTAL SCORE: {total:.2f}")
    
    # Grade
    if total >= 90:
        grade = "A+"
    elif total >= 80:
        grade = "A"
    elif total >= 70:
        grade = "B"
    elif total >= 60:
        grade = "C"
    elif total >= 50:
        grade = "D"
    else:
        grade = "F"
    
    log(f"GRADE: {grade}")
    log("=" * 50)
    
    return {
        "scores": scores,
        "total": total,
        "grade": grade
    }

# Run scoring
result = execute()
log(f"Score: {result['total']:.2f}")
`;

// ===== POLICY =====
export const EXAMPLE_POLICY = `"""
Execution Policy Validator
Enforces constraints and validates algorithm behavior
Checks for violations and safety limits
"""

from bitwise_api import (
    get_bits, get_metric, get_all_metrics,
    get_budget, log
)

# Policy Configuration
POLICY_CONFIG = {
    # Size constraints
    "max_size_multiplier": 2.0,    # Final size can't exceed 2x initial
    "min_size_multiplier": 0.1,    # Final size can't go below 10% of initial
    
    # Entropy constraints
    "max_entropy": 0.999,          # Entropy shouldn't hit maximum
    "max_entropy_increase": 0.3,   # Entropy shouldn't increase too much
    
    # Budget constraints
    "min_budget_remaining": 0.05,  # At least 5% budget should remain
    
    # Data integrity
    "require_valid_binary": True,  # Must be valid 0/1 string
    "min_length": 8,               # Minimum 8 bits
    
    # Balance constraints
    "max_imbalance": 0.95,         # Can't be more than 95% ones or zeros
}

def check_size_policy(bits, initial_size):
    """Check size constraints"""
    current_size = len(bits)
    ratio = current_size / initial_size if initial_size > 0 else 1.0
    
    if ratio > POLICY_CONFIG["max_size_multiplier"]:
        return False, f"Size exceeded: {ratio:.2f}x (max: {POLICY_CONFIG['max_size_multiplier']}x)"
    
    if ratio < POLICY_CONFIG["min_size_multiplier"]:
        return False, f"Size too small: {ratio:.2f}x (min: {POLICY_CONFIG['min_size_multiplier']}x)"
    
    return True, "Size OK"

def check_entropy_policy(metrics, initial_entropy):
    """Check entropy constraints"""
    entropy = metrics.get('entropy', 0)
    
    if entropy > POLICY_CONFIG["max_entropy"]:
        return False, f"Maximum entropy reached: {entropy:.4f}"
    
    increase = entropy - initial_entropy
    if increase > POLICY_CONFIG["max_entropy_increase"]:
        return False, f"Entropy increased too much: +{increase:.4f}"
    
    return True, f"Entropy OK ({entropy:.4f})"

def check_budget_policy(initial_budget):
    """Check budget constraints"""
    remaining = get_budget()
    ratio = remaining / initial_budget if initial_budget > 0 else 0
    
    if ratio < POLICY_CONFIG["min_budget_remaining"]:
        return False, f"Budget nearly exhausted: {ratio*100:.1f}% remaining"
    
    return True, f"Budget OK ({ratio*100:.1f}% remaining)"

def check_data_integrity():
    """Check data integrity"""
    bits = get_bits()
    
    if len(bits) < POLICY_CONFIG["min_length"]:
        return False, f"Data too short: {len(bits)} bits (min: {POLICY_CONFIG['min_length']})"
    
    if POLICY_CONFIG["require_valid_binary"]:
        if not all(b in '01' for b in bits):
            return False, "Invalid binary data (contains non-0/1 characters)"
    
    # Check balance
    if len(bits) > 0:
        ones_ratio = bits.count('1') / len(bits)
        if ones_ratio > POLICY_CONFIG["max_imbalance"] or ones_ratio < (1 - POLICY_CONFIG["max_imbalance"]):
            return False, f"Extreme imbalance: {ones_ratio*100:.1f}% ones"
    
    return True, "Data integrity OK"

def validate_all(initial_size=None, initial_entropy=None, initial_budget=1000):
    """Run all policy checks"""
    bits = get_bits()
    metrics = get_all_metrics()
    
    if initial_size is None:
        initial_size = len(bits)
    if initial_entropy is None:
        initial_entropy = metrics.get('entropy', 0.5)
    
    checks = [
        ("Size", check_size_policy(bits, initial_size)),
        ("Entropy", check_entropy_policy(metrics, initial_entropy)),
        ("Budget", check_budget_policy(initial_budget)),
        ("Integrity", check_data_integrity()),
    ]
    
    all_passed = True
    results = []
    
    for name, (passed, message) in checks:
        results.append({
            "check": name,
            "passed": passed,
            "message": message
        })
        if not passed:
            all_passed = False
    
    return all_passed, results

def execute():
    """Main policy validation"""
    log("=" * 50)
    log("POLICY: Validating execution")
    
    all_passed, results = validate_all()
    
    log("")
    log("Policy Checks:")
    for r in results:
        status = "✓ PASS" if r["passed"] else "✗ FAIL"
        log(f"  [{status}] {r['check']}: {r['message']}")
    
    log("")
    if all_passed:
        log("POLICY RESULT: ALL CHECKS PASSED")
    else:
        log("POLICY RESULT: VIOLATIONS DETECTED")
        violations = [r for r in results if not r["passed"]]
        log(f"Violations: {len(violations)}")
    
    log("=" * 50)
    
    return {
        "passed": all_passed,
        "checks": results,
        "violations": len([r for r in results if not r["passed"]])
    }

# Run policy check
result = execute()
log(f"Policy passed: {result['passed']}")
`;

/**
 * Load all example files into pythonModuleSystem
 */
export function loadExampleAlgorithmFiles(pythonModuleSystem: any): void {
  // Check if already loaded
  const existingFiles = pythonModuleSystem.getAllFiles();
  const hasScheduler = existingFiles.some((f: any) => f.name === 'MasterScheduler.py');
  
  if (hasScheduler) {
    console.log('Example algorithm files already loaded');
    return;
  }

  // Add all files
  pythonModuleSystem.addFile('MasterScheduler.py', EXAMPLE_SCHEDULER, 'scheduler');
  pythonModuleSystem.addFile('EntropyReduction.py', EXAMPLE_ALGORITHM, 'algorithm');
  pythonModuleSystem.addFile('PerformanceScoring.py', EXAMPLE_SCORING, 'scoring');
  pythonModuleSystem.addFile('ExecutionPolicy.py', EXAMPLE_POLICY, 'policies');

  // Create strategy
  try {
    pythonModuleSystem.createStrategy(
      'Complete Analysis Pipeline',
      'MasterScheduler.py',
      ['EntropyReduction.py'],
      ['PerformanceScoring.py'],
      ['ExecutionPolicy.py']
    );
    console.log('Example strategy created');
  } catch (e) {
    console.log('Strategy may already exist');
  }
}
