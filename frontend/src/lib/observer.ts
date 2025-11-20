// Observer pattern implementation (local-only)

export interface Observer<T = any> {
  update(subject: Subject<T>, data?: T): void;
}

export interface Subject<T = any> {
  attach(observer: Observer<T>): void;
  detach(observer: Observer<T>): void;
  notify(data?: T): void;
}

// Concrete Subject implementation
export class ConcreteSubject<T = any> implements Subject<T> {
  private observers: Set<Observer<T>> = new Set();

  attach(observer: Observer<T>): void {
    this.observers.add(observer);
  }

  detach(observer: Observer<T>): void {
    this.observers.delete(observer);
  }

  notify(data?: T): void {
    for (const obs of Array.from(this.observers)) {
      try {
        obs.update(this, data);
      } catch (e) {
        // swallow errors to keep notification robust
        // (this is a contained example; in production you might log)
      }
    }
  }
}

// Example concrete observer (kept local)
export class LoggingObserver implements Observer<any> {
  constructor(private readonly name = "observer") {}
  update(subject: Subject<any>, data?: any): void {
    // no console output in library code by default; this demonstrates
    // how an observer would receive updates. Do not use this anywhere
    // unless intentionally imported.
    // console.log(`${this.name} received`, data);
  }
}

export { ConcreteSubject as SubjectImpl, LoggingObserver as ObserverImpl };
