import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "Palette.js" as P

// Карточка песни: никнейм + стрелка вниз для ОВ.
Rectangle {
    id: card

    property color accent: P.sideA
    property string caption: "ПЕСНЯ 1"
    property string placeholder: "Никнейм исполнителя"
    property int ov: -1
    property int gen: 0
    property alias name: field.text

    signal nameEdited(string text)
    signal ovSelected(int value)

    height: 98
    radius: 4
    color: P.surface
    border.color: P.line
    border.width: 1

    onGenChanged: {
        field.text = ""
        card.ov = -1
    }

    Text {
        x: 16
        y: 12
        text: card.caption
        color: card.accent
        font.pixelSize: 9
        font.letterSpacing: 3
        font.bold: true
    }

    TextField {
        id: field
        x: 14
        y: 26
        width: card.width - 28
        height: 34
        placeholderText: card.placeholder
        color: P.text
        font.pixelSize: 16
        selectByMouse: true
        placeholderTextColor: P.textMute
        leftPadding: 2
        background: Rectangle { color: "transparent" }
        onTextEdited: card.nameEdited(text)
    }

    Rectangle {
        x: 16
        y: 62
        width: card.width - 32
        height: 1
        color: field.activeFocus ? card.accent : P.line
        Behavior on color { ColorAnimation { duration: 150 } }
    }

    Item {
        x: 14
        y: 66
        width: 104
        height: 26

        Text {
            anchors.verticalCenter: parent.verticalCenter
            text: card.ov < 0 ? "\u25be  ОВ  —" : "\u25be  ОВ  " + card.ov
            color: ovArea.containsMouse ? card.accent : P.textDim
            font.pixelSize: 11
            font.letterSpacing: 1
        }

        MouseArea {
            id: ovArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: ovPopup.open()
        }
    }

    Text {
        x: 120
        y: 66
        height: 26
        verticalAlignment: Text.AlignVCenter
        text: "общее впечатление"
        color: P.textMute
        font.pixelSize: 10
    }

    Popup {
        id: ovPopup
        objectName: "ovPopup"
        modal: true
        padding: 20
        width: 420
        anchors.centerIn: Overlay.overlay
        closePolicy: Popup.CloseOnEscape | Popup.CloseOnPressOutside

        background: Rectangle {
            color: P.surfaceHi
            radius: 4
            border.color: P.line
            border.width: 1
        }

        contentItem: Column {
            width: ovPopup.width - 40
            spacing: 10

            Text {
                text: "ОБЩЕЕ ВПЕЧАТЛЕНИЕ"
                color: P.text
                font.pixelSize: 11
                font.letterSpacing: 3
                font.bold: true
            }

            Text {
                text: "0–10, шаг 1. На победителя не влияет, кроме ничейного исхода."
                color: P.textMute
                font.pixelSize: 10
                width: parent.width
                wrapMode: Text.WordWrap
            }

            OvFader {
                width: parent.width
                height: 58
                accent: card.accent
                value: card.ov < 0 ? 0 : card.ov
                onChanged: (v) => {
                    card.ov = v
                    card.ovSelected(v)
                }
            }

            RowLayout {
                width: parent.width
                spacing: 10

                FlatButton {
                    text: "Сбросить"
                    implicitHeight: 32
                    implicitWidth: 120
                    font.pixelSize: 11
                    onClicked: {
                        card.ov = -1
                        card.ovSelected(-1)
                        ovPopup.close()
                    }
                }

                Item { Layout.fillWidth: true }

                FlatButton {
                    text: "Готово"
                    primary: true
                    implicitHeight: 32
                    implicitWidth: 100
                    font.pixelSize: 11
                    onClicked: ovPopup.close()
                }
            }
        }
    }
}
