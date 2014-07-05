//continue-page2
//FULL PAGE
/*$(document).ready(function() {
    $('#fullpage').fullpage();
    });*/
//TOP BANNER
/*function hide_banner () {
    $("#banner").hide();
    document.cookie = "bgf_promise=true";
    analytics.track('Engaged', {
    category: 'Nonshared',
    label: 'Banner'
    });
    return false;
    }
    $(function () {
    $("#banner .promise").on("click", hide_banner);
    var cookie = document.cookie,
    s = cookie.indexOf("bgf_promise="), e;
    if (s == -1) return;
    s = cookie.indexOf("=", s) + 1;
    e = cookie.indexOf(";", s);
    if (e == -1) e = cookie.length;
    if (cookie.substring(s, e) === "true") $("#banner").hide();
    });*/
$(document).ready(function () {
    $.fn.serializeObject = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
    $("#owl-offers").owlCarousel();
    /*$('#tabs3 a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    });*/
    $('#continue-page2').click(function (e) {
        var options = $('#form_opportunities').val() || [];
        var link;
        var nextLink;
        for (k in options) {
            var option = options[k];
            switch (option) {
            case 'credit':
                link = '/submit?customer=1';
                break;
            default:
                link = '/static/form-lend2.html';
                nextLink = '/submit?customer=2';
            }
            analytics.track('Form', {
                category: 'Preference',
                label: option
            });
        }
        if (link) {
            $('#form-page2').load(link, function () {
                analytics.page({
                    title: 'Offers Info',
                    url: full_url + '#info',
                    path: es + url + '/#info',
                    referrer: full_url
                });
                $('#form-page2').removeClass('hidden');
                //clean bottom form just in case
                $('#form-page3').removeClass('hidden');
                $('#form-page3').addClass('hidden');
                $('#form-page3').html('');
                if (nextLink) {
                    $(window).scrollTop($('#offer-2').position().top);
                    $('#continue-submit').click(function (ev) {
                        var post_form = $('#form2').serializeObject();
                        //report these choices
                        for (name in post_form) {
                            if (name.indexOf('email') < 0 && post_form[name]) {
                                analytics.track('Form', {
                                    category: name,
                                    label: post_form[name]
                                });
                            }
                        }
                        $('#form-page3').load(nextLink, post_form, function () {
                            analytics.page({
                                title: 'Loan Apply',
                                url: full_url + '#claim',
                                path: es + url + '/#claim',
                                referrer: full_url
                            });
                            $('#form-page3').removeClass('hidden');
                            $(window).scrollTop($('#offer-3').position().top);
                        });
                        ev.preventDefault();
                    });
                } else {
                    $(window).scrollTop($('#offer-3').position().top);
                }
            });
        }
        e.preventDefault();
    });
    $('#continue-lender').click(function (e) {
        $.getJSON('/submit', {
            page: $("#page-company-id").val(),
            lender: $("#form_lender_email").val()
        }, function (data) {
            if (data.status === 'OK') {
                $('#lender-message').html('<div class="alert alert-success" role="alert">Thank You. We will contact you shortly.</div>');
                $('#continue-lender').remove();
            } else {
                $('#lender-message').html('<div class="alert alert-danger" role="alert">Sorry! Looks like contact email was entered incorrectly.</div>');
            }
        });
        e.preventDefault();
    });
    /*
    $( "#form2" ).on( "submit", function( event ) {
    console.log( $( this ).serialize() );
    });
    */
});
 
