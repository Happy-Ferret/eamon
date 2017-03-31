from django.conf.urls import url, include
from rest_framework import routers

from . import views

from .views import PlayerViewSet, AdventureViewSet, AuthorViewSet, RoomViewSet, ArtifactViewSet, EffectViewSet, MonsterViewSet, HintViewSet, LogViewSet

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'players', PlayerViewSet)
router.register(r'authors', AuthorViewSet)
router.register(r'adventures', AdventureViewSet)
router.register(r'adventures/(?P<adventure_id>[\w-]+)/rooms$', RoomViewSet)
router.register(r'adventures/(?P<adventure_id>[\w-]+)/artifacts$', ArtifactViewSet)
router.register(r'adventures/(?P<adventure_id>[\w-]+)/effects$', EffectViewSet)
router.register(r'adventures/(?P<adventure_id>[\w-]+)/monsters$', MonsterViewSet)
router.register(r'adventures/(?P<adventure_id>[\w-]+)/hints', HintViewSet)
router.register(r'log', LogViewSet)

urlpatterns = [
    url(r'^api/', include(router.urls)),
    url(r'^$', views.index, name='index'),
    url(r'^adventure-list$', views.adventure_list, name='adventure-list'),
    url(r'^manual$', views.manual, name='manual'),
    url(r'^adventure/(?P<adventure_id>[\w-]+)/$', views.adventure, name='adventure'),

    # this route is a catch-all for compatibility with the Angular routes. It must be last in the list.
    # NOTE: this currently matches URLs without a . in them, so .js files and broken images will still 404.
    # NOTE: non-existent URLs won't 404 with this in place. They will be sent into the Angular app.
    url(r'^(?P<path>[^\.]*)/$', views.index),
]
