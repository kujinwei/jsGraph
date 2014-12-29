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


//10449438|1418005416|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449439|1418005445|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449440|1418005573|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449441|1418005628|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449442|1418005653|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449443|1418005668|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449444|1418005672|1359|75.126.172.128|23.246.234.49|75.126.172.243|pingable
//10449450|1418005114|1407|192.155.236.128|23.246.234.49|192.155.236.179|pingable
//10449451|1418005166|1407|192.155.236.128|23.246.234.49|192.155.236.179|pingable
//10449452|1418005191|1407|192.155.236.128|23.246.234.49|192.155.236.179|pingable
//10449453|1418005260|1407|192.155.236.128|23.246.234.49|192.155.236.179|pingable
//10449472|1418005217|1407|192.155.236.128|23.246.234.49|192.155.236.147|pingable
//10449473|1418005237|1407|192.155.236.128|23.246.234.49|192.155.236.147|pingable
//10449474|1418005267|1407|192.155.236.128|23.246.234.49|192.155.236.147|pingable

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
    .linkDistance(60)
    .charge(-300)
    .on("tick", tick)
    .start();

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var node = svg.selectAll(".node")
    .data(nodes , function(d){return d.id;})
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .call(force.drag);



//link.enter().insert("line", ".node").attr("class", "link");
var link = svg.selectAll(".line")
    .data(links, function(d){return d.id ;})
    .enter()
    .insert("line" , ".node")
    .attr("class" , "link") ;
//    .attr("style" , "stroke: #000;stroke-width: 1.5px;");

//var g_link = svg.append('g');
//var g_edges = g_link.selectAll('g')
//    .data(links,function(d){
//        return d.id
//    })
//    .enter()
//    .append('g');
//var edges = g_edges.append('line')
//    .classed('link',true);
//var g_path = g_edges.append('path')
//    .attr("opacity","0");

//force.start() ;


function tick() {

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; });
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