/*global flow, _, Router */

(function () {
    var totalConns;
    
    function newRoutingStep(step){
        var next = step.freePairs.shift();

        if(!next) return null;

        step.potentialScore = getPotentialScore(step.freePairs, step.pickedPairs.length);

        var newFreePairs = _.compact(_.reject(step.freePairs, function(pair){
            return (pair.connector == next.connector) ||
                ((pair.dir == "in") && (next.source == pair.target)) ||
                ((pair.dir == "out") && (next.target == pair.source));
        }));

        var pickedPairs = step.pickedPairs.concat(next);
        var potentialScore = getPotentialScore(newFreePairs, pickedPairs.length);
        
        return {
            freePairs: newFreePairs, 
            pickedPairs: pickedPairs,
            currentScore: step.currentScore + next.score,
            potentialScore: potentialScore
        };
    }

    function getPotentialScore(pairs, pickedPairsNum){
        var connectorsFound = [];
        var potentialScore = 0;

        for(var i = -1, l = pairs.length; ++i < l;){
            if(! _.contains(connectorsFound, pairs[i].connector)){
                connectorsFound.push(pairs[i].connector);
                
                potentialScore += pairs[i].score;

                if(connectorsFound.length === (totalConns - pickedPairsNum)) return potentialScore;
            }
        }
        
        return null;
    }
    
    Router = {
        routeConnectors: function(node){
            var steps = [], routedConnectors = [];;
            totalConns = 0;

            var freePairs = this._collectPairs([], node);

            if(!freePairs.length) return [];
            
            steps.push({
                freePairs: freePairs,
                pickedPairs: [],
                score: 0,
                nextScore: 0,
                currentScore: 0,
                potentialScore: getPotentialScore(freePairs,0)
            });

            var oPairs = this._getOptimalPairs(steps);

            _.each(oPairs, function(pair){
                pair.connector.docks = pair;
                routedConnectors.push(pair.connector);
            }, this);

            return routedConnectors;
        },
        _getOptimalPairs: function(steps){
            var iters = 0;
            var nextStep, easiestStep;

            do {
                iters++;
                
                easiestStep = _.min(steps, function(step){ return step.currentScore + step.potentialScore; }, this);

                nextStep = newRoutingStep(easiestStep);

                if(nextStep.potentialScore !== null) nextStep.freePairs.length && steps.unshift(nextStep);

                if(easiestStep.potentialScore === null)steps = _.without(steps,easiestStep);
            } while(nextStep.freePairs.length || (nextStep.pickedPairs.length != totalConns));

            return nextStep.pickedPairs;
        },
        _collectPairs: function(pairs, node){
            _.each(node.inConnectors, function(conn){
                if(conn){
                    pairs = pairs.concat(this._connectorScores(conn, "in", node));
                    totalConns++;
                } 
            }, this);
            
            _.each(node.outConnectors, function(conn){
                if(conn){
                    pairs = pairs.concat(this._connectorScores(conn, "out", node));
                    totalConns++;
                } 
            }, this);

            return _.sortBy(pairs, function(pair){return pair.score; });
        },
        _connectorScores: function(conn, dir, node){
            var pairs = [], pair;
            
            _.each(node.docks, function(dock){
                pair = this.bestDockPairFor(conn, dir == "in" ?  "target" : "source", dock, {unmodified: true});

                if(pair){
                    pairs.push(_.extend(pair,{
                        dir: dir,
                        connector: conn
                    }));
                }
            }, this);

            return pairs;
        },
        bestDockPairFor: function(connector, side, dock){
            var bestPair, score, onSrc = (side == "source");

            _.each(onSrc ? connector.target.docks : connector.source.docks, function(opDock){
                var sDock = onSrc ? dock : opDock, tDock = onSrc ? opDock : dock;
                
                if((onSrc ? this._docksAllowedOnSource(connector, sDock, tDock) :
                    this._docksAllowedOnTarget(connector, sDock, tDock)) &&
                   !this._targetDockReserved(connector, tDock)){
                    
                    score = this._scoreForDockPair(sDock, tDock);

                    if(!bestPair || score < bestPair.score){
                        bestPair = { score: score, source: sDock, target: tDock };
                    }
                }
            }, this);

            return bestPair;
        },
        _scoreForDockPair: function(sDock,tDock){
            var dir = normalise([tDock.x - sDock.x, tDock.y - sDock.y]);
            var cos1 = dot(sDock.v, dir), cos2 = dot(tDock.v, neg(dir));
            var score = (2 - 2*cos1*cos2) / ((1 + cos1)*(1+cos2));
            
            return isNaN(score) ? Infinity : score;
        },
        //the following two routines are to eventually replace dockPairAllowed completely 
        _docksAllowedOnTarget: function(connector, sDock, tDock){
            return !this.inConnectorsOnSourceFor(connector, sDock).length;
        },
        _docksAllowedOnSource: function(connector, sDock, tDock){
            return !this.outConnectorsOnTargetFor(connector, tDock).length;
        },
        _targetDockReserved: function(connector, tDock){
            return tDock.reserved && _.any(connector.target.outConnectors, function(conn){ return !conn; });
        }
    };


    _.each(["source","target"], function(node){
        _.each(["out","in"], function(type){
            var utilName = type+"ConnectorsOn"+node[0].toUpperCase() + node.slice(1);
            
            Router[utilName + "For"] = function(connector, dock){
                var conns = connector[node][type+"Connectors"];

                return _.filter(conns, function(c){return c && (c.docks[type=="in" ? "target" : "source"] == dock);});
            };

            Router[utilName + "Dock"] = function(connector){
                return connector.docks && connector[utilName + "For"](this.docks[node], 1);
            };
        });
    });

    function neg(v){ return [-v[0], -v[1]]; }

    function dot(v1,v2){ return v1[0]*v2[0] + v1[1]*v2[1]; } 

    function normalise(v){
        var len = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
        
        return [v[0] / len, v[1] / len ];
    };
}());

