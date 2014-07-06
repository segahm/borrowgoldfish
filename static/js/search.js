
$(document).ready(function () {
    $('#business-search').submit(function(e){
        var url = $(this).attr('action');
        var keywords = $('#business-search input').val();
        if (keywords){
            url += '&q='+encodeURIComponent(keywords);
            $.getJSON(url, {}, function (data) {
                if (data.items && data.items.length > 0) {
                    analytics.track('Search', {
                        category: 'Home',
                        label: keywords
                    });
                    window.location.href = data.items[0].link;
                } else {
                    $('#business-search-message').html('<div class="alert alert-danger" role="alert">Looks like this business is outside of our current coverage. But we can change that: <a href="mailto:grow@caura.co" class="alert-link">grow@caura.co</a></div>');
                }
            });
        }
        e.preventDefault();
    });
});

// $(document).ready(function () {
//     var myStates = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
//         'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
//         'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
//         'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
//         'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
//         'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
//         'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
//         'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
//         'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
//     ];
//     // constructs the suggestion engine
//     var states = new Bloodhound({
//         datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
//         queryTokenizer: Bloodhound.tokenizers.whitespace,
//         // `states` is an array of state names defined in "The Basics"
//         local: $.map(myStates, function (state) {
//             return {
//                 value: state
//             };
//         })
//     });

//     // kicks off the loading/processing of `local` and `prefetch`
//     states.initialize();

//     $('#bloodhound .typeahead').typeahead({
//         hint: true,
//         highlight: true,
//         minLength: 1
//     }, {
//         name: 'states',
//         displayKey: 'value',
//         // `ttAdapter` wraps the suggestion engine in an adapter that
//         // is compatible with the typeahead jQuery plugin
//         source: states.ttAdapter()
//         /*,
//         templates: {
//             empty: [
//                 '<div class="empty-message">',
//                 'unable to find any Best Picture winners that match the current query',
//                 '</div>'
//             ].join('\n'),
//             suggestion: Handlebars.compile('<p><strong>{{value}}</strong> – {{year}}</p>')
//         }*/
//     });
// });
// $(document).ready(function () {
//     var which = Math.round(Math.random() * 2);
//     $('#header').addClass('pic' + which);
// });
document.cookie = "bgf_promise=true"; //landing page