#!/usr/bin/env python
import unittest
import os, sys

from openquakeplatform.test import pla

imt_examples = {
    'Vulnerability': {
        'tag_id': 3,
        'exams': [
            {'exa_id': 1, 'sfx': 'xml' },
            {'exa_id': 99, 'sfx': 'xml' }
        ]
    }
}


class IptExamplesTest(unittest.TestCase):
    pass

def make_function(func_name, exp_path, tag_id, example):
    def generated(self):
        pla.get('/ipt/?tab_id=%d&example_id=%d' % (tag_id, example['exa_id']))
        ret_tag = pla.xpath_finduniq("//textarea[@id='textareavf']")

        exp_filename = os.path.join(exp_path,
                                "example_%d.%s" % (tag_id * 100 + example['exa_id'],
                                example['sfx']))
        with open(exp_filename, 'rb') as exp_file:
            expected = exp_file.read()
        self.assertEqual(ret_tag.get_attribute("value"), expected)

    generated.__name__ = func_name
    return generated

def generator():
    exp_path = os.path.join(os.path.dirname(
        sys.modules[IptExamplesTest.__module__].__file__), 'expected')
    for name, examples in imt_examples.iteritems():
        for example in examples['exams']:
            func_name = "%s_%d_test" % (name, example['exa_id'])
            test_func = make_function(func_name, exp_path,
                                      examples['tag_id'], example)

            setattr(IptExamplesTest, func_name, test_func)

generator()
