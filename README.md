Connector Router
================

Demo
----

http://kkudryavtsev.github.io/connector-router/

Description
-----

A JS implementation of a greedy algorithm for routing edges in a directed graph using the following rules:

* Each node has a set of inbound and outbound edges
* Each edge connects to a node on a selected connection point, or "dock", which is defined by
** x and y coordinates
** a normalised vector V at which an edge that uses the dock must enter the node. (Example: a dock with a V of [1,0] means that an edge that uses this dock must enter the node directly from the right)
* Inbound and outbound edges cannot use the same dock
* Once connected an edge would give a slight preference to the docks that it has previously acquired during the rerouting procedure in order to prevent edges "jumping around"
* Bezier curves are used for visualising edges
* For each node all inbound and outbound edges are assigned docks in such way that the amount of bending in each edge is minimised
* The amount of bending is calculated as

![bend formula](https://raw.github.com/kkudryavtsev/connector-router/master/bend.gif "bend formula")

Where B[x][y] is the amount of bending in the curve connecting dock x with dock y while cos(a) and cos(b) are the cosines of the angles between the corresponding normalised dock vectors and a normalised directional vector D that lies on the line connecting x and y.

![formula illustrated](https://raw.github.com/kkudryavtsev/connector-router/master/formula_illustrated.png "formula illustrated")

Higher values of B[x][y] mean more bending in the bezier curve connecting x and y and less readable graph. Therefore the purpose of the algorithm is to assign docks to edges in such way that the sum of B[x][y] for the routed node is minimised.

The algorithm
-------------

The algorithm is based on iteratively making assumptions about the best way to route all edges for a node, picking one pair of docks based on these assumptions, connecting these and evaluating the results.

Detailed description coming soon