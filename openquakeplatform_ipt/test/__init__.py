from .platform import pla
from .ipt_test import IptTest
from .examples_test import IptExamplesTest, IptUploadTest


def setup_package():
    print("setup_package: ipt")
    pla.init(autologin=False)


def teardown_package():
    print("teardown_package: ipt")
    pla.fini()
