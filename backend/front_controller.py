from abc import ABC, abstractmethod
from typing import Callable, Dict, Any, Optional


class ControllerInterface(ABC):
    """Interface for controllers handled by FrontController.

    This is a simple protocol-like interface for demonstration and
    is not imported by other modules in the project.
    """

    @abstractmethod
    def handle(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a request dictionary and return a response dictionary."""


class FrontController:
    """A small Front Controller implementation.

    This class acts as a centralized dispatcher that maps string paths to
    controller callables. It intentionally is not wired into the running
    application — it is included as a concrete example of the pattern.
    """

    def __init__(self) -> None:
        self._handlers: Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]] = {}

    def register(self, path: str, handler: Callable[[Dict[str, Any]], Dict[str, Any]]) -> None:
        """Register a handler for a given path."""
        self._handlers[path] = handler

    def unregister(self, path: str) -> None:
        """Remove handler registration for a path if present."""
        if path in self._handlers:
            del self._handlers[path]

    def dispatch(self, path: str, request: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Dispatch the request to the registered handler.

        If no handler is registered, return a default 404-like dict.
        """
        request = request or {}
        handler = self._handlers.get(path)
        if handler is None:
            return {
                "status": 404,
                "message": f"No handler registered for path: {path}",
            }
        try:
            return handler(request)
        except Exception as exc:  # pragma: no cover - defensive
            return {"status": 500, "message": f"Handler error: {exc}"}


# Example controller implementing ControllerInterface (not used anywhere)
class ExampleController(ControllerInterface):
    def handle(self, request: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": 200, "echo": request}


__all__ = ["ControllerInterface", "FrontController", "ExampleController"]
