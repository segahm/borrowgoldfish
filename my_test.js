$("#claim-box").mousedown(function() {
    analytics.page({
        title: 'Claim Business',
        url: '{{full_url}}#claim',
        path: '{{#es}}/es{{/es}}{{url}}/#claim',
        referrer: '{{full_url}}'
    });
});

$('#valuation-box').mousedown(function() {
    analytics.page({
        title: 'Valuation Info',
        url: '{{full_url}}#info',
        path: '{{#es}}/es{{/es}}{{url}}/#info',
        referrer: '{{full_url}}'
    });
});