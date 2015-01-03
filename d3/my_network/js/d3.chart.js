
//TODO should use angular factory or provider

registerKeyboardHandler = function (callback) {
    var callback = callback;
    d3.select(window).on("keydown", callback);
};

TimeLineChart = function (container, options, data) {
    var self = this;
    this.chart = container ;
    this.data = data ;
    this.options = options || {};
    this.cx = options.width;
    this.cy = options.height;
    this.options.xmax = options.xmax || 30;
    this.options.xmin = options.xmin || 0;
    this.options.ymax = options.ymax || 10;
    this.options.ymin = options.ymin || 0;
    this.options.starttime = options.starttime || new Date().addDays(-7);
    this.options.endtime = options.endtime || new Date();
    this.options.drawLine = options.drawLine || true ;
    this.options.showFocus = options.showFocus || false ;

	this.tip = null ;
    this.padding = {
        "top": this.options.title ? 40 : 20,
        "right": 30,
        "bottom": this.options.xlabel ? 60 : 10,
        "left": this.options.ylabel ? 70 : 45
    };

    this.size = {
        "width": this.cx - this.padding.left - this.padding.right,
        "height": this.cy - this.padding.top - this.padding.bottom
    };

// x-scale
    this.x = d3.time.scale().range([0, this.size.width]);
    //this.x.domain(d3.extent(data, function(d) { return d.time; }));
    this.x.domain([this.options.starttime , this.options.endtime]);
// drag x-axis logic
    this.downx = Math.NaN;

// y-scale (inverted domain)
    this.y = d3.scale.linear()
        .nice()
        .range([0, this.size.height])
        .nice();
//    this.y.domain([d3.max(data, function(d) { return d.value; }) , 0]);
    this.y.domain([2 , 0]);
// drag y-axis logic
    this.downy = Math.NaN;

    this.dragged = this.selected = null;

//    this.line = d3.svg.line()
//        .x(function (d, i) {
//            return this.x(d.time);
//        })
//        .y(function (d, i) {
//            return this.y(d.value);
//        });

    var xrange = (this.options.xmax - this.options.xmin),
        yrange2 = (this.options.ymax - this.options.ymin) / 2,
        yrange4 = yrange2 / 2;

    this.vis = this.chart.append("svg")
        .attr("width", this.cx)
        .attr("height", this.cy)
        .append("g")
        .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

    this.plot = this.vis.append("rect")
        .attr("width", this.size.width)
        .attr("height", this.size.height)
        .style("fill", "#EEEEEE")
        // .attr("pointer-events", "all")
        .on("mousedown.drag", self.plot_drag())
        .on("touchstart.drag", self.plot_drag())
    // this.plot.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));

    this.vis.append("svg")
        .attr("top", 0)
        .attr("left", 0)
        .attr("width", this.size.width)
        .attr("height", this.size.height)
        .attr("viewBox", "0 0 " + this.size.width + " " + this.size.height)
        .attr("class", "line") ;
//        .append("path")
//        .attr("class", "line")
//        .attr("d", this.line(this.data));

    //add the circle for each point
//    this.data.forEach(function(d){
//        self.vis.append("circle")
//            .attr("cx", self.x(d.time))
//            .attr("cy", self.y(d.value))
//            .attr("r", 2)
//            .style("stroke", "red");
//
//    }) ;

    self.vis.append("line")
            .attr("x1", self.x(this.options.starttime))
            .attr("y1", self.y(1))
            .attr("x2", self.x(this.options.endtime))
            .attr("y2", self.y(1))
            .style("stroke", "green")
            .style("stroke-width", 2);



    this.data.forEach(function(d){

        self.vis.append("line")
            .attr("x1", self.x(d.startTime))
            .attr("y1", self.y(1))
            .attr("x2", self.x(d.endTime))
            .attr("y2", self.y(1))
            .style("stroke", "red")
            .style("stroke-width", 2);

        self.vis.append("rect")
            .attr("x", self.x(d.startTime))
            .attr("y", self.y(1))
            .attr("height", self.y(0)-self.y(1))
            .attr("width", self.x(d.endTime) - self.x(d.startTime))
            // .style("stroke", "red")
            .style("fill", "#00FF0E")
            .style("stroke-width", 1)
            .on("click" , function(){
            	console.log("click me") ;
            })
            .on("mouseover", function() { 
            	// console.log("over") ; 
            	self.showTip("n" , d.startTime); 
            })
            .on("mouseout", function() {
            	self.hideTip(); 
            });

    }) ;


    // append the rectangle to capture mouse
    var capture = this.vis.append("rect")
        .attr("width", self.size.width)
        .attr("height", self.size.height)
        .style("fill", "none") ;
        // .style("pointer-events", "all")
        // .on("mousedown.drag", self.plot_drag())
        // .on("touchstart.drag", self.plot_drag())
        // .call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));

    if (options.showFocus) {
        this.focus = this.drawFocus() ;
        capture.on("mouseover", function() { self.focus.style("display", null); })
            .on("mouseout", function() { self.focus.style("display", "none"); })
            .on("mousemove", function(){self.onfocus(d3.mouse(this)) ;})
    }

// add Chart Title
    if (this.options.title) {
        this.vis.append("text")
            .attr("class", "axis")
            .text(this.options.title)
            .attr("x", this.size.width / 2)
            .attr("dy", "-0.8em")
            .style("text-anchor", "middle");
    }

// Add the x-axis label
    if (this.options.xlabel) {
        this.vis.append("text")
            .attr("class", "axis")
            .text(this.options.xlabel)
            .attr("x", this.size.width / 2)
            .attr("y", this.size.height)
            .attr("dy", "2.4em")
            .style("text-anchor", "middle");
    }

// add y-axis label
    if (this.options.ylabel) {
        this.vis.append("g").append("text")
            .attr("class", "axis")
            .text(this.options.ylabel)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + -40 + " " + this.size.height / 2 + ") rotate(-90)");
    }

    // this.chart
        // .on("mousemove.drag", self.mousemove())
        // .on("touchmove.drag", self.mousemove())
        // .on("mouseup.drag", self.mouseup())
        // .on("touchend.drag", self.mouseup());

    this.redraw()();
};

//
// TimeLineChart methods
//

TimeLineChart.prototype.showTip = function(direction, msg) {
	if (this.tip == null) {
		this.tip = d3.tip().attr('class', 'd3-tip').direction(direction).offset(function() {
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
		this.vis.call(this.tip);
	}
	this.tip.html(msg);
	this.tip.show();
};

TimeLineChart.prototype.hideTip = function() {
	this.tip.hide();
};

TimeLineChart.prototype.plot_drag = function () {
    var self = this;
    return function () {
        registerKeyboardHandler(self.keydown());
        d3.select('body').style("cursor", "move");
        if (d3.event.altKey) {
            var p = d3.mouse(self.vis.node());
            var newpoint = {};
            newpoint.x = self.x.invert(Math.max(0, Math.min(self.size.width, p[0])));
            newpoint.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
            self.points.push(newpoint);
            self.points.sort(function (a, b) {
                if (a.x < b.x) {
                    return -1
                }
                ;
                if (a.x > b.x) {
                    return  1
                }
                ;
                return 0
            });
            self.selected = newpoint;
            self.update();
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
    }
};

TimeLineChart.prototype.update = function () {
    var self = this;
    if (this.options.drawLine) {
        //var lines = this.vis.select("path").attr("d", this.line(this.data));
    }

    var svg = this.vis.select("svg") ;

    if (d3.event && d3.event.keyCode) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

}

TimeLineChart.prototype.datapoint_drag = function () {
    var self = this;
    return function (d) {
        registerKeyboardHandler(self.keydown());
        document.onselectstart = function () {
            return false;
        };
        self.selected = self.dragged = d;
        self.update();

    }
};

TimeLineChart.prototype.mousemove = function () {
    var self = this;
    return function () {
        var p = d3.mouse(self.vis[0][0]),
            t = d3.event.changedTouches;

        if (self.dragged) {
            self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
            self.update();
        }
        ;
        if (!isNaN(self.downx)) {
            d3.select('body').style("cursor", "ew-resize");
            var rupx = self.x.invert(p[0]),
                xaxis1 = self.x.domain()[0],
                xaxis2 = self.x.domain()[1],
                xextent = xaxis2 - xaxis1;
            if (rupx != 0) {
                var changex, new_domain;
                changex = self.downx / rupx;
                new_domain = [xaxis1, xaxis1 + (xextent * changex)];
                self.x.domain(new_domain);
                self.redraw()();
            }
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
        ;
        if (!isNaN(self.downy)) {
            d3.select('body').style("cursor", "ns-resize");
            var rupy = self.y.invert(p[1]),
                yaxis1 = self.y.domain()[1],
                yaxis2 = self.y.domain()[0],
                yextent = yaxis2 - yaxis1;
            if (rupy != 0) {
                var changey, new_domain;
                changey = self.downy / rupy;
                new_domain = [yaxis1 + (yextent * changey), yaxis1];
                self.y.domain(new_domain);
                self.redraw()();
            }
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
    }
};

TimeLineChart.prototype.mouseup = function () {
    var self = this;
    return function () {
        document.onselectstart = function () {
            return true;
        };
        d3.select('body').style("cursor", "auto");
        d3.select('body').style("cursor", "auto");
        if (!isNaN(self.downx)) {
            self.redraw()();
            self.downx = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
        ;
        if (!isNaN(self.downy)) {
            self.redraw()();
            self.downy = Math.NaN;
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
        if (self.dragged) {
            self.dragged = null
        }
    }
}

TimeLineChart.prototype.keydown = function () {
    var self = this;
    return function () {
        if (!self.selected) return;
        switch (d3.event.keyCode) {
            case 8: // backspace
            case 46:
            { // delete
                var i = self.points.indexOf(self.selected);
                self.points.splice(i, 1);
                self.selected = self.points.length ? self.points[i > 0 ? i - 1 : 0] : null;
                self.update();
                break;
            }
        }
    }
};

TimeLineChart.prototype.drawFocus = function() {
    var self = this;
    var focus = self.vis.append("g")
        .style("display", "none");
    focus.append("circle")
        .style("fill", "none")
        .style("stroke", "blue")
        .attr("r", 4);

    // append the x line
    focus.append("line")
        .attr("class", "x")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", self.size.height);

    // append the y line
    focus.append("line")
        .attr("class", "y")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", self.size.width)
        .attr("x2", self.size.width);

    // append the circle at the intersection
    focus.append("circle")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "blue")
        .attr("r", 4);

    // place the value at the intersection
    focus.append("text")
        .attr("class", "y1")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "-.3em");
    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 8)
        .attr("dy", "-.3em");

    // place the date at the intersection
    focus.append("text")
        .attr("class", "y3")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "1em");
    focus.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em");
    return focus ;
} ;

TimeLineChart.prototype.onfocus = function(point) {
    var self = this;
    //  %d-%b-%y
    var parseDate = d3.time.format("%b %d").parse,
        formatDate = d3.time.format("%Y/%m/%d-%H:%M:%S"),
        bisectDate = d3.bisector(function(d) { return d.startTime; }).left;

    var x0 = self.x.invert(point[0]),
        i = bisectDate(self.data, x0, 1),
        d0 = self.data[i - 1],
        d1 = self.data[i] ;

    var d ;

    if (angular.isDefined(d0) && angular.isDefined(d1)) {
        d = x0 - d0.startTime > d1.startTime - x0 ? d1 : d0;
        setFocus() ;
    }

    function setFocus() {
        var focus = self.focus ;
        focus.select("circle.y")
            .attr("transform",
                "translate(" + self.x(d.startTime) + "," +
                self.y(d.value) + ")");

        focus.select("text.y1")
            .attr("transform",
                "translate(" + self.x(d.startTime) + "," +
                self.y(d.value) + ")")
            .text(d.value);

        focus.select("text.y2")
            .attr("transform",
                "translate(" + self.x(d.startTime) + "," +
                self.y(d.value) + ")")
            .text(d.value);

        focus.select("text.y3")
            .attr("transform",
                "translate(" + self.x(d.startTime) + "," +
                self.y(d.value) + ")")
            .text(formatDate(d.startTime));

        focus.select("text.y4")
            .attr("transform",
                "translate(" + self.x(d.startTime) + "," +
                self.y(d.value) + ")")
            .text(formatDate(d.startTime));

        focus.select(".x")
            .attr("transform",
                "translate(" + self.x(d.startTime) + "," +
                self.y(d.value) + ")")
            .attr("y2", self.size.height - self.y(d.value));

        focus.select(".y")
            .attr("transform",
                "translate(" + self.size.width * -1 + "," +
                self.y(d.value) + ")")
            .attr("x2", self.size.width + self.size.width);
    }

} ;

TimeLineChart.prototype.redraw = function () {
	// console.log("redraw") ;
    var self = this;
    var formatDate = d3.time.format("%b %d") ;
    return function () {
        var tx = function (d) {
                return "translate(" + self.x(d) + ",0)";
            },
            ty = function (d) {
                return "translate(0," + self.y(d) + ")";
            },
            stroke = function (d) {
                return d ? "#ccc" : "#666";
            },
            fx = self.x.tickFormat(5),
            fy = self.y.tickFormat(5);


// Regenerate x-ticks…
        var gx = self.vis.selectAll("g.x")
            .data(self.x.ticks(10), String)
            .attr("transform", tx);

        // gx.select("text")
            // .text(fx);
            
        // gx.select("text")
            // .text(function(d){
            	// console.log(fx(d)) ;
            	// return fx(d) ;
            	// });

        var gxe = gx.enter().insert("g", "a")
            .attr("class", "x")
            .attr("transform", tx);

        gxe.append("line")
            .attr("stroke", stroke)
            .attr("y1", 0)
            .attr("y2", self.size.height);


        gxe.append("text")
            .attr("class", "axis")
            .attr("y", self.size.height)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            // .text(fx)
            .text(function(d){return formatDate(d);})
            .style("cursor", "ew-resize")
            .on("mouseover", function (d) {
                d3.select(this).style("font-weight", "bold");
            })
            .on("mouseout", function (d) {
                d3.select(this).style("font-weight", "normal");
            })
            .on("mousedown.drag", self.xaxis_drag())
            .on("touchstart.drag", self.xaxis_drag());

        gx.exit().remove();

// Regenerate y-ticks…
        var gy = self.vis.selectAll("g.y")
            .data(self.y.ticks(10), String)
            .attr("transform", ty);

        gy.select("text")
            .text(fy);

        var gye = gy.enter().insert("g", "a")
            .attr("class", "y")
            .attr("transform", ty)
            .attr("background-fill", "#FFEEB6");

        gye.append("line")
            .attr("stroke", stroke)
            .attr("x1", 0)
            .attr("x2", self.size.width);

        gye.append("text")
            .attr("class", "axis")
            .attr("x", -3)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(fy)
            .style("cursor", "ns-resize")
            .on("mouseover", function (d) {
                d3.select(this).style("font-weight", "bold");
            })
            .on("mouseout", function (d) {
                d3.select(this).style("font-weight", "normal");
            })
            .on("mousedown.drag", self.yaxis_drag())
            .on("touchstart.drag", self.yaxis_drag());

        gy.exit().remove();
        self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
        self.update();
    }
}

TimeLineChart.prototype.xaxis_drag = function () {
    var self = this;
    return function (d) {
        document.onselectstart = function () {
            return false;
        };
        var p = d3.mouse(self.vis[0][0]);
        self.downx = self.x.invert(p[0]);
    }
};

TimeLineChart.prototype.yaxis_drag = function (d) {
    var self = this;
    return function (d) {
        document.onselectstart = function () {
            return false;
        };
        var p = d3.mouse(self.vis[0][0]);
        self.downy = self.y.invert(p[1]);
    }
};