function gem_tableHeightUpdate(tbl, $box) {
    tbl.render();

    console.log('gem_tableHeight');
    /* console.log(tbl);
       console.log($box);
       console.log($(tbl.container).find('div.wtHolder').find('div.wtHider')); */

    var h_min = 100, h_max = 300;
    var h_prev = $box.height();
    var h = $(tbl.container).find('div.wtHolder').find('div.wtHider').height() + 20;

    /* console.log('h_prev: ' + h_prev + 'h: ' + h); */
    if (h_prev <= h_min && h > h_min ||
        h_prev > h_min && h_prev < h_max ||
        h_prev >= h_max && h < h_max) {
        $box.css('height', (h > h_max ? h_max : (h < h_min ? h_min : h)) + 'px');
        tbl.render();
        /* console.log('recomputed'); */
    }
}

