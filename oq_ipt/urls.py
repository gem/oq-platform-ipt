from django.conf.urls import patterns, include, url

from django.contrib import admin

import openquakeplatform.ipt

admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'oq_ipt.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^ipt/', include("openquakeplatform.ipt.urls")),
)
