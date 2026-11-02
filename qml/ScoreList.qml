import QtQuick

// Что песня забрала у оппонента: имя трека + список критериев.
// Никаких баллов — только факт превосходства.
Item {
    id: list

    property string trackName: ""
    property var items: []
    property color accent: theme.textDim

    implicitHeight: column.height

    Column {
        id: column
        width: list.width
        spacing: 4

        Text {
            width: parent.width
            text: list.trackName
            color: list.accent
            font.pixelSize: 11
            font.bold: true
            elide: Text.ElideRight
        }

        Text {
            text: "СИЛЬНЕЕ ОППОНЕНТА"
            color: theme.textMute
            font.pixelSize: 9
            font.letterSpacing: 2
            font.bold: true
        }

        Repeater {
            model: list.items

            delegate: Text {
                width: column.width
                text: modelData && modelData.label ? modelData.label : ""
                color: theme.textDim
                font.pixelSize: 11
                elide: Text.ElideRight
            }
        }

        Text {
            visible: !list.items || list.items.length === 0
            text: "ничего не забрала"
            color: theme.textMute
            font.pixelSize: 10
        }
    }
}
