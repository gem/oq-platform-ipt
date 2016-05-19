$(document).ready(function () {
    $('.cf_gid #tabs[name="subtabs"] a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    });

    $('.cf_gid input[name="risk"]').click(function (e) {
        $('.cf_gid span[name="risk-content"]').css('display', $(e.target).is(':checked') ? '' : 'none');
    });
});

    
