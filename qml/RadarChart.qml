import QtQuick
import "Palette.js" as P

// Радар: 9 критериев, две песни контурами без заливки.
// Оси идут в фиксированном порядке, подписи — вокруг.
Item {
    id: chart

    property var labels: []
    property var valuesA: []
    property var valuesB: []
    property real maxValue: 12
    property color colorA: P.sideA
    property color colorB: P.sideB
    property bool winnerIsA: true
    // при ничьей второй контур рисуем пунктиром, иначе один скрывает другой
    property bool drawCase: false

    readonly property int count: labels ? labels.length : 0
    readonly property real cx: width / 2
    readonly property real cy: height / 2
    readonly property real radius: Math.max(20, Math.min(width, height) / 2 - 44)

    function pointAt(i, ratio) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(1, count)
        return {
            x: cx + Math.cos(a) * radius * ratio,
            y: cy + Math.sin(a) * radius * ratio
        }
    }

    function ringSegments() {
        var out = []
        for (var r = 1; r <= 4; r++) {
            for (var i = 0; i < count; i++) {
                out.push({
                    p1: pointAt(i, r / 4),
                    p2: pointAt((i + 1) % count, r / 4)
                })
            }
        }
        return out
    }

    function axisSegments() {
        var out = []
        for (var i = 0; i < count; i++)
            out.push({ p1: pointAt(i, 0), p2: pointAt(i, 1) })
        return out
    }

    function polySegments(values, dashed) {
        var out = []
        if (!values)
            return out
        for (var i = 0; i < count; i++) {
            if (dashed && (i % 2) === 1)
                continue
            var v1 = Math.max(0, Math.min(1, (values[i] || 0) / maxValue))
            var v2 = Math.max(0, Math.min(1, (values[(i + 1) % count] || 0) / maxValue))
            out.push({ p1: pointAt(i, v1), p2: pointAt((i + 1) % count, v2) })
        }
        return out
    }

    function dotsFor(values) {
        var out = []
        if (!values)
            return out
        for (var i = 0; i < count; i++) {
            var v = Math.max(0, Math.min(1, (values[i] || 0) / maxValue))
            var p = pointAt(i, v)
            out.push({ x: p.x, y: p.y, value: values[i] })
        }
        return out
    }

    readonly property var rings: ringSegments()
    readonly property var axes: axisSegments()
    readonly property var polyWinner: winnerIsA ? polySegments(valuesA, false) : polySegments(valuesB, false)
    readonly property var polyOther: winnerIsA
        ? polySegments(valuesB, drawCase)
        : polySegments(valuesA, drawCase)
    readonly property var dotsAdata: dotsFor(valuesA)
    readonly property var dotsBdata: dotsFor(valuesB)

    // сетка
    Repeater {
        model: chart.rings
        delegate: Seg {
            p1: modelData.p1
            p2: modelData.p2
            segColor: P.text
            opacity: 0.10
        }
    }

    // оси
    Repeater {
        model: chart.axes
        delegate: Seg {
            p1: modelData.p1
            p2: modelData.p2
            segColor: P.text
            opacity: 0.16
        }
    }

    // контур проигравшего — под победителем
    Repeater {
        model: chart.polyOther
        delegate: Seg {
            p1: modelData.p1
            p2: modelData.p2
            segColor: chart.winnerIsA ? chart.colorB : chart.colorA
            thickness: 2
            opacity: 0.85
            visible: !chart.drawCase
        }
    }

    // контур победителя — сверху
    Repeater {
        model: chart.polyWinner
        delegate: Seg {
            p1: modelData.p1
            p2: modelData.p2
            segColor: chart.winnerIsA ? chart.colorA : chart.colorB
            thickness: 2
            opacity: 1.0
        }
    }

    // при ничьей второй контур рисуем пунктиром поверх, иначе он не виден
    Repeater {
        model: chart.polyOther
        delegate: Seg {
            p1: modelData.p1
            p2: modelData.p2
            segColor: chart.winnerIsA ? chart.colorB : chart.colorA
            thickness: 2
            opacity: 0.95
            visible: chart.drawCase
        }
    }

    // точки проигравшего
    Repeater {
        model: chart.winnerIsA ? chart.dotsBdata : chart.dotsAdata
        delegate: Rectangle {
            x: modelData.x - width / 2
            y: modelData.y - height / 2
            width: 5
            height: 5
            radius: 2.5
            color: chart.winnerIsA ? chart.colorB : chart.colorA
            opacity: 0.85
        }
    }

    // точки победителя
    Repeater {
        model: chart.winnerIsA ? chart.dotsAdata : chart.dotsBdata
        delegate: Rectangle {
            x: modelData.x - width / 2
            y: modelData.y - height / 2
            width: 6
            height: 6
            radius: 3
            color: chart.winnerIsA ? chart.colorA : chart.colorB
        }
    }

    // подписи осей
    Repeater {
        model: chart.labels
        delegate: Text {
            readonly property var anchor_: chart.pointAt(index, 1.0)
            x: anchor_.x - width / 2
            y: anchor_.y + (Math.sin(-Math.PI / 2 + index * 2 * Math.PI / Math.max(1, chart.count)) > 0.3 ? 8 : -18)
            width: 92
            horizontalAlignment: Text.AlignHCenter
            text: modelData
            color: P.textMute
            font.pixelSize: 9
            font.letterSpacing: 0.5
            elide: Text.ElideRight
        }
    }
}
