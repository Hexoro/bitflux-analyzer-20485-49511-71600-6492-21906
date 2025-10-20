# Binary File Analyzer & Editor

A powerful web-based tool for analyzing, editing, and manipulating binary data with advanced features for pattern detection, boundary management, and comprehensive analysis.

## 🎯 Core Features

### Binary Viewer & Editor
- **Edit Mode**: Full text-editor-like experience for binary data
  - **Cursor Navigation**: Navigate with arrow keys (up/down/left/right)
  - **Selection**: Shift+Arrow keys to select ranges of bits
  - **Direct Editing**: Type 0 or 1 to insert/replace bits at cursor
  - **Cut/Copy/Paste**: Standard Ctrl+X/C/V operations (browser clipboard)
  - **Undo/Redo**: Ctrl+Z and Ctrl+Y for full edit history
  - **Delete Operations**: Backspace and Delete keys work naturally
  - **Toggle**: Press 'E' key or use toolbar button to enable/disable
- **Virtualized Display**: Handles large files efficiently
- **Customizable Layout**: Adjustable bits per row
- **Visual Indicators**: Cursor position, selection range, edit mode status

### File Management
- **Multi-File System**: Work with multiple binary files simultaneously
- **File Operations**:
  - Load binary or text files
  - Save as text (binary string format)
  - Export as actual binary files
  - Create new files from generated data
- **File Sidebar**: Easy navigation between open files

### Analysis Tab
Comprehensive statistical analysis of binary data:

#### Basic Metrics
- **Total Bits**: File size in bits and bytes
- **Bit Distribution**: Count and percentage of 0s and 1s
- **Entropy**: Measure of randomness (0-1 scale)
- **Hamming Weight**: Count of 1s in the data

#### Data Quality
- **Balance Score**: How evenly distributed 0s and 1s are
- **Randomness**: Entropy-based quality indicator
- **Byte Alignment**: Indicates if data is byte-aligned (divisible by 8)

#### Pattern Analysis
- **Longest Runs**: Tracks longest sequences of consecutive 0s and 1s
- **Run Length Statistics**: Average run lengths for both bits
- **Transition Analysis**: Frequency of bit changes (0→1, 1→0)

#### Advanced Statistics
- **Compression Ratio**: Estimated compressibility
- **Autocorrelation**: Pattern repetition detection
- **Byte Patterns**: Frequency analysis of byte values
- **Bit Density**: Spatial distribution of 1s
- **Transition Rate**: Frequency of bit changes

### Sequences Tab
Advanced sequence search and highlighting:

- **Multiple Searches**: Save and manage multiple search patterns
- **Serial Numbers**: Each search gets a unique ID
- **Color Coding**: Each sequence automatically gets a unique color
- **View Modes**:
  - Card View: Detailed cards for each sequence
  - Table View: Compact table with sortable columns
- **Filters & Sorting**:
  - Filter by sequence pattern
  - Sort by various criteria (length, matches, etc.)
- **Toggle Highlighting**: Turn highlighting on/off per sequence
- **Jump to Positions**: Quick navigation to any match
- **Statistics**: Shows total matches and positions for each pattern

### Boundaries Tab
Intelligent boundary detection and management:

#### Smart Suggestions
- **Longest Runs**: Automatically detects longest sequences of 0s and 1s
- **Palindromes**: Finds longest palindromic sequences (min 8 bits)
- **Click to Use**: One-click to select any suggestion as boundary

#### Boundary Generation
- **Unique Boundary Generator**: Creates sequences guaranteed not to exist in your data
- **Custom Boundaries**: Define your own boundary patterns
- **Validation**: Ensures boundaries are valid and unique

#### Boundary Operations
- **Append**: Add boundary to end of file
- **Insert**: Insert boundary at specific position
- **Color Coding**: Assign colors to boundaries for visual distinction
- **Position Tracking**: Shows all occurrences of each boundary
- **Jump to Occurrences**: Navigate to any boundary position

### Partitions Tab
Automatic file segmentation based on boundaries:

- **Automatic Partitioning**: File divided by detected boundaries
- **Per-Partition Statistics**: Full metrics for each segment
- **Visual Separation**: Clear visualization of partition structure
- **Quick Navigation**: Jump to any partition instantly

### Anomalies Tab
Comprehensive anomaly detection and analysis:

#### Anomaly Types Detected
1. **Palindromes**: Mirror sequences (e.g., 10011001)
2. **Repeating Patterns**: Sequences that repeat (e.g., 010101)
3. **Alternating Sequences**: Regular bit alternation
4. **Long Runs**: Extended sequences of same bit
5. **Sparse Regions**: Areas with very few 1s
6. **Dense Regions**: Areas with high concentration of 1s
7. **Byte Boundaries**: Significant patterns at byte-aligned positions

#### Features
- **Severity Levels**: Critical, High, Medium, Low
- **Type Filtering**: Filter by anomaly type
- **Severity Filtering**: Filter by severity level
- **View Modes**:
  - Card View: Detailed anomaly cards
  - Table View: Sortable table with all details
- **Summary Dashboard**: 
  - Total anomalies count
  - Affected bits percentage
  - Coverage statistics
  - Breakdown by severity and type
- **Jump to Anomaly**: Navigate directly to any detected issue

### Transformations Tab
Powerful bit manipulation operations:

#### Bitwise Operations
- **NOT**: Flip all bits (0→1, 1→0)
- **AND**: Bitwise AND with pattern
- **OR**: Bitwise OR with pattern
- **XOR**: Bitwise XOR with pattern

#### Shift Operations
- **Left Shift**: Shift bits left by N positions
- **Right Shift**: Shift bits right by N positions
- **Rotate Left**: Circular left rotation
- **Rotate Right**: Circular right rotation

#### Find & Replace
- **Pattern Search**: Find any binary sequence
- **Replace All**: Replace all occurrences
- **Validation**: Ensures valid binary patterns

### History Tab
Complete edit tracking and version management:

#### Features
- **Automatic Tracking**: Every edit is automatically recorded
- **Grouped Display**: Similar operations grouped together
- **Expandable Groups**: Click to see individual edits
- **Rich Metadata**:
  - Timestamp (relative: "2m ago")
  - File size at that point
  - Entropy measurement
  - Bit distribution
  - Operation description

#### Operations
- **Compare**: Visual diff between versions
- **Restore to Current**: Replace current file content
- **Restore as New File**: Open version in new file with timestamp
- **File Creation Tracking**: Special entry when data is first loaded

#### Grouping
Intelligent grouping by operation type:
- Boundary operations
- Transformations
- Edits
- Generated data
- Loaded files

### Toolbar
Quick access to all major functions:

- **File Operations**: Load, Save, Export
- **Generate**: Create random or patterned data
- **Undo/Redo**: Full undo stack with keyboard shortcuts
- **Navigation**: Jump to position, Find sequences
- **Convert**: Text↔Binary conversion
- **Edit Mode Toggle**: Enable/disable edit mode (Keyboard: E)

### Dialogs & Tools

#### Generate Dialog
- **Random Generation**: Create random binary data
- **Custom Patterns**: Define specific bit patterns
- **Length Control**: Specify exact bit count
- **Probability**: Control 0/1 distribution

#### Jump To Dialog
- **Position Jump**: Navigate to any bit position
- **Validation**: Ensures position is within file bounds

#### Converter Dialog
- **Text to Binary**: Convert ASCII text to binary
- **Binary to Text**: Decode binary to ASCII
- **File Upload**: Convert uploaded files to binary

#### Comparison Dialog
- **Visual Diff**: Side-by-side comparison of versions
- **Statistics Comparison**: Metrics comparison
- **Highlight Differences**: Visual highlighting of changes

## 🎨 Design System

### Color Palette
- **Background**: Rich black (`#0A0A0A`)
- **Primary Accent**: Electric cyan (`#00D4FF`)
- **Secondary**: Purple (`#9333EA`)
- **Success**: Green (`#10B981`)
- **Warning**: Yellow (`#F59E0B`)
- **Error**: Red (`#EF4444`)
- **Muted**: Gray tones for secondary text

### Typography
- **Primary Font**: Inter (UI elements)
- **Monospace Font**: JetBrains Mono (binary display)
- **Responsive Sizing**: Adapts to screen size

### Visual Features
- **Dark Mode**: Optimized for dark themes
- **Glassmorphism**: Frosted glass effects on panels
- **Smooth Animations**: Transitions on all interactions
- **Color-Coded Highlights**: Rainbow colors for sequences
- **Hover Effects**: Interactive feedback on all clickable elements

## ⌨️ Keyboard Shortcuts

### Edit Mode (when enabled)
- **Type 0/1**: Insert bit at cursor or replace selection
- **Arrow Keys**: Move cursor
- **Shift + Arrows**: Select bits
- **Delete**: Delete bit at cursor or selection
- **Backspace**: Delete bit before cursor or selection
- **Escape**: Clear selection
- **Ctrl+Z**: Undo
- **Ctrl+Y** or **Ctrl+Shift+Z**: Redo
- **Ctrl+C**: Copy selection (browser clipboard)
- **Ctrl+V**: Paste (browser clipboard)

### Global Shortcuts
- **E**: Toggle edit mode
- **Ctrl+S**: Save file
- **Ctrl+O**: Open file
- **Ctrl+Z**: Undo (works globally)
- **Ctrl+Y**: Redo (works globally)

## 🚀 Technical Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn-ui (Radix UI primitives)
- **State Management**: React hooks and context
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

## 📊 Architecture

### Core Classes

#### `BinaryModel`
- Manages binary data storage and manipulation
- Handles undo/redo operations
- Provides utility methods for file I/O

#### `BinaryMetrics`
- Calculates all statistical measures
- Performs pattern analysis
- Generates quality metrics

#### `HistoryManager`
- Tracks all file modifications
- Stores version metadata
- Enables time travel through edits

#### `PartitionManager`
- Manages boundary definitions
- Creates file partitions
- Tracks boundary positions

#### `FileSystemManager`
- Manages multiple file instances
- Handles file switching
- Coordinates file operations

#### `FileState`
- Encapsulates complete file state
- Coordinates between managers
- Provides unified interface

### Component Structure

```
Index (Main App)
├── Toolbar
├── FileSystemSidebar
├── BinaryViewer (Edit Mode)
└── Tabs
    ├── AnalysisPanel
    ├── SequencesPanel
    ├── BoundariesPanel
    ├── PartitionsPanel
    ├── AnomaliesPanel
    ├── TransformationsPanel
    └── HistoryPanelNew
```

## 🎯 Use Cases

1. **Binary File Analysis**: Examine structure and patterns in binary files
2. **Data Forensics**: Detect anomalies and unusual patterns
3. **File Format Reverse Engineering**: Identify boundaries and structure
4. **Data Compression Research**: Analyze entropy and compressibility
5. **Binary Protocol Analysis**: Study communication protocols
6. **Educational Tool**: Learn about binary data representation
7. **Data Recovery**: Identify and extract specific sequences
8. **Quality Assurance**: Verify binary data integrity

## 🔒 Data Privacy

- **Client-Side Only**: All processing happens in your browser
- **No Server Upload**: Files never leave your computer
- **No Tracking**: No analytics or user tracking
- **Local Storage**: Optional, for preferences only

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires modern browser with:
- ES6+ JavaScript support
- Web File API
- Clipboard API (for copy/paste)

## 📝 Tips & Tricks

1. **Large Files**: The viewer is optimized for files up to several MB
2. **Edit Mode**: Use edit mode for quick manual corrections
3. **Sequence Search**: Save frequently used patterns for quick access
4. **Boundary Strategy**: Use unique boundaries for reliable partitioning
5. **History**: Use "Restore as New File" to compare multiple versions
6. **Anomalies**: Filter by severity to focus on critical issues
7. **Analysis**: Check entropy to assess data randomness
8. **Transformations**: Test XOR patterns for simple encryption/obfuscation

## 🔧 Development

Built with modern web technologies for performance and maintainability:

- **Component-Based**: Modular, reusable components
- **Type-Safe**: Full TypeScript coverage
- **Performance**: Virtualized rendering for large datasets
- **Responsive**: Mobile-friendly design
- **Accessible**: ARIA labels and keyboard navigation

## 📄 License

MIT License - Feel free to use and modify for your needs

---

**Made with ❤️ for binary data enthusiasts**

---

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7c88d63e-f258-4ddd-be54-d153c1e0c41e) and click on Share → Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
