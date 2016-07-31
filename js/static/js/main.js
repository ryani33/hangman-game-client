(function ($) {
    $("#new-word-btn").click(function(){
        event.preventDefault();
        window.location.replace("/api/new");
    });
    $("#start-btn").click(function(){
        event.preventDefault();
        window.location.replace("/api/start");
    });
    $("#submit-btn").click(function(){
        $("#new-guess-form").attr("action", "/api/submit");
    });
    $('#hint-check').click(function() {
        if ($(this).prop('checked')){
            $('#hint-text').removeClass('hide');        
        } else {
            $('#hint-text').addClass('hide');
        } 
    });
})(jQuery);