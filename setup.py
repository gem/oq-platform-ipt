import os
import sys
import re
from setuptools import setup


def get_version():
    version_re = r"^__version__\s+=\s+['\"]([^'\"]*)['\"]"
    version = None

    package_init = 'openquakeplatform_ipt/__init__.py'
    for line in open(package_init, 'r'):
        version_match = re.search(version_re, line, re.M)
        if version_match:
            version = version_match.group(1)
            break
    else:
        sys.exit('__version__ variable not found in %s' % package_init)

    return version


def get_readme():
    if sys.version_info[0] == 3:
        kwargs = {'encoding': 'utf-8'}
    else:
        kwargs = {}

    with open(os.path.join(os.path.abspath(os.path.dirname(__file__)),
                           'README.rst'), **kwargs) as readme:
        return readme.read()


# allow setup.py to be run from any path
os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))

version = get_version()
readme = get_readme()

setup(
    name='oq-platform-ipt',
    version=version,
    packages=["openquakeplatform_ipt"],
    include_package_data=True,
    license='BSD License',  # example license
    description='Input Preparation Toolkit for OpenQuake Platform.',
    long_description=readme,
    url='http://github.com/gem/oq-platform-ipt',
    author='GEM Foundation',
    author_email='devops@openquake.org',
    install_requires=[
        'django >=1.5, <2.3',
    ],
    classifiers=[
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Scientists',
        'License :: OSI Approved :: AGPL3',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
)
