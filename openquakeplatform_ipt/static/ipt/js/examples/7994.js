$(document).ready(function () {
    window.gem_example_completed = false;
    // this is a workaround for a bug fixed in jquery 1.9 (checked is toggled after that handler is fired
/*    
    $(cf_obj['vol'].pfx + " div[name='vm-structural-new'] input[name='file_upload']").submit();
    $(cf_obj['vol'].pfx + " div[name='source-model-logic-tree-file-new'] input[name='file_upload']").submit();
    $(cf_obj['vol'].pfx + " div[name='source-model-file-new'] input[name='file_upload']").submit();
    $(cf_obj['vol'].pfx + " div[name='gsim-logic-tree-file-new'] input[name='file_upload']").submit();
    $(cf_obj['vol'].pfx + " div[name='vm-structural-new'] input[name='file_upload']").submit();

    $(cf_obj['vol'].pfx + " div[name='ashfall-file-new'] input[name='file_upload']").submit();
*/

    $(cf_obj['vol'].pfx + ' input[type="checkbox"][name="ashfall"]').prop('checked', true).triggerHandler('click');
    $(cf_obj['vol'].pfx + ' input[type="checkbox"][name="lavaflow"]').prop('checked', true).triggerHandler('click');
    $(cf_obj['vol'].pfx + ' input[type="checkbox"][name="lahar"]').prop('checked', true).triggerHandler('click');
    $(cf_obj['vol'].pfx + ' input[type="checkbox"][name="pyroclasticflow"]').prop('checked', true).triggerHandler('click');

    $(cf_obj['vol'].pfx + ' div[name="ashfall-input"] select[name="in-type"]').val('openquake');
    $(cf_obj['vol'].pfx + ' div[name="lavaflow-input"] select[name="in-type"]').val('openquake');
    $(cf_obj['vol'].pfx + ' div[name="lahar-input"] select[name="in-type"]').val('openquake');
    $(cf_obj['vol'].pfx + ' div[name="pyroclasticflow-input"] select[name="in-type"]').val('openquake');

    
    $(cf_obj['vol'].pfx + ' div[name="ashfall-file-html"] select[name="file_html"]').val('ashfall_file/ashfall_vol_full.csv');
    $(cf_obj['vol'].pfx + ' div[name="lavaflow-file-html"] select[name="file_html"]').val('lavaflow_file/lavaflow_vol_full.csv');
    $(cf_obj['vol'].pfx + ' div[name="lahar-file-html"] select[name="file_html"]').val('lahar_file/lahar_vol_full.csv');
    $(cf_obj['vol'].pfx + ' div[name="pyroclasticflow-file-html"] select[name="file_html"]').val('pyroclasticflow_file/pyroclasticflow_vol_full.csv');

    console.log(    $(cf_obj['vol'].pfx + ' div[name="exposure-model-html"] select[name="file_html"]'));
    $(cf_obj['vol'].pfx + ' div[name="exposure-model-html"] select[name="file_html"]').val('exposure_model/exposure_model_vol_full.zip');

    $(cf_obj['vol'].pfx + ' div[name="fm-ashfall-file-html"] select[name="file_html"]').val('fragility_model/fragility_model_vol_full.xml');

    $(cf_obj['vol'].pfx + ' input[type="checkbox"][name="is-cons-models"]').prop('checked', true).triggerHandler('click');
    $(cf_obj['vol'].pfx + ' div[name="fm-ashfall-cons-html"] select[name="file_html"]').val('fragility_cons/consequence_model_vol_full.xml');

    // Click to download EventBase.zip
    setTimeout(function () {
        $(cf_obj['vol'].pfx + ' button[name="download"]').click();
        window.gem_example_completed = true;
    }, 1000);

    return;
});
