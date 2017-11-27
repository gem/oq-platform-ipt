from openquake.moon import platform_get, platform_del
try:
    from openquakeplatform.settings import STANDALONE
except:
    STANDALONE = False


def setup_package():
    pla = platform_get()
    pla.init(autologin=not STANDALONE)


def teardown_package():
    platform_del()
