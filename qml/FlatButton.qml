import QtQuick
import QtQuick.Controls

// Кнопка в общем стиле системы.
Button {
    id: control

    property bool primary: false

    implicitHeight: 40
    implicitWidth: Math.max(128, labelText.implicitWidth + 44)
    font.pixelSize: 12
    font.letterSpacing: 2
    padding: 10

    background: Rectangle {
        radius: 3
        color: control.primary
               ? (control.down ? Qt.darker(theme.accent, 1.18) : theme.accent)
               : (control.hovered ? theme.surfaceHi : "transparent")
        border.color: control.primary
                      ? theme.accent
                      : (control.hovered ? theme.textMute : theme.line)
        border.width: 1
        Behavior on color { ColorAnimation { duration: 120 } }
    }

    contentItem: Text {
        id: labelText
        text: control.text ? control.text.toUpperCase() : ""
        color: control.primary ? theme.bg : (control.hovered ? theme.text : theme.textDim)
        font: control.font
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        elide: Text.ElideRight
    }
}
