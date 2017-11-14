from openquake.moon import Moon
from .ipt_test import IptTest
from .examples_test import IptExamplesTest, IptUploadTest


pla = Moon()
pla.primary_set()

def setup_package():
    print("setup_package: ipt")
    pla.init(autologin=False)
    import time ; time.sleep(10)

def teardown_package():
    print("teardown_package: ipt")
    pla.fini()
