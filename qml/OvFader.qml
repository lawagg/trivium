import QtQuick

// Фейдер «Общее впечатление»: единственный, у которого есть числовая шкала,
// риски и чёрточки (ТЗ, п. 1 «Реализация»).
Item {
    id: root

    property int value: 0
    property int from: 0
    property int to: 10
    property color accent: theme.accent

    signal changed(int value)

    implicitHeight: 58

    readonly property int steps: Math.max(1, to - from)
    readonly property real handleSize: 10

    function xFor(step) {
        var usable = Math.max(0, width - handleSize)
        return handleSize / 2 + (step / steps) * usable
    }

    function setFromX(x) {
        var usable = Math.max(1, width - handleSize)
        var raw = (x - handleSize / 2) / usable
        raw = Math.max(0, Math.min(1, raw))
        var stepped = Math.floor(raw * steps + 1e-6)
        var result = from + Math.max(0, Math.min(steps, stepped))
        if (result !== root.value) {
            root.value = result
            root.changed(result)
        }
    }

    Rectangle {
        id: track
        y: 10
        width: root.width
        height: 2
        color: theme.line
    }

    Rectangle {
        anchors.verticalCenter: track.verticalCenter
        x: root.handleSize / 2
        width: Math.max(0, root.xFor(root.value) - root.handleSize / 2)
        height: 2
        color: root.accent
        opacity: 0.6
    }

    Repeater {
        model: root.steps + 1

        delegate: Item {
            width: 1
            height: root.implicitHeight
            x: root.xFor(index) - width / 2

            Rectangle {
                width: 1
                height: 5
                y: 15
                color: index === root.value ? root.accent : theme.line
            }
            Text {
                y: 24
                x: 0.5 - 14
                width: 28
                horizontalAlignment: Text.AlignHCenter
                text: root.from + index
                color: index === root.value ? root.accent : theme.textMute
                font.pixelSize: 10
            }
        }
    }

    Rectangle {
        x: root.xFor(root.value) - root.handleSize / 2
        y: 5
        width: root.handleSize
        height: root.handleSize
        radius: 2
        color: theme.text
        border.color: root.accent
        border.width: 2
    }

    MouseArea {
        anchors.fill: parent
        anchors.bottomMargin: 22
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        preventStealing: true
        onPressed: (mouse) => root.setFromX(mouse.x)
        onPositionChanged: (mouse) => {
            if (pressed)
                root.setFromX(mouse.x)
        }
    }
}
