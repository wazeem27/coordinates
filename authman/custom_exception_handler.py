# custom_exception_handler.py

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from typing import Optional, Any, Dict, Tuple


def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Optional[Response]:
    """
    Custom exception handler for Django REST Framework.
    This function customizes the response for PermissionDenied exceptions.

    Args:
        exc (Exception): The raised exception.
        context (Dict[str, Any]): Context dictionary containing additional context.

    Returns:
        Optional[Response]: Customized response for exceptions or None if not handled.
    """
    response: Optional[Response] = exception_handler(exc, context)

    if isinstance(exc, PermissionDenied):
        response_data: Dict[str, Any] = {
            'status': 'error',
            'message': 'You do not have permission to perform this action.'
            # Add any other keys or details you want in the response
        }
        if response is not None:
            response.data = response_data

    return response
