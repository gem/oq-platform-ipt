from django.conf.urls import patterns, include, url

from django.contrib import admin
from django.views.generic import TemplateView


import openquakeplatform_plugins.ipt

js_info_dict = {
    'domain': 'djangojs',
    'packages': ('geonode',)
}

admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'oq_ipt.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

# Meta
    url(r'^lang\.js$', TemplateView.as_view(template_name='lang.js', content_type='text/javascript'), name='lang'),

    url(r'^jsi18n/$', 'django.views.i18n.javascript_catalog',
                                  js_info_dict, name='jscat'),
    (r'^i18n/', include('django.conf.urls.i18n')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^ipt/', include("openquakeplatform_plugins.ipt.urls"), name='home'),
)
