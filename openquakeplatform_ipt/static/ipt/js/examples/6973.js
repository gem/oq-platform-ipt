$(document).ready(function () {
    window.gem_example_completed = false;
    $(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="risk"]').prop('checked', true).triggerHandler('click');
    // this is a workaround for a bug fixed in jquery 1.9 (checked is toggled after that handler is fired
    $(cf_obj['e_b'].pfx + " div[name='exposure-model-new'] input[name='file_upload']").submit();
    $(cf_obj['e_b'].pfx + " div[name='vm-structural-new'] input[name='file_upload']").submit();
    $(cf_obj['e_b'].pfx + " div[name='source-model-logic-tree-file-new'] input[name='file_upload']").submit();
    $(cf_obj['e_b'].pfx + " div[name='source-model-file-new'] input[name='file_upload']").submit();
    $(cf_obj['e_b'].pfx + " div[name='gsim-logic-tree-file-new'] input[name='file_upload']").submit();

    $(cf_obj['e_b'].pfx + " div[name='region-grid'] input[name='grid_spacing']").val("5.0");

    var data = [
        [ "40", "40" ], ["30", "30"], ["20", "20" ]
    ];

    var table = $(cf_obj['e_b'].pfx + ' div[name="table"]').handsontable('getInstance');
    table.loadData(data);

    setTimeout(function () {
        $(cf_obj['e_b'].pfx + ' div[name="risk-outputs"] input[type="checkbox"][name="individual-curves"]').prop('checked', false).triggerHandler('click');

        $(cf_obj['e_b'].pfx + ' div[name="exposure-model-html"] select[name="file_html"]').val('exposure_model/exposure_model.xml');
        $(cf_obj['e_b'].pfx + ' div[name="vm-structural-html"] select[name="file_html"]').val('vulnerability_model/vulnerability_model_BOG.xml');
        $(cf_obj['e_b'].pfx + ' div[name="source-model-logic-tree-file-html"] select[name="file_html"]').val('source_model_logic_tree_file/source_model_logic_tree.xml');
        $(cf_obj['e_b'].pfx + ' div[name="source-model-file-html"] select[name="file_html"]').val('source_model_file/int_col_bog.xml');
        $(cf_obj['e_b'].pfx + ' div[name="gsim-logic-tree-file-html"] select[name="file_html"]').val('gsim_logic_tree_file/gmpe_logic_tree.xml');

        // Click check rupture mesh spacing and area source discretization
        $(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="rupture_mesh_spacing_choice"]').prop('checked', true).triggerHandler('click');
        $(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="area_source_discretization_choice"]').prop('checked', true).triggerHandler('click');

        $(cf_obj['e_b'].pfx + ' div[name="hazard-calculation"] select[name="ground-motion-correlation"]').val('JB2009');
        // Click to download EventBase.zip
        $(cf_obj['e_b'].pfx + ' button[name="download"]').click();
        window.gem_example_completed = true;
    }, 1000);
});
