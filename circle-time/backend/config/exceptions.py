from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Wraps all DRF errors in the standard envelope:
    { "success": false, "message": "..." }
    No extra top-level keys — frontend does not consume them.
    """
    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred"

        # Try to extract a specific message from DRF's error detail
        detail = response.data
        if isinstance(detail, dict):
            if "detail" in detail:
                message = str(detail["detail"])
            elif "non_field_errors" in detail:
                message = "; ".join(str(e) for e in detail["non_field_errors"])
            else:
                errors = []
                for field, errs in detail.items():
                    if isinstance(errs, list):
                        for e in errs:
                            errors.append(f"{field}: {e}")
                    else:
                        errors.append(f"{field}: {errs}")
                if errors:
                    message = "; ".join(errors)
        elif isinstance(detail, list):
            message = "; ".join(str(e) for e in detail)
        elif isinstance(detail, str):
            message = detail

        response.data = {
            "success": False,
            "message": message,
        }

    return response
