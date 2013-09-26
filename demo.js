/*global demo, _, $, Raphael, Router */

(function () {
    var paper,
        ARROW_OUTER_LENGTH = 15,
        ARROW_INNER_LENGTH = 10,
        ARROW_ANGLE_RAD = 20 * Math.PI / 180; // 20 degrees

    
    var createConnector = function(source, target){
        var path = paper.path([]);

        path.attr({ "arrow-end": "none", "stroke-width": 1 });

        return {
            source: source,
            target: target,
            path: path,
            arrowPath: paper.path([]),
            docks: {}
        };
    };

    var drawArrow = function(connector, ex, ey){
        ex -= connector.docks.target.v[0] * ARROW_INNER_LENGTH;
        ey -= connector.docks.target.v[1] * ARROW_INNER_LENGTH;

        var endV = connector.docks.target.v;
        //arrow length:
        var aol = ARROW_OUTER_LENGTH, ail = ARROW_INNER_LENGTH;
        var cosA = Math.cos(ARROW_ANGLE_RAD), sinA = Math.sin(ARROW_ANGLE_RAD);

        //arrow vector:
        var av = endV;

        // arrow lines:  x' = x*cosA - y*sinA, y' = x*sinA + y*cosA
        var a1x = aol*(av[0] * cosA - av[1] * sinA) + ex, a1y = aol*(av[0] * sinA + av[1]*cosA) + ey;
        var a2x = aol*(av[0] * cosA + av[1] * sinA) + ex, a2y = aol*(-av[0] * sinA + av[1]*cosA) + ey;

        // arrow inner point:
        var aix = ex + endV[0] * ail, aiy = ey + endV[1] * ail;
        
        connector.arrowPath.attr({
            path: "M"+ex+","+ey+"L"+a1x+","+a1y+"L"+aix+","+aiy+"L"+a2x+","+a2y+"L"+","+ex+","+ey
        });
    };

    var redrawConnector = function(connector){
        var trg = connector.docks.target, src = connector.docks.source;
        var ex = trg.x + connector.docks.target.v[0] * ARROW_INNER_LENGTH;
        var ey = trg.y + connector.docks.target.v[1] * ARROW_INNER_LENGTH;
        
        var sx = connector.docks.source.x, sy = connector.docks.source.y;
        
        var svx = connector.docks.source.v[0], svy = connector.docks.source.v[1];
        var evx = connector.docks.target.v[0], evy = connector.docks.target.v[1];

        var halfDist = Math.sqrt(Math.pow(sx-ex,2) + Math.pow(sy-ey,2)) / 2;
        
        var cp1x = sx + svx * halfDist, cp1y = sy + svy * halfDist; //control point 1
        var cp2x = ex + evx * halfDist, cp2y = ey + evy * halfDist; // control point 2

        connector.path.attr({ path: "M" + sx + "," + sy + "C" + cp1x + "," + cp1y + "," + cp2x + "," + cp2y +
                              "," + ex + "," + ey });

        drawArrow(connector, ex, ey);
    };

    var createNode = function(opt, paper){
        var node = {};

        _.extend(node, opt, {
            element: $("<div>").addClass("node").draggable({
                drag:function(e, h){
                    node.x = h.offset.left;
                    node.y = h.offset.top;
                    
                    _.each(node.getDocks(), function(dock, i){
                        node.docks[i] = _.extend(node.docks[i] || {}, dock);
                    });
                    _.each(Router.routeConnectors(node), function(conn){ redrawConnector(conn); }, this);
                }.bind(this),
                scroll: false
            }).css({
                top: opt.y,
                left: opt.x,
                position: "absolute"
            }).text("Drag me!"),
            getDocks: function(){
                var w = 100, h=50, x = node.x, y = node.y;

                return [
                    { x: x + w / 2, y: y,         v: [0, -1] }, //v = dock vector (normalised)
                    { x: x + w,     y: y + h / 2, v: [1, 0]  },
                    { x: x + w / 2, y: y + h,     v: [0, 1], reserved: "out"  },
                    { x: x,         y: y + h / 2, v: [-1, 0] }
                ];
            },
            inConnectors: [],
            outConnectors: []
        });

        node.docks = node.getDocks();


        $("body").append(node.element);

        return node;
    };

    var connect = function(source, target){
        var connector = createConnector(source, target);

        source.outConnectors.push(connector);
        target.inConnectors.push(connector);

        _.each(Router.routeConnectors(source), function(conn){ redrawConnector(conn); }, this);
    };

    $(function () {
        var nw = 100, nh = 50, ww = $(window).width(), wh = $(window).height();
        
        paper = Raphael("paper", $(window).width(), $(window).height());

        var nodes = [
            createNode({x:nw*2,y:nh*2}),
            createNode({x:ww/2 - nw/2,y:nh*2}),
            createNode({x:ww - nw*3,y:nh*2}),
            createNode({x:nw*2,y:wh/2 - nh/2}),
            createNode({x:ww/2 - nw/2,y:wh/2 - nh/2}),
            createNode({x:ww - nw*3,y:wh/2 - nh/2}),
            createNode({x:nw*2,y:wh - nh*3}),
            createNode({x:ww/2 - nw/2,y:wh-nh*3}),
            createNode({x:ww - nw*3,y:wh-nh*3})
        ];
        
        for(var i=0, l=nodes.length;i<l; i++){
            for(var j=i+1; j<nodes.length; j++){
                connect(nodes[i], nodes[j]);
            }
        };

    });

}());
