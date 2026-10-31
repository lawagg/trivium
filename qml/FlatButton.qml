import QtQuick
import QtQuick.Controls
import "Palette.js" as P

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
               ? (control.down ? Qt.darker(P.accent, 1.18) : P.accent)
               : (control.hovered ? P.surfaceHi : "transparent")
        border.color: control.primary
                      ? P.accent
                      : (control.hovered ? P.textMute : P.line)
        border.width: 1
        Behavior on color { ColorAnimation { duration: 120 } }
    }

    contentItem: Text {
        id: labelText
        text: control.text ? control.text.toUpperCase() : ""
        color: control.primary ? P.bg : (control.hovered ? P.text : P.textDim)
        font: control.font
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        elide: Text.ElideRight
    }
}
