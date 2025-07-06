from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.logging import get_logger
from src.core.exceptions import AppException

logger = get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Global error handler middleware"""
    
    async def dispatch(self, request: Request, call_next):
        """
        Global error handler middleware

        This middleware catches all exceptions raised by the application
        and returns a JSON response with a standardized error format.

        The error format is as follows:

        {
            "error": string,
            "message": string,
            "details": object
        }

        The "error" field contains the error code. The "message" field contains
        the error message. The "details" field contains additional error details
        if available.

        If the exception is an instance of AppException, the status code and
        error format is taken from the exception. Otherwise, a 500 status code
        is returned with a generic error message.
        """
        try:
            response = await call_next(request)
            return response
        except AppException as e:
            logger.error(f"Application error: {str(e)}")
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": e.error_code,
                    "message": str(e),
                    "details": e.details
                }
            )
        except Exception as e:
            logger.exception(f"Unhandled error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred"
                }
            )