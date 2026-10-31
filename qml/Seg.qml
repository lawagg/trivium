import QtQuick

// Отрезок между двумя точками: 1-пиксельная линия, повёрнутая по направлению.
Item {
    id: seg

    property var p1: null
    property var p2: null
    property color segColor: "#ffffff"
    property real thickness: 1

    readonly property real len: (p1 && p2)
        ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
        : 0

    Rectangle {
        x: seg.p1 ? seg.p1.x : 0
        y: (seg.p1 ? seg.p1.y : 0) - seg.thickness / 2
        width: seg.len
        height: seg.thickness
        color: seg.segColor
        antialiasing: true
        transformOrigin: Item.Left
        rotation: (seg.p1 && seg.p2)
            ? Math.atan2(seg.p2.y - seg.p1.y, seg.p2.x - seg.p1.x) * 180 / Math.PI
            : 0
    }
}
