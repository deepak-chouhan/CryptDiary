$(document).ready(function () {



    var mobilenavbar = document.getElementById("mob-link");
    var menu_icon = document.getElementById("menu-button");

    var mobile = document.getElementById("mobile-nav");

    mobilenavbar.style.opacity = "0";
    mobilenavbar.style.height = "0px";
    mobilenavbar.style.pointerEvents = "none";

    function navfunctioning() {
        if (mobilenavbar.style.opacity === "0") {
            mobilenavbar.style.height = "100px";
            mobilenavbar.style.opacity = "1";
            mobilenavbar.style.pointerEvents = "all";
        } else {
            mobilenavbar.style.height = "0px";
            mobilenavbar.style.opacity = "0";
            mobilenavbar.style.pointerEvents = "none";
        }
    }

    $(menu_icon).click(function () {
        navfunctioning();
    });

});