google.load("jquery", "1");
google.setOnLoadCallback(function() {
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    $("#cover").css({
        width : windowWidth,
        height : windowHeight
    });

    var messageWidth = 200;
    var messageHeight = 100;

    $("#cover_message").css({
        width : 300,
        height : 250,
        left : (windowWidth / 2) - (300 / 2),
        top : (windowHeight / 2) - (250 / 2)
    });
    $("#cover_contents").css({
        width : 300,
        height : 200,
        left : (windowWidth / 2) - (300 / 2),
        top : (windowHeight / 2) - (250 / 2)
    });
    $("#cover_button").css({
        width : 300,
        height : 50 / 2,
        left : (windowWidth / 2) - (300 / 2),
        top : (windowHeight / 2) + (250 / 2 - 50)
    });

    window.setTimeout(function() {
        $("#cover").css({
            display : "none"
        });
    }, 10000);

});
