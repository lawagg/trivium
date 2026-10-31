import QtQuick
import "Palette.js" as P

// Фейдер сравнения двух песен.
// value = -1 — крайне левое положение (сильнее песня 1),
//         +1 — крайне правое (сильнее песня 2),
//          0 — центр (преимущества нет).
// Числовых подписей у этого фейдера нет — так требует ТЗ.
Item {
    id: root

    property real value: 0.0
    property color leftColor: P.sideA
    property color rightColor: P.sideB

    signal moved(real pos)

    implicitHeight: 32

    readonly property real handleSize: 12
    readonly property real clamped: Math.max(-1, Math.min(1, value))
    readonly property real midX: width / 2
    readonly property real cx: handleSize / 2 + ((clamped + 1) / 2) * Math.max(0, width - handleSize)
    readonly property color activeColor: clamped < 0 ? leftColor : rightColor
    readonly property bool centered: Math.abs(clamped) < 0.001

    function setFromX(x) {
        var w = Math.max(1, width)
        var p = (x - w / 2) / (w / 2)
        p = Math.max(-1, Math.min(1, p))
        if (Math.abs(p) < 0.015)
            p = 0
        root.value = p
        root.moved(p)
    }

    // дорожка
    Rectangle {
        anchors.verticalCenter: parent.verticalCenter
        width: root.width
        height: 2
        color: P.line
    }

    // заливка от центра к активной стороне
    Rectangle {
        anchors.verticalCenter: parent.verticalCenter
        x: Math.min(root.midX, root.cx)
        width: Math.abs(root.cx - root.midX)
        height: 2
        color: root.activeColor
        opacity: 0.85
        visible: width > 0.5
    }

    // центральная риска
    Rectangle {
        anchors.verticalCenter: parent.verticalCenter
        x: root.midX - 0.5
        width: 1
        height: 10
        color: root.centered ? P.textDim : P.line
    }

    // ручка
    Rectangle {
        anchors.verticalCenter: parent.verticalCenter
        x: root.cx - root.handleSize / 2
        width: root.handleSize
        height: root.handleSize
        radius: root.handleSize / 2
        color: root.centered ? P.textDim : P.text
        border.width: root.centered ? 0 : 3
        border.color: root.activeColor
        Behavior on color { ColorAnimation { duration: 120 } }
    }

    MouseArea {
        id: area
        anchors.fill: parent
        enabled: root.enabled
        hoverEnabled: true
        preventStealing: true
        cursorShape: Qt.PointingHandCursor

        onPressed: (mouse) => root.setFromX(mouse.x)
        onPositionChanged: (mouse) => {
            if (pressed)
                root.setFromX(mouse.x)
        }
        onDoubleClicked: (mouse) => {
            root.value = 0
            root.moved(0)
        }
    }
}
