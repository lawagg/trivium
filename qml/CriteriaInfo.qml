import QtQuick
import QtQuick.Controls
import "Palette.js" as P

// Пояснение к критериям открытого блока.
// Геометрию задаёт Main: колонка слева (side) или полоса сверху (top).
Item {
    id: info

    property var blockData: null
    property bool open: false
    property bool isSide: true
    property int textMax: 460

    signal dismissed()

    opacity: open ? 1.0 : 0.0
    visible: opacity > 0.01
    Behavior on opacity { NumberAnimation { duration: 240 } }

    Rectangle {
        anchors.fill: parent
        color: P.surface
        border.color: P.line
        border.width: 1
        radius: 4
    }

    Item {
        anchors.fill: parent
        anchors.margins: 18

        // текстовая колонка: не шире textMax, по центру панели
        Item {
            id: column
            width: Math.min(info.textMax, parent.width)
            height: parent.height
            anchors.horizontalCenter: parent.horizontalCenter

            Text {
                id: caption
                text: "ЧТО ЗНАЧИТ КРИТЕРИЙ"
                color: P.textMute
                font.pixelSize: 9
                font.letterSpacing: 3
                font.bold: true
            }

            Text {
                id: blockTitle
                anchors.top: caption.bottom
                anchors.topMargin: 6
                text: info.blockData && info.blockData.title ? info.blockData.title.toUpperCase() : ""
                color: P.accent
                font.pixelSize: 12
                font.letterSpacing: 3
                font.bold: true
            }

            Item {
                anchors.right: parent.right
                anchors.top: parent.top
                width: 26
                height: 26

                Text {
                    anchors.centerIn: parent
                    text: "\u00d7"
                    color: closeArea.containsMouse ? P.text : P.textMute
                    font.pixelSize: 18
                }

                MouseArea {
                    id: closeArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: info.dismissed()
                }
            }

            Flickable {
                id: flick
                anchors.top: blockTitle.bottom
                anchors.topMargin: 12
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                clip: true
                contentWidth: width
                contentHeight: list.height
                boundsBehavior: Flickable.StopAtBounds
                ScrollBar.vertical: ScrollBar { policy: ScrollBar.AsNeeded }

                Column {
                    id: list
                    width: flick.width - 6
                    spacing: 18

                    Repeater {
                        model: info.blockData && info.blockData.criteria ? info.blockData.criteria : []

                        delegate: Column {
                            id: critBlock
                            width: list.width
                            spacing: 7

                            property var crit: modelData

                            Text {
                                width: parent.width
                                text: critBlock.crit && critBlock.crit.label ? critBlock.crit.label : ""
                                color: P.text
                                font.pixelSize: 13
                                font.letterSpacing: 1
                                font.bold: true
                            }

                            Text {
                                width: parent.width
                                text: critBlock.crit && critBlock.crit.desc ? critBlock.crit.desc.intro : ""
                                color: P.textDim
                                font.pixelSize: 11
                                lineHeight: 1.45
                                wrapMode: Text.WordWrap
                            }

                            Repeater {
                                model: critBlock.crit && critBlock.crit.desc ? critBlock.crit.desc.sections : []

                                delegate: Column {
                                    id: section
                                    width: critBlock.width
                                    spacing: 5

                                    property var sec: modelData

                                    Text {
                                        width: parent.width
                                        text: section.sec ? section.sec.title + ":" : ""
                                        color: P.textDim
                                        font.pixelSize: 10
                                        font.bold: true
                                    }

                                    Repeater {
                                        model: section.sec ? section.sec.items : []

                                        delegate: Text {
                                            width: section.width
                                            textFormat: Text.RichText
                                            text: "— <b>" + modelData.title + ":</b> " + modelData.text
                                            color: P.textMute
                                            font.pixelSize: 11
                                            lineHeight: 1.45
                                            wrapMode: Text.WordWrap
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
