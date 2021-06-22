$(document).ready(function () {

    var dashboard_nav = document.getElementById("side-nav");
    var swidth = $(window).width();

    if (swidth <= 767) {
        dashboard_nav.style.left = "-150px";
    }

    $(".dashboard-menu").click(function () {

        if (dashboard_nav.style.left === "0px") {
            dashboard_nav.style.left = "-150px";
            dashboard_nav.style.pointerEvents = "none";
        } else {
            dashboard_nav.style.left = "0px"
            dashboard_nav.style.pointerEvents = "all";
        }

    });

    $(window).resize(function () {
        var w = $(window).width();
        if (w <= 767 && dashboard_nav.style.left == "0px") {
            $('.sidebar').removeAttr('style');
            dashboard_nav.style.left = "-150px";
        }

        if (w >= 767 && dashboard_nav.style.left == "-150px") {
            $('.sidebar').removeAttr('style');
            dashboard_nav.style.left = "0";
        }

    });

    var add_button = document.getElementById("add-asset");
    var asset = document.getElementById("asset");
    var asset_remove = document.getElementById("asset-remove");

    $(add_button).click(function () {
        asset.style.opacity = "1";
        asset.style.pointerEvents = "all";
    });

    $(asset_remove).click(function () {
        asset.style.opacity = "0"
        asset.style.pointerEvents = "none"
    });

})