var Family_tree = function() {
    var that = Object.create(Family_tree.prototype);
    // Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;

    // size of the diagram
    var viewerWidth = $(document).width();
    var viewerHeight = $(document).height();

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    that.search = function() {
        root.children.forEach(collapse);
        var query = document.getElementById("search_input").value.toLowerCase();
        var find_all = filterQuery(query);
        clearSearchResultsTable(); // clear previous search results
        clearErrorMessages(); // clear error messages
        if (query) {
           if (find_all.length === 0) { // no results
                var no_results = document.createElement("td");
                no_results.id = "error_message";
                no_results.innerHTML = "no results found";
                document.getElementById("results_row1").appendChild(no_results);
                root.children.forEach(collapse);
            } else if (find_all.length > 18) { // too many results to display
                var too_many_results = document.createElement("td");
                too_many_results.id = "error_message";
                too_many_results.innerHTML = "too many results. please be more specific.";
                document.getElementById("results_row1").appendChild(too_many_results);
                root.children.forEach(collapse);
            } else if (find_all.length === 1) { // 1 node matches this query
                var path = searchTree(root, query, []);
                console.log(path);
                openPaths(path);
                highlightPath(path[path.length-1]); // highlight the path to the leaf
            } else { // multiple nodes match this query, display the results
                var i = 1;
                find_all = find_all.sort();
                find_all.forEach(function(el) {
                    var row;
                    if (i === 1) {
                        row = document.getElementById("results_row1");
                    } else if (i === 2) {
                        row = document.getElementById("results_row2");
                    } else if (i === 3) {
                        row = document.getElementById("results_row3");
                    }
                    var cell = row.insertCell(-1);
                    var link = document.createElement("a");
                    link.innerHTML = el;
                    link.onclick = function() {
                        var path = searchTree(root, el.toLowerCase(), []);
                        console.log(path);
                        openPaths(path);
                        highlightPath(path[path.length-1]);
                    };
                    cell.appendChild(link);
                    i++;
                    if (i === 4) {
                        i = 1;
                    }
                });
            }
        }
    }

    function clearErrorMessages() {
        if (document.getElementById("error_message")) {
            var error_node = document.getElementById("error_message");
            document.getElementById("input_section").removeChild(error_node);
        }
    }

    function clearSearchResultsTable() {
        var row1 = document.getElementById("results_row1");
        var row2 = document.getElementById("results_row2");
        var row3 = document.getElementById("results_row3");
        while (row1.firstChild) {
            row1.removeChild(row1.firstChild);
        }
        while (row2.firstChild) {
            row2.removeChild(row2.firstChild);
        }
        while (row3.firstChild) {
            row3.removeChild(row3.firstChild);
        }
    }

    that.expandAll = function() {
        expand(root); 
        update(root);
    }

    that.collapseAll = function() {
        root.children.forEach(collapse);
        collapse(root);
        root.children = root._children;
        root._children = null;
        update(root);
        centerNode(root);
    }

    // helper function to return a list of nodes for which the query matches
    function filterQuery(query) {
        var output = [];
        function search(query, node) {
            if (node.name.toLowerCase().indexOf(query) !== -1) {
                output.push(node.name);
            }
            if (node.children || node._children) {
                // node has children
                var children = (node.children) ? node.children : node._children;
                for (var i=0; i<children.length; i++) {
                    search(query, children[i]);
                }
            }
        }
        search(query, root);
        return output;
    }

    function highlightPath(leaf) {
        // TODO: implement me
    }

    function searchTree(node, query, path) {
        if (node.name.toLowerCase().indexOf(query) !== -1) {
            // found a match
            path.push(node);
            return path;
        } else {
            if (node.children || node._children) {
                // node has children
                var children = (node.children) ? node.children : node._children;
                for(var i=0; i<children.length; i++){
                    path.push(node);
                    var found = searchTree(children[i],query, path);
                    if(found){
                        return found;
                    }
                    else{
                        path.pop();
                    }
                }
            } else {
                // node does not have children
                return false;
            }
        }
    }

    function openPaths(paths){
        root.children.forEach(collapse);
        for(var i = 0; i < paths.length - 1; i++){
            if(paths[i].id !== "1"){//i.e. not root
                paths[i].class = 'found';
                if(paths[i]._children){ //if children are hidden: open them, otherwise: don't do anything
                    paths[i].children = paths[i]._children;
                    paths[i]._children = null;
                }
                update(paths[i]);
            }
            if (i == paths.length - 2) {
                centerNode(paths[i])
            }
        }
    }

    // A recursive helper function for performing some setup by walking through all nodes
    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // sort the tree according to the node names
    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree
    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        // if nodes has children, remove the links and nodes
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function(d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function(d) {
                    return d.id;
                }).filter(function(d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

        // remove parent link
        parentLink = tree.links(tree.nodes(draggingNode.parent));
        svgGroup.selectAll('path.link').filter(function(d, i) {
            if (d.target.id == draggingNode.id) {
                return true;
            }
            return false;
        }).remove();

        dragStarted = null;
    }

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // now restore the mouseover event or we won't be able to drag a 2nd time
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        // updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            centerNode(draggingNode);
            draggingNode = null;
        }
    }

    // Helper functions for collapsing and expanding nodes.
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        var children = (d.children)?d.children:d._children;
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        if(children) {
            children.forEach(expand);
        }
    }

    function centerNode(source, fromSearch) {
        scale = zoomListener.scale();
        if (fromSearch) { //center on the node
            x = -source.y0;
        } else { //center on the node's children
            x = -source.children[0].y0;
        }
        scale = zoomListener.scale();
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function
    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.
    function click(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        update(d);
        centerNode(d, true);
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("image")
            .attr("xlink:href", function(d) { return d.icon; })
            .attr("x", "-90px")
            .attr("y", "-50px")
            .attr("width", "100px")
            .attr("height", "100px");

        nodeEnter.append("text")
            .attr("x", function(d) {
            return 10;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
            return "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("font-weight", "bold");

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .text(function(d) {
                return d.name;
            });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", 4.5)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        //node.each(function(d) {
        //    if (d.name == "") {
        //        d3.select(this).remove();
        //    }
    }

    that.generate_tree = function() {

        // Call visit function to establish maxLabelLength
        visit(pbe_family_tree, function(d) {
            totalNodes++;
            maxLabelLength = Math.max(d.name.length, maxLabelLength);

        }, function(d) {
            return d.children && d.children.length > 0 ? d.children : null;
        });

        sortTree();

        // Define the root
        root = pbe_family_tree;
        root.x0 = viewerHeight / 2;
        root.y0 = 0;

        // Collapse all children of roots children before rendering.
        root.children.forEach(function(child){
            collapse(child);
        });

        // Layout the tree initially and center on the root node.
        update(root);
        centerNode(root);
    }

    Object.freeze(that);
    return that;
};
