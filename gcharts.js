// CHARTS
    var svg = {{{svg}}};
    var counties = {{{json_counties}}};
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(drawChart);
    function drawChart() {
    var ar;
    //peer comparison
    var options = {
    legend: { position: "none" },
    title: '{{charts[0].title}}',
    hAxis: {title: '', titleTextStyle: {color: 'black'}}
    };
    var data = google.visualization.arrayToDataTable([
    ['Metric', '{{charts[0].metric}}', { role: "style" } ],
    ['social popularity',{{peers.popularity}},'color: #EBF1E6'],
    ['reviews',  {{peers.reviews}},'color: #EBF1E6'],
    ['website',  {{peers.web}},'color: #EBF1E6']
    ]);
    var chart = new google.visualization.ColumnChart(document.getElementById('peer-comparison'));
    chart.draw(data, options);
    options = {
    legend: { position: "none" },
    title: '',
    bar: {groupWidth: "45%"},
    hAxis: {title: '{{charts[0].hAxis}}', titleTextStyle: {color: 'black'}}
    };
    data = google.visualization.arrayToDataTable([
    ['Metric', '{{charts[0].metric}}', { role: "style" } ],
    ['price',  {{peers.price}},'color: #E5D9C9;'],
    ['location',{{peers.location}},'color: #E5D9C9']
    ]);
    chart = new google.visualization.ColumnChart(document.getElementById('peer-comparison-2'));
    {{#settings.is_dev}}
    /*google.visualization.events.addListener(chart, 'ready', function(){
    $("#owl-charts").addClass( "owl-carousel owl-theme" );
    //do coroussel only after chart is drawn
    $(document).ready(function(){
    $("#owl-charts").owlCarousel({responsive: false,itemsScaleUp: true});
    });
    });*/
    {{/settings.is_dev}}
    chart.draw(data, options);
    //segmentation in a county
    ar = [['Type of Food', '# of restaurants']];
    var topc = svg.top_cats;
    c_color = {};
    colors = ['#CBE0F4','#ffde6b','#E5D9C9','#C1EDC8'];
    var row = 0;
    for (var k in topc){
    c_color[k] = colors[row];
    ar.push([k,parseFloat(topc[k])]);
    row++;
    }
    data = google.visualization.arrayToDataTable(ar);
    $(".evttype2").each(function () {
    var el = $(this);
    el.css("color", c_color[el.data("ind")]);
    });
    options = {
    title: '{{charts[1].title}}',
    chartArea:{left:0,top:5,width:'100%',height:'100%'},
    colors: colors,
    legend: {position: "none"},
    width: "100%"
    };
    chart = new google.visualization.PieChart(document.getElementById('top-segments'));
    chart.draw(data, options);
    //restaurant density
    ar = [['County','# of people per restaurant',{ role: "style" }]];
    var tc = svg.top_counties;
    c_color = {};
    colors = ['#CBE0F4','#ffde6b','#E5D9C9'];
    row = 0;
    for (var c in tc){
    c_color[c] = colors[row];
    ar.push([c+', '+tc[c].state,tc[c].density,'color: '+c_color[c]]);
    row++
    }
    $(".evttype").each(function () {
    var el = $(this);
    el.css("color", c_color[el.data("ind")]);
    });
    data = google.visualization.arrayToDataTable(ar);
    options = {
    title: '{{charts[2].title}}',
    width: "50%",
    legend: { position: "none" }
    };
    chart = new google.visualization.BarChart(document.getElementById('rest-density'));
    chart.draw(data, options);
    //restaurant hourly operations
    ar = [['hour'],['8:00-10:00'],['12-3pm'],['5pm - ']];
    var hr = svg.hourly_density;
    colors = [];
    for (var c in hr){
    colors.push(c_color[c]);
    var tot = tc[c].people/tc[c].density;
    ar[0].push(c);
    ar[1].push(hr[c].m/tot);
    ar[2].push(hr[c].a/tot);
    ar[3].push(hr[c].d/tot);
    }
    for (var h=1;h<4;h++){
    tot = ar[h][1]+ar[h][2]+ar[h][3];
    ar[h][1] = Math.round(ar[h][1]/tot*100)/100;
    ar[h][2] = Math.round(ar[h][2]/tot*100)/100;
    ar[h][3] = Math.round(ar[h][3]/tot*100)/100;
    }
    data = google.visualization.arrayToDataTable(ar);
    options = {
    title: '{{charts[3].title}}',
    colors: colors,
    legend: { position: "none" },
    vAxis:{
    format:'##%',
    viewWindow: {max: 1}
    },
    width: "50%",
    rx: 10,
    ry: 10,
    bar: { groupWidth: '50%' },
    isStacked: true,
    };
    chart = new google.visualization.ColumnChart(document.getElementById('rest-hourly'));
    chart.draw(data, options);
    }