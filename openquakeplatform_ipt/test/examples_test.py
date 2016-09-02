#!/usr/bin/env python
import unittest
from openquakeplatform.test import pla

imt_examples = { 'Vulnerability': {'tag_id': 3,
                              'exams': [
                                  {'exa_id': 1, 'ret':
                                   """<?xml version="1.0" encoding="UTF-8"?> 
<nrml xmlns="http://openquake.org/xmlns/nrml/0.5"> 
	<vulnerabilityModel id="Vulnerability_test02" assetCategory="buildings" lossCategory="structural"> 
		<description>Vulnerability curves for MUR in Antioquia
Fixed consequence model</description> 
		<vulnerabilityFunction id="MUR/H:1" dist="LN">
			<imls imt="PGA">0.025 0.05 0.075 0.1 0.125 0.15 0.175 0.2 0.225 0.25 0.275 0.3 0.325 0.35 0.375 0.4 0.425 0.45 0.475 0.5 0.525 0.55 0.575 0.6</imls>
			<meanLRs>0.001 0.003 0.006006 0.023845 0.05541 0.101325 0.161288 0.235614 0.326435 0.435387 0.558104 0.681537 0.789743 0.872486 0.928431 0.962465 0.981418 0.991232 0.996021 0.998248 0.999247 0.999681 0.999866 0.999944</meanLRs>
			<covLRs>1.499993 1.488915 1.319811 0.784661 0.397836 0.37947 0.355485 0.325754 0.289426 0.245845 0.196758 0.147385 0.104103 0.071005 0.048628 0.029277 0.014494 0.006839 0.003104 0.001366 0.000588 0.000249 0.000104 0.000044</covLRs>
		</vulnerabilityFunction>
		<vulnerabilityFunction id="MUR/H:2" dist="LN">
			<imls imt="PGA">0.025 0.05 0.075 0.1 0.125 0.15 0.175 0.2 0.225 0.25 0.275 0.3 0.325 0.35 0.375 0.4 0.425 0.45 0.475 0.5 0.525 0.55 0.575 0.6</imls>
			<meanLRs>0.000621 0.034401 0.109619 0.10971 0.146987 0.238893 0.31012 0.317773 0.380724 0.428463 0.446674 0.456104 0.480333 0.536784 0.615071 0.620671 0.706434 0.778461 0.803128 0.842213 0.850487 0.883643 0.920004 0.988817</meanLRs>
			<covLRs>0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</covLRs>
		</vulnerabilityFunction>
		<vulnerabilityFunction id="MUR/H:3" dist="LN">
			<imls imt="SA(0.1)">0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1 1.05 1.1 1.15 1.2</imls>
			<meanLRs>0.005 0.0983 0.1506 0.191627 0.208749 0.22587 0.244658 0.256778 0.2789 0.296545 0.308474 0.456104 0.429906 0.465048 0.50019 0.535331 0.570473 0.605615 0.640757 0.675898 0.71104 0.746182 0.8955 0.957</meanLRs>
			<covLRs>0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0</covLRs>
		</vulnerabilityFunction>
		<vulnerabilityFunction id="111" dist="PM">
			<imls imt="PGA">0.2 0.3 0.4 0.5 0.7 0.8</imls>
			<probabilities lr="0">0.01 0.02 0.03 0.04 0.05 0.06</probabilities>
		</vulnerabilityFunction>
	</vulnerabilityModel> 
</nrml>"""}
                                  ,
                                  {'exa_id': 99, 'ret':
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
            func_name = "%s_%d_test" % (name, example['exa_id'])
            test_func = make_function(func_name,
                                      examples['tag_id'], example)

            setattr(IptExamplesTest, func_name, test_func)

generator()
