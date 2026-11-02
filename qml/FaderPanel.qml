import QtQuick

// Панель блока судейства. Разворачивается из вершины тетраэдра:
// левый край закреплён в точке стыковки, ширина растёт от нуля вправо.
Item {
    id: panel

    property var blockData: null
    property int fullWidth: 720
    property int fullHeight: 340
    property bool open: false
    property int gen: 0

    signal faderMoved(string key, real value)
    signal closeRequested()
    signal infoToggleRequested()

    property bool infoVisible: true

    width: open ? fullWidth : 0
    height: fullHeight
    clip: true
    visible: width > 2

    Behavior on width { NumberAnimation { duration: 340; easing.type: Easing.OutCubic } }
    Behavior on y { NumberAnimation { duration: 320; easing.type: Easing.OutCubic } }
    Behavior on height { NumberAnimation { duration: 320; easing.type: Easing.OutCubic } }

    Rectangle {
        width: panel.fullWidth
        height: panel.fullHeight
        color: theme.surface
        border.color: theme.line
        border.width: 1
        radius: 4
    }

    Item {
        id: content
        width: panel.fullWidth
        height: panel.fullHeight
        opacity: panel.open ? 1.0 : 0.0
        Behavior on opacity {
            NumberAnimation { duration: panel.open ? 240 : 120 }
        }

        // --- шапка ---
        Text {
            x: 28
            y: 24
            text: panel.blockData && panel.blockData.title ? panel.blockData.title.toUpperCase() : ""
            color: theme.text
            font.pixelSize: 15
            font.letterSpacing: 5
            font.bold: true
        }

        Text {
            x: 28
            y: 46
            text: panel.blockData && panel.blockData.subtitle ? panel.blockData.subtitle : ""
            color: theme.textMute
            font.pixelSize: 11
            font.letterSpacing: 1
        }

        // легенда сторон
        Row {
            x: panel.fullWidth - 168
            y: 44
            spacing: 8
            visible: panel.fullWidth >= 620

            Rectangle { width: 6; height: 6; radius: 3; color: theme.sideA; y: 4 }
            Text {
                text: "песня 1"
                color: theme.textMute
                font.pixelSize: 10
                font.letterSpacing: 1
            }
            Text { text: "←→"; color: theme.textMute; font.pixelSize: 10 }
            Text {
                text: "песня 2"
                color: theme.textMute
                font.pixelSize: 10
                font.letterSpacing: 1
            }
            Rectangle { width: 6; height: 6; radius: 3; color: theme.sideB; y: 4 }
        }

        Rectangle {
            x: 28
            y: 68
            width: panel.fullWidth - 56
            height: 1
            color: theme.line
            opacity: 0.7
        }

        // крестик
        Item {
            x: panel.fullWidth - 52
            y: 18
            width: 30
            height: 30

            Text {
                anchors.centerIn: parent
                text: "\u00d7"
                color: closeArea.containsMouse ? theme.text : theme.textMute
                font.pixelSize: 20
            }

            MouseArea {
                id: closeArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: panel.closeRequested()
            }
        }

        // пояснение к критериям
        Item {
            x: panel.fullWidth - 88
            y: 18
            width: 30
            height: 30

            Text {
                anchors.centerIn: parent
                text: "?"
                color: infoArea.containsMouse ? theme.text : (panel.infoVisible ? theme.accent : theme.textMute)
                font.pixelSize: 15
                font.bold: true
            }

            MouseArea {
                id: infoArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: panel.infoToggleRequested()
            }
        }

        // --- фейдеры ---
        Column {
            x: 28
            y: 84
            width: panel.fullWidth - 56

            Repeater {
                model: panel.blockData && panel.blockData.criteria ? panel.blockData.criteria : []

                delegate: Item {
                    id: row
                    width: panel.fullWidth - 56
                    height: 74

                    property var crit: modelData
                    property int resetKey: panel.gen
                    onResetKeyChanged: fader.value = 0

                    Text {
                        anchors.left: parent.left
                        anchors.top: parent.top
                        text: row.crit && row.crit.label ? row.crit.label : ""
                        color: theme.textDim
                        font.pixelSize: 13
                        font.letterSpacing: 1
                    }

                    DetentFader {
                        id: fader
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.top: parent.top
                        anchors.topMargin: 26
                        height: 32
                        value: 0
                        leftColor: theme.sideA
                        rightColor: theme.sideB
                        onMoved: (v) => panel.faderMoved(row.crit.key, v)
                    }
                }
            }
        }
    }
}
