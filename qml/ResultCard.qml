import QtQuick

// Поле результата: «Победитель и его ОВ» / «Проигравший и его ОВ».
Rectangle {
    id: card

    property string title: "ПОБЕДИТЕЛЬ"
    property string nameText: "—"
    property string ovText: "—"
    property color accent: theme.accent
    property bool muted: false

    implicitHeight: 92
    radius: 4
    color: theme.surface
    border.color: theme.line
    border.width: 1

    Rectangle {
        x: 0
        y: 0
        width: 2
        height: parent.height
        color: card.accent
        opacity: card.muted ? 0.3 : 1.0
    }

    Text {
        x: 20
        y: 16
        text: card.title
        color: card.muted ? theme.textMute : card.accent
        font.pixelSize: 9
        font.letterSpacing: 3
        font.bold: true
    }

    Text {
        x: 20
        y: 33
        width: parent.width - 40
        text: card.nameText
        color: theme.text
        font.pixelSize: 18
        font.bold: true
        elide: Text.ElideRight
    }

    Text {
        x: 20
        y: 62
        text: "ОВ " + card.ovText
        color: theme.textDim
        font.pixelSize: 11
        font.letterSpacing: 1
    }
}
