let counter = 0;

export function newId(): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 8);
  return `local_${Date.now().toString(36)}_${counter.toString(36)}_${rand}`;
}