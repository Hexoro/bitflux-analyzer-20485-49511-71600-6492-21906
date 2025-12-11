/**
 * File System Manager - Manages multiple binary files
 */

import { FileState } from './fileState';

export interface BinaryFile {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  type: 'binary' | 'text';
  state: FileState;
  group?: string; // Optional grouping
}

export class FileSystemManager {
  private files: Map<string, BinaryFile> = new Map();
  private groups: Set<string> = new Set();
  private activeFileId: string | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Create a default file
    this.createFile('untitled.txt', '', 'binary');
  }

  // Create a new file
  createFile(name: string, bits: string = '', type: 'binary' | 'text' = 'binary'): BinaryFile {
    const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const state = new FileState(bits);
    
    const file: BinaryFile = {
      id,
      name,
      created: new Date(),
      modified: new Date(),
      type,
      state,
    };
    
    this.files.set(id, file);
    this.activeFileId = id;
    this.notifyListeners();
    return file;
  }

  // Get all files
  getFiles(): BinaryFile[] {
    return Array.from(this.files.values()).sort((a, b) => 
      a.created.getTime() - b.created.getTime()
    );
  }

  // Get active file
  getActiveFile(): BinaryFile | null {
    if (!this.activeFileId) return null;
    return this.files.get(this.activeFileId) || null;
  }

  // Set active file
  setActiveFile(id: string): void {
    if (this.files.has(id)) {
      this.activeFileId = id;
      this.notifyListeners();
    }
  }

  // Update file content
  updateFile(id: string, bits: string): void {
    const file = this.files.get(id);
    if (file) {
      file.state.model.loadBits(bits);
      file.modified = new Date();
      this.notifyListeners();
    }
  }

  // Rename file
  renameFile(id: string, newName: string): void {
    const file = this.files.get(id);
    if (file) {
      file.name = newName;
      file.modified = new Date();
      this.notifyListeners();
    }
  }

  // Delete file
  deleteFile(id: string): void {
    this.files.delete(id);
    
    // If deleted file was active, switch to another file
    if (this.activeFileId === id) {
      const files = this.getFiles();
      this.activeFileId = files.length > 0 ? files[0].id : null;
    }
    
    this.notifyListeners();
  }

  // Convert text to binary
  static textToBinary(text: string): string {
    let bits = '';
    for (let i = 0; i < text.length; i++) {
      const byte = text.charCodeAt(i);
      bits += byte.toString(2).padStart(8, '0');
    }
    return bits;
  }

  // Convert binary to text
  static binaryToText(bits: string): string {
    let text = '';
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substring(i, i + 8);
      if (byte.length === 8) {
        text += String.fromCharCode(parseInt(byte, 2));
      }
    }
    return text;
  }

  // Set file group
  setFileGroup(id: string, group: string): void {
    const file = this.files.get(id);
    if (file) {
      file.group = group;
      file.modified = new Date();
      this.notifyListeners();
    }
  }

  // Add a new group
  addGroup(groupName: string): void {
    if (groupName.trim()) {
      this.groups.add(groupName.trim());
      this.notifyListeners();
    }
  }

  // Delete a group
  deleteGroup(groupName: string): void {
    this.groups.delete(groupName);
    // Remove group from all files that had it
    this.files.forEach(file => {
      if (file.group === groupName) {
        file.group = undefined;
      }
    });
    this.notifyListeners();
  }

  // Get all unique groups (combines stored groups and groups from files)
  getGroups(): string[] {
    const allGroups = new Set<string>(this.groups);
    this.files.forEach(file => {
      if (file.group) allGroups.add(file.group);
    });
    return Array.from(allGroups).sort();
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}
