import os
import sys
import time
import pytest
from http.server import SimpleHTTPRequestHandler 
from http.server import HTTPServer
import threading

from openquake.moon import platform_get, platform_del


PUBLIC_DIRECTORY = os.path.join(os.path.dirname(__file__), 'webpages')

class MyRequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        print("PATH: [%s]" % path)
        if path == '/':
            return PUBLIC_DIRECTORY + os.sep + 'index.html'
        else:
            return PUBLIC_DIRECTORY + os.sep.join(path.split('/'))


@pytest.fixture(scope="package", autouse=True)
def package_setup_teardown():
    # --- SETUP CODE GOES HERE ---
    print("\n[Setup] This runs ONCE before any tests in this package start")
    global _httpserver, _httpserver_thread
    _httpserver = HTTPServer(('', 8008), MyRequestHandler)
    _httpserver_thread = threading.Thread(target = _httpserver.serve_forever)
    _httpserver_thread.daemon = True
    try:
        _httpserver_thread.start()
    except KeyboardInterrupt:
        _httpserver_thread.shutdown()
        sys.exit(0)
    for i in range(1,1000):
        if _httpserver_thread.is_alive():
            break
        time.sleep(0.2)
        continue
            
    pla = platform_get()
    pla.init(landing="/index.html", autologin=False)
    
    yield  # This tells pytest to go execute all the tests
    
    # --- TEARDOWN CODE GOES HERE ---
    print("\n[Teardown] This runs ONCE after all tests in this package finish")

    pla.fini()
    
