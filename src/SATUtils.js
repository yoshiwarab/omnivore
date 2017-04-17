import SAT from 'sat';

export default class SATUtils {
  static functionalAdd(v1, v2) {
    var v1 = new SAT.Vector().copy(v1);
    return v1.add(v2);
  }

  static copyPolygon(polygon) {
    var pos = new SAT.Vector().copy(polygon.pos);
    var points = [];
    for (var point of polygon.points) {
      var copy = new SAT.Vector().copy(point);
      points.push(copy);
    }

    return new SAT.Polygon(pos, points);
  }
}
