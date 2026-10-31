import QtQuick
import "../qml"

Window {
    width: 620
    height: 260
    color: "#0a0a12"
    visible: true

    Column {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 24

        OvFader {
            width: 560
            height: 70
            accent: "#ffd700"
            value: 7
        }

        DetentFader {
            width: 560
            height: 34
            value: -0.5
        }

        DetentFader {
            width: 560
            height: 34
            value: 0.9
        }
    }
}
