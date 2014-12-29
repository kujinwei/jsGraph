
var vlans = [
    {"id":"1" , "number":"1359" , "name":"vlan1" , "align":"left"},
    {"id":"2" , "number":"1407" , "name":"vlan2" , "align":"right"},
    {"id":"3" , "number":"1353" , "name":"vlan3" , "align":"left"},
    {"id":"4" , "number":"1564" , "name":"vlan4" , "align":"right"},
    {"id":"5" , "number":"1353" , "name":"vlan5" , "align":"left"},
    {"id":"6" , "number":"1564" , "name":"vlan6" , "align":"right"},
    {"id":"7" , "number":"1353" , "name":"vlan7" , "align":"left"},
    {"id":"8" , "number":"1588" , "name":"vlan8" , "align":"right"}

] ;

var subnets = [
    {"id":"1","vlan":"1359" , "subnet":"10.4.41","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"2","vlan":"1407" ,"subnet":"10.4.42","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"3","vlan":"1407" , "subnet":"10.4.43","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"4","vlan":"1353" , "subnet":"10.4.44","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"5","vlan":"1353" , "subnet":"10.4.45","type":"apnode","port_num":"12","desc":""},
    {"id":"6","vlan":"1359" , "subnet":"10.4.46","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"7","vlan":"1407" ,"subnet":"10.4.47","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"8","vlan":"1564" , "subnet":"10.4.48","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"9","vlan":"1353" , "subnet":"10.4.49","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"5","vlan":"1353" , "subnet":"10.4.50","type":"apnode","port_num":"12","desc":""},
    {"id":"6","vlan":"1359" , "subnet":"10.4.51","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"7","vlan":"1407" ,"subnet":"10.4.52","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"8","vlan":"1564" , "subnet":"10.4.53","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"5","vlan":"1353" , "subnet":"10.4.54","type":"apnode","port_num":"12","desc":""},
    {"id":"6","vlan":"1359" , "subnet":"10.4.55","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"7","vlan":"1407" ,"subnet":"10.4.56","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"8","vlan":"1564" , "subnet":"10.4.57","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"5","vlan":"1353" , "subnet":"10.4.58","type":"apnode","port_num":"12","desc":""},
    {"id":"6","vlan":"1359" , "subnet":"10.4.59","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"7","vlan":"1407" ,"subnet":"10.4.60","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"8","vlan":"1564" , "subnet":"10.4.61","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"5","vlan":"1588" , "subnet":"10.4.62","type":"apnode","port_num":"12","desc":""},
    {"id":"6","vlan":"1359" , "subnet":"10.4.63","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"7","vlan":"1407" ,"subnet":"10.4.64","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"8","vlan":"1588" , "subnet":"10.4.61","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"5","vlan":"1588" , "subnet":"10.4.62","type":"apnode","port_num":"12","desc":""},
    {"id":"6","vlan":"1359" , "subnet":"10.4.63","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"7","vlan":"1407" ,"subnet":"10.4.64","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"8","vlan":"1564" , "subnet":"10.4.65","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"10","vlan":"1353" , "subnet":"10.4.66","type":"apnode","port_num":"12","desc":""}
] ;

var firewalls = [] ;

var pings = [
    {"source":"10.4.45" , "target":"10.4.48" , "state" : "error"},
    {"source":"10.4.61" , "target":"10.4.48" , "state" : "error"},
    {"source":"10.4.44" , "target":"10.4.52" , "state" : "error"}

] ;

//Width and height
var w = 800;
var h = 500;
var padding = 20;
var border=1;
var bordercolor='black';

var svg = null ;
//var vlans = [] ;
//var subnets = [] ;

var rootPosition = null ;
var currX = 10, currY = 2;
var vlanSize = 170 ;
var subnetSize = 30 ;
var subnetDistance = 10 ;


function VLAN(number , name) {
    this.number = number ;
    this.name = name ;
    this.subnets = [] ;

}
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

function initCloud() {
    w = $("svg").parent().width();
    h = $("svg").parent().height() ;
    //Create SVG element
    svg = d3.select("#cloudSVG")
        .attr("width", w)
        .attr("height", h)
        .attr("border",border)
    ;



//    console.log("svg="  ,svg.node()) ;
//    var width = svg.parent().width();
//    var height = $("svg").parent().height();
    console.log("width=" , w) ;

    svg.on('click' , function(){
        coordinates = d3.mouse(this);
        var x = coordinates[0] ;
        var y = coordinates[1] ;
        console.log("click me: " , x + " " + y) ;
    });
//        console.log(svg.node().getBoundingClientRect()) ;
    rootPosition = svg.node().getBoundingClientRect() ;
//    currX = rootPosition.x + 10 ;
//    currY = rootPosition.y + 20 ;

//        svg.select("#logo")
//                .attr("x" , pos.x + 1)
//                .attr("y" , pos.y + 1);

    var borderPath = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", h)
        .attr("width", w)
        .style("stroke", bordercolor)
        .style("fill", "none")
        .style("stroke-width", border);

    g_vlans = svg.select("#g_vlans") ;

    var zoom = d3.behavior.zoom()
        .scaleExtent([-4, 10])
        .on("zoom", zoomed);

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    svg.call(zoom);
}

function zoomed() {
    g_vlans.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();

    d3.select(this).classed("dragging", true);
//    force.start();
}

function dragged(d) {

    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);

}

function dragended(d) {

    d3.select(this).classed("dragging", false);
}


function findVLAN(subnet) {
    for (var i = 0; i< vlans.length ; i++) {
        if (vlans[i].number == subnet.vlan) {
            return vlans[i] ;
        }
    }
    return null ;
}

function loadNetwork() {
    vlans.forEach(function(vlan) {
        vlan.subnets = [] ;
    });
    subnets.forEach(function(subnet) {
        var vlan = findVLAN(subnet) ;
        if (vlan !== null) {
            vlan.subnets.push(subnet) ;
        }

    });
//    console.log("vlans=" , vlans) ;
}

function drawVLAN(vlan , x , y) {
    var _x , _y , pos;
    var i = 0 ;
    _x = x ;
    _y = y ;

    var vlanEle = g_vlans.append("ellipse")
        .attr("cx" , x)
        .attr("cy" , y)
        .attr("rx", vlanSize)
        .attr("ry", vlanSize - 60)
        .attr("fill" , "none")
        .attr("stroke" , "gray")
        .attr("stroke-width" , "1") ;
//    console.log("vlan pos=" , vlanEle.position()) ;
    pos = vlanEle.position() ;
    vlan.pos = pos ;


    var vlanLabel = g_vlans.append("text")
        .text("VLAN :" + vlan.number)
        .attr('text-anchor','middle')
        .attr('x',x - 20)
        .attr('y',pos.top + 20)
//        .attr('font-family', 'sans-serif')
        .attr('font-size', '12');

    var bone = g_vlans.append("line")
        .attr("x1" , pos.left + 10)
        .attr("y1" , y)
        .attr("x2" , pos.right - 60)
        .attr("y2" , y)
        .attr("stroke" , "gray")
        .attr("stroke-width" , "6");


    var rows = vlanSize/subnetSize  ;

    //the first line
    _x = pos.left + subnetDistance ;
    _y = y - subnetSize - subnetDistance * 3 ;
    for (var j = 0; j < rows && i < vlan.subnets.length ; j++) {
        _x = _x + subnetSize + subnetDistance ;
        subnet = drawSubnet(vlan.subnets[i], _x , _y) ;
        i ++ ;
        g_vlans.append("line")
            .attr("x1" , subnet.position().left + subnetSize/2 )
            .attr("y1" , subnet.position().bottom-4)
            .attr("x2" , subnet.position().left + subnetSize/2)
            .attr("y2" , bone.position().top)
            .attr("stroke" , "black")
            .attr("stroke-width" , "1");
    }

    //the second line
    _x = pos.left + subnetDistance ;
    _y = y + subnetDistance * 3 ;
    for (var j = 0; j < rows && i < vlan.subnets.length ; j++) {
        _x = _x + subnetSize + subnetDistance - 6 ;
        subnet = drawSubnet(vlan.subnets[i] , _x , _y) ;
        i ++ ;
        g_vlans.append("line")
            .attr("x1" , subnet.position().left + subnetSize/2 )
            .attr("y1" , subnet.position().top+4)
            .attr("x2" , subnet.position().left + subnetSize/2)
            .attr("y2" , bone.position().bottom)
            .attr("stroke" , "black")
            .attr("stroke-width" , "1");
    }

    // draw the firewall
    var firewall = g_vlans.append('image')
        .attr({
            width: 40,
            height: 40
        })
        .attr('x',pos.right - 50)
        .attr('y',y-20)
        .attr('xlink:href',function(d){
            return 'images/firewall.png';
        });
    firewalls.push({"vlan" : vlan.number , "pos" : firewall.position() }) ;
    //link the bone to firewall
    g_vlans.append("line")
        .attr("x1" , bone.position().right-4)
        .attr("y1" , y)
        .attr("x2" , firewall.position().left+4)
        .attr("y2" , y)
        .attr("stroke" , "black")
        .attr("stroke-width" , "1");


    for (var i = 0; i < vlan.subnets.length ; i++) {

    }

    return pos ;

}

function drawSubnet(subnet , x , y) {
    var g_subnet = g_vlans.append('image')
        .attr({
            width: 40,
            height: 40
        })
        .attr('x',x)
        .attr('y',y)
        .attr('xlink:href',function(d){
            return 'images/pc.png';
        });
    g_subnet.on('click' , function(){
//        alert(this) ;
    }).on('mouseover' , function(){
//        console.log("My subnet is " + subnet.subnet) ;
    }) ;
    subnet.pos = g_subnet.position() ;
    return g_subnet ;

//    subnets.push(subnet.position()) ;

}

function drawPing(pos1 , pos2) {
//    var arc = d3.svg.arc()
//        .innerRadius(140)
//        .outerRadius(140)
//        .startAngle(0)
//        .endAngle(Math.PI/3);

//    g_vlans.append("path")
//        .attr("d",arc)
//        .attr("transform","translate(200,200)")
//        .attr("stroke","red")
//        .attr("marker-end","url(#endtriangle)")
//        .attr("marker-start","url(#starttriangle)")
//        .attr("fill","none")
//        .attr("stroke-width","2")
//        .attr("id","dimen");

    // build the arrow.
    var pathId = "path_" + pos1.left + "_" + pos2.left ;
    svg.select("defs").append("svg:marker")    // This section adds in the arrows
        .attr("id", "Arrow_" + pathId)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5 z");

    var dx = pos2.left - pos1.right,
        dy = (pos2.top+pos2.height/2) - (pos1.top+pos1.height/2),
        dr = Math.sqrt(dx * dx + dy * dy);

    var d = "M" +
        pos1.right + "," +
        (pos1.top+pos1.height/2)+ "A" +
        dr + "," + dr + " 0 0,1 " +
        (pos2.left) + "," +
        (pos2.top+pos2.height/2);


    var path = g_vlans.append("svg:path")
//    .attr("class", function(d) { return "link " + d.type; })
        .attr("class", "link")
        .attr("marker-end", "url(#" + "Arrow_" + pathId + ")")
        .attr("d" , d);


}

function linkVlan(pos1 , pos2) {
    var x1,x2,y1,y2 ;
    x1 = pos1.right ;
    y1 = pos1.top + pos1.height/2 ;
    x2 = pos2.left ;
    y2 = pos2.top + pos2.height/2 ;
    g_vlans.append('line')
        .attr("x1" , x1)
        .attr("y1" , y1)
        .attr("x2" , x2)
        .attr("y2" , y2)
        .classed('link',true);
}

function linkSubnet(pos1 , pos2) {

    var x1,x2,y1,y2 ;
    console.log("offset=" , (pos1.width - 40)) ;

    x1 = pos1.right - (pos1.width - 40) ;
    x1 = pos1.right - 4 ;
    y1 = pos1.top + pos1.height/2 ;
    x2 = pos2.left + 4 ;
    y2 = pos2.top + pos2.height/2 ;
    vlans.append('line')
        .attr("x1" , x1)
        .attr("y1" , y1)
        .attr("x2" , x2)
        .attr("y2" , y2)
        .classed('link',true);


}

function draw() {
    currY += 140 ;
    for (var i = 0; i< vlans.length ; i++) {
        if (i%2 == 0 ) {
            currX = vlanSize + 20 ;
        } else {
            currX += vlanSize * 2 + 20 ;
        }

        if (i%2 == 0 && i > 0) {
            currY += 240 ;
        }
        drawVLAN(vlans[i] , currX , currY) ;
    }


//    var pos1 = drawVLAN(currX , currY) ;
//    currX += 300 ;
//    var pos2 = drawVLAN(currX , currY) ;
//
//    currX -= 300 ;
//    currY += 200 ;
//    var pos3 = drawVLAN(currX , currY) ;
//    currX += 300 ;
//    var pos4 = drawVLAN(currX , currY) ;
//
//    linkVlan(pos1 , pos2) ;
//    linkVlan(pos3 , pos4) ;
//
//    linkSubnet(subnets[0] , subnets[4]) ;
}


initCloud() ;
loadNetwork() ;
draw() ;

console.log( vlans[1].pos) ;

//console.log(firewalls) ;
drawPing(firewalls[0].pos , vlans[1].pos) ;

drawPing(firewalls[1].pos , vlans[2].pos) ;

drawPing(firewalls[2].pos , vlans[3].pos) ;
