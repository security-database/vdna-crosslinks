root = exports ? this

# Help with the placement of nodes
RadialPlacement = () ->
  # stores the key -> location values
  values = d3.map()
  # how much to separate each location by
  increment = 20
  # how large to make the layout
  radius = 200
  # where the center of the layout should be
  center = {"x":0, "y":0}
  # what angle to start at
  start = -120
  current = start

  # Given an center point, angle, and radius length,
  # return a radial position for that angle
  radialLocation = (center, angle, radius) ->
    x = (center.x + radius * Math.cos(angle * Math.PI / 180))
    y = (center.y + radius * Math.sin(angle * Math.PI / 180))
    {"x":x,"y":y}

  # Main entry point for RadialPlacement
  # Returns location for a particular key,
  # creating a new location if necessary.
  placement = (key) ->
    value = values.get(key)
    if !values.has(key)
      value = place(key)
    value

  # Gets a new location for input key
  place = (key) ->
    value = radialLocation(center, current, radius)
    values.set(key,value)
    current += increment
    value

  # Given a set of keys, perform some
  # magic to create a two ringed radial layout.
  # Expects radius, increment, and center to be set.
  # If there are a small number of keys, just make
  # one circle.
  setKeys = (keys) ->
    # start with an empty values
    values = d3.map()

    # number of keys to go in first circle
    firstCircleCount = 360 / increment

    # if we don't have enough keys, modify increment
    # so that they all fit in one circle
    if keys.length < firstCircleCount
      increment = 360 / keys.length

    # set locations for inner circle
    firstCircleKeys = keys.slice(0,firstCircleCount)
    firstCircleKeys.forEach (k) -> place(k)

    # set locations for outer circle
    secondCircleKeys = keys.slice(firstCircleCount)

    # setup outer circle
    radius = radius + radius / 1.8
    increment = 360 / secondCircleKeys.length

    secondCircleKeys.forEach (k) -> place(k)

  placement.keys = (_) ->
    if !arguments.length
      return d3.keys(values)
    setKeys(_)
    placement

  placement.center = (_) ->
    if !arguments.length
      return center
    center = _
    placement

  placement.radius = (_) ->
    if !arguments.length
      return radius
    radius = _
    placement

  placement.start = (_) ->
    if !arguments.length
      return start
    start = _
    current = start
    placement

  placement.increment = (_) ->
    if !arguments.length
      return increment
    increment = _
    placement

  return placement

Network = () ->
  # variables we want to access
  # in multiple places of Network
  width = 1200
  height = 600
  # allData will store the unfiltered data
  allData = []
  curLinksData = []
  curNodesData = []
  linkedByIndex = {}
  # these will hold the svg groups for
  # accessing the nodes and links display
  nodesG = null
  linksG = null
  # these will point to the circles and lines
  # of the nodes and links
  node = null
  link = null
  # variables to refect the current settings
  # of the visualization
  layout = "force"
  filter = [["cve", "Microsoft", "Mandriva", "RedHat", "Debian", "Gentoo", "Cisco", "US-CERT", "VU-CERT", "HP", "VMware", "Ubuntu", "Sun"], ["Critical", "High", "Medium", "Low", "NA"]]
  sort = ""
  # groupCenters will store our radial layout for
  # the group by artist layout.
  groupCenters = null

  # our force directed layout
  force = d3.layout.force()
  # color function used to color nodes
  nodeColors = d3.scale.category20()
  # tooltip used to display details
  tooltip = Tooltip("vis-tooltip", 230)

  # charge used in severity layout
  charge = (node) -> -Math.pow(node.radius, 2.0) / 2

  # Starting point for network visualization
  # Initializes visualization and starts force layout
  network = (selection, data) ->
    # format our data
    allData = setupData(data.message)
    # create our svg and groups
    vis = d3.select(selection).append("svg")
      .attr("width", '100%')
      .attr("height", '100%')
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRatio", "YMid meet")
    linksG = vis.append("g").attr("id", "links")
    nodesG = vis.append("g").attr("id", "nodes")
    # setup the size of the force environment
    force.size([width, height])

    setLayout("force")

    # perform rendering and start force layout
    update()

  # The update() function performs the bulk of the
  # work to setup our visualization based on the
  # current layout/sort/filter.
  #
  # update() is called everytime a parameter changes
  # and the network needs to be reset.
  update = () ->
    # filter data to show based on current filter settings.
    curNodesData = filterNodes(allData.nodes)
    curLinksData = filterLinks(allData.links, curNodesData)

    # sort nodes based on current sort and update centers for
    # radial layout
    if layout == "radial"
      severities = sortedSeverities(curNodesData, curLinksData)
      updateCenters(severities)

    # reset nodes in force layout
    force.nodes(curNodesData)

    # enter / exit for nodes
    updateNodes()

    #disable some filters
    updateF(curNodesData)

    # always show links in force layout
    if layout == "force"

      force.links(curLinksData)
      updateLinks()
    else
      # reset links so they do not interfere with
      # other layouts. updateLinks() will be called when
      # force is done animating.
      force.links([])
      # if present, remove them from svg
      if link
        link.data([]).exit().remove()
        link = null

    # start me up!
    force.start()

  # Public function to switch between layouts
  network.toggleLayout = (newLayout) ->
    force.stop()
    setLayout(newLayout)
    update()

  # Public function to switch between filter options
  network.toggleFilter = (newFilter) ->
    force.stop()
    setFilter(newFilter)
    update()

  network.updateData = (newData) ->
    allData = setupData(newData)
    link.remove()
    node.remove()
    update()

  # called once to clean up raw data and switch links to
  # point to node instances
  # Returns modified data
  setupData = (data) ->
    # initialize circle radius scale
    countExtent = d3.extent(data.nodes, (d) -> d.links)
    circleRadius = d3.scale.sqrt().range([3, 12]).domain(countExtent)

    data.nodes.forEach (n) ->
      # set initial x/y to values within the width/height
      # of the visualization
      n.x = randomnumber=Math.floor(Math.random()*width)
      n.y = randomnumber=Math.floor(Math.random()*height)
      # add radius to the node so we can use it later
      if (n.id == sname)
        n.radius = 20
      else
        n.radius = circleRadius(n.links)

    # id's -> node objects
    nodesMap  = mapNodes(data.nodes)

    # switch links to point to node objects instead of id's
    data.links.forEach (l) ->
      l.source = nodesMap.get(l.source)
      l.target = nodesMap.get(l.target)

      # linkedByIndex is used for link sorting
      linkedByIndex["#{l.source.id},#{l.target.id}"] = 1

    data

  # Helper function to map node id's to node objects.
  # Returns d3.map of ids -> nodes
  mapNodes = (nodes) ->
    nodesMap = d3.map()
    nodes.forEach (n) ->
      nodesMap.set(n.id, n)
    nodesMap

  # Helper function that returns an associative array
  # with counts of unique attr in nodes
  # attr is value stored in node, like 'artist'
  nodeCounts = (nodes, attr) ->
    counts = {}
    nodes.forEach (d) ->
      counts[d[attr]] ?= 0
      counts[d[attr]] += 1
    counts

  # Given two nodes a and b, returns true if
  # there is a link between them.
  # Uses linkedByIndex initialized in setupData
  neighboring = (a, b) ->
    linkedByIndex[a.id + "," + b.id] or
      linkedByIndex[b.id + "," + a.id]

  filterNodes = (allNodes) ->
    filteredNodes = allNodes
    filteredNodes2 = []
    filteredNodes3 = []
    filteredNodes_tmp = []
    filteredNodes_tmp2 = []
    filteredNodes_tmp3 = []

    w = 0
    z = 0

    s = 0
    v = 0

    for d, i in filter[1]
      if d != 'l'
        s++

    for d, i in filter[0]
      if (d != 'a')
        v++

    if v == 0 && s > 0
      for d, i in filter[1]
        if d == "Critical" or d == "High" or d == "Medium" or d == "Low" or d == "NA"
          filteredNodes_tmp[w] = allNodes.filter (n) ->
            n.severity == d
        w++
    else if v > 0 && s == 0
      for d, i in filter[0]
        if d == "cve" or d == "Microsoft" or d == "HP"  or d == "Gentoo" or d == "Debian" or d == "Mandriva" or d == "RedHat" or d == "VU-CERT" or d == "Ubuntu" or d == "VMware" or d == "HP" or d == "US-CERT" or d == "Cisco"
          filteredNodes_tmp[w] = allNodes.filter (n) ->
              n.vendor == d
          w++
    else if s > 0 && v > 0
      for d, i in filter[0]

        filteredNodes_tmp3 = []
        if d == "cve" or d == "Microsoft" or d == "HP"  or d == "Gentoo" or d == "Debian" or d == "Mandriva" or d == "RedHat" or d == "VU-CERT" or d == "Ubuntu" or d == "VMware" or d == "HP" or d == "US-CERT" or d == "Cisco"
          filteredNodes_tmp3 = allNodes.filter (n) ->
              n.vendor == d

          z = 0
          for j, k in filter[1]
            if j == "Critical" or j == "High" or j == "Medium" or j == "Low" or j == "NA"
              filteredNodes_tmp2 = filteredNodes_tmp3.filter (o) ->
                  o.severity == j

              filteredNodes_tmp[w] = filteredNodes_tmp2.concat(filteredNodes_tmp2)
              w++

    #remove duplicate
    rr = []
    for j, k in filteredNodes_tmp
      for a, b in j
        if (rr[a.id] != 1 )
          filteredNodes2 = filteredNodes2.concat(a)
          rr[a.id] = 1

    if w == 0
      filteredNodes2 = filteredNodes

    filteredNodes2

  # Returns array of severities sorted based on
  # current sorting method.
  sortedSeverities = (nodes,links) ->
    severities = []
    if sort == "links"
      counts = {}
      links.forEach (l) ->
        counts[l.source.severity] ?= 0
        counts[l.source.severity] += 1
        counts[l.target.severity] ?= 0
        counts[l.target.severity] += 1
      # add any missing severities that dont have any links
      nodes.forEach (n) ->
        counts[n.severity] ?= 0

      # sort based on counts
      severities = d3.entries(counts).sort (a,b) ->
        b.value - a.value
      # get just names
      severities = severities.map (v) -> v.key
    else
      # sort severities by song count
      counts = nodeCounts(nodes, "severity")
      severities = d3.entries(counts).sort (a,b) ->
        b.value - a.value
      severities = severities.map (v) -> v.key
    severities

  updateCenters = (severities) ->
    if layout == "radial"
      groupCenters = RadialPlacement().center({"x":width/2, "y":height / 2 - 100})
        .radius(300).increment(18).keys(severities)

  # Removes links from allLinks whose
  # source or target is not present in curNodes
  # Returns array of links
  filterLinks = (allLinks, curNodes) ->
    curNodes = mapNodes(curNodes)
    allLinks.filter (l) ->
      curNodes.get(l.source.id) and curNodes.get(l.target.id)

  #
  updateF = (nodes) ->
    vendors = []
    severity = []
    v = 0
    nodes.forEach (n) ->
        vendors[v] = n.vendor
        severity[v] = n.severity
        v++;

    d = d3.selectAll("#filters_vendors a")
    w = 0
    for a, b in d
      for c, e in a
        if d3.select(c).attr("id") not in vendors
          d3.select(c).classed("active", false)

    d = d3.selectAll("#filters_severity a")
    w = 0
    for a, b in d
      for c, e in a
        if d3.select(c).attr("id") not in severity
          d3.select(c).classed("active", false)


  # enter/exit display for nodes
  updateNodes = () ->
    node = nodesG.selectAll("circle.node")
      .data(curNodesData, (d) -> d.id)


    node.enter().append("circle")
      .attr("class", "node")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)
      .attr("r", (d) -> d.radius)
      .attr("href", (d) -> "?alert=" + d.id + "&depth=3")
      .style("fill", (d) ->
        if "Critical" == d.severity then "brown"
        else if "High" == d.severity then "red"
        else if "Medium" == d.severity then "orange"
        else if "Low" == d.severity then "green"
        else 'grey'
      )
      .style("stroke", (d) ->
        if d.id == sname
          "blue"
        else
          strokeFor(d)
      )
      .style("stroke-width", (d) ->
          "1.0"
      )

    node.on("mouseover", showDetails)
      .on("mouseout", hideDetails)

    node.on("click", showClick)

    node.exit().remove()

  showClick = (d) ->
      window.location = "?alert=" + d.id + "&depth=3"

  # enter/exit display for links
  updateLinks = () ->
    link = linksG.selectAll("line.link")
      .data(curLinksData, (d) -> "#{d.source.id}_#{d.target.id}")
    link.enter().append("line")
      .attr("class", "link")
      .attr("stroke", "#ddd")
      .attr("stroke-opacity", 0.8)
      .attr("x1", (d) -> d.source.x)
      .attr("y1", (d) -> d.source.y)
      .attr("x2", (d) -> d.target.x)
      .attr("y2", (d) -> d.target.y)

    link.exit().remove()

  # switches force to new layout parameters
  setLayout = (newLayout) ->
    layout = newLayout
    if layout == "force"
      force.on("tick", forceTick)
        .charge(-200)
        .gravity(.6)
    else if layout == "radial"
      force.on("tick", radialTick)
        .charge(charge)
        .gravity(.1)

  # switches filter option to new filter
  setFilter = (newFilter) ->
    filter = newFilter

  # switches sort option to new sort
  setSort = (newSort) ->
    sort = newSort

  forceTick = (e) ->
    q = d3.geom.quadtree(curNodesData)
    i = 0
    n = curNodesData.length
    q.visit collide(curNodesData[i])  while ++i < n
    d3.selectAll("circle").attr("cx", (d) ->
      d.x
    ).attr("cy", (d) ->
      d.y
    )

    link.attr("x1", (d) ->
      d.source.x
    ).attr("y1", (d) ->
      d.source.y
    ).attr("x2", (d) ->
      d.target.x
    ).attr "y2", (d) ->
      d.target.y



  collide = (node) ->
    r = node.radius + 16
    nx1 = node.x - r
    nx2 = node.x + r
    ny1 = node.y - r
    ny2 = node.y + r
    (quad, x1, y1, x2, y2) ->
      if quad.point && (quad.point != node)
        x = node.x - quad.point.x
        y = node.y - quad.point.y
        l = Math.sqrt(x * x + y * y)
        r = node.radius + quad.point.radius
        if (l < r)
          l = (l - r) / l * .5
          node.x -= x *= l
          node.y -= y *= l
          quad.point.x += x
          quad.point.y += y
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1

  # tick function for radial layout
  radialTick = (e) ->
    node.each(moveToRadialLayout(e.alpha))

    node
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

    if e.alpha < 0.03
      force.stop()
      updateLinks()

  # Adjusts x/y for each node to
  # push them towards appropriate location.
  # Uses alpha to dampen effect over time.
  moveToRadialLayout = (alpha) ->
    k = alpha * 0.1
    (d) ->
      centerNode = groupCenters(d.severity)
      d.x += (centerNode.x - d.x) * k
      d.y += (centerNode.y - d.y) * k


  # Helper function that returns stroke color for
  # particular node.
  strokeFor = (d) ->
    color = ''
    if "Critical" == d.severity then "DimGray"
    else if "High" == d.severity then "DarkRed"
    else if "Medium" == d.severity then "Chocolate"
    else if "Low" == d.severity then "DarkGreen"
    else "DimGray"

    #d3.rgb(nodeColors(color)).brighter().toString()
    #"white"

  # Mouseover tooltip function
  showDetails = (d,i) ->
    content = '<p class="main">' + d.id + ' (' + d.vendor + ')</span></p>'
    content += '<p class="main">Severity : ' + d.severity + '</span></p>'
    content += '<p class="main">Published on ' + d.published + '</span></p>'
    tooltip.showTooltip(content,d3.event)

    # higlight connected links
    if link
      link.attr("stroke", (l) ->
        if l.source == d or l.target == d then "#555" else "#ddd"
      )
      link.attr("stroke-opacity", (l) ->
        if l.source == d or l.target == d then 0.5 else 0.1
      )

    # highlight neighboring nodes
    # watch out - don't mess with node if search is currently matching
    node.style("stroke", (n) ->
      if (n.searched or neighboring(d, n)) then "#555" else strokeFor(n))
      .style("stroke-width", (n) ->
        if (n.searched or neighboring(d, n)) then 1 else 0.1
      )
      .style("fill-opacity", (n) ->
        if (n.searched or neighboring(d, n)) then 1 else 0.1
      )
    # highlight the node being moused over
    d3.select(this).style("stroke","black")
      .style("stroke-width", 1.0)
      .style("fill-opacity", 1.0)
  # Mouseout function
  hideDetails = (d,i) ->
    tooltip.hideTooltip()
    # watch out - don't mess with node if search is currently matching
    node.style("stroke", (n) -> if sname == n.id then "blue" else if !n.searched then strokeFor(n) else "#555")
      .style("stroke-width", (n) -> if sname == n.id then 1.0 else if !n.searched then 1.0 else 1.0)
      .style("fill-opacity", (n) -> if !n.searched then 1.0 else 1.0)
    if link
      link.attr("stroke", "#ddd")
        .attr("stroke-opacity", 0.8)

  # Final act of Network() function is to return the inner 'network()' function.
  return network

# Activate selector button
activate = (group, link) ->
  d3.selectAll("##{group} a").classed("active", false)
  d3.select("##{group} ##{link}").classed("active", true)

$ ->
  myNetwork = Network()

  d3.selectAll("#layouts a").on "click", (d) ->
    newLayout = d3.select(this).attr("id")
    activate("layouts", newLayout)
    myNetwork.toggleLayout(newLayout)

  d3.selectAll("#controls a").on "click", (d) ->
    newA = d3.select(this).attr("class")
    if newA == 'active'
      d3.select(this).classed("active", false)
    else
      d3.select(this).classed("active", true)

    newFilterVendors = []
    newFilterVendors_all = d3.selectAll("#filters_vendors a")
    w = 0
    for a, b in newFilterVendors_all
      for c, e in a
        if d3.select(c).attr("class") == 'active'
          newFilterVendors[w] = c.id
          w++


    newFilterSeverity = []
    newFilterSeverity_all = d3.selectAll("#filters_severity a")
    w = 0
    for a, b in newFilterSeverity_all
      for c, e in a
        if d3.select(c).attr("class") == 'active'
          newFilterSeverity[w] = c.id
          w++

    f = []
    f = [newFilterVendors, newFilterSeverity]
    #console.log(f)
    myNetwork.toggleFilter(f)


  d3.json "/crosslinks.php?alert=" + sname + "&depth=" + sdepth, (json) ->
    myNetwork("#result", json)