var userLoggedIntoFacebook = false;

/* fbAsyncInit() is called automatically when the SDK loads */
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1607908772873325',
        xfbml      : true,
        version    : 'v2.7'
    });

    FB.Event.subscribe("auth.statusChange", checkStatus);

    /* Check login status after init */
    FB.getLoginStatus(function(response) {
        checkStatus(response);
    });
};

/* Load the facebook SDK */
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

/* Report user login status - called by fbAsyncInit() */
function checkStatus(response) {
    if (response.status == "connected") {
        userLoggedIntoFacebook = true;
        createFacebookGraph();
    } else {
        userLoggedIntoFacebook = false;
    }
}

/* Onlogin callback for the facebook login button */
function onFacebookLogin() {
    checkStatus();
}
