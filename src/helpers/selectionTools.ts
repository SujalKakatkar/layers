import type {Shape} from "../types/types";

export function expandSelectionByGroup(selectedIds: string[], shapes: Shape[]): string[] {
    const groupIds = new Set<string>();
    
    // Find all groupIds within the currently selected set
    selectedIds.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        if (shape?.groupId) {
            groupIds.add(shape.groupId);
        }
    });

    if (groupIds.size === 0) {
        return selectedIds;
    }

    const expandedIds = new Set(selectedIds);
    
    // Include all shapes that share any discovered groupId
    shapes.forEach(shape => {
        if (shape.groupId && groupIds.has(shape.groupId)) {
            expandedIds.add(shape.id);
        }
    });

    return Array.from(expandedIds);
}
