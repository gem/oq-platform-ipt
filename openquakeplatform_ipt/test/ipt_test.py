#!/usr/bin/env python
import unittest
from openquake.moon import platform_get
from selenium.webdriver.common.keys import Keys


class IptTest(unittest.TestCase):
    def check_empty_cells_test(self):
        pla = platform_get()
        pla.get('/ipt')

        # initially, we are in the exposure tab
        # and the handson table is empty

        # <button id="saveBtnEX" type="button" style="display: block;"
        #     class="btn btn-primary">Convert to NRML</button>

        convert_btn = pla.xpath_finduniq(
            "//div[contains(concat(' ',normalize-space(@class),' '),"
            "' ex_gid ')]//button[@id='convertBtn' and @type='button'"
            " and normalize-space(text())='Convert to NRML']")

        # required to avoiding wrong click on overlapping "About" link
        convert_btn.location_once_scrolled_into_view

        convert_btn.click()

        pla.xpath_finduniq(
            "//div[contains(concat(' ',normalize-space(@class),' '),"
            "' ex_gid ')]//div[@id='outputDiv']//div[@id='validationErrorMsg'"
            " and normalize-space(text())='Validation error:"
            " empty cell at coords (1, 1).']")

    def add_rows_tables_test(self):
        pla = platform_get()
        pla.get('/ipt')

        footer = pla.xpath_finduniq("//footer")

        # hide footer
        pla.driver.execute_script(
            "$(arguments[0]).attr('style','display:none;')", footer)

        # Check add rows for exposure table
        new_row_btn = pla.xpath_finduniq(
            "//button[@name='new_row_add' and @class='btn'"
            "and @data-gem-id='0' and normalize-space(text())='New Row']")

        # Click add row and check if exists new rows
        for row in range(4, 6):
            new_row_btn.click()
            pla.xpath_findfirst(
                "//div[@class='relative']"
                "//span[@class='rowHeader'"
                " and normalize-space(text())='%s']" % row)

        new_table_btn = pla.xpath_finduniq(
            "//button[@id='new_exposuretbl_add'"
            " and normalize-space(text())='Add New Table']")

        new_table_btn.send_keys(Keys.PAGE_DOWN)

        # Click add row and check if exists new rows
        for id_tbl in range(1, 2):
            new_table_btn.click()
            print('id table: %s' % id_tbl)
            new_table_btn = pla.xpath_finduniq(
                "//div[@name='exposuretbl-%s']" % id_tbl)

            # Check add rows for exposure table
            new_row_new_table_btn = pla.xpath_finduniq(
                "//button[@name='new_row_add' and @class='btn'"
                "and @data-gem-id='1' and normalize-space(text())='New Row']")

            # Click add row and check if exists new rows
            for new_table_row in range(4, 6):
                new_row_new_table_btn.click()
                pla.xpath_findfirst(
                    "//div[@class='relative']"
                    "//span[@class='rowHeader'"
                    " and normalize-space(text())='%s']" % new_table_row)
