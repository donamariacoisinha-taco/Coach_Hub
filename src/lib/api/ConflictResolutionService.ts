import { PremiumProtocol } from './premiumProtocolsApi';

export interface ProtocolConflict {
  id: string;
  protocolId: string;
  protocolName: string;
  localVersion: number;
  serverVersion: number;
  timestamp: string;
  resolved: boolean;
}

class ConflictResolutionService {
  private conflicts: ProtocolConflict[] = [];
  private listeners: Set<(conflicts: ProtocolConflict[]) => void> = new Set();

  registerConflict(protocol: PremiumProtocol, serverVersion: number) {
    const conflict: ProtocolConflict = {
      id: `${protocol.id}_${Date.now()}`,
      protocolId: protocol.id,
      protocolName: protocol.name,
      localVersion: protocol.version || 0,
      serverVersion: serverVersion,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.conflicts.unshift(conflict);
    console.warn('[ConflictResolutionService] Conflict registered:', conflict);
    this.notifyListeners();
  }

  getConflicts(): ProtocolConflict[] {
    return this.conflicts;
  }

  clearConflicts() {
    this.conflicts = [];
    this.notifyListeners();
  }

  resolveConflict(conflictId: string) {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (conflict) {
      conflict.resolved = true;
      this.notifyListeners();
    }
  }

  subscribe(listener: (conflicts: ProtocolConflict[]) => void): () => void {
    this.listeners.add(listener);
    // Emit initial state
    listener(this.conflicts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener([...this.conflicts]);
      } catch (e) {
        console.error('[ConflictResolutionService] Error executing listener callback:', e);
      }
    });
  }
}

export const conflictResolutionService = new ConflictResolutionService();
