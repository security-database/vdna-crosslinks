
var width = $("div.result").width();
var height = $("div.result").height();
var linkedByIndex = {};
var force = d3.layout.force();
var oldNodeId = '';
var inside = false;
var lastinside = false;
var getFocus_stop = false;
var forcealpha;
var filter, layout;

//var alert = 'MS13-052';

var layout = "force";
var filter = [["cve", "Microsoft", "Mandriva", "RedHat", "Debian", "Gentoo", "Cisco", "US-CERT", "VU-CERT", "HP", "VMware", "Ubuntu", "Sun"], ["Critical", "High", "Medium", "Low", "NA"], ["Nessus", "Snort", "OpenVas", "Metasploit"]]
  // Create a grapher instance (width, height, options)

var grapher = new Grapher();
var network = [];

// Variable to keep track of the node we're dragging and the current offset
var dragging = null;
var offset = null;
var startPoint;

var groupCenters;
var severities;



Opentip.styles.crosstip = {
  borderColor: "lightgrey",
  background: "white",
  borderRadius: 0
}
Opentip.defaultStyle = "crosstip";
var myOpentip = new Opentip($("#tooltip2"), "", { style: "crosstip", showOn: "mouseover" });

var opts = {
      lines: 13 // The number of lines to draw
    , length: 7 // The length of each line
    , width: 2 // The line thickness
    , radius: 44 // The radius of the inner circle
    , scale: 1 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#000' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 50 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: true // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
  }


var target = document.getElementById('result')
var spinner = new Spinner(opts).spin(target);
target.appendChild(spinner.el)

d3.json("/crosslinks.php?alert=" + sname + "&depth=" + sdepth, function(error, data) {
  spinner.stop();
  network = setupData(data.message);
  setLayout(layout);
  force.size([width, height]);
  update();
  grapher.canvas.id = "canvas";
  document.getElementById('result').appendChild(grapher.canvas);
});



function setupData(data) {

  var circleRadius, countExtent, nodesMap;
  countExtent = d3.extent(data.nodes, function(d) {
    return d.links;
  });
  circleRadius = d3.scale.sqrt().range([3, 12]).domain(countExtent);

  data.nodes.forEach(function(n) {
    var randomnumber;
    //n.x = width / 2;
    //n.y = height / 2;
    n.x = randomnumber = Math.floor(Math.random() * width);
    n.y = randomnumber = Math.floor(Math.random() * height);
    n.weight= 1;
    n.r = circleRadius(n.links);
    return n.radius = circleRadius(n.links);
  });
  nodesMap = mapNodes(data.nodes);
  data.links.forEach(function(l) {
    l.source = nodesMap.get(l.source);
    l.target = nodesMap.get(l.target);
    return linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
  });

  var newlinks = [];
  var sourcename = "";
  var targetname = "";


  for (i = 0; i < data.nodes.length; i++) {
    data.nodes[i].alpha = 1;

    if (data.nodes[i].type == "Alert" && data.nodes[i].severity == "Critical") {
      data.nodes[i].color = "rgba(165,42,42,"+data.nodes[i].alpha+")";
    }
    if (data.nodes[i].type == "Alert" && data.nodes[i].severity == "High") {
      data.nodes[i].color = "rgba(255,0,0,"+data.nodes[i].alpha+")";
    }
    if (data.nodes[i].type == "Alert" && data.nodes[i].severity == "Low") {
      data.nodes[i].color = "rgba(0,128,0,"+data.nodes[i].alpha+")";
    }
    if (data.nodes[i].type == "Alert" && data.nodes[i].severity == "Medium") {
      data.nodes[i].color = "rgba(255,165,0,"+data.nodes[i].alpha+")";
    }
    if (data.nodes[i].type == "Alert" && (data.nodes[i].severity == "NA" || data.nodes[i].severity == "")) {
      data.nodes[i].color = "rgba(128,128,128,"+data.nodes[i].alpha+")";
    }
    if (data.nodes[i].type == "Nessus") {
      data.nodes[i].color = "rgba(0,0,205,"+data.nodes[i].alpha+")";
      data.nodes[i].severity = "Nessus";
    }
    if (data.nodes[i].type == "Snort") {
      data.nodes[i].color = "rgba(176,196,222,"+data.nodes[i].alpha+")";
      data.nodes[i].severity = "Snort";
    }
    if (data.nodes[i].type == "OpenVas") {
      data.nodes[i].color = "rgba(123,104,238,"+data.nodes[i].alpha+")";
      data.nodes[i].severity = "OpenVas";
    }
    if (data.nodes[i].type == "Metasploit") {
      data.nodes[i].color = "rgba(65,105,225,"+data.nodes[i].alpha+")";
      data.nodes[i].severity = "Metasploit";
    }
  }

  for (i = 0; i < data.links.length; i++) {
    data.links[i].color = "rgba(221, 221, 221, 0.5)";
    data.links[i].lineWidth = 2;

  }

  return data;
};

function mapNodes(nodes) {
  var nodesMap;
  nodesMap = d3.map();
  nodes.forEach(function(n) {
    return nodesMap.set(n.id, n);
  });
  return nodesMap;
};

// Helper function for offsets.
function getOffset (e) {
  if (e.offsetX) return {x: e.offsetX, y: e.offsetY};
  var rect = e.target.getBoundingClientRect();
  var x = e.clientX - rect.left,
      y = e.clientY - rect.top;
  return {x: x, y: y};
};



// forceTick gets called on each tick of D3's force
var forceTick = function () {



  var q = d3.geom.quadtree(network.nodes);
  var n = network.nodes.length;

  for (i = 1; i < n; ++i) q.visit(collide(network.nodes[i]));

  grapher.center();
  grapher.update(); // update the grapher
  grapher.render();
};

var __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
};


function toggleFilter(newFilter) {
  filter = newFilter;
  return update();
};


function update() {
  var curNodesData = [];
  var curLinksData = [];

  curNodesData = filterNodes(network.nodes)
  curLinksData = filterLinks(network.links, curNodesData)


  force.nodes(curNodesData);

  for ( var i in curLinksData) {
    var sourcename;
    var targetname;
    sourcename = curLinksData[i].source;
    targetname = curLinksData[i].target;
    for ( var j in curNodesData) {
      if (curNodesData[j].id == targetname.id) {
        curLinksData[i].to = j;
      }
      if (curNodesData[j].id == sourcename.id) {
        curLinksData[i].from = j;
      }
    }
  }

  if (layout === "radial") {
    severities = sortedSeverities(network.nodes, network.links);
    updateCenters(severities);
    force.links([]);
  }

  if (layout === "force") {
    force.links(curLinksData);
  }

  force.start();

  //while (force.alpha() > 0.08) {force.tick(); } // trick

  var n = []
  n.nodes = curNodesData;
  n.links = curLinksData;
  grapher.data(n);

  updateButtons(curNodesData);
  updateExist();
};




grapher.on('mousedown', function (e) {
  var eOffset = getOffset(e);
  var point = grapher.getDataPosition(eOffset);
  var nodeId = getNodeIdAt(point);

  if (nodeId > -1) {
    window.location = "?alert=" + grapher.props.data.nodes[nodeId].id + "&depth=3";
  } else {
    startPoint = getOffset(e);
  }
});


grapher.on('wheel', function (e) {
  var center = getOffset(e);
  var delta = e.deltaY / 5000;
  // Call zoom with the ratio and center.
  grapher.zoom(1 + delta, center);
  // Render the graph

  grapher.render();
});

grapher.on('mouseup', function (e) {
  // Stop listening to mouse events, and cleanup startPoint
  startPoint = undefined;
});


grapher.on('mousemove', function (e) {
  var eOffset = getOffset(e);
  var point = grapher.getDataPosition(eOffset);
  var nodeId = getNodeIdAt(point);
  var linkedNodes = [];

    if (startPoint) {
      var translate = grapher.translate(),
          offset = getOffset(e);

      translate[0] += (offset.x - startPoint.x);
      translate[1] += (offset.y - startPoint.y);

      startPoint = offset;
      grapher.translate(translate);
    } else {

    if (nodeId > -1) {
      if (inside == false || oldNodeId != nodeId) {

        if (force.alpha() > 0) {
          forcealpha = force.alpha();
          force.stop();
          getFocus_stop = true;
        }


        for ( var i in grapher.props.data.links) {
          if (grapher.props.data.links[i].from == nodeId || grapher.props.data.links[i].to == nodeId  ) {
            linkedNodes[grapher.props.data.links[i].from] = grapher.props.data.links[i].target;
            linkedNodes[grapher.props.data.links[i].to] = grapher.props.data.links[i].source;
            linkedNodes[nodeId] = grapher.props.data.nodes[nodeId];
          }
        }

        for ( var i in grapher.props.data.links) {
          if ((grapher.props.data.links[i].from == nodeId && typeof linkedNodes[grapher.props.data.links[i].to] != undefined)
            || (grapher.props.data.links[i].to == nodeId && typeof linkedNodes[grapher.props.data.links[i].from] != undefined)) {
            grapher.props.data.links[i].color = "rgba(221, 221, 221, 1)";
          } else {
            grapher.props.data.links[i].color = "rgba(221, 221, 221, 0.1)";
          }
        }


        for (var i in grapher.props.data.nodes) {
          if (linkedNodes[i] != undefined) {
            grapher.props.data.nodes[i].alpha = 1;
          } else {
            grapher.props.data.nodes[i].alpha = 0.1;
          }


          if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "Critical") {
            grapher.props.data.nodes[i].color = "rgba(165,42,42,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "High") {
            grapher.props.data.nodes[i].color = "rgba(255,0,0,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "Low") {
            grapher.props.data.nodes[i].color = "rgba(0,128,0,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "Medium") {
            grapher.props.data.nodes[i].color = "rgba(255,165,0,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "NA") {
            grapher.props.data.nodes[i].color = "rgba(128,128,128,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Nessus") {
            grapher.props.data.nodes[i].color = "rgba(0,0,205,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Snort") {
            grapher.props.data.nodes[i].color = "rgba(176,196,222,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "OpenVas") {
            grapher.props.data.nodes[i].color = "rgba(123,104,238,"+grapher.props.data.nodes[i].alpha+")";
          }
          if (grapher.props.data.nodes[i].type == "Metasploit") {
            grapher.props.data.nodes[i].color = "rgba(65,105,225,"+grapher.props.data.nodes[i].alpha+")";
          }
        }

        content = '<p class="main">' + grapher.props.data.nodes[nodeId].id + ' (' + grapher.props.data.nodes[nodeId].vendor + ')</p>';
        if (grapher.props.data.nodes[nodeId].type == "Alert") {
          content += '<p class="main">Severity: ' + grapher.props.data.nodes[nodeId].severity + '</p>';
          content += '<p class="main">Published on: ' + grapher.props.data.nodes[nodeId].published + '</p>';
        }
        content += '<p class="main">Links: ' + grapher.props.data.nodes[nodeId].links + '</p>';

        myOpentip.show();
        myOpentip.setContent(content);

        grapher.update();
        grapher.render();
        inside = true;
        lastinside = true;
        oldNodeId = nodeId;
      }
    } else {
      if (lastinside == true && getFocus_stop == true) {
        force.resume(forcealpha);
        getFocus_stop = false;
      }
      inside = false;
      lastinside = false;

      for ( var i in grapher.props.data.links) {
        grapher.props.data.links[i].color = "rgba(221, 221, 221, 0.5)";
      }
      for (var i in grapher.props.data.nodes) {
        grapher.props.data.nodes[i].alpha = 1;

        if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "Critical") {
          grapher.props.data.nodes[i].color = "rgba(165,42,42,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "High") {
          grapher.props.data.nodes[i].color = "rgba(255,0,0,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "Low") {
          grapher.props.data.nodes[i].color = "rgba(0,128,0,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "Medium") {
          grapher.props.data.nodes[i].color = "rgba(255,165,0,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Alert" && grapher.props.data.nodes[i].severity == "NA") {
          grapher.props.data.nodes[i].color = "rgba(128,128,128,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Nessus") {
          grapher.props.data.nodes[i].color = "rgba(0,0,205,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Snort") {
          grapher.props.data.nodes[i].color = "rgba(176,196,222,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "OpenVas") {
          grapher.props.data.nodes[i].color = "rgba(123,104,238,"+grapher.props.data.nodes[i].alpha+")";
        }
        if (grapher.props.data.nodes[i].type == "Metasploit") {
          grapher.props.data.nodes[i].color = "rgba(65,105,225,"+grapher.props.data.nodes[i].alpha+")";
        }
      }


      myOpentip.setContent("");
      myOpentip.hide();
      oldNodeId = '';
      grapher.update();
      grapher.render();
      dragging = offset = null;
    }
  }

});


function collide(node) {
  var r = node.radius + 16,
  nx1 = node.x - r,
  nx2 = node.x + r,
  ny1 = node.y - r,
  ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
      y = node.y - quad.point.y,
      l = Math.sqrt(x * x + y * y),
      r = node.radius + quad.point.radius + 5;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  };
};

// We create a function that determines whether a click event falls on a node.
function getNodeIdAt(point) {
  var node = -1,
      x = point.x, y = point.y;

  grapher.props.data.nodes.every(function (n, i) {
    var inX = x <= n.x + n.r && x >= n.x - n.r,
        inY = y <= n.y + n.r && y >= n.y - n.r,
        found = inX && inY;
    if (found) node = i;
    return !found;
  });

  return node;
};


function updateExist(nodes) {

  vendors = [];
  severity = [];
  exploit = [];
  v=0;

  network.nodes.forEach(function(n) {

    severity.push(n.severity);

    if (n.vendor === "Nessus" || n.vendor === "Snort" || n.vendor === "OpenVas" || n.vendor === "Metasploit") {
        exploit.push(n.vendor);
      } else {
        vendors.push(n.vendor);
      }
      return;
  });

  vendors = jQuery.unique( vendors );
  exploit = jQuery.unique( exploit );
  severity = jQuery.unique( severity );



  for (var b in d3.selectAll("#filters_vendors a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_vendors a")[0][b]).attr("id"), __indexOf.call(vendors, _ref) < 0) {
    } else {
      d3.select(d3.selectAll("#filters_vendors a")[0][b]).classed("exist", true);
    }
  }
  for (var b in d3.selectAll("#filters_severity a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_severity a")[0][b]).attr("id"), __indexOf.call(severity, _ref) < 0) {
    } else {
      d3.select(d3.selectAll("#filters_severity a")[0][b]).classed("exist", true);
    }
  }
  for (var b in d3.selectAll("#filters_exploits a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_exploits a")[0][b]).attr("id"), __indexOf.call(exploit, _ref) < 0) {
    } else {
      d3.select(d3.selectAll("#filters_exploits a")[0][b]).classed("exist", true);
    }
  }
}


function updateButtons(nodes) {
  vendors = [];
  severity = [];
  exploit = [];
  v=0;

  nodes.forEach(function(n) {
    severity.push(n.severity);

    if (n.vendor === "Nessus" || n.vendor === "Snort" || n.vendor === "OpenVas" || n.vendor === "Metasploit") {
        exploit.push(n.vendor);
      } else {
        vendors.push(n.vendor);
      }
      return;
  });

  vendors = jQuery.unique( vendors );
  exploit = jQuery.unique( exploit );
  severity = jQuery.unique( severity );

  for (var b in d3.selectAll("#filters_vendors a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_vendors a")[0][b]).attr("id"), __indexOf.call(vendors, _ref) < 0) {
      d3.select(d3.selectAll("#filters_vendors a")[0][b]).classed("active", false);
    }
  }
  for (var b in d3.selectAll("#filters_severity a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_severity a")[0][b]).attr("id"), __indexOf.call(severity, _ref) < 0) {
      d3.select(d3.selectAll("#filters_severity a")[0][b]).classed("active", false);
    }
  }
  for (var b in d3.selectAll("#filters_exploits a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_exploits a")[0][b]).attr("id"), __indexOf.call(exploit, _ref) < 0) {
      d3.select(d3.selectAll("#filters_exploits a")[0][b]).classed("active", false);
    }
  }
};

function filterNodes(allNodes) {
  w = 0;

  vendors = [];
  severity = [];
  exploit = [];

  d3.selectAll("#filters_vendors a")[0].forEach(function(n) {
    vendors.push(n.id);
    return;
  });
  d3.selectAll("#filters_severity a")[0].forEach(function(n) {
    severity.push(n.id);
    return;
  });
  d3.selectAll("#filters_exploits a")[0].forEach(function(n) {
    exploit.push(n.id);
    return;
  });


  var filteredNodes_tmp = [];
  var filteredNodes2 = [];
  var filteredNodes_tmp4 = [];

  v = filter[0].length; //vendors
  s = filter[1].length; //severity
  e = filter[2].length;//exploits

  if (v === 0 && s > 0) {
    for (var i in filter[1]) {
      if (filter[1][i] ===  __indexOf.call(severity, filter[1][i]) < 0) {
      } else {
        filteredNodes_tmp[w] = allNodes.filter(function(n) {
          return n.severity === filter[1][i];
        });
        w++;
       }
    }
  } else if (v > 0 && s === 0) {
    for (var i in filter[0]) {
       if (filter[0][i] ===  __indexOf.call(vendors, filter[0][i]) < 0) {
       } else {
        filteredNodes_tmp[w] = allNodes.filter(function(n) {
          return n.vendor === filter[0][i];
        });
        w++;
       }
    }
  } else if (s > 0 && v > 0) {
    for (var i in filter[0]) {
      filteredNodes_tmp3 = [];
      if (filter[0][i] ===  __indexOf.call(vendors, filter[0][i]) < 0) {
      } else {
        filteredNodes_tmp3 = allNodes.filter(function(n) {
          return n.vendor === filter[0][i];
        });

        for (var k in filter[1]) {
          if (filter[1][k] ===  __indexOf.call(severity, filter[1][k]) < 0) {
          } else {
            filteredNodes_tmp2 = filteredNodes_tmp3.filter(function(o) {
              return o.severity === filter[1][k];
            });
            filteredNodes_tmp[w] = filteredNodes_tmp2.concat(filteredNodes_tmp2);
            w++;
          }
        }
      }
    }
  }

  if (e > 0) {
    for (var i in filter[2]) {
       if (filter[2][i] ===  __indexOf.call(exploit, filter[2][i]) < 0) {
       } else {
        filteredNodes_tmp4 = allNodes.filter(function(n) {
          return n.vendor === filter[2][i];
        });
        filteredNodes_tmp[w] = filteredNodes_tmp4.concat(filteredNodes_tmp4);
        w++;
       }
    }
  }

  rr = [];
  for (var k in filteredNodes_tmp) {
    for (var b in filteredNodes_tmp[k]) {
      if (rr[filteredNodes_tmp[k][b].id] !== 1) {
        filteredNodes2 = filteredNodes2.concat(filteredNodes_tmp[k][b]);
        rr[filteredNodes_tmp[k][b].id] = 1;
      }
    }
  }

  if (w === 0) {
    filteredNodes2 = filteredNodes;
  }
  return filteredNodes2;
};

function filterLinks(allLinks, curNodes) {
  curNodes = mapNodes(curNodes);
  return allLinks.filter(function(l) {
    return curNodes.get(l.source.id) && curNodes.get(l.target.id);
  });
};

function mapNodes(nodes) {
  var nodesMap;
  nodesMap = d3.map();
  nodes.forEach(function(n) {
    return nodesMap.set(n.id, n);
  });
  return nodesMap;
};


d3.selectAll("#layouts a").on("click", function(d) {
  var newLayout;
  newLayout = d3.select(this).attr("id");
  activate("layouts", newLayout);
  return toggleLayout(newLayout);
});


d3.selectAll("#controls a").on("click", function(d) {

  if (d3.select(this).attr("class").indexOf("active") > -1) {
    d3.select(this).classed("active", false);
  } else {
    d3.select(this).classed("active", true);
  }

  newFilterVendors = [];
  for (var b in d3.selectAll("#filters_vendors a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_vendors a")[0][b]).attr("id"), __indexOf.call(vendors, _ref) < 0) {
    } else {
      if (d3.select(d3.selectAll("#filters_vendors a")[0][b]).classed("active")) {
        newFilterVendors.push(d3.selectAll("#filters_vendors a")[0][b].id);
      }
    }
  }
  newFilterSeverity = [];
  for (var b in d3.selectAll("#filters_severity a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_severity a")[0][b]).attr("id"), __indexOf.call(severity, _ref) < 0) {
    } else {
      if (d3.select(d3.selectAll("#filters_severity a")[0][b]).classed("active")) {
        newFilterSeverity.push(d3.selectAll("#filters_severity a")[0][b].id);
      }
    }
  }
  newFilterExploit = [];
  for (var b in d3.selectAll("#filters_exploits a")[0]) {
    if (_ref = d3.select(d3.selectAll("#filters_exploits a")[0][b]).attr("id"), __indexOf.call(exploit, _ref) < 0) {
    } else {
      if (d3.select(d3.selectAll("#filters_exploits a")[0][b]).classed("active")) {
        newFilterExploit.push(d3.selectAll("#filters_exploits a")[0][b].id);
      }
    }
  }

  return toggleFilter([newFilterVendors, newFilterSeverity, newFilterExploit]);
});

function activate(group, link) {
  d3.selectAll("#" + group + " a").classed("active", false);
  return d3.select("#" + group + " #" + link).classed("active", true);
};

var RadialPlacement;
function RadialPlacement() {
  var center, current, increment, place, placement, radialLocation, radius, setKeys, start, values;
  values = d3.map();
  increment = 20;
  radius = 200;
  center = {
    "x": 0,
    "y": 0
  };
  start = -120;
  current = start;
  radialLocation = function(center, angle, radius) {
    var x, y;
    x = center.x + radius * Math.cos(angle * Math.PI / 180);
    y = center.y + radius * Math.sin(angle * Math.PI / 180);
    return {
      "x": x,
      "y": y
    };
  };
  placement = function(key) {
    var value;
    value = values.get(key);
    if (!values.has(key)) {
      value = place(key);
    }
    return value;
  };
  place = function(key) {
    var value;
    value = radialLocation(center, current, radius);
    values.set(key, value);
    current += increment;
    return value;
  };
  setKeys = function(keys) {
    var firstCircleCount, firstCircleKeys, secondCircleKeys;
    values = d3.map();
    firstCircleCount = 360 / increment;
    if (keys.length < firstCircleCount) {
      increment = 360 / keys.length;
    }
    firstCircleKeys = keys.slice(0, firstCircleCount);
    firstCircleKeys.forEach(function(k) {
      return place(k);
    });
    secondCircleKeys = keys.slice(firstCircleCount);
    radius = radius + radius / 1.8;
    increment = 360 / secondCircleKeys.length;
    return secondCircleKeys.forEach(function(k) {
      return place(k);
    });
  };
  placement.keys = function(_) {
    if (!arguments.length) {
      return d3.keys(values);
    }
    setKeys(_);
    return placement;
  };
  placement.center = function(_) {
    if (!arguments.length) {
      return center;
    }
    center = _;
    return placement;
  };
  placement.radius = function(_) {
    if (!arguments.length) {
      return radius;
    }
    radius = _;
    return placement;
  };
  placement.start = function(_) {
    if (!arguments.length) {
      return start;
    }
    start = _;
    current = start;
    return placement;
  };
  placement.increment = function(_) {
    if (!arguments.length) {
      return increment;
    }
    increment = _;
    return placement;
  };
  return placement;
};

function sortedSeverities(nodes, links) {
  var counts, severities;
  severities = [];
  counts = nodeCounts(nodes, "severity");
  severities = d3.entries(counts).sort(function(a, b) {
    return b.value - a.value;
  });
  severities = severities.map(function(v) {
    return v.key;
  });
  return severities;
};

function updateCenters(severities) {
    return groupCenters = RadialPlacement().center({
      "x": width / 2,
      "y": height / 2 - 100
    }).radius(300).increment(18).keys(severities);
};

function setLayout(newLayout) {
  layout = newLayout;
  if (layout === "force") {
    return force.on("tick", forceTick).charge(-200).gravity(.6).friction(.5);
  } else if (layout === "radial") {
    return force.on("tick", radialTick).charge(charge).gravity(.1).friction(.9);
  }
};


function moveToRadialLayout(node, alpha) {
  var centerNode;
  centerNode = groupCenters(node.severity);
  node.x += (centerNode.x - node.x) * alpha * 0.1;
  return node.y += (centerNode.y - node.y) * alpha * 0.1;
};

function nodeCounts(nodes, attr) {
  var counts;
  counts = {};
  nodes.forEach(function(d) {
    var _name, _ref;
    if ((_ref = counts[_name = d[attr]]) == null) {
      counts[_name] = 0;
    }
    return counts[d[attr]] += 1;
  });
  return counts;
};

function radialTick(e) {
  severities = sortedSeverities(network.nodes, network.links);
  updateCenters(severities);

  for (var i in network.nodes) {
    moveToRadialLayout(network.nodes[i], e.alpha);
    network.nodes[i].cx = network.nodes[i].x;
    network.nodes[i].cy = network.nodes[i].y;
  }

  var q = d3.geom.quadtree(network.nodes);
  var n = network.nodes.length;

  for (i = 1; i < n; ++i) q.visit(collide(network.nodes[i]));

  grapher.center();
  grapher.update();
  grapher.render();
};

function toggleLayout(newLayout) {
  setLayout(newLayout);
  update();
};

function charge(node) {
  return -Math.pow(node.radius, 2.0) / 2;
};