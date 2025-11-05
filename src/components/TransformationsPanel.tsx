import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Textarea } from './ui/textarea';
import { 
  FlipHorizontal, 
  Shuffle, 
  Replace, 
  Move,
  Delete,
  Eye,
  ArrowLeftRight,
  CircleDot,
  Binary,
  GitBranch,
  Plus,
  Minus,
  Terminal
} from 'lucide-react';
import { LogicGates, ShiftOperations, BitManipulation, BitPacking, AdvancedBitOperations, ArithmeticOperations } from '@/lib/binaryOperations';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { BitRange } from '@/lib/fileState';

interface TransformationsPanelProps {
  bits: string;
  selectedRanges: BitRange[];
  onTransform: (newBits: string, description: string) => void;
}

export const TransformationsPanel = ({ bits, selectedRanges, onTransform }: TransformationsPanelProps) => {
  const [findPattern, setFindPattern] = useState('');
  const [replacePattern, setReplacePattern] = useState('');
  const [shiftAmount, setShiftAmount] = useState('1');
  const [maskPattern, setMaskPattern] = useState('');
  const [insertPosition, setInsertPosition] = useState('');
  const [insertBits, setInsertBits] = useState('');
  const [moveDestination, setMoveDestination] = useState('');
  const [peekStart, setPeekStart] = useState('');
  const [peekLength, setPeekLength] = useState('');
  const [peekResult, setPeekResult] = useState('');
  const [padLength, setPadLength] = useState('');
  const [logicOperandB, setLogicOperandB] = useState('');
  const [operand, setOperand] = useState('10');
  const [commandInput, setCommandInput] = useState('');
  const [commandResult, setCommandResult] = useState('');

  const hasData = bits && bits.length > 0;
  const hasSelection = selectedRanges.length > 0;

  // Apply transformation to selected ranges or entire bitstring
  const applyTransformation = (transformFn: (input: string) => string, description: string) => {
    if (!hasSelection) {
      // No selection - apply to entire bitstring
      const result = transformFn(bits);
      onTransform(result, description);
      return;
    }

    // Apply to each selected range
    let result = bits;
    let offset = 0;

    // Sort ranges by start position
    const sortedRanges = [...selectedRanges].sort((a, b) => a.start - b.start);

    sortedRanges.forEach((range) => {
      const adjustedStart = range.start + offset;
      const adjustedEnd = range.end + offset;
      
      const before = result.substring(0, adjustedStart);
      const selected = result.substring(adjustedStart, adjustedEnd + 1);
      const after = result.substring(adjustedEnd + 1);
      
      const transformed = transformFn(selected);
      result = before + transformed + after;
      
      // Update offset for next iteration
      offset += transformed.length - selected.length;
    });

    const rangeDesc = sortedRanges.length === 1 
      ? `range ${sortedRanges[0].start}-${sortedRanges[0].end}`
      : `${sortedRanges.length} ranges`;
    onTransform(result, `${description} (${rangeDesc})`);
  };

  // ============= LOGIC GATES =============
  const handleLogicGate = (operation: keyof typeof LogicGates) => {
    // NOT gate doesn't need operand B
    if (operation !== 'NOT' && (!logicOperandB || !/^[01]+$/.test(logicOperandB))) return;
    
    applyTransformation((input) => {
      if (operation === 'NOT') {
        return LogicGates.NOT(input);
      } else {
        return LogicGates[operation](input, logicOperandB);
      }
    }, `Applied ${operation} gate`);
  };

  // ============= SHIFT & ROTATE =============
  const handleShift = (type: 'logicalLeft' | 'logicalRight' | 'arithmeticLeft' | 'arithmeticRight' | 'rotateLeft' | 'rotateRight') => {
    const amount = parseInt(shiftAmount) || 1;
    if (amount < 1) return;
    
    let desc: string;
    let transformFn: (input: string) => string;
    
    switch (type) {
      case 'logicalLeft':
        transformFn = (input) => ShiftOperations.logicalShiftLeft(input, amount);
        desc = `Logical shift left by ${amount}`;
        break;
      case 'logicalRight':
        transformFn = (input) => ShiftOperations.logicalShiftRight(input, amount);
        desc = `Logical shift right by ${amount}`;
        break;
      case 'arithmeticLeft':
        transformFn = (input) => ShiftOperations.arithmeticShiftLeft(input, amount);
        desc = `Arithmetic shift left by ${amount}`;
        break;
      case 'arithmeticRight':
        transformFn = (input) => ShiftOperations.arithmeticShiftRight(input, amount);
        desc = `Arithmetic shift right by ${amount}`;
        break;
      case 'rotateLeft':
        transformFn = (input) => ShiftOperations.rotateLeft(input, amount);
        desc = `Rotated left by ${amount}`;
        break;
      case 'rotateRight':
        transformFn = (input) => ShiftOperations.rotateRight(input, amount);
        desc = `Rotated right by ${amount}`;
        break;
      default:
        return;
    }
    
    applyTransformation(transformFn, desc);
  };

  // ============= BIT MANIPULATION =============
  // Bit manipulation operations don't use applyTransformation as they work on absolute positions
  const handleDelete = () => {
    if (!hasSelection) return;
    
    let result = bits;
    let offset = 0;
    
    // Sort ranges by start position and delete from left to right
    const sortedRanges = [...selectedRanges].sort((a, b) => a.start - b.start);
    
    sortedRanges.forEach((range) => {
      const adjustedStart = range.start - offset;
      const adjustedEnd = range.end - offset;
      result = BitManipulation.deleteBits(result, adjustedStart, adjustedEnd + 1);
      offset += (range.end - range.start + 1);
    });
    
    const rangeDesc = sortedRanges.length === 1 
      ? `${sortedRanges[0].start}-${sortedRanges[0].end}`
      : `${sortedRanges.length} ranges`;
    onTransform(result, `Deleted bits ${rangeDesc}`);
  };

  const handleInsert = () => {
    const pos = parseInt(insertPosition);
    if (isNaN(pos) || pos < 0 || pos > bits.length) return;
    if (!insertBits || !/^[01]+$/.test(insertBits)) return;
    
    const result = BitManipulation.insertBits(bits, pos, insertBits);
    onTransform(result, `Inserted ${insertBits.length} bits at position ${pos}`);
  };

  const handleMove = () => {
    if (!hasSelection || selectedRanges.length !== 1) return;
    const dest = parseInt(moveDestination);
    if (isNaN(dest) || dest < 0) return;
    
    const range = selectedRanges[0];
    const result = BitManipulation.moveBits(bits, range.start, range.end + 1, dest);
    onTransform(result, `Moved bits ${range.start}-${range.end} to position ${dest}`);
  };

  const handlePeek = () => {
    const start = parseInt(peekStart);
    const length = parseInt(peekLength);
    if (isNaN(start) || isNaN(length) || start < 0 || length < 1) return;
    
    const result = BitManipulation.peekBits(bits, start, length);
    setPeekResult(result);
  };

  const handleMask = (operation: 'AND' | 'OR' | 'XOR') => {
    if (!maskPattern || !/^[01]+$/.test(maskPattern)) return;
    
    applyTransformation((input) => BitManipulation.applyMask(input, maskPattern, operation), `Applied ${operation} mask`);
  };

  const handleReverse = () => {
    applyTransformation((input) => AdvancedBitOperations.reverseBits(input), 'Reversed bits');
  };

  const handleFindReplace = () => {
    if (!findPattern || !/^[01]+$/.test(findPattern)) return;
    if (!replacePattern || !/^[01]+$/.test(replacePattern)) return;

    const replaced = bits.split(findPattern).join(replacePattern);
    const count = (bits.match(new RegExp(findPattern, 'g')) || []).length;
    onTransform(replaced, `Replaced ${count} occurrence(s) of "${findPattern}"`);
  };

  // ============= BIT PACKING & ALIGNMENT =============
  const handlePadding = (direction: 'left' | 'right', padWith: '0' | '1') => {
    const length = parseInt(padLength);
    if (isNaN(length) || length <= bits.length) return;
    
    const result = direction === 'left' 
      ? BitPacking.padLeft(bits, length, padWith)
      : BitPacking.padRight(bits, length, padWith);
    
    onTransform(result, `Padded ${direction} to ${length} bits with ${padWith}`);
  };

  const handleAlign = (type: 'byte' | 'nibble') => {
    const result = type === 'byte' 
      ? BitPacking.alignToBytes(bits)
      : BitPacking.alignToNibbles(bits);
    
    const padded = result.length - bits.length;
    if (padded === 0) return;
    
    onTransform(result, `Aligned to ${type} boundary (+${padded} bits)`);
  };

  // ============= ARITHMETIC OPERATIONS =============
  const handleArithmetic = (operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'power') => {
    const op = operand.match(/^[01]+$/) ? operand : ArithmeticOperations.fromDecimal(parseInt(operand) || 0);
    
    applyTransformation((input) => {
      switch (operation) {
        case 'add':
          return ArithmeticOperations.add(input, op);
        case 'subtract':
          return ArithmeticOperations.subtract(input, op);
        case 'multiply':
          return ArithmeticOperations.multiply(input, op);
        case 'divide':
          return ArithmeticOperations.divide(input, op).quotient;
        case 'modulo':
          return ArithmeticOperations.modulo(input, op);
        case 'power':
          return ArithmeticOperations.power(input, op);
        default:
          return input;
      }
    }, `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${operand}`);
  };

  // ============= ADVANCED OPERATIONS =============
  const handleGrayCode = (direction: 'toGray' | 'fromGray') => {
    const transformFn = direction === 'toGray'
      ? (input: string) => AdvancedBitOperations.binaryToGray(input)
      : (input: string) => AdvancedBitOperations.grayToBinary(input);
    
    applyTransformation(transformFn, `Converted ${direction === 'toGray' ? 'to' : 'from'} Gray code`);
  };

  const handleSwapEndianness = () => {
    applyTransformation((input) => AdvancedBitOperations.swapEndianness(input), 'Swapped endianness');
  };

  // ============= COMMAND PARSER =============
  const parseCommand = (cmd: string): boolean => {
    const trimmed = cmd.trim().toUpperCase();
    const parts = trimmed.split(/\s+/);
    
    if (parts.length === 0) return false;
    
    try {
      const command = parts[0];
      
      // Logic Gates
      if (['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'].includes(command)) {
        if (parts.length < 2) throw new Error(`${command} requires operand`);
        const operandB = parts[1];
        if (!/^[01]+$/.test(operandB)) throw new Error('Operand must be binary');
        applyTransformation((input) => LogicGates[command as keyof typeof LogicGates](input, operandB), `Applied ${command} gate`);
        return true;
      }
      
      if (command === 'NOT') {
        applyTransformation((input) => LogicGates.NOT(input), 'Applied NOT gate');
        return true;
      }
      
      // Shifts & Rotations
      if (['SHL', 'SHR', 'SAL', 'SAR', 'ROL', 'ROR'].includes(command)) {
        const amount = parseInt(parts[1] || '1');
        if (isNaN(amount) || amount < 1) throw new Error('Invalid shift amount');
        
        const shiftMap: Record<string, any> = {
          'SHL': 'logicalLeft',
          'SHR': 'logicalRight',
          'SAL': 'arithmeticLeft',
          'SAR': 'arithmeticRight',
          'ROL': 'rotateLeft',
          'ROR': 'rotateRight'
        };
        handleShift(shiftMap[command]);
        return true;
      }
      
      // Bit Manipulation
      if (command === 'DELETE') {
        if (!hasSelection) throw new Error('DELETE requires selection');
        handleDelete();
        return true;
      }
      
      if (command === 'INSERT') {
        if (parts.length < 3) throw new Error('INSERT requires position and bits');
        const pos = parseInt(parts[1]);
        const insertBits = parts[2];
        if (isNaN(pos) || !/^[01]+$/.test(insertBits)) throw new Error('Invalid INSERT parameters');
        const result = BitManipulation.insertBits(bits, pos, insertBits);
        onTransform(result, `Inserted ${insertBits.length} bits at position ${pos}`);
        return true;
      }
      
      if (command === 'MOVE') {
        if (!hasSelection || selectedRanges.length !== 1) throw new Error('MOVE requires single selection');
        const dest = parseInt(parts[1]);
        if (isNaN(dest)) throw new Error('Invalid destination');
        const range = selectedRanges[0];
        const result = BitManipulation.moveBits(bits, range.start, range.end + 1, dest);
        onTransform(result, `Moved bits ${range.start}-${range.end} to position ${dest}`);
        return true;
      }
      
      if (command === 'PEEK') {
        if (parts.length < 3) throw new Error('PEEK requires start and length');
        const start = parseInt(parts[1]);
        const length = parseInt(parts[2]);
        const result = BitManipulation.peekBits(bits, start, length);
        setCommandResult(`Peek result: ${result}`);
        return true;
      }
      
      if (command === 'MASK') {
        if (parts.length < 3) throw new Error('MASK requires operation (AND/OR/XOR) and pattern');
        const op = parts[1] as 'AND' | 'OR' | 'XOR';
        const pattern = parts[2];
        if (!['AND', 'OR', 'XOR'].includes(op)) throw new Error('Invalid mask operation');
        if (!/^[01]+$/.test(pattern)) throw new Error('Pattern must be binary');
        applyTransformation((input) => BitManipulation.applyMask(input, pattern, op), `Applied ${op} mask`);
        return true;
      }
      
      if (command === 'REVERSE') {
        handleReverse();
        return true;
      }
      
      // Packing & Alignment
      if (command === 'PAD') {
        if (parts.length < 4) throw new Error('PAD requires direction, length, and value');
        const direction = parts[1].toLowerCase() as 'left' | 'right';
        const length = parseInt(parts[2]);
        const padWith = parts[3] as '0' | '1';
        if (!['left', 'right'].includes(direction)) throw new Error('Direction must be LEFT or RIGHT');
        if (isNaN(length)) throw new Error('Invalid length');
        if (!['0', '1'].includes(padWith)) throw new Error('Pad value must be 0 or 1');
        handlePadding(direction, padWith);
        return true;
      }
      
      if (command === 'ALIGN') {
        if (parts.length < 2) throw new Error('ALIGN requires type (BYTE/NIBBLE)');
        const type = parts[1].toLowerCase() as 'byte' | 'nibble';
        if (!['byte', 'nibble'].includes(type)) throw new Error('Type must be BYTE or NIBBLE');
        handleAlign(type);
        return true;
      }
      
      // Arithmetic
      if (['ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW'].includes(command)) {
        if (parts.length < 2) throw new Error(`${command} requires operand`);
        const operandValue = parts[1];
        const op = operandValue.match(/^[01]+$/) ? operandValue : ArithmeticOperations.fromDecimal(parseInt(operandValue) || 0);
        
        const opMap: Record<string, any> = {
          'ADD': 'add',
          'SUB': 'subtract',
          'MUL': 'multiply',
          'DIV': 'divide',
          'MOD': 'modulo',
          'POW': 'power'
        };
        handleArithmetic(opMap[command]);
        return true;
      }
      
      // Advanced
      if (command === 'GRAY') {
        if (parts.length < 2) throw new Error('GRAY requires TO or FROM');
        const direction = parts[1];
        if (direction === 'TO') {
          handleGrayCode('toGray');
        } else if (direction === 'FROM') {
          handleGrayCode('fromGray');
        } else {
          throw new Error('GRAY requires TO or FROM');
        }
        return true;
      }
      
      if (command === 'ENDIAN') {
        handleSwapEndianness();
        return true;
      }
      
      // Find & Replace
      if (command === 'REPLACE') {
        if (parts.length < 3) throw new Error('REPLACE requires find and replace patterns');
        const find = parts[1];
        const replace = parts[2];
        if (!/^[01]+$/.test(find) || !/^[01]+$/.test(replace)) throw new Error('Patterns must be binary');
        const replaced = bits.split(find).join(replace);
        const count = (bits.match(new RegExp(find, 'g')) || []).length;
        onTransform(replaced, `Replaced ${count} occurrence(s) of "${find}"`);
        return true;
      }
      
      throw new Error(`Unknown command: ${command}`);
    } catch (error: any) {
      setCommandResult(`Error: ${error.message}`);
      return false;
    }
  };

  const handleExecuteCommand = () => {
    if (!commandInput.trim()) return;
    setCommandResult('');
    const success = parseCommand(commandInput);
    if (success) {
      setCommandInput('');
    }
  };

  const popCount = hasData ? AdvancedBitOperations.populationCount(bits) : 0;
  const transitionCount = hasData ? AdvancedBitOperations.countTransitions(bits) : 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Transformations</h3>
          {hasData && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                <CircleDot className="w-3 h-3 mr-1" />
                {popCount} ones
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <GitBranch className="w-3 h-3 mr-1" />
                {transitionCount} transitions
              </Badge>
            </div>
          )}
        </div>

        {!hasData && (
          <Card className="p-4 bg-secondary/20 border-border">
            <p className="text-sm text-muted-foreground text-center">
              No binary data available. Please generate or load a file first.
            </p>
          </Card>
        )}

        {hasData && (
          <Accordion type="multiple" defaultValue={['command']} className="space-y-2">
            {/* COMMAND INTERFACE */}
            <AccordionItem value="command" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Command Interface
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="command" className="text-xs">Enter Command</Label>
                  <Textarea
                    id="command"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="e.g., AND 1010, SHL 3, REPLACE 01 10"
                    className="font-mono text-sm min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleExecuteCommand();
                      }
                    }}
                  />
                  <Button onClick={handleExecuteCommand} variant="default" size="sm" className="w-full">
                    Execute Command
                  </Button>
                  {commandResult && (
                    <Card className="p-2 bg-secondary/50">
                      <p className="text-xs font-mono break-all">{commandResult}</p>
                    </Card>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check the Notes panel for complete command reference
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* LOGIC GATES */}
            <AccordionItem value="logic" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4" />
                  Logic Gates
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="logic-operand" className="text-xs">Operand B (binary pattern)</Label>
                  <Input
                    id="logic-operand"
                    value={logicOperandB}
                    onChange={(e) => setLogicOperandB(e.target.value)}
                    placeholder="e.g., 1010"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleLogicGate('AND')} variant="outline" size="sm">AND</Button>
                  <Button onClick={() => handleLogicGate('OR')} variant="outline" size="sm">OR</Button>
                  <Button onClick={() => handleLogicGate('XOR')} variant="outline" size="sm">XOR</Button>
                  <Button onClick={() => handleLogicGate('NOT')} variant="outline" size="sm">NOT</Button>
                  <Button onClick={() => handleLogicGate('NAND')} variant="outline" size="sm">NAND</Button>
                  <Button onClick={() => handleLogicGate('NOR')} variant="outline" size="sm">NOR</Button>
                  <Button onClick={() => handleLogicGate('XNOR')} variant="outline" size="sm">XNOR</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasSelection ? `Applied to ${selectedRanges.length} range${selectedRanges.length !== 1 ? 's' : ''}` : 'Applied to entire stream'}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* SHIFT & ROTATE */}
            <AccordionItem value="shift" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" />
                  Shift & Rotate
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="shift-amount" className="text-xs">Shift Amount</Label>
                  <Input
                    id="shift-amount"
                    type="number"
                    min="1"
                    value={shiftAmount}
                    onChange={(e) => setShiftAmount(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Logical Shifts (fill with 0s)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleShift('logicalLeft')} variant="outline" size="sm">
                      ← Left
                    </Button>
                    <Button onClick={() => handleShift('logicalRight')} variant="outline" size="sm">
                      Right →
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Arithmetic Shifts (preserve sign)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleShift('arithmeticLeft')} variant="outline" size="sm">
                      ← Left
                    </Button>
                    <Button onClick={() => handleShift('arithmeticRight')} variant="outline" size="sm">
                      Right →
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Rotations (circular)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleShift('rotateLeft')} variant="outline" size="sm">
                      ↺ Left
                    </Button>
                    <Button onClick={() => handleShift('rotateRight')} variant="outline" size="sm">
                      Right ↻
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* BIT MANIPULATION */}
            <AccordionItem value="manipulation" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4" />
                  Bit Manipulation
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {/* Delete */}
                {hasSelection && (
                  <>
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Delete className="w-4 h-4 mr-2" />
                      Delete Selection ({selectedRanges.reduce((sum, r) => sum + (r.end - r.start + 1), 0)} bits in {selectedRanges.length} range{selectedRanges.length !== 1 ? 's' : ''})
                    </Button>
                    <Separator />
                  </>
                )}

                {/* Insert */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Insert Bits</Label>
                  <Input
                    placeholder="Position (0-based)"
                    type="number"
                    value={insertPosition}
                    onChange={(e) => setInsertPosition(e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Bits to insert (e.g., 1010)"
                    value={insertBits}
                    onChange={(e) => setInsertBits(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleInsert} variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Insert
                  </Button>
                </div>

                <Separator />

                {/* Move */}
                {hasSelection && selectedRanges.length === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Move Selection</Label>
                      <Input
                        placeholder="Destination position"
                        type="number"
                        value={moveDestination}
                        onChange={(e) => setMoveDestination(e.target.value)}
                        className="text-sm"
                      />
                      <Button onClick={handleMove} variant="outline" size="sm" className="w-full">
                        <Move className="w-4 h-4 mr-2" />
                        Move to Position
                      </Button>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Peek */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Peek (View without modifying)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Start position"
                      type="number"
                      value={peekStart}
                      onChange={(e) => setPeekStart(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Length"
                      type="number"
                      value={peekLength}
                      onChange={(e) => setPeekLength(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button onClick={handlePeek} variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Peek
                  </Button>
                  {peekResult && (
                    <Card className="p-2 bg-secondary/50">
                      <p className="text-xs font-mono break-all">{peekResult}</p>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Bit Masking */}
                <div className="space-y-2">
                  <Label htmlFor="mask" className="text-xs font-medium">Bit Mask</Label>
                  <Input
                    id="mask"
                    value={maskPattern}
                    onChange={(e) => setMaskPattern(e.target.value)}
                    placeholder="e.g., 11110000"
                    className="font-mono text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => handleMask('AND')} variant="outline" size="sm">AND</Button>
                    <Button onClick={() => handleMask('OR')} variant="outline" size="sm">OR</Button>
                    <Button onClick={() => handleMask('XOR')} variant="outline" size="sm">XOR</Button>
                  </div>
                </div>

                <Separator />

                {/* Reverse */}
                <Button
                  onClick={handleReverse}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Reverse {hasSelection ? 'Selection' : 'All'}
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* BIT PACKING & ALIGNMENT */}
            <AccordionItem value="packing" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <FlipHorizontal className="w-4 h-4" />
                  Bit Packing & Alignment
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {/* Padding */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Padding</Label>
                  <Input
                    placeholder="Target length"
                    type="number"
                    value={padLength}
                    onChange={(e) => setPadLength(e.target.value)}
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handlePadding('left', '0')} variant="outline" size="sm">
                      Pad Left (0)
                    </Button>
                    <Button onClick={() => handlePadding('right', '0')} variant="outline" size="sm">
                      Pad Right (0)
                    </Button>
                    <Button onClick={() => handlePadding('left', '1')} variant="outline" size="sm">
                      Pad Left (1)
                    </Button>
                    <Button onClick={() => handlePadding('right', '1')} variant="outline" size="sm">
                      Pad Right (1)
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Alignment */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Alignment</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleAlign('nibble')} variant="outline" size="sm">
                      Align to Nibble (4-bit)
                    </Button>
                    <Button onClick={() => handleAlign('byte')} variant="outline" size="sm">
                      Align to Byte (8-bit)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current length: {bits.length} bits
                    {bits.length % 8 !== 0 && ` (needs ${8 - (bits.length % 8)} bits for byte)`}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ARITHMETIC OPERATIONS */}
            <AccordionItem value="arithmetic" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Binary Arithmetic
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Operand (binary or decimal)</Label>
                  <Input
                    placeholder="1010 or 10"
                    value={operand}
                    onChange={(e) => setOperand(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArithmetic('add')}
                    className="text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArithmetic('subtract')}
                    className="text-xs"
                  >
                    Subtract
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArithmetic('multiply')}
                    className="text-xs"
                  >
                    Multiply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArithmetic('divide')}
                    className="text-xs"
                  >
                    Divide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArithmetic('modulo')}
                    className="text-xs"
                  >
                    Modulo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArithmetic('power')}
                    className="text-xs"
                  >
                    Power
                  </Button>
                </div>
                
                <Card className="p-3 bg-secondary/50">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current value (decimal):</span>
                      <span className="font-mono">{ArithmeticOperations.toDecimal(bits)}</span>
                    </div>
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* ADVANCED OPERATIONS */}
            <AccordionItem value="advanced" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-4 h-4" />
                  Advanced Operations
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {/* Gray Code */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Gray Code Conversion</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleGrayCode('toGray')} variant="outline" size="sm">
                      Binary → Gray
                    </Button>
                    <Button onClick={() => handleGrayCode('fromGray')} variant="outline" size="sm">
                      Gray → Binary
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Endianness */}
                <Button
                  onClick={handleSwapEndianness}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Swap Endianness
                </Button>

                <Separator />

                {/* Statistics */}
                <Card className="p-3 bg-secondary/50">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Population Count:</span>
                      <span className="font-mono">{popCount} ones</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bit Transitions:</span>
                      <span className="font-mono">{transitionCount}</span>
                    </div>
                  </div>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* FIND & REPLACE */}
            <AccordionItem value="findreplace" className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Replace className="w-4 h-4" />
                  Find & Replace
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="find" className="text-xs">Find Pattern</Label>
                  <Input
                    id="find"
                    value={findPattern}
                    onChange={(e) => setFindPattern(e.target.value)}
                    placeholder="e.g., 1010"
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="replace" className="text-xs">Replace With</Label>
                  <Input
                    id="replace"
                    value={replacePattern}
                    onChange={(e) => setReplacePattern(e.target.value)}
                    placeholder="e.g., 0101"
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleFindReplace}
                  variant="default"
                  className="w-full"
                  size="sm"
                  disabled={!findPattern || !replacePattern}
                >
                  <Replace className="w-4 h-4 mr-2" />
                  Replace All
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {hasSelection && hasData && (
          <Card className="p-3 bg-primary/10 border-primary/20">
            <p className="text-xs font-mono text-sm">
              <strong className="text-primary">Selection Active:</strong>
            </p>
            <div className="mt-2 space-y-1">
              {selectedRanges.map((range, idx) => (
                <div key={range.id} className="text-xs text-muted-foreground">
                  Range {idx + 1}: {range.start} - {range.end} ({range.end - range.start + 1} bits)
                </div>
              ))}
              <div className="text-xs text-primary font-medium mt-2">
                Total: {selectedRanges.reduce((sum, r) => sum + (r.end - r.start + 1), 0)} bits
              </div>
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
