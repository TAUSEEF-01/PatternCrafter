// Front Controller pattern for the SPA (local-only)

export interface RouteHandler {
  (params?: Record<string, any>, body?: any): Promise<any> | any;
}

export interface FrontControllerInterface {
  register(path: string, handler: RouteHandler): void;
  unregister(path: string): void;
  handle(path: string, params?: Record<string, any>, body?: any): Promise<any>;
}

export class FrontController implements FrontControllerInterface {
  private handlers: Map<string, RouteHandler> = new Map();

  register(path: string, handler: RouteHandler): void {
    this.handlers.set(path, handler);
  }

  unregister(path: string): void {
    this.handlers.delete(path);
  }

  async handle(path: string, params?: Record<string, any>, body?: any): Promise<any> {
    const handler = this.handlers.get(path);
    if (!handler) {
      return { status: 404, message: `No handler for ${path}` };
    }
    try {
      return await handler(params, body);
    } catch (e) {
      return { status: 500, message: String(e) };
    }
  }
}

// Example: not exported as a default or used by app — kept as a reference.
export const ExampleFrontController = FrontController;
