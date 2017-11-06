#!/usr/bin/env python
import unittest
import os, sys
import codecs

from openquakeplatform.test import pla

imt_examples = {
    'Exposure': {
        'tab_id': 1,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaex']"],
             'sfx': 'xml' },
            {'exa_id': 98, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='validationErrorMsg']"],
             'sfx': 'txt' },
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaex']"],
             'sfx': 'xml' }
        ]
    },
    'Fragility': {
        'tab_id': 2,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': [
                "//div[@id='tabs-2']//div[@id='validationErrorMsg'][@style='display: none;']",
                "//textarea[@id='textareaff']"],
             'sfx': 'xml' },
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-2']//div[@id='validationErrorMsg'][@style='display: none;']",
                                     "//textarea[@id='textareaff']"],
             'sfx': 'xml' }
        ]
    },
    'Vulnerability': {
        'tab_id': 4,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-3']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareavf']"],
             'sfx': 'xml' },
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-3']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareavf']"],
             'sfx': 'xml' }
        ]
    },
    'SiteConditions': {
        'tab_id': 6,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareasc']"],
             'sfx': 'xml' },
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareasc']"],
             'sfx': 'xml' }
        ]
    }
    'ConfigurationFile': {
        'tab_id': 7,
        'exams': [
            {'exa_id': 99, 'subtab_id': 3,
             'xpath': ["//div[@id='tabs-6']//div[@id='validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareasc']"],
             'sfx': 'xml' }
        ]
    }
}


class IptExamplesTest(unittest.TestCase):
    pass


def make_function(func_name, exp_path, tab_id, subtab_id, example):
    def generated(self):
        pla.get('/ipt/?tab_id=%d&example_id=%d' % (tab_id, example['exa_id']))
        for xpath in example['xpath']:
            ret_tag = pla.xpath_finduniq(xpath, times=20)

        exp_filename = os.path.join(
            exp_path, "example_%d%s" % (
                tab_id * 1000 + example['exa_id'] * 10 + subtab_id,
                exampleexample['sfx']))
        with codecs.open(exp_filename, 'r', 'utf-8') as exp_file:
            expected = exp_file.read()

        ret = ret_tag.get_attribute("value")
        if ret is None:
            ret = ret_tag.get_attribute('innerHTML')
        self.assertEqual(ret, expected)

    generated.__name__ = func_name
    return generated

def generator():
    exp_path = os.path.join(os.path.dirname(
        sys.modules[IptExamplesTest.__module__].__file__), 'expected')
    for name, examples in imt_examples.iteritems():
        for example in examples['exams']:
            func_name = "%s_%d_test" % (name, example['exa_id'])
            test_func = make_function(
                func_name, exp_path, examples['tab_id'],
                examples['subtab_id'], example)

            setattr(IptExamplesTest, func_name, test_func)

generator()
