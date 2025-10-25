import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
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
  Minus
} from 'lucide-react';
import { LogicGates, ShiftOperations, BitManipulation, BitPacking, AdvancedBitOperations, ArithmeticOperations } from '@/lib/binaryOperations';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

interface TransformationsPanelProps {
  bits: string;
  selectedRange: { start: number; end: number } | null;
  onTransform: (newBits: string, description: string) => void;
}

export const TransformationsPanel = ({ bits, selectedRange, onTransform }: TransformationsPanelProps) => {
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

  const hasData = bits && bits.length > 0;

  // Get selected bits or entire bit string
  const getTargetBits = () => {
    if (selectedRange) {
      return bits.substring(selectedRange.start, selectedRange.end + 1);
    }
    return bits;
  };

  const applyToSelection = (transformed: string, description: string) => {
    if (selectedRange) {
      const before = bits.substring(0, selectedRange.start);
      const after = bits.substring(selectedRange.end + 1);
      onTransform(before + transformed + after, description);
    } else {
      onTransform(transformed, description);
    }
  };

  // ============= LOGIC GATES =============
  const handleLogicGate = (operation: keyof typeof LogicGates) => {
    if (!logicOperandB || !/^[01]+$/.test(logicOperandB)) return;
    
    const targetBits = getTargetBits();
    let result: string;
    
    if (operation === 'NOT') {
      result = LogicGates.NOT(targetBits);
    } else {
      result = LogicGates[operation](targetBits, logicOperandB);
    }
    
    applyToSelection(result, `Applied ${operation} gate${selectedRange ? ' to selection' : ''}`);
  };

  // ============= SHIFT & ROTATE =============
  const handleShift = (type: 'logicalLeft' | 'logicalRight' | 'arithmeticLeft' | 'arithmeticRight' | 'rotateLeft' | 'rotateRight') => {
    const amount = parseInt(shiftAmount) || 1;
    if (amount < 1) return;
    
    const targetBits = getTargetBits();
    let result: string;
    let desc: string;
    
    switch (type) {
      case 'logicalLeft':
        result = ShiftOperations.logicalShiftLeft(targetBits, amount);
        desc = `Logical shift left by ${amount}`;
        break;
      case 'logicalRight':
        result = ShiftOperations.logicalShiftRight(targetBits, amount);
        desc = `Logical shift right by ${amount}`;
        break;
      case 'arithmeticLeft':
        result = ShiftOperations.arithmeticShiftLeft(targetBits, amount);
        desc = `Arithmetic shift left by ${amount}`;
        break;
      case 'arithmeticRight':
        result = ShiftOperations.arithmeticShiftRight(targetBits, amount);
        desc = `Arithmetic shift right by ${amount}`;
        break;
      case 'rotateLeft':
        result = ShiftOperations.rotateLeft(targetBits, amount);
        desc = `Rotated left by ${amount}`;
        break;
      case 'rotateRight':
        result = ShiftOperations.rotateRight(targetBits, amount);
        desc = `Rotated right by ${amount}`;
        break;
    }
    
    applyToSelection(result, desc + (selectedRange ? ' (selection)' : ''));
  };

  // ============= BIT MANIPULATION =============
  const handleDelete = () => {
    if (!selectedRange) return;
    const result = BitManipulation.deleteBits(bits, selectedRange.start, selectedRange.end + 1);
    onTransform(result, `Deleted bits ${selectedRange.start}-${selectedRange.end}`);
  };

  const handleInsert = () => {
    const pos = parseInt(insertPosition);
    if (isNaN(pos) || pos < 0 || pos > bits.length) return;
    if (!insertBits || !/^[01]+$/.test(insertBits)) return;
    
    const result = BitManipulation.insertBits(bits, pos, insertBits);
    onTransform(result, `Inserted ${insertBits.length} bits at position ${pos}`);
  };

  const handleMove = () => {
    if (!selectedRange) return;
    const dest = parseInt(moveDestination);
    if (isNaN(dest) || dest < 0) return;
    
    const result = BitManipulation.moveBits(bits, selectedRange.start, selectedRange.end + 1, dest);
    onTransform(result, `Moved bits ${selectedRange.start}-${selectedRange.end} to position ${dest}`);
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
    
    const targetBits = getTargetBits();
    const result = BitManipulation.applyMask(targetBits, maskPattern, operation);
    applyToSelection(result, `Applied ${operation} mask${selectedRange ? ' to selection' : ''}`);
  };

  const handleReverse = () => {
    const targetBits = getTargetBits();
    const result = AdvancedBitOperations.reverseBits(targetBits);
    applyToSelection(result, `Reversed${selectedRange ? ' selection' : ' all bits'}`);
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

  // ============= ADVANCED OPERATIONS =============
  const handleGrayCode = (direction: 'toGray' | 'fromGray') => {
    const targetBits = getTargetBits();
    const result = direction === 'toGray'
      ? AdvancedBitOperations.binaryToGray(targetBits)
      : AdvancedBitOperations.grayToBinary(targetBits);
    
    applyToSelection(result, `Converted ${direction === 'toGray' ? 'to' : 'from'} Gray code${selectedRange ? ' (selection)' : ''}`);
  };

  const handleSwapEndianness = () => {
    const targetBits = getTargetBits();
    const result = AdvancedBitOperations.swapEndianness(targetBits);
    applyToSelection(result, `Swapped endianness${selectedRange ? ' (selection)' : ''}`);
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
          <Accordion type="multiple" defaultValue={['logic', 'shift', 'manipulation']} className="space-y-2">
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
                  {selectedRange ? 'Applied to selection' : 'Applied to entire stream'}
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
                {selectedRange && (
                  <>
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Delete className="w-4 h-4 mr-2" />
                      Delete Selection ({selectedRange.end - selectedRange.start + 1} bits)
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
                {selectedRange && (
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
                  Reverse {selectedRange ? 'Selection' : 'All'}
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
                    onClick={() => {
                      const op = operand.match(/^[01]+$/) ? operand : ArithmeticOperations.fromDecimal(parseInt(operand) || 0);
                      const result = ArithmeticOperations.add(bits, op);
                      onTransform(result, `Added ${operand}`);
                    }}
                    className="text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const op = operand.match(/^[01]+$/) ? operand : ArithmeticOperations.fromDecimal(parseInt(operand) || 0);
                      const result = ArithmeticOperations.subtract(bits, op);
                      onTransform(result, `Subtracted ${operand}`);
                    }}
                    className="text-xs"
                  >
                    Subtract
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const op = operand.match(/^[01]+$/) ? operand : ArithmeticOperations.fromDecimal(parseInt(operand) || 0);
                      const result = ArithmeticOperations.multiply(bits, op);
                      onTransform(result, `Multiplied by ${operand}`);
                    }}
                    className="text-xs"
                  >
                    Multiply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const op = operand.match(/^[01]+$/) ? operand : ArithmeticOperations.fromDecimal(parseInt(operand) || 0);
                      const divResult = ArithmeticOperations.divide(bits, op);
                      onTransform(divResult.quotient, `Divided by ${operand}`);
                    }}
                    className="text-xs"
                  >
                    Divide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const op = operand.match(/^[01]+$/) ? operand : ArithmeticOperations.fromDecimal(parseInt(operand) || 0);
                      const result = ArithmeticOperations.modulo(bits, op);
                      onTransform(result, `Modulo ${operand}`);
                    }}
                    className="text-xs"
                  >
                    Modulo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const exp = operand;
                      const result = ArithmeticOperations.power(bits, exp);
                      onTransform(result, `Raised to power ${exp}`);
                    }}
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

        {selectedRange && hasData && (
          <Card className="p-3 bg-primary/10 border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Current selection:</strong> {selectedRange.end - selectedRange.start + 1} bits
              <br />
              Position: {selectedRange.start} - {selectedRange.end}
            </p>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
