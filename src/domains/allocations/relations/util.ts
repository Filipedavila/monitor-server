
export function sanitizeDelta(toAdd: number[], toRemove: number[]): { add: number[], remove: number[] } {
    const setRemove = new Set(toRemove);
    const setAdd = new Set(toAdd);

    const cleanAdd = toAdd.filter(id => !setRemove.has(id));
    const cleanRemove = toRemove.filter(id => !setAdd.has(id));

    return { add: cleanAdd, remove: cleanRemove };
  }
