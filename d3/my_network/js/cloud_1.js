var data = ["1", "2", "3", "4", "5"];
var circleA = [
    [50,48],[106,35],[107,42],[119,52],[139,58],
    [26,60],[65,68],[117,73],[123,70],[145,78]
];


//CREATE TABLE `new_connectivity_check` (
//`id` integer NOT NULL PRIMARY KEY AUTOINCREMENT, `
//timestamp` bigint,
//`vlan_number` varchar(10),
//`subnet` varchar(20),
//`source_ip` varchar(20),
//`target_ip` varchar(20),
//`result` varchar(20));


var subnets = [
    {"id":"WHG","vlan":"1359" , "subnet":"10.4.41.1","type":"gateway","port_num":"12","desc":"WOWO"},
    {"id":"A","vlan":"1359" ,"subnet":"10.4.41.2","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"B","vlan":"1353" , "subnet":"10.4.43.1","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"B","vlan":"135" , "subnet":"10.4.43.1","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"EAP","vlan":"1353" , "subnet":"10.4.46.1","type":"apnode","port_num":"12","desc":""}
    ] ;

var vlans = [
    {"id":"1" , "number":"1359" , "name":"vlan1"},
    {"id":"2" , "number":"1407" , "name":"vlan2"},
    {"id":"3" , "number":"1353" , "name":"vlan3"},
    {"id":"4" , "number":"1564" , "name":"vlan4"}

] ;


var nodes = [
    {"id":"WHG","mip":"10.4.41.1","type":"gateway","port_num":"12","desc":""},
    {"id":"A","mip":"10.4.42.1","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"B","mip":"10.4.43.1","type":"switch","port_num":"12","desc":"HOHOHO"},
    {"id":"EAP","mip":"10.4.46.1","type":"apnode","port_num":"12","desc":""},
    {"id":"F","mip":"10.4.47.1","type":"switch","port_num":"12","desc":""}
] ;
var links = [
    {"id":1, "source":"WHG","target":"A","src_port":"4","dst_port":"12","bandwidth":"1000"},
    {"id":2, "source":"EAP","target":"B","src_port":"1","dst_port":"12","bandwidth":"1000"},
    {"id":3, "source":"WHG","target":"F","src_port":"3","dst_port":"12","bandwidth":"1000"}

] ;


var width = 960,
    height = 500;



var getNodeById = function(id) {
    for (var i = 0 ; i < nodes.length ; i++) {
        if (nodes[i].id == id) {
            return nodes[i] ;
        }
    }
    return null ;
}

links.forEach(function(link) {
    link.source = getNodeById(link.source) ;
    link.target = getNodeById(link.target) ;
//    link.value = link.id;
});

var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(500)
    .charge(-300)
    .on("tick", tick)
    .start();

axis = d3.svg.axis() ;

var svg = d3.select("body")
    .append("svg")
    .attr("id" , "mySVG")
    .attr("width", width)
    .attr("height", height)
    .call(axis)
    .on('click' , function(){
        coordinates = d3.mouse(this);
        var x = coordinates[0] ;
        var y = coordinates[1] ;
        console.log("click me: " , x + " " + y) ;
    });

var g_link = svg.append('g') ;


var g_edges = g_link.selectAll('g')
    .data(links,function(d){ return d.id})
    .enter()
    .append('g');


var edges = g_edges.append('line')
    .classed('link',true);
var g_path = g_edges.append('path')
    .attr("opacity","0");




var g_nodes = svg.append('g');


var g2 = g_nodes.selectAll('g')   //node部分
    .data(nodes)
    .enter()
    .append('g') ;
//    .call(drag);

//var circles = g2
//    .append("circle")
//    .attr("r" , 60)
//    .attr("fill" , "none")
//    .attr("stroke" , "gray")
//    .attr("stroke-width" , "1") ;

var ellipses = g2.append("ellipse")
                         .attr("rx", 100)
                         .attr("ry", 80)
                        .attr("fill" , "none")
                        .attr("stroke" , "gray")
                        .attr("stroke-width" , "1") ;
//var vm_num = 0;

var texts = g2.append("text")
//    .attr("class", "linetext dstPortTxt")
    .text(function(d) {
        return "test" ;
    });

var images = g2.append('image')
    .attr({
        width: 44,
        height: 44
    })
//    .attr('x',300)
    .attr('xlink:href',function(d){
        return 'images/pc.png';

    });


//console.log(document.getElementById("mySVG").innerHTML) ;

//var node = svg.selectAll(".node")
//    .data(nodes , function(d){return d.id;})
//    .enter().append("circle")
//    .attr("class", "node")
//    .attr("r", 10)
//    .call(force.drag);



//link.enter().insert("line", ".node").attr("class", "link");
//var link = svg.selectAll(".line")
//    .data(links, function(d){return d.id ;})
//    .enter()
//    .insert("line" , ".node")
//    .attr("class" , "link") ;
//    .attr("style" , "stroke: #000;stroke-width: 1.5px;");



//force.start() ;

function middle(point1,point2){
    var x=(point2[0]-point1[0])/2+point1[0];
    var y=(point2[1]-point1[1])/2+point1[1];
    return [x,y];
}


function tick() {

//    console.log("d:" , d)  ;

//    texts.attr('x',function(d){ return d.source.x })
//        .attr('y',function(d){return d.source.y + 20 ;})
//        .attr('dx',function(d){return d.target.x;})
//        .attr('dy',function(d){return d.target.y});

    g2.attr('transform', function(d) {
//        console.log("g2 = " , d.x) ;
        return "translate(" + d.x + "," + d.y + ")" ;
    });
    edges.attr('x1',function(d){ return d.source.x})
        .attr('y1',function(d){return d.source.y})
        .attr('x2',function(d){return d.target.x;})
        .attr('y2',function(d){return d.target.y});

    g_path.attr("d",function(d){
        var x1=d.source.x,y1=d.source.y+22,x3=d.target.x,y3=d.target.y+22;
        var p1=[x1,y1];
        var p3=[x3,y3];
        var p2=[(x1+x3+y3-y1)/2,(y1+y3+x1-x3)/2];
        var p4=[(x1+x3-y3+y1)/2,(y1+y3-x1+x3)/2];
        var p5=middle(p1,p3);
        var p6=middle(p2,p5);
        var p7=middle(p4,p5);
        var traces="M"+p1+" Q"+p6+" "+p3+"M"+p3+" Q"+p7+" "+p1;
        return traces;
    }) ;

//    console.log(document.getElementById("mySVG").innerHTML) ;

//    link.attr("x1", function(d) { return d.source.x; })
//        .attr("y1", function(d) { return d.source.y; })
//        .attr("x2", function(d) { return d.target.x; })
//        .attr("y2", function(d) { return d.target.y; });

//    node
//        .attr("transform", function(d) {
//            return "translate(" + d.x + "," + d.y + ")"; });
}

//});

//
//
//var nodeEnter = node.enter().append("g")
//    .attr("class", "node");
//
//
//
//nodeEnter.append("circle")
//    .attr("class", "nodeCircle")
//    .attr("cx", 200)
//    .attr("cy", 200)
//    .attr("r", "28");


//var circle1 = svg.append("circle")
//    .attr("cx", 200)
//    .attr("cy", 300)
//    .attr("r", 200);
//
//var circle2 = svg.append("circle")
//    .attr("cx", 700)
//    .attr("cy", 300)
//    .attr("r", 200);
//
//var vlan1 = svg.append("rect")
//    .attr("x", 210)
//    .attr("y", 330)
//    .attr("width", 100)
//    .attr("height", 100)
//    .style("fill" , "red");
//
//
//circle1.on('click' , function(){
//    alert("OK") ;
//}) ;
//
//vlan1.on('click' , function(){
//    alert("OK OK") ;
//}) ;