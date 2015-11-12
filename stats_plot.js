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
        var hdens = svg.hourly_density;
        var r = svg.top_counties;
        for (var i=0;i<counties.length;i++){
            var c = counties[i];
            var tot = r[c].people/r[c].density;
            if (typeof(hdens[c]) !== 'undefined'){
                day_data[i] = [hdens[c].m/tot,0,0,
                              hdens[c].a/tot,0,0,
                              hdens[c].d/tot,0,0];
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
    var margin = {top: 0, bottom: 0, left:100   , right: 0};
    var width = 330 - margin.left - margin.right;
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
    for (var i=0;i<counties.length;i++){
      var c = counties[i];
      data.push({
        hlabel: c+', '+svg.top_counties[c].state,
        density: svg.top_counties[c].density
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