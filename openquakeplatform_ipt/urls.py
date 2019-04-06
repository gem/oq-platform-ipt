# -*- coding: utf-8 -*-
# vim: tabstop=4 shiftwidth=4 softtabstop=4

# Copyright (c) 2010-2013, GEM Foundation.
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public
#    License along with this program. If not, see
#    <https://www.gnu.org/licenses/agpl.html>.

from django.conf.urls import url
from openquakeplatform_ipt import views

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

app_name = 'ipt'
urlpatterns = [
    url(r'^(?P<tab_id>\d+)?$', views.view, name='home'),
    url(r'^upload/(?P<target>[^?]*)', views.upload, name='upload'),
    url(r'^valid$', views.validate_nrml, name='validate_nrml'),
    url(r'^sendback$', views.sendback_nrml, name='sendback_nrml'),
    url(r'^sendback_er_rupture_surface$', views.sendback_er_rupture_surface,
        name='sendback_er_rupture_surface'),
    url(r'^prepare/scenario$',
        views.scenario_prepare, name='scenario_prepare'),
    url(r'^prepare/event-based$',
        views.event_based_prepare, name='event_based_prepare'),
    url(r'^prepare/volcano$',
        views.volcano_prepare, name='volcano_prepare'),
    url(r'^download$', views.download, name='download'),
    url(r'^clean_all$', views.clean_all, name='clean_all'),
]
