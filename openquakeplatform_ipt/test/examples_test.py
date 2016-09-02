#!/usr/bin/env python
import unittest
from openquakeplatform.test import pla

imt_examples = { 'Exposure': {'tag_id': 100,
                              'exams': [
                                  {'exa_id': 1, 'ret':
                                   """<?xml version="1.0" encoding="UTF-8"?> 
<nrml xmlns="http://openquake.org/xmlns/nrml/0.5"> 
	<vulnerabilityModel id="111vv1" assetCategory="buildings" lossCategory="structural"> 
		<description>the description</description> 
		<vulnerabilityFunction id="111" dist="PM">
			<imls imt="PGA">0.2 0.3 0.4 0.5 0.7 0.8</imls>
			<probabilities lr="0">0.01 0.02 0.03 0.04 0.05 0.06</probabilities>
		</vulnerabilityFunction>
		<vulnerabilityFunction id="222" dist="PM">
			<imls imt="PGA">1.2 1.3 1.4 1.5 1.7 1.8</imls>
			<probabilities lr="0">0.01 0.02 0.03 0.04 0.05 0.06</probabilities>
		</vulnerabilityFunction>
		<vulnerabilityFunction id="333" dist="LN">
			<imls imt="PGA">0 1 2</imls>
			<meanLRs>0.1 1.1 2.1</meanLRs>
			<covLRs>0.2 1.2 2.2</covLRs>
		</vulnerabilityFunction>
	</vulnerabilityModel> 
</nrml>"""}]
                              }}


class IptExamplesTest(unittest.TestCase):
    pass

def make_function(func_name, tag_id, example):
    def generated(self):
        pla.get('/ipt/?tab_id=%d&example_id=%d' % (tag_id, example['exa_id']))
        # <textarea id="textareavf"

        ret_tag = pla.xpath_finduniq("//textarea[@id='textareavf']")

        self.assertEqual(ret_tag.get_attribute("value"), example['ret'])

    generated.__name__ = func_name
    return generated

def generator():
    for name, examples in imt_examples.iteritems():
        for example in examples['exams']:
            func_name = "%s_%d" % (name, example['exa_id'])
            test_func = make_function(func_name,
                                      examples['tag_id'], example)

            setattr(IptExamplesTest, func_name, test_func)

generator()
