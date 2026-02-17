from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'Ticket Support API',
        'endpoints': {
            'tickets': '/api/tickets/',
            'ticket_detail': '/api/tickets/{id}/',
            'classify': '/api/tickets/classify/',
            'stats': '/api/tickets/stats/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('tickets.urls')),
]
