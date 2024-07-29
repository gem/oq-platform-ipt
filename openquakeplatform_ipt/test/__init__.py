from openquake.moon import platform_get, platform_del
try:
    from openquakeplatform.settings import AUTH_ONLY
except:
    AUTH_ONLY = False


def setup_package():
    pla = platform_get()
    pla.init(autologin=AUTH_ONLY)


def teardown_package():
    platform_del()
