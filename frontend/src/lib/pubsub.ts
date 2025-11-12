// Simple typed pub/sub (Observer pattern) implementation.
// Observers subscribe to events; Subjects publish events.
// Provides subscribe, unsubscribe (via returned cleanup), and one-time subscription.

export type EventHandler<T = any> = (payload: T) => void;

interface HandlerRecord {
  handler: EventHandler;
  once?: boolean;
}

const channels: Map<string, Set<HandlerRecord>> = new Map();

export function subscribe<T = any>(
  event: string,
  handler: EventHandler<T>,
  options?: { once?: boolean }
): () => void {
  if (!channels.has(event)) channels.set(event, new Set());
  const record: HandlerRecord = {
    handler: handler as EventHandler,
    once: options?.once,
  };
  channels.get(event)!.add(record);
  return () => {
    const set = channels.get(event);
    if (set) {
      set.delete(record);
      if (set.size === 0) channels.delete(event);
    }
  };
}

export function publish<T = any>(event: string, payload: T): void {
  const set = channels.get(event);
  if (!set) return;
  // Clone to avoid mutation during iteration
  const toCall = Array.from(set);
  for (const record of toCall) {
    try {
      (record.handler as EventHandler<T>)(payload);
    } catch (err) {
      // Fail fast but continue notifying other observers
      console.error(`PubSub handler for event '${event}' threw:`, err);
    }
    if (record.once) {
      set.delete(record);
    }
  }
  if (set.size === 0) channels.delete(event);
}

export function once<T = any>(
  event: string,
  handler: EventHandler<T>
): () => void {
  return subscribe(event, handler, { once: true });
}

export function clearEvent(event: string): void {
  channels.delete(event);
}

export function clearAll(): void {
  channels.clear();
}

// Helper typed event names for notifications
export const NOTIFICATION_UNREAD_EVENT = "notifications:unreadCount";
export const NOTIFICATION_LIST_EVENT = "notifications:list";
