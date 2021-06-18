$(document).ready(function(){


    var check_box = document.getElementById("show-password");
    var password = document.getElementById("password");

    // Show hide password
    $(check_box).click(function () { 

        if(password.type === "password"){
            password.type = "text";
        }
        else{
            password.type = "password"
        }

    });

});