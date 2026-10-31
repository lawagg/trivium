import QtQuick
import "Palette.js" as P

// Экран результата: радар по девяти критериям, списки того,
// что каждая песня забрала у оппонента, и короткий вердикт.
// Никаких баллов на экране — только факты превосходства.
Item {
    id: view

    property var result: null
    property color colorA: P.sideA
    property color colorB: P.sideB

    readonly property bool ready: result !== null && result !== undefined && result.ok === true
    readonly property bool wide: width >= 820
    readonly property bool winnerIsA: ready && result.winner === "A"
    readonly property bool isDraw: ready && result.draw === true
    readonly property bool accentVerdict: ready && result.kind === "art_flip"

    readonly property int margin: 18
    readonly property int verdictH: 28

    visible: ready

    Rectangle {
        anchors.fill: parent
        color: P.surface
        border.color: P.line
        border.width: 1
        radius: 4
    }

    // --- вердикт по центру внизу ---
    Rectangle {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: view.margin
        width: verdictText.width + 24
        height: view.verdictH
        radius: 3
        color: "transparent"
        border.width: 1
        border.color: view.accentVerdict ? P.accent : P.line

        Text {
            id: verdictText
            anchors.centerIn: parent
            text: view.ready ? view.result.verdict_label.toUpperCase() : ""
            color: view.accentVerdict ? P.accent : P.textDim
            font.pixelSize: 10
            font.letterSpacing: 3
            font.bold: true
        }
    }

    Item {
        id: middle
        x: view.margin
        y: view.margin
        width: view.width - view.margin * 2
        height: Math.max(0, view.height - view.margin * 2 - view.verdictH - 16)

        // --- широко: списки по бокам от радара ---
        Item {
            id: wideBlock
            anchors.fill: parent
            visible: view.wide

            readonly property int radarSide: Math.max(200, Math.min(height, 460))
            readonly property int sideWidth: Math.max(120, (width - radarSide) / 2 - 24)

            ScoreList {
                x: 0
                y: Math.max(0, (wideBlock.height - height) / 2)
                width: wideBlock.sideWidth
                trackName: view.ready ? view.result.name_a : ""
                accent: view.colorA
                items: view.ready ? view.result.strengths_a : []
            }

            ScoreList {
                anchors.right: parent.right
                y: Math.max(0, (wideBlock.height - height) / 2)
                width: wideBlock.sideWidth
                trackName: view.ready ? view.result.name_b : ""
                accent: view.colorB
                items: view.ready ? view.result.strengths_b : []
            }

            RadarChart {
                anchors.centerIn: parent
                width: wideBlock.radarSide
                height: width
                labels: view.ready ? view.result.radar.labels : []
                valuesA: view.ready ? view.result.radar.a : []
                valuesB: view.ready ? view.result.radar.b : []
                maxValue: view.ready ? view.result.radar.max : 6
                colorA: view.colorA
                colorB: view.colorB
                winnerIsA: view.winnerIsA
                drawCase: view.isDraw
            }
        }

        // --- узко: радар сверху, списки под ним ---
        Item {
            id: narrowBlock
            anchors.fill: parent
            visible: !view.wide

            readonly property int radarSide: Math.max(140, Math.min(width, 230, height * 0.5))

            RadarChart {
                x: (parent.width - width) / 2
                y: 0
                width: narrowBlock.radarSide
                height: width
                labels: view.ready ? view.result.radar.labels : []
                valuesA: view.ready ? view.result.radar.a : []
                valuesB: view.ready ? view.result.radar.b : []
                maxValue: view.ready ? view.result.radar.max : 6
                colorA: view.colorA
                colorB: view.colorB
                winnerIsA: view.winnerIsA
                drawCase: view.isDraw
            }

            Row {
                width: parent.width
                y: narrowBlock.radarSide + 10
                spacing: 16

                ScoreList {
                    width: (parent.width - 16) / 2
                    trackName: view.ready ? view.result.name_a : ""
                    accent: view.colorA
                    items: view.ready ? view.result.strengths_a : []
                }

                ScoreList {
                    width: (parent.width - 16) / 2
                    trackName: view.ready ? view.result.name_b : ""
                    accent: view.colorB
                    items: view.ready ? view.result.strengths_b : []
                }
            }
        }
    }
}
