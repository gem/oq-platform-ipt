from openquake.moon import platform_get, platform_del
# from .ipt_test import IptTest
# from .examples_test import IptExamplesTest, IptUploadTest


def setup_package():
    pla = platform_get()
    pla.init(autologin=False)


def teardown_package():
    platform_del()
