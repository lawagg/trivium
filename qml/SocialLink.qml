import QtQuick
import QtQuick.Shapes

// Иконка-ссылка. kind: "vk" | "mail" | "tg"
Item {
    id: link

    property string kind: "vk"
    property string url: ""

    signal activated()

    width: 26
    height: 26

    Rectangle {
        anchors.fill: parent
        radius: width / 2
        color: area.containsMouse ? theme.surfaceHi : "transparent"
        border.color: area.containsMouse ? theme.accent : theme.line
        border.width: 1
        Behavior on border.color { ColorAnimation { duration: 140 } }
    }

    // ВКонтакте — монограмма
    Text {
        visible: link.kind === "vk"
        anchors.centerIn: parent
        text: "VK"
        color: area.containsMouse ? theme.accent : theme.textDim
        font.pixelSize: 9
        font.bold: true
        font.letterSpacing: 0.5
    }

    // Почта — конверт
    Shape {
        visible: link.kind === "mail"
        anchors.centerIn: parent
        width: 22
        height: 22

        ShapePath {
            strokeColor: area.containsMouse ? theme.accent : theme.textDim
            strokeWidth: 1
            fillColor: "transparent"
            startX: 6
            startY: 8
            PathLine { x: 16; y: 8 }
            PathLine { x: 16; y: 15 }
            PathLine { x: 6; y: 15 }
            PathLine { x: 6; y: 8 }
        }

        ShapePath {
            strokeColor: area.containsMouse ? theme.accent : theme.textDim
            strokeWidth: 1
            fillColor: "transparent"
            startX: 6
            startY: 8
            PathLine { x: 11; y: 12 }
            PathLine { x: 16; y: 8 }
        }
    }

    // Телеграм — бумажный самолётик
    Shape {
        visible: link.kind === "tg"
        anchors.centerIn: parent
        width: 22
        height: 22

        ShapePath {
            strokeColor: "transparent"
            fillColor: area.containsMouse ? theme.accent : theme.textDim
            startX: 5
            startY: 11
            PathLine { x: 17; y: 5 }
            PathLine { x: 13; y: 17 }
            PathLine { x: 10; y: 12 }
            PathLine { x: 5; y: 11 }
        }
    }

    MouseArea {
        id: area
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: {
            if (link.url.length > 0)
                Qt.openUrlExternally(link.url)
            link.activated()
        }
    }
}
