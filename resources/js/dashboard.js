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
        } else {
            dashboard_nav.style.left = "0px";
        }
    });

})