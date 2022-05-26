#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.conf.urls import patterns, include, url
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

urlpatterns = patterns('',
	url(r'^$', 'guac_django.views.index', name='index'),#首页
	url(r'jump_ws$', 'guac_django.views.jump_ws', name='jump_ws'),#wss
)
