from openquake.moon import platform_get
from .ipt_test import IptTest
from .examples_test import IptExamplesTest, IptUploadTest

def setup_package():
    pla = platform_get()
    print("setup_package: ipt")
    pla.init(autologin=False)


def teardown_package():
    pla = platform_get()
    print("teardown_package: ipt")
    pla.fini()
