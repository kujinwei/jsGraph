var debug = false;
var vlans = [], subnets = [], vms = [], firewalls = [];
var componentMap = null;
// network status definition
var STATUS = {
	healthy : "healthy",
	unhealthy : "unhealthy"
};
var LAYER = {
	zone : "zone",
	vlan : "vlan",
	subnet : "subnet",
	chart : "chart"
};

var layers = [];
var currentLayerIndex = -1;
var svg;
var zoom, drag;
var loadingBox;
var width = 880;
var height = 560;

var rootPosition = null;
var currX = 10, currY = 2;
var vlanSize = 170;
var cellSize = 30;
var vlanDistance = 120;
var cellDistance = 10;
var barHeight = 40;
var xOffset = 40;

var subnetCount = 0;
var pathCount = 0;

var d3Popover = null;
var tip = null;

var pingPromise;
var markers = [];

d3.selection.prototype.position = function() {

    var el = this.node();
    var elPos = el.getBoundingClientRect();
    var vpPos = getVpPos(el);

    function getVpPos(el) {
        if(el.parentElement.tagName === 'svg') {
            return el.parentElement.getBoundingClientRect();
        }
        return getVpPos(el.parentElement);
    }

    return {
        top: elPos.top - vpPos.top,
        left: elPos.left - vpPos.left,
        width: elPos.width,
        bottom: elPos.bottom - vpPos.top,
        height: elPos.height,
        right: elPos.right - vpPos.left
    };

};

var init = function() {

	svg = d3.select("#NetworkDiagram").append("svg").attr("border", 1);

	//calculate all size
	width = $("svg").parent().width();
	height = $("svg").parent().height();
	svg.attr("width", width);
	svg.attr("height", height);

	//vlanSize = (width - xOffset *2 - vlanDistance) /2 ;

	svg.on('click', function() {
		coordinates = d3.mouse(this);
		var x = coordinates[0];
		var y = coordinates[1];
		//console.log("click me: " , x + " " + y) ;
	});
	//add title

	//add a border for svg
	svg.append("rect").attr("x", 0).attr("y", 0).attr("height", height - 1).attr("width", width - 1).style("stroke", "black").style("fill", "none").style("stroke-width", 1);

	svg.append("text").text("Cloud Map").attr('text-anchor', 'middle').attr('x', 60).attr('y', 20).attr('stroke', 'blue').attr('stroke-width', 1)
	//        .attr('font-family', 'sans-serif')
	.attr('font-size', '14');

	//draw the toolbar
	initToolbar();

};

var enableDragZoom = function() {
	if (zoom == null) {
		zoom = d3.behavior.zoom() ;
		// .scaleExtent([-4, 10]) ;
		// .on("zoom", zoomed);
	}
	
	drag = d3.behavior.drag().on("dragstart", dragstarted).on("drag", dragged).on("dragend", dragended);

	// svg.call(zoom);
	// currentLayer().graphics.call(zoom) ;
	// currentLayer().graphics.on("mousedown.drag", dragstarted) ;
	// svg.on("mousedown.drag", dragstarted) ;
	// svg.on("mousemove.drag", dragged) ;
	// svg.on("mouseup.drag", dragended) ;
	// svg.call(drag) ;
	zoom.on("zoomstart" , function(){	
		// console.log(d3.event) ;
		if (d3.event.sourceEvent.type !== "dblclick") {
			// d3.select('body').style("cursor", "move");
		}		
		
	}).on("zoom" , function(){	
		d3.select('body').style("cursor", "move");	
		currentLayer().graphics.attr("transform", "translate(" + d3.event.translate + ")");
	}).on("zoomend" , function(){
		d3.select('body').style("cursor", "auto");
		
		
	}) ;
	
	svg.call(zoom);
	svg.on("dblclick.zoom", null);
	svg.on("wheel.zoom", null);
	svg.on("mousewheel.zoom", null);
	svg.on("MozMousePixelScroll.zoom", null);
};

/**
 * 
 */
var disableZoom = function() {
	svg.on("mousedown.zoom", null);
	svg.on("mousemove.zoom", null);
	svg.on("dblclick.zoom", null);
	svg.on("touchstart.zoom", null);
	svg.on("wheel.zoom", null);
	svg.on("mousewheel.zoom", null);
	svg.on("MozMousePixelScroll.zoom", null);
};

var showLoading = function() {
	loadingBox = svg.append("text").text("Loading the data, please wait ...").attr('text-anchor', 'middle').attr('x', width / 2).attr('y', height / 2 + 2).attr('font-size', '12');

};

var hideLoading = function() {
	if (loadingBox) {
		loadingBox.remove();
	}
};

var initToolbar = function() {
	var toolbar = svg.append("g");
	var back = toolbar.append('image').attr({
		width : 20,
		height : 20
	}).attr('x', width - 30).attr('y', 2).attr('xlink:href', function(d) {
		return 'images/network/back.gif';
	});
	//            var forward = toolbar.append('image')
	//                .attr({
	//                    width: 20,
	//                    height: 20
	//                })
	//                .attr('x',w-30)
	//                .attr('y',2)
	//                .attr('xlink:href',function(d){
	//                    return 'images/network/forward.gif';
	//                });
	back.on('click', function() {
		goBack();
	});
	//            forward.on('click' , function(){
	//                //g_vlans.style("display", "block");
	//                goForward() ;
	//            }) ;

};

var _checkPointInEllipse = function() {
	//(x-x1)*(x-x1)/r*r - (y-y1)*(y-y1)/r*r < 1
};

var _printSVG = function() {
	console.log(document.getElementById('NetworkDiagram').innerHTML);
}
/**
 * alloc a svg group element for a new layer
 */
var allocLayer = function() {
	var g = svg.append("g");
	// g.attr("pointer-events" , "all") ;
	var layer = {};
	layer.graphics = g;
	layer.parent = currentLayer();
	layers.push(layer);
	return layer;
};

var openNewLayer = function() {
	hideCurrLayer();
	allocLayer();
	currentLayerIndex++;

};

var currentLayer = function() {
	if (currentLayerIndex > -1) {
		return layers[currentLayerIndex];
	} else {
		return null;
	}
};
/**
 * get current graphics handler
 * @returns {*}
 */
var getGraphics = function() {
	return layers[layers.length - 1].graphics;
}
var goBack = function() {
	var parent = currentLayer().parent;
	if (parent != null) {
		//hideLayer(currentLayer()) ;
		currentLayer().graphics.remove();
		layers.length = layers.length - 1;
		showLayer(parent);
		currentLayerIndex--;
		enableDragZoom();
	}
};

var goForward = function() {
	if (currentLayerIndex < layers.length - 1) {
		hideLayer(layers[currentLayerIndex]);
		showLayer(layers[currentLayerIndex + 1]);
		currentLayerIndex++;
	}
};

var showLayer = function(layer) {
	if (layer) {
		//layer.style("opacity", 1);
		layer.graphics.style("display", "block");
		layer.graphics.attr("transform", "translate(0,0)");
	}
};

var hideLayer = function(layer) {
	if (layer) {
		//layer.style("opacity", 0);
		layer.graphics.style("display", "none");
	}
};

var hideCurrLayer = function() {
	if (layers.length > 0) {
		hideLayer(currentLayer());
	}
};

var showCurrLayer = function() {
	if (layers.length > 0) {
		showLayer(currentLayer());
	}
};

var findVLAN = function(subnet) {
	for (var i = 0; i < vlans.length; i++) {
		if (vlans[i].number == subnet.vlan) {
			return vlans[i];
		}
	}
	return null;
}
/**
 * get the instance object from a subnet
 * @param subnet
 * @param instance
 */
var findInstance = function(subnet, instance) {
	for (var i = 0; i < subnet.instances.length; i++) {
		if (subnet.instances[i].ip === instance) {
			return subnet.instances[i];
		}
	}
	return null;
}
/**
 *
 * @param vlan
 * @param subnet
 * @returns {*}
 */
var findSubnet = function(vlan, subnet) {
	for (var i = 0; i < vlan.subnets.length; i++) {
		if (vlan.subnets[i].ip === subnet) {
			return vlan.subnets[i];
		}
	}
	return null;
}
/**
 * check if a ip in a subnet
 * @param ip
 * @param subnet
 * @returns {boolean}
 */
var inSubnet = function(ip, subnet) {
	var ipPrefix = ip.substring(0, ip.lastIndexOf("."));
	var subnetPrefix = subnet.ip.substring(0, subnet.ip.lastIndexOf("."));
	if (ipPrefix == subnetPrefix) {
		return true;
	}
	return false;
}
var markTarget = function(g, pos) {
	var marker = g.append('rect').attr({
		width : pos.width,
		height : pos.height
	}).attr('x', pos.left).attr('y', pos.top).attr('fill', 'none').attr('stroke', 'red').attr('stroke-width', 2);
	markers.push(marker);
	return marker;
}
var clearMarkers = function() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].remove();
	}
	markers.length = 0;
};
/**
 *
 * @param vm
 * @param source
 * @returns {*}
 */
var markPing = function(vm, source) {
	//            console.log("Now vlans=" , vlans) ;
	var g = getGraphics();
	var vlan;
	var pos;
	var marker;
	for (var i = 0; i < vlans.length; i++) {
		vlan = vlans[i];
		if (vlan.number == source.vlan && source.result == "unpingable") {
			vlan.status = STATUS.unhealthy;
			if (currentLayer().type == LAYER.zone) {
				marker = g.append('image').attr({
					width : 20,
					height : 20
				}).attr('x', vlan.pos.left + vlan.pos.width / 2 - cellSize / 2).attr('y', vlan.pos.top + cellSize).attr('xlink:href', function(d) {
					return 'images/network/warning.gif';
				});
				markers.push(marker);
			}

		}
		for (var j = 0; j < vlan.subnets.length; j++) {
			var subnet = vlan.subnets[j];
			if (inSubnet(vm, subnet) && source.result == "unpingable") {
				subnet.status = STATUS.unhealthy;
				if ( (currentLayer().type == LAYER.zone)) {
					pos = subnet.vlanIconPos;
					marker = markTarget(g, pos);
					marker.on('dblclick', function() {
						drawSubnet(subnet);
					}).on('mouseover', function() {
						showTip('n', subnet.ip);
					}).on('mouseout', function() {
						hideTip();
					});
				} else if ((currentLayer().type === LAYER.vlan)) {
					pos = subnet.pos;
					markTarget(g, pos);
				} else if ((currentLayer().type === LAYER.subnet)) {
					var instance = findInstance(subnet, vm);
					console.log("instance=", instance);
					pos = instance.pos;
					markTarget(g, pos);
				}
			}
		}
	}
};

/**
 *
 * @param vlansData
 */
var loadVLANs = function(vlansData) {
	var vlan;
	for (vlan_number in vlansData) {
		vlan = {};
		vlan.number = vlan_number;
		vlan.status = STATUS.healthy;
		vlan.subnets = [];
		for (ip in vlansData[vlan_number]) {
			subnet = {};
			subnet.ip = ip;
			subnet.status = STATUS.healthy;
			subnet.instances = vlansData[vlan_number][ip];
			vlan.subnets.push(subnet);
		}
		vlans.push(vlan);
	}
};
/**
 * load network topology
 */
var loadNetwork = function() {
	showLoading();
	if (debug) {
		d3.json("data/network_data.json", function(json) {
			loadVLANs(json.data);
			loadCloudComponents();
		});
	} else {
		NetworkService.loadNetwork(function(result) {
			loadVLANs(result.data);
			loadCloudComponents();
		});
	}

};

/**
 * 
 */
var loadInstanceHistoryData = function(instanceIP) {
	if (debug) {
		var lineData = [];
		var value, r;
		var dateRange = 24 * 6;
		for (var i = 0; i < 10; i++) {
			r = -(Math.floor(Math.random() * dateRange + 1) - 1);
			//                    if (r % 2 == 0) {
			//                        value = 1 ;
			//                    } else {
			//                        value = 0 ;
			//                    }
			value = Math.floor(Math.random() * 10 + 1) - 1;
			lineData.push({
				'startTime' : new Date().addHours(r),
				'endTime' : new Date().addHours(r + 2),
				'value' : 1
			});
		}
		drawTimeChart(instanceIP, []);

	} else {
		showLoading();
		NetworkService.loadHistory(instanceIP, function(result) {
			hideLoading();
			lineData = result.data;
			lineData.forEach(function(d) {
				lineData.startTime = new Date(parseInt(d.starttime) * 1000);
				lineData.endTime = new Date(parseInt(d.endtime) * 1000);
				lineData.value = 1;
				//pingable and unpingable are in the same line
			});
			drawTimeChart(instanceIP, lineData);
		}, function(error) {
			hideLoading();
			drawTimeChart(instanceIP, []);
		});

	}
};
/**
 * find the component name from compoenntMap
 * @param ip
 * @returns {*}
 */
var findComponent = function(ip) {
	for (comp in componentMap) {
		for (var i = 0; i < componentMap[comp].length; i++) {
			if (componentMap[comp][i] == ip) {
				return comp;
			}
		}
	}
	return "";
};

/**
 *
 */
var mapComponentsToInstances = function() {
	var vlan, subnet;
	for (var i = 0; i < vlans.length; i++) {
		vlan = vlans[i];
		for (var j = 0; j < vlan.subnets.length; j++) {
			subnet = vlan.subnets[j];
			for (var k = 0; k < subnet.instances.length; k++) {
				subnet.instances[k].component = findComponent(subnet.instances[k].ip);
			}
		}
	}

};

var loadCloudComponents = function() {
	if (debug) {
		d3.json("data/components.json", function(json) {
			componentMap = json.list;
			mapComponentsToInstances();
			hideLoading();
			draw();
			checkPing();
		});
	} else {
		
	}

};

var startPing = function() {
	// pingPromise = $timeout(checkPing, 5000);
};

var handlePing = function(data) {
	clearMarkers();
	for (vm in data) {
		sources = data[vm];
		for (var i = 0; i < sources.length; i++) {
			markPing(vm, sources[i]);
		}
	}
};

var checkPing = function() {
	if (debug) {
		d3.json("data/ping.json", function(json) {
			//redraw() ;
			var pings = json.data ;
			for (p in pings) {
				var n = Math.floor(Math.random() * pings[p].length + 1) - 1;
				if (n % 2 === 0) {
					for (var i = 0; i < pings[p].length; i++) {
						pings[p][i]["result"] = "pingable";
					}
				} else {
					for (var i = 0; i < pings[p].length; i++) {
						pings[p][i]["result"] = "unpingable";
					}
				}
			}
			handlePing(pings);
			//$timeout(checkPing, 3000);
		});
	} else {
		
		
	}

};

/**
 *
 * @param vlan
 * @param x
 * @param y
 * @returns {*}
 */
var drawVlanIcon = function(vlan, x, y, align) {
	var _x, _y, pos;
	var i = 0;
	_x = x;
	_y = y;
	var bone, firewall, subnet;

	var g = getGraphics();
	var vlanEle = g.append("ellipse").attr("cx", x).attr("cy", y).attr("rx", vlanSize).attr("ry", vlanSize - 60).attr("fill", "none").attr("stroke", "gray").attr("stroke-width", "1");
	//    console.log("vlan pos=" , vlanEle.position()) ;
	pos = vlanEle.position();
	vlan.pos = pos;
	//draw the label
	var vlanLabel = g.append("text").text("VLAN :" + vlan.number).attr('text-anchor', 'middle').attr('x', x - 20).attr('y', pos.top + 20)
	//        .attr('font-family', 'sans-serif')
	.attr('font-size', '12');

	// draw the firewall and the bone
	if (align === "left") {
		bone = g.append("line").attr("x1", pos.left + 70).attr("y1", y).attr("x2", pos.right - 10).attr("y2", y).attr("stroke", "gray").attr("stroke-width", "6");
		firewall = g.append('image').attr({
			width : 40,
			height : 40
		}).attr('x', pos.left + 10).attr('y', y - 20).attr('xlink:href', function(d) {
			return 'images/network/firewall.png';
		});
	} else if (align === "right") {
		bone = g.append("line").attr("x1", pos.left + 10).attr("y1", y).attr("x2", pos.right - 60).attr("y2", y).attr("stroke", "gray").attr("stroke-width", "6");
		firewall = g.append('image').attr({
			width : 40,
			height : 40
		}).attr('x', pos.right - 50).attr('y', y - 20).attr('xlink:href', function(d) {
			return 'images/network/firewall.png';
		});
	}

	firewalls.push({
		"vlan" : vlan.number,
		"pos" : firewall.position()
	});
	//link the bone to firewall
	if (align === "left") {
		g.append("line").attr("x1", bone.position().left + 4).attr("y1", y).attr("x2", firewall.position().right - 4).attr("y2", y).attr("stroke", "black").attr("stroke-width", "1");
	} else if (align === "right") {
		g.append("line").attr("x1", bone.position().right - 4).attr("y1", y).attr("x2", firewall.position().left + 4).attr("y2", y).attr("stroke", "black").attr("stroke-width", "1");
	}

	var cols = vlanSize / cellSize;

	//the first line
	if (align === "left") {
		_x = pos.left + cellDistance * 2;
	} else if (align === "right") {
		_x = pos.left + cellDistance;
	}

	_y = y - cellSize - cellDistance * 3;
	for (var j = 0; j < cols && i < vlan.subnets.length; j++) {
		_x = _x + cellSize + cellDistance;
		subnet = drawSubnetIcon(vlan.subnets[i], _x, _y);
		vlan.subnets[i].vlanIconPos = subnet.position();
		i++;
		g.append("line").attr("x1", subnet.position().left + cellSize / 2).attr("y1", subnet.position().bottom - 4).attr("x2", subnet.position().left + cellSize / 2).attr("y2", bone.position().top).attr("stroke", "black").attr("stroke-width", "1");
	}

	//the second line
	if (align === "left") {
		_x = pos.left + cellDistance * 2 + 20;
	} else if (align === "right") {
		_x = pos.left + cellDistance + 20;
	}
	_y = y + cellDistance * 3;
	for (var j = 0; j < cols && i < vlan.subnets.length; j++) {
		_x = _x + cellSize + cellDistance - 6;
		subnet = drawSubnetIcon(vlan.subnets[i], _x, _y);
		i++;
		g.append("line").attr("x1", subnet.position().left + cellSize / 2).attr("y1", subnet.position().top + 4).attr("x2", subnet.position().left + cellSize / 2).attr("y2", bone.position().bottom).attr("stroke", "black").attr("stroke-width", "1");
	}
	if (vlan.subnets.length > cols * 2) {
		g.append('text').text("...").attr('text-anchor', 'middle').attr('x', _x + cellSize + cellDistance + 2).attr('y', _y + cellSize / 2).attr('stroke', 'blue').attr('stroke-width', 1).attr('font-size', '14').on('dblclick', function() {
			drawVlan(vlan);
		});
		;
	}

	vlanLabel.on('dblclick', function() {
		drawVlan(vlan);
	});

	return pos;

};

/**
 *
 * @param subnet
 * @param x
 * @param y
 * @returns {*}
 */
var drawSubnetIcon = function(subnet, x, y) {
	var subnetId = "subnetId_" + subnetCount;
	subnetCount++;
	var g = getGraphics();
	var subnetEle = g.append('image').attr("id", subnetId).attr({
		width : cellSize,
		height : cellSize
	}).attr('x', x).attr('y', y).attr('xlink:href', function(d) {
		return 'images/network/network.png';
	});

	subnetEle.on('click', function() {
	}).on('mouseover', function() {
		showTip('n', subnet.ip);
		coordinates = d3.mouse(this);
		//popover(coordinates[0] , coordinates[1]) ;
	}).on('mouseout', function() {
		hideTip();
	}).on('dblclick', function() {
		drawSubnet(subnet);
	});

	subnet.pos = subnetEle.position();
	return subnetEle;
};

/**
 *
 * @param vm
 * @param x
 * @param y
 * @returns {*}
 */
var drawVMIcon = function(vm, x, y) {
	var g = getGraphics();
	var vmEle = g.append('image').attr({
		width : cellSize,
		height : cellSize
	}).attr('x', x).attr('y', y).attr('xlink:href', function(d) {
		return 'images/network/pc.png';
	});
	if (vm.component == null || vm.component.length == 0) {
		vm.component = "dea";
	}
	//limit the label length to 14 char
	if (vm.component.length > 14) {
		vm.component = vm.component.substring(0, 14) + "...";
	}
	var compLabel = g.append("text").text(vm.component).attr('text-anchor', 'middle').style('text-anchor', 'middle');

	//            var bbox = compLabel.node().getBBox();
	//            var textWidth = vm.component.length * 5 ; //not accurate
	//            textWidth = bbox.width ;
	compLabel.attr('x', vmEle.position().left + (vmEle.position().width) / 2).attr('y', vmEle.position().bottom + 7);
	//console.log(compLabel.node().outerHTML) ;
	//HACK for the bug for some older firefox versions
	if (compLabel.position().left > vmEle.position().left) {
		compLabel.attr('transform', 'translate(-' + compLabel.position().width / 2 + ',0)');
	}

	vmEle.on('click', function() {
	}).on('mouseover', function() {
		showTip('n', vm.ip);
		//coordinates = d3.mouse(this);
	}).on('mouseout', function() {
		hideTip();
	}).on('dblclick', function() {
		openNewLayer();
		currentLayer().type = LAYER.chart;
		//drawLineChart(vm , lineData) ;
		disableZoom();
		loadInstanceHistoryData(vm.ip);

	});

	vm.pos = vmEle.position();
	return vmEle;
}
/**
 *
 * @param subnet
 */
var drawSubnet = function(subnet) {
	openNewLayer();
	currentLayer().type = LAYER.subnet;
	var _x = xOffset * 2, _y = barHeight * 2;
	var cols = Math.round((width - xOffset * 3) / (cellSize * 4 + cellDistance));

	var g = getGraphics();
	//add the label
	g.append("text").text("Instances for subnet : " + subnet.ip).attr('text-anchor', 'middle').attr('x', width / 2 - xOffset).attr('y', barHeight).attr('stroke', 'gray').attr('stroke-width', 1);
	// subnet.vms
	for (var i = 0; i < subnet.instances.length; i++) {
		if (i % cols == 0 && i > 0) {
			_x = xOffset * 2;
			_y = _y + cellSize * 2;
		}
		drawVMIcon(subnet.instances[i], _x, _y);
		_x = _x + cellSize * 4 + cellDistance;
	}

};


var drawTimeChart = function(vm, data) {
	var g = getGraphics();
	var parseDate = d3.time.format("%Y/%m/%d-%H:%M:%S");

	data.forEach(function(d) {
		d.starttime = new Date(parseInt(d.starttime) * 1000);
		d.endtime = new Date(parseInt(d.endtime) * 1000);

	});

	var margin = {
		top : 30,
		right : 50,
		bottom : 30,
		left : 50
	};
	var _width = width - margin.left - margin.right, _height = height - margin.top - margin.bottom;
	var chart = new TimeLineChart(g, {
		"width" : _width,
		"height" : _height,
		"xmax" : 60,
		"xmin" : 0,
		"ymax" : 2,
		"ymin" : 0,
		"title" : "Outage Chart for " + vm,
		"xlabel" : "Outage History: Green=reachable, Red=unreachable",
		"ylabel" : "Connectivity",
		"drawLine" : true
	}, data);
};

/**
 * draw all subnet of a vlan
 * @param vlan
 */
var drawVlan = function(vlan) {
	openNewLayer();
	currentLayer().type = LAYER.vlan;
	var g = getGraphics();
	var _x = xOffset, _y = barHeight * 3;
	var cols = Math.round((width - xOffset * 2) / (cellSize + cellDistance));

	//add the label
	g.append("text").text("VLAN : " + vlan.number + " and its subnet").attr('text-anchor', 'middle').attr('x', width / 2 - xOffset).attr('y', barHeight).attr('stroke', 'gray').attr('stroke-width', 1);
	//draw the firewall
	var firewall = g.append('image').attr({
		width : cellSize,
		height : cellSize
	}).attr('x', width / 2 - cellSize / 2).attr('y', barHeight + 10).attr('xlink:href', function(d) {
		return 'images/network/firewall.png';
	});
	//link the firewall to bone
	g.append("line").attr("x1", firewall.position().left + firewall.position().width / 2).attr("y1", firewall.position().bottom).attr("x2", firewall.position().left + firewall.position().width / 2).attr("y2", _y - cellDistance).attr("stroke", "black").attr("stroke-width", "2");

	for (var i = 0; i < vlan.subnets.length; i++) {
		if (i % cols == 0 && i > 0) {
			_x = xOffset;
			_y = _y + cellSize + cellDistance * 2;
		}
		if (i % cols == 0) {
			g.append("line").attr("x1", xOffset + cellSize / 2).attr("y1", _y - cellDistance).attr("x2", width - xOffset).attr("y2", _y - cellDistance).attr("stroke", "black").attr("stroke-width", "1");
		}

		var ele = drawSubnetIcon(vlan.subnets[i], _x, _y);
		//link the subnet to bone
		g.append("line").attr("x1", _x + cellSize / 2 + 1).attr("y1", _y + 7).attr("x2", _x + cellSize / 2 + 1).attr("y2", _y - cellDistance).attr("stroke", "black").attr("stroke-width", "1");
		//link to above line
		if (i >= cols) {
			var offset = 6;
			g.append("line").attr("x1", ele.position().right + cellDistance / 2 - offset).attr("y1", _y - cellDistance).attr("x2", ele.position().right + cellDistance / 2 - offset).attr("y2", _y - cellDistance * 2).attr("stroke", "black").attr("stroke-width", "1");
		}

		_x = _x + cellSize + cellDistance;

	}

};

/**
 *
 */
var drawZone = function() {
	openNewLayer();
	currentLayer().type = LAYER.zone;
	enableDragZoom();

	currY += 140;
	var align;
	for (var i = 0; i < vlans.length; i++) {//vlans.length
		if (i % 2 == 0) {
			currX = (width - vlanDistance - vlanSize * 2) / 2;
			align = "right";
		} else {
			currX += vlanSize + vlanDistance * 2;
			align = "left";
		}

		if (i % 2 == 0 && i > 0) {
			currY += 240;
		}
		drawVlanIcon(vlans[i], currX, currY, align);
	}
	linkFirewall();
};

var linkFirewall = function() {
	var g = getGraphics();
	var firewall1, firewall2;
	for (var i = 0; i < firewalls.length && (i + 1) < firewalls.length; i = i + 2) {
		firewall1 = firewalls[i];
		firewall2 = firewalls[i + 1];
		g.append("line").attr("x1", firewall1.pos.right - 2).attr("y1", firewall1.pos.top + firewall1.pos.width / 2 + 2).attr("x2", firewall2.pos.left + 4).attr("y2", firewall2.pos.top + firewall2.pos.width / 2 + 2).attr("stroke", "green").attr("stroke-width", "1");
	}
	for (var i = 0; i < firewalls.length && (i + 2) < firewalls.length; i++) {
		firewall1 = firewalls[i];
		firewall2 = firewalls[i + 2];
		g.append("line").attr("x1", firewall1.pos.left + firewall1.pos.width / 2).attr("y1", firewall1.pos.bottom - 4).attr("x2", firewall2.pos.left + firewall2.pos.width / 2 + 2).attr("y2", firewall2.pos.top + 4).attr("stroke", "green").attr("stroke-width", "1");
	}
};

var draw = function() {
	drawZone();
};

var redraw = function() {
	for (var i = 0; i < layers.length; i++) {
		layers[i].graphics.remove();
	}
	layers.length = 0;
	currentLayerIndex = -1;
	layers = [];
	currX = 10;
	currY = 2;
	draw();
};
/**
 *
 * @param direction
 * @param msg
 */
var showTip = function(direction, msg) {
	if (tip == null) {
		tip = d3.tip().attr('class', 'd3-tip').direction(direction).offset(function() {
			if (direction == 'n') {
				return [-10, 0]
			} else if (direction == 's') {
				return [10, 0]
			} else if (direction == 'e') {
				return [0, 10]
			} else if (direction == 'w') {
				return [0, -10]
			}
		});
		svg.call(tip);
	}
	tip.html(msg);
	tip.show();
};

var hideTip = function() {
	tip.hide();
};

var showTooltip = function() {
	if (d3Popover) {
		d3Popover.$promise.then(d3Popover.show);
	}
};

var hideTooltip = function() {
	if (d3Popover) {
		d3Popover.$promise.then(d3Popover.hide);
	}
};


function zoomed() {
	console.log("event=", d3.event.sourceEvent);
	var scale = 1;
	//don't use d3.event.scale so far

	if (d3.event.sourceEvent.type !== "dblclick" && d3.event.sourceEvent.type !== "click") {
		// currentLayer().graphics.attr("transform", "translate(" + d3.event.translate + ")scale(" + scale + ")");
	}
}

function dragstarted(d) {
	console.log("dragstarted") ;
	d3.select('body').style("cursor", "move");
	// d3.event.sourceEvent.stopPropagation();
	d3.event.stopPropagation();
	d3.select(this).classed("dragging", true);
	//    force.start();
}

function dragged(d) {
	// console.log("dragged");
	//currentLayer().graphics.attr("transform", "translate(" + d3.event.translate + ")");
	// console.log(d3.event) ;
	// d3.select(currentLayer().graphics).attr("cx", d3.event.x).attr("cy", d3.event.y);
}

function dragended(d) {
	// console.log("dragended");
	d3.select('body').style("cursor", "auto");
	d3.select(this).classed("dragging", false);
}

debug = true;
init();

loadNetwork();
