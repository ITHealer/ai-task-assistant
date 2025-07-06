from typing import Optional, Dict, Any


class AppException(Exception):
    """Base application exception"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "APP_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(AppException):
    """Validation exception"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details=details
        )


class NotFoundException(AppException):
    """Not found exception"""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            status_code=404
        )


class UnauthorizedException(AppException):
    """Unauthorized exception"""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(
            message=message,
            error_code="UNAUTHORIZED",
            status_code=401
        )


class ForbiddenException(AppException):
    """Forbidden exception"""
    
    def __init__(self, message: str = "Forbidden"):
        super().__init__(
            message=message,
            error_code="FORBIDDEN",
            status_code=403
        )