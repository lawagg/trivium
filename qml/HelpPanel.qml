import QtQuick
import QtQuick.Controls
import "Palette.js" as P

// Справка «Как судить?»: алгоритм судейства из ТЗ.
// Раскрывается справа так же, как панель блока.
Item {
    id: help

    property var sections: []
    property bool open: false
    property int fullWidth: 720
    property int fullHeight: 520

    signal closeRequested()

    width: open ? fullWidth : 0
    height: fullHeight
    clip: true
    visible: width > 2

    Behavior on width { NumberAnimation { duration: 340; easing.type: Easing.OutCubic } }
    Behavior on height { NumberAnimation { duration: 300; easing.type: Easing.OutCubic } }

    Rectangle {
        width: help.fullWidth
        height: help.fullHeight
        color: P.surface
        border.color: P.line
        border.width: 1
        radius: 4
    }

    Item {
        id: content
        width: help.fullWidth
        height: help.fullHeight
        opacity: help.open ? 1.0 : 0.0
        Behavior on opacity { NumberAnimation { duration: help.open ? 240 : 120 } }

        Text {
            x: 28
            y: 24
            text: "АЛГОРИТМ СУДЕЙСТВА"
            color: P.text
            font.pixelSize: 15
            font.letterSpacing: 5
            font.bold: true
        }

        Text {
            x: 28
            y: 46
            text: "как пользоваться формой"
            color: P.textMute
            font.pixelSize: 11
            font.letterSpacing: 1
        }

        Rectangle {
            x: 28
            y: 68
            width: help.fullWidth - 56
            height: 1
            color: P.line
            opacity: 0.7
        }

        Item {
            x: help.fullWidth - 52
            y: 18
            width: 30
            height: 30

            Text {
                anchors.centerIn: parent
                text: "\u00d7"
                color: closeArea.containsMouse ? P.text : P.textMute
                font.pixelSize: 20
            }

            MouseArea {
                id: closeArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: help.closeRequested()
            }
        }

        Flickable {
            id: flick
            x: 28
            y: 84
            width: help.fullWidth - 56
            height: help.fullHeight - 104
            clip: true
            contentWidth: width
            contentHeight: column.height
            boundsBehavior: Flickable.StopAtBounds
            ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

            Column {
                id: column
                width: flick.width - 8
                spacing: 18

                Repeater {
                    model: help.sections

                    delegate: Column {
                        id: section
                        width: column.width
                        spacing: 7

                        property var sec: modelData

                        Row {
                            spacing: 9

                            Text {
                                text: section.sec && section.sec.num && section.sec.num.length > 0
                                      ? section.sec.num + "." : ""
                                color: P.accent
                                font.pixelSize: 12
                                font.bold: true
                            }

                            Text {
                                text: section.sec ? section.sec.title : ""
                                color: P.text
                                font.pixelSize: 12
                                font.letterSpacing: 2
                                font.bold: true
                            }
                        }

                        Repeater {
                            model: section.sec ? section.sec.items : []

                            delegate: Text {
                                width: section.width
                                topPadding: modelData.h === true ? 4 : 0
                                text: modelData.text
                                color: modelData.h === true ? P.textDim : P.textMute
                                font.pixelSize: modelData.h === true ? 10 : 11
                                font.bold: modelData.h === true
                                font.letterSpacing: modelData.h === true ? 2 : 0
                                lineHeight: 1.4
                                wrapMode: Text.WordWrap
                            }
                        }
                    }
                }
            }
        }
    }
}
