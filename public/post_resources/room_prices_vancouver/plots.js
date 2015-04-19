function numByNeigh() {
  var textWidth = $('div.content').width();

  if (textWidth <= 800) {
    // Two Lines
    var mapWidth = textWidth;
    var histWidth = textWidth;
  }
  else {
    // Same line
    var mapWidth = textWidth * 2.0/3.0;
    var histWidth = textWidth * 1.0 / 3.0;
  }
  var mapHeight = 600,
      histHeight = 600;

  var mapMargin = { left: 0, right: 0, top: 0, bottom: 0};
  var histMargin = { left: 10, right: 10, top: 40, bottom: 100 };

  var svg = d3.select("#numbyneigh").append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

  var hist = d3.select("#numbyneigh").append("svg")
    .attr("width", histWidth)
    .attr("height", histHeight)
    .attr("class", "histogram");

  queue()
    .defer(d3.json, '/public/post_resources/room_prices_vancouver/local.topo.json')
    .defer(d3.json, '/public/post_resources/room_prices_vancouver/neigh_prices.json')
    .defer(d3.json, '/public/post_resources/room_prices_vancouver/coastlines.topo.json')
    .await(function(error, local, mapdata) {
      if (error) return console.error(error);

      var height = mapHeight - mapMargin.top - mapMargin.bottom,
          width = mapWidth - mapMargin.left - mapMargin.right;

      // Extract GeoJSON, this is a featurecollection
      var areas = topojson.feature(local, local.objects.local);

      var center = d3.geo.centroid(areas);
      var projection = d3.geo.albers()
        .scale(1)
        .translate([0, 0]);

      var path = d3.geo.path().projection(projection);

      // Compute the bounds of a feature of interest, then derive scale & translate.
      var b = path.bounds(areas),
        s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

      projection.scale(s)
        .translate(t);

      var quantize = d3.scale.quantize()
        .domain([400, 800])
        .range(colorbrewer.Greens[9]);


      svg.selectAll(".localareas").data(areas.features).enter()
        .append("path")
        .attr('d', path)
        .attr("class", 'localareas')
        .attr("fill", function(d) {
          return quantize(mapdata[d.properties.Name]);
        })
        .attr("class", function(d) {
          return 'batch-' + d.properties.Name.replace(/\s/g, "-");
        })
        .on("mouseover", function(d) {
          return highlightBatch(d.properties.Name);
        })
        .on("mouseout", function(d) {
          return lowlightBatch(d.properties.Name);
        });

      svg.selectAll("text")
        .data(areas.features)
        .enter()
        .append("svg:text")
        .text(function(d) {
          return d.properties.Name.match(/[A-Z]/g).join('');
        })
        .attr("x", function(d) {
          return path.centroid(d)[0];
        })
        .attr("y", function(d) {
          return path.centroid(d)[1];
        })
        .attr("text-anchor", "middle")
        .attr('font-size', '12pt')
        .attr('fill', '#131313')
        .attr("class", function(d) {
          return 'batch-' + d.properties.Name.replace(/\s/g, "-");
        })
        .on("mouseover", function(d) {
          return highlightBatch(d.properties.Name);
        })
        .on("mouseout", function(d) {
          return lowlightBatch(d.properties.Name);
        });

      var values = [];
      for (var k in mapdata) {
        values.push(mapdata[k]);
      }

      var xScale = d3.scale.linear()
        .domain([0, d3.max(values)])
        .range([0, histWidth - 220]);

      var yScale = d3.scale.ordinal()
        .domain(Object.keys(mapdata))
        .rangeBands([0, histHeight], 0.2);


      // Histogram
      hist.selectAll('rect').data(Object.keys(mapdata)).enter()
        .append("rect")
        .attr("fill", function(d) {
          return quantize(mapdata[d]);
        })
        .attr('x', 180)
        .attr("y", function(d) {
          return yScale(d);
        })
        .attr("width", function(d) {
          return xScale(mapdata[d]);
        })
        .attr("height", yScale.rangeBand())
        .attr("class", function(d) {
          return 'batch-' + d.replace(/\s/g, "-");
        })
        .on("mouseover", highlightBatch)
        .on("mouseout", lowlightBatch);

      hist.selectAll('text').data(Object.keys(mapdata)).enter()
        .append("text")
        .attr("x", 170)
        .attr("text-anchor", "end")
        .attr("y", function(d) {
          return yScale(d);
        })
        .attr("dy", yScale.rangeBand() / 1.5)
        .text(function(d) {
          return d;
        });

      hist.selectAll('text1').data(Object.keys(mapdata)).enter()
        .append("text")
        .attr("x", function(d) {
          return xScale(mapdata[d]) + 190;
        })
        .attr("y", function(d) {
          return yScale(d);
        })
        .attr("dy", yScale.rangeBand() / 1.7)
        .attr('font-size', '8pt')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .attr('fill', '#888888')
        .text(function(d) {
          return '\$ ' + Math.round(mapdata[d]);
        });

      function highlightBatch(d) {
        d3.selectAll('.batch-' + d.replace(/\s/g, "-")).classed("highlight", true);
      };

      function lowlightBatch(d) {
        d3.selectAll('.batch-' + d.replace(/\s/g, "-")).classed("highlight", false);
      };

    });

};

function popularKeywords() {
  var textWidth = $('div.content').width();
  var chartWidth = Math.min(800, textWidth),
      chartHeight = chartWidth / 1.2;

  var margin = {left: 50, right: 150, top: 10, bottom: 10 };

  var hist = d3.select("#popularKeywords").append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .append('g')
    .attr("transform", 'translate(' + margin.left + ',' + margin.top + ')');

  d3.json("/public/post_resources/room_prices_vancouver/hotwords.json",
    function (error, data) {
      // Data massagement
      var data = _.map(data, function (val, key) {
        return {'name' : key, 'value': val, 'sign': Math.sign(val)};
      }).sort( function (a, b) { return - a.value + b.value; });

      var height = chartHeight - margin.top - margin.bottom,
          width = chartWidth - margin.left - margin.right;

      var x = d3.scale.linear().range([0, width]);
      var y = d3.scale.ordinal().rangeRoundBands([0, height], .2);

      x.domain(d3.extent(data, function(d) {
        return d.value; })).nice();

      y.domain(data.map(function(d) { return d.name; }));

      hist.selectAll(".bar")
        .data(data)
        .enter().append("rect")
          .attr("class", function(d) { return d.value < 0 ? "bar negative" : "bar positive"; })
          .attr("x", function(d) { return x(Math.min(0, d.value)); })
          .attr("y", function(d) { return y(d.name); })
          .attr("width", function(d) { return Math.abs(x(d.value) - x(0)); })
          .attr("height", y.rangeBand());


      hist.selectAll("text")
        .data(data)
        .enter().append("text")
          //.attr("class", function(d) { return d.value < 0 ? "bar negative" : "bar positive"; })
          .attr("x", function(d) { return  x(Math.max(0, d.value) + 5); })
          .attr("y", function(d) { return y(d.name) + 23; })
          .text( function (d) { return d.name; })
          .attr('font-weight', 'bold');


      hist.selectAll("pricetext")
        .data(data)
        .enter().append("text")
        .attr("x", function(d) { return  x(0) + d.sign *  10; })
        .attr("y", function(d) { return y(d.name) + 23; })
        .attr('text-anchor', function (d) { return d.sign == -1 ? 'end' : 'start'; } )
        .text( function (d) {
          var sign = (d.sign == -1) ? '' : '+';
          return sign +   d.value; })
        .attr('fill', '#ffffff')
        .attr('font-weight', 'bold')
        .attr('font-size', '10pt');
    }
  );
}


function postFrequency() {
  var textWidth = $('div.content').width();

  var chartWidth = Math.min(800, textWidth);
  var chartHeight = chartWidth / 1.2;
  var margin = { left: 10, right: 10, top: 40, bottom: 100 };

  var histWidth = chartWidth - margin.left - margin.right,
      histHeight = chartHeight - margin.top - margin.bottom;

  var hist = d3.select("#postFrequency").append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .append('g')
    .attr("transform", 'translate(' + margin.left + ',' + margin.top + ')');

  d3.json("/public/post_resources/room_prices_vancouver/survival.json",
    function (error, data) {
      // Data massagement
      var data = _.map(data, function (val, key) {
        return {'name' : key, 'value': val};
      });

      var height = histHeight,
          width = histWidth;

      var x = d3.scale.ordinal().rangeRoundBands([0, width], .2);
      var y = d3.scale.linear().range([0, height]);

      y.domain(d3.extent(data, function(d) {
        return d.value; }));

      x.domain(data.map(function(d) { return d.name; }));

      hist.selectAll(".bar")
        .data(data)
        .enter().append("rect")
          .attr("class", "positive")
          .attr("x", function(d) { return x(d.name); })
          .attr("y", function(d) { return height - y(d.value); })
          .attr("width", function(d) { return x.rangeBand(); })
          .attr("height",function(d) { return y(d.value); } );

      hist.selectAll("text")
        .data(data)
        .enter().append("text")
          .attr("x", function(d) { return x(d.name) + x.rangeBand() / 2; })
          .attr("y", function(d) { return height + 30; })
          .attr('text-anchor', 'middle')
          .attr('font-weight', 'bold')
          .text(function (d) { return d.name; });


      hist.selectAll("labels")
        .data(data)
        .enter().append("text")
          .attr("x", function(d) { return x(d.name) + x.rangeBand() / 2; })
          .attr("y", function(d) { return height - y(d.value) - 10; })
          .attr('text-anchor', 'middle')
          .attr('font-weight', 'bold')
          .attr('font-size', '10pt')
          .attr('fill', '#888888')
          .text(function (d) { return Math.round(d.value * 100); });

      // Y axis
      hist.append('text')
        .attr('transform', 'translate(' + width / 2 + ',' + 10 + ') ')
        .text('Remaining Posts (%)')
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px');

      // X axis
      hist.append('text')
        .attr('x', histWidth / 2)
        .attr('y', height + 60)
        .text('Day')
        .attr('text-anchor', 'middle');
      }
    );

}
function popularKeywordsBubble() {

  var textWidth = $('div.content').width();
  var bubble = d3.select("#popularKeywords").append("svg")
    .attr("width", textWidth)
    .attr("height", 600)
    .append('g')
    .attr('transform', 'translate (2, 2)');

  d3.json("/public/post_resources/room_prices_vancouver/hotwords.json",
    function (error, data) {

      // Data massagement
      var dataList = _.map(data, function (val, key) {
        return {'name' : key, 'value': Math.abs(val), 'sign': Math.sign(val)};
      });
      var dataNested = {'name': 'root', 'children': dataList}

      // Layout
      var layout = d3.layout.pack().size([textWidth, 600]).padding(5);
      var nodes = layout.nodes(dataNested);

      bubble.selectAll('circle').data(nodes)
        .enter()
        .append("circle")
        .filter( function (d) { return d.name != 'root'; })
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', function(d) { return d.r; })
        .attr('class',
          function (d) { return (d.sign == -1) ? 'negative' : 'positive'; });

      // Labels
      bubble.selectAll('text').data(nodes)
        .enter()
        .append("text")
        .filter( function (d) { return d.name != 'root'; })
        .attr('x', function (d) { return d.x; })
        .attr('y', function(d) { return d.y + 0.45 * d.r; })
        .text(function (d) {
          return d.name; })
        .attr('fill', '#ffffff')
        .attr('text-anchor', 'middle')
        .attr('font-size', function (d) {
          return 0.3 * d.r + 'px'; });

      // Prices
      bubble.selectAll('pricetext').data(nodes)
        .enter()
        .append("text")
        .filter( function (d) { return d.name != 'root'; })
        .attr('x', function (d) { return d.x; })
        .attr('y', function(d) { return d.y + 0.05 * d.r; })
        .text(function (d) {
          var sign = (d.sign == -1) ? '-' : '+';
          return  sign + d.value; })
        .attr('fill', '#ffffff')
        .attr('text-anchor', 'middle')
        .attr('font-size', function (d) {
          return 0.5 * d.r + 'px'; })
        .append('tspan').text('$').attr('font-size', function (d) { return 0.3 * d.r + 'px'; });

    }
  );
};

function mean( values ) {
  /* Calculate mean */
  var sum = 0.0;
  for (var i in values) {

    var val = values[i];
    if (typeof val != "number")
      console.error('mean only accepts numeric input, got ' + typeof val);
    else
      sum += val;
  }

  return sum/values.length;
};
