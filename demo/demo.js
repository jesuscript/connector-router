/*global demo, _, $, Raphael, Router */

(function () {
    var paper,
        ARROW_OUTER_LENGTH = 15,
        ARROW_INNER_LENGTH = 10;

    
    var createConnector = function(source, target){
        var path = paper.path([]);

        path.attr({ "arrow-end": "none", "stroke-width": 1 });

        return {
            source: source,
            target: target,
            path: path
        };
    };

    var redrawConnector = function(connector){
        var trg = connector.docks.target, src = connector.docks.source;
        var ex = trg.x + connector.docks.target.v[0] * ARROW_INNER_LENGTH;
        var ey = trg.y + connector.docks.target.v[1] * ARROW_INNER_LENGTH;
        
        var sx = connector.docks.source.x, sy = connector.docks.source.y;
        
        var svx = connector.docks.source.v[0], svy = connector.docks.source.v[1];
        var evx = connector.docks.target.v[0], evy = connector.docks.target.v[1];

        console.log(trg.x);
        var halfDist = Math.sqrt(Math.pow(sx-ex,2) + Math.pow(sy-ey,2)) / 2;
        
        var cp1x = sx + svx * halfDist, cp1y = sy + svy * halfDist; //control point 1
        var cp2x = ex + evx * halfDist, cp2y = ey + evy * halfDist; // control point 2

        var path = "M" + sx + "," + sy + "C" + cp1x + "," + cp1y + "," + cp2x + "," + cp2y + "," + ex + "," + ey;


        console.log(path);
        connector.path.attr({ path: path });
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
                }.bind(this)
            }).css({
                top: opt.y,
                left: opt.x,
                position: "absolute"
            }),
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
        paper = Raphael("paper", $(window).width(), $(window).height());

        var node = [];
        node[1] = createNode({x:200,y:300});
        node[2] = createNode({x:850,y:750});
        node[3] = createNode({x:100,y:100});
        node[4] = createNode({x:400,y:500});
        node[5] = createNode({x:100,y:500});
        node[6] = createNode({x:400,y:100});
        node[7] = createNode({x:700,y:200});
        node[8] = createNode({x:450,y:250});

        
        for(var i=1; i<9; i++){
            for(var j=i+1; j<9; j++){
                connect(node[i], node[j]);
            }
        };

    });

}());
