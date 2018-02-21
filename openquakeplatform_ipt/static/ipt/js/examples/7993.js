$(document).ready(function () {
    window.gem_example_completed = false;
    // this is a workaround for a bug fixed in jquery 1.9 (checked is toggled after that handler is fired
    // $(cf_obj['scen'].pfx + " div[name='rupture-file-new'] input[name='file_upload']").submit();

    setTimeout(function () {
        $(cf_obj['e_b'].pfx + ' div[name="exposure-model-new"] select[name="file_html"]').val('stochastic_event_base/exposure_model.xml');
        $(cf_obj['e_b'].pfx + ' div[name="vm-structural-new"] select[name="file_html"]').val('stochastic_event_base/vulnerability_model_BOG.xml');
        $(cf_obj['e_b'].pfx + ' div[name="source-model-logic-tree-file-new"] select[name="file_html"]').val('stochastic_event_base/source_model_logic_tree.xml');
        $(cf_obj['e_b'].pfx + ' div[name="source-model-file-new"] select[name="file_html"]').val('stochastic_event_base/int_col_bog.xml');
        $(cf_obj['e_b'].pfx + ' div[name="gsim-logic-tree-file-new"] select[name="file_html"]').val('stochastic_event_base/gmpe_logic_tree.xml');
        $(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="rupture_mesh_spacing_choice"]').prop('checked', true).triggerHandler('click');
        $(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="area_source_discretization_choice"]').prop('checked', true).triggerHandler('click');
        // waiting for gmpe list population
        // $(cf_obj['scen'].pfx + ' div[name="hazard-gmpe_specify-gmpe"] div.sol-label-text:contains("AbrahamsonEtAl2014RegCHN")'
        //  ).click()
        $(cf_obj['e_b'].pfx + ' button[name="download"]').click();
        window.gem_example_completed = true;
    }, 1000);
});
