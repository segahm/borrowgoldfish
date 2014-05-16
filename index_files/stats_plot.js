(function () {

    "use strict";

    $(function () {
        var cb = d3.scale.category10();
        $(".evttype").each(function () {
            var el = $(this);
            el.css("color", cb(+el.data("ind")));
        });
        //  Histogram #2
        var day_hist = window.histogram().width(300)
                        .labels(['8:00-10:00','','','12-3pm','','','5pm -','','']);
        var day_data = [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]];
        for (var i=0;i<counties.length;i++){
            if (typeof(svg.hourly_density[counties[i]]) !== 'undefined'){
                day_data[i] = [svg.hourly_density[counties[i]].m,0,0,
                              svg.hourly_density[counties[i]].a,0,0,
                              svg.hourly_density[counties[i]].d,0,0];
            }
        }
        //var day_data = [[3,0,0,3,0,0,3,0,0],[3,0,0,3,0,0,3,0,0],[4,0,0,5,0,0,6,0,0]];
        d3.select("#day")
          .datum(day_data[0].map(function (d, i) {
              return day_data.map(function (d) { return d[(i)]; });
          }))
          .call(day_hist);

        // Languages.
        var event_pie = window.piechart().dim(200);
        var event_data = d3.values(svg.top_cats);  //[31, 16, 4];
        d3.select("#rest-by-cat-chart").datum(event_data).call(event_pie);


    });

})();

(function(){
    var cb = d3.scale.category10();
    var margin = {top: 0, bottom: 0, left:70   , right: 0};
    var width = 300 - margin.left - margin.right;
    var height = 170 - margin.top - margin.bottom;

    var xScale = d3.scale.linear().range([0, width]);
    var yScale = d3.scale.ordinal().rangeRoundBands([0, height], 0.2,0);

    var numTicks = 3;
    var xAxis = d3.svg.axis().scale(xScale)
                    .orient("top")
                    .tickSize((-height))
                    .ticks(numTicks);
    var barSvg = d3.select("#density").append("svg")
                .attr("width", width+margin.left+margin.right)
                .attr("height", height+margin.top+margin.bottom)
                .append("g")
                .attr("transform", "translate("+margin.left+","+margin.top+")")

    var x = barSvg.append("g")
            .attr("class", "x-axis");

    var data = [];
    for (var county in svg.top_counties){
      data.push({
        hlabel: county+', '+svg.top_counties[county].state,
        density: svg.top_counties[county].density
      });
    }
    function draw(data) {

        var xMax = d3.max(data, function(d) { return d.density; } );
        var xMin = 0;
        xScale.domain([xMin, xMax]);
        yScale.domain(data.map(function(d) { return d.hlabel; }));


        var groups = barSvg.append("g").attr("class", "labels")
                    .selectAll("text")
                    .data(data)
                    .enter()
                    .append("g");

        groups.append("text")
                .attr("x", "0")
                .attr("y", function(d) { return yScale(d.hlabel); })
                .text(function(d) { return d.hlabel; })
                .attr("text-anchor", "end")
                .attr("dy", ".9em")
                .attr("dx", "-.32em")
                .attr("id", function(d,i) { return "label"+i; });

        var bars = groups
                    .attr("class", "bars")
                    .append("rect")
                    .attr("data-ind",function(d,i) { return i;})
                    .style("fill", function (d) {
                      var ind = d3.select(this).attr("data-ind");
                      return cb(ind);
                    })
                    .attr("width", function(d) { return xScale(d.density); })
                    .attr("height", height/7)
                    .attr("x", xScale(xMin))
                    .attr("y", function(d) { return yScale(d.hlabel); });


        groups.append("text")
                .attr("x", function(d) { return xScale(d.density); })
                .attr("y", function(d) { return yScale(d.hlabel); })
                .text(function(d) { return d.density; })
                .attr("text-anchor", "end")
                .attr("dy", "1.2em")
                .attr("dx", "-.32em")
                .attr("id", "precise-value");

        x.call(xAxis);
        var grid = xScale.ticks(numTicks);
        barSvg.append("g").attr("class", "grid")
            .selectAll("line")
            .data(grid, function(d) { return d; })
            .enter().append("line")
                .attr("y1", 0)
                .attr("y2", height+margin.bottom)
                .attr("x1", function(d) { return xScale(d); })
                .attr("x2", function(d) { return xScale(d); })
                .attr("stroke", "white");

    }
    draw(data);

})();