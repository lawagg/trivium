import QtQuick
import "Palette.js" as P

// Сцена «Тривиум»: тетраэдр, спроецированный вручную.
//
// Покой: фигура медленно вращается вокруг вертикальной оси (0–360 по кругу,
// поэтому нет разрыва на стыке циклов).
//
// Открытый блок: выбранная вершина уходит вправо и замирает в точке стыковки,
// а три остальные продолжают вращаться вокруг горизонтальной оси, проходящей
// через неё. Переход между состояниями — один коэффициент morphT.
Item {
    id: stage

    property int activeIndex: -1
    property int hoveredIndex: -1
    property real dockX: 0
    property real dockY: 0
    property bool dockEnabled: false
    property var labels: ["АРТ", "РАЗУМ", "ТЕЛО", "ДУША"]
    // клики по вершинам (в режиме справки выключены)
    property bool interactive: true
    // сдвинуть фигуру влево и не раскрывать (режим справки)
    property bool idleLeft: false
    // левая граница, которую фигура не должна перекрывать (колонка описаний)
    property real leftLimit: 0
    // верхняя граница (полоса описаний сверху)
    property real topInset: 0

    signal vertexClicked(int index)
    signal vertexHovered(int index)

    clip: true

    // --- Время -----------------------------------------------------------
    // time идёт всегда (крутит «веер» открытого блока),
    // spin замирает, пока блок открыт, — чтобы возврат был без рывка.
    property real time: 0
    property real spin: 0

    Timer {
        interval: 16
        repeat: true
        running: true
        onTriggered: {
            stage.time += 0.016
            if (stage.activeIndex < 0)
                stage.spin = (stage.spin + 0.16) % 360
        }
    }

    // --- Геометрия -------------------------------------------------------
    readonly property real rad: Math.PI / 180
    property real tilt: -20 * rad

    readonly property real orbitRadius: 152
    readonly property real orbitTilt: 52
    readonly property real orbitSpeed: 0.95
    // вылет «веера» влево: ужимается, если слева стоит колонка описаний
    readonly property real orbitDist: dockEnabled
        ? Math.max(126, Math.min(214, dockX - leftLimit - 24 - orbitTilt))
        : 214

    // 0 — фигура целиком, 1 — раскрыта вокруг выбранной вершины
    property real morphT: activeIndex >= 0 ? 1.0 : 0.0
    Behavior on morphT { NumberAnimation { duration: 640; easing.type: Easing.OutCubic } }

    // во время закрытия вершина-опора уже не activeIndex, но нужна для расчёта
    property int anchorIndex: -1
    onActiveIndexChanged: {
        if (activeIndex >= 0)
            anchorIndex = activeIndex
    }

    property real tetCx: idleLeft ? width * 0.24
                                  : (activeIndex >= 0 ? dockX - orbitDist : width * 0.5)
    property real tetCy: topInset + (height - topInset) * 0.5
    // радиус подстраивается под высоту сцены: когда снизу появляется результат,
    // сцена сжимается, и фигура не должна вылезать за края
    property real tetRadius: idleLeft
        ? Math.min(196, height * 0.36)
        : (activeIndex >= 0 ? Math.min(150, (height - topInset) * 0.30)
                            : Math.min(244, (height - topInset) * 0.42))

    Behavior on tetCx { NumberAnimation { duration: 640; easing.type: Easing.OutCubic } }
    Behavior on tetRadius { NumberAnimation { duration: 640; easing.type: Easing.OutCubic } }

    // Правильный тетраэдр: вершина сверху, три в основании
    property var verts: [
        [0.0, 1.0, 0.0],
        [0.9428, -0.3333, 0.0],
        [-0.4714, -0.3333, 0.8165],
        [-0.4714, -0.3333, -0.8165]
    ]
    property var pairs: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]

    // положение вершины в «закрытой» фигуре
    function project(i) {
        var v = verts[i]
        var a = spin * rad
        var ca = Math.cos(a)
        var sa = Math.sin(a)
        var x1 = v[0] * ca - v[2] * sa
        var z1 = v[0] * sa + v[2] * ca
        var y1 = v[1]
        var ct = Math.cos(tilt)
        var st = Math.sin(tilt)
        var y2 = y1 * ct - z1 * st
        var z2 = y1 * st + z1 * ct
        var f = 1.0 / (1.0 + z2 * 0.30)
        var bob = Math.sin(time * 0.55) * 6
        return {
            x: tetCx + x1 * tetRadius * f,
            y: tetCy - y2 * tetRadius * f + bob,
            z: z2,
            f: f
        }
    }

    // положение в «раскрытом» состоянии: опора справа, три вершины
    // описывают окружность вокруг горизонтальной оси
    function orbit(i) {
        if (i === anchorIndex)
            return { x: dockX, y: dockY, z: 1.0, f: 1.15 }

        var k = i < anchorIndex ? i : i - 1
        var ang = time * orbitSpeed + k * 2 * Math.PI / 3
        var c = Math.cos(ang)
        var s = Math.sin(ang)
        return {
            x: dockX - orbitDist - orbitTilt * c,
            y: dockY - orbitRadius * s,
            z: c,
            f: 0.84 + 0.20 * c
        }
    }

    function pos(i) {
        var a = project(i)
        var t = morphT
        if (t <= 0.001)
            return a
        var b = orbit(i)
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t,
            f: a.f + (b.f - a.f) * t
        }
    }

    function depthOpacity(f) {
        return Math.max(0.30, Math.min(1.0, (f - 0.72) / 0.55))
    }

    // --- Направляющие ----------------------------------------------------
    Item {
        width: stage.tetRadius * 2.6
        height: width
        x: stage.tetCx - width / 2
        y: stage.tetCy - height / 2
        opacity: 0.7 * (1.0 - stage.morphT)

        Rectangle {
            anchors.centerIn: parent
            width: stage.tetRadius * 2.42
            height: width
            radius: width / 2
            color: "transparent"
            border.color: P.lineSoft
            border.width: 1
        }

        Rectangle {
            anchors.centerIn: parent
            width: stage.tetRadius * 1.72
            height: width
            radius: width / 2
            color: "transparent"
            border.color: P.lineSoft
            border.width: 1
            opacity: 0.7
        }
    }

    // --- Рёбра -----------------------------------------------------------
    Repeater {
        model: 6

        delegate: Rectangle {
            readonly property var pa: stage.pos(stage.pairs[index][0])
            readonly property var pb: stage.pos(stage.pairs[index][1])
            readonly property real len: Math.sqrt((pb.x - pa.x) * (pb.x - pa.x)
                                                  + (pb.y - pa.y) * (pb.y - pa.y))

            x: pa.x
            y: pa.y - height / 2
            width: Math.max(0, len)
            height: 1
            transformOrigin: Item.Left
            rotation: Math.atan2(pb.y - pa.y, pb.x - pa.x) / Math.PI * 180
            color: P.text
            opacity: stage.depthOpacity((pa.f + pb.f) / 2) * 0.46
            antialiasing: true
            z: -100 + (pa.f + pb.f)
        }
    }

    // --- Вершины ---------------------------------------------------------
    Repeater {
        model: 4

        delegate: Item {
            id: node

            readonly property var pr: stage.pos(index)
            readonly property bool isActive: stage.activeIndex === index
            readonly property bool isHovered: stage.hoveredIndex === index
            readonly property real f: pr.f

            x: pr.x - width / 2
            y: pr.y - height / 2
            width: 96
            height: 96
            z: isActive ? 1000 : 100 + pr.f * 10

            // ореол
            Rectangle {
                anchors.centerIn: parent
                width: 34 * node.f
                height: width
                radius: width / 2
                color: P.accent
                opacity: node.isActive ? 0.12 : (node.isHovered ? 0.09 : 0.0)
                Behavior on opacity { NumberAnimation { duration: 180 } }
            }

            // кольцо
            Rectangle {
                anchors.centerIn: parent
                width: node.isActive ? 30 : 23 * node.f
                height: width
                radius: width / 2
                color: "transparent"
                border.width: 1
                border.color: node.isActive ? P.accent
                                            : (node.isHovered ? P.text : "#62627A")
                Behavior on width { NumberAnimation { duration: 220; easing.type: Easing.OutCubic } }
                Behavior on border.color { ColorAnimation { duration: 180 } }
            }

            // ядро
            Rectangle {
                anchors.centerIn: parent
                width: node.isActive ? 9 : 8 * node.f
                height: width
                radius: width / 2
                color: node.isActive ? P.accent : P.text
                opacity: node.isActive ? 1.0 : stage.depthOpacity(node.f)
                Behavior on width { NumberAnimation { duration: 220; easing.type: Easing.OutCubic } }
            }

            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.horizontalCenterOffset: 6
                anchors.top: parent.verticalCenter
                anchors.topMargin: node.isActive ? 24 : 17 * node.f
                text: stage.labels[index] ? stage.labels[index] : ""
                color: node.isActive ? P.accent : (node.isHovered ? P.text : P.textDim)
                font.pixelSize: node.isActive ? 12 : 11
                font.letterSpacing: 3
                font.bold: node.isActive
                Behavior on color { ColorAnimation { duration: 180 } }
            }

            MouseArea {
                anchors.centerIn: parent
                width: 120
                height: 120
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                enabled: stage.interactive && !node.isActive
                onEntered: if (stage.interactive) stage.vertexHovered(index)
                onExited: if (stage.hoveredIndex === index) stage.vertexHovered(-1)
                onClicked: if (stage.interactive) stage.vertexClicked(index)
            }
        }
    }
}
