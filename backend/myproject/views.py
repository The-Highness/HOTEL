from django.http import HttpResponse
from django.views.decorators.http import require_safe


@require_safe
def ping(request):
    return HttpResponse("OK", content_type="text/plain")
