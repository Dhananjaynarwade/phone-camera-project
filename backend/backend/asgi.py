import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

from signaling.routing import websocket_urlpatterns


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "backend.settings"
)


django_application = get_asgi_application()


application = ProtocolTypeRouter({

    "http": django_application,

    "websocket": URLRouter(
        websocket_urlpatterns
    ),

})