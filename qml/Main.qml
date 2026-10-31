import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "Palette.js" as P

Window {
    id: win

    visible: true
    width: 1360
    height: 880
    minimumWidth: 900
    minimumHeight: 700
    color: P.bg
    title: "Тривиум — система судейства"

    // --- Описание формы (из Python) --------------------------------------
    readonly property var spec: {
        try {
            return JSON.parse(bridge.spec())
        } catch (e) {
            return { "blocks": [], "algorithm": [] }
        }
    }

    // какая вершина тетраэдра какой блок открывает
    readonly property var vertexKeys: ["art", "reason", "body", "soul"]

    // --- Состояние -------------------------------------------------------
    property var basePos: ({})
    property var artPos: ({})
    property var panelData: null
    property int gen: 0
    property string nameA: ""
    property string nameB: ""
    property int ovA: -1
    property int ovB: -1
    property var result: null
    readonly property bool hasResult: win.result ? win.result.ok === true : false

    property int activeBlock: -1
    property bool panelShown: false
    property bool helpOpen: false
    property bool infoHidden: false
    property string pendingAction: ""

    // показывать ли пояснения к критериям
    readonly property bool showInfo: win.activeBlock >= 0 && !win.infoHidden

    onActiveBlockChanged: {
        if (activeBlock >= 0) {
            panelDelay.restart()
        } else {
            panelShown = false
            panelDelay.stop()
        }
    }

    // панель раскрывается не сразу, а когда вершина почти долетела до стыковки
    Timer {
        id: panelDelay
        interval: 380
        onTriggered: win.panelShown = true
    }

    // --- Блоки -----------------------------------------------------------
    function blockDataForKey(key) {
        var blocks = win.spec && win.spec.blocks ? win.spec.blocks : []
        for (var i = 0; i < blocks.length; i++) {
            if (blocks[i].key === key)
                return blocks[i]
        }
        return { "key": key, "title": "", "subtitle": "", "kind": "base", "criteria": [] }
    }

    readonly property var vertexLabels: {
        var out = []
        for (var i = 0; i < win.vertexKeys.length; i++)
            out.push((win.blockDataForKey(win.vertexKeys[i]).title || "").toUpperCase())
        return out
    }

    function openBlock(i) {
        win.helpOpen = false
        win.infoHidden = false
        win.panelData = win.blockDataForKey(win.vertexKeys[i])
        win.activeBlock = i
        if (win.result !== null)
            win.result = null
    }

    function closeBlock() {
        win.activeBlock = -1
    }

    function toggleBlock(i) {
        if (win.activeBlock === i) {
            win.closeBlock()
            return
        }
        if (win.activeBlock >= 0) {
            win.closeBlock()
            reopenTimer.index = i
            reopenTimer.restart()
        } else {
            win.openBlock(i)
        }
    }

    function openHelp() {
        win.closeBlock()
        win.helpOpen = true
    }

    function closeHelp() {
        win.helpOpen = false
    }

    Timer {
        id: reopenTimer
        interval: 300
        property int index: -1
        onTriggered: win.openBlock(reopenTimer.index)
    }

    // --- Оценки ----------------------------------------------------------
    function setFader(kind, key, value) {
        var source = kind === "base" ? win.basePos : win.artPos
        var copy = {}
        for (var k in source)
            copy[k] = source[k]
        copy[key] = value
        if (kind === "base")
            win.basePos = copy
        else
            win.artPos = copy
        if (win.result !== null)
            win.result = null
    }

    function calc() {
        var payload = {
            "song_a": win.nameA,
            "song_b": win.nameB,
            "ov_a": win.ovA < 0 ? null : win.ovA,
            "ov_b": win.ovB < 0 ? null : win.ovB,
            "base": win.basePos,
            "art": win.artPos
        }
        try {
            win.result = JSON.parse(bridge.compute(JSON.stringify(payload)))
        } catch (e) {
            win.result = { "ok": false, "error": "Не удалось посчитать результат: " + e }
        }
        win.closeBlock()
        win.closeHelp()
    }

    function resetAll() {
        win.basePos = ({})
        win.artPos = ({})
        win.gen = win.gen + 1
        win.nameA = ""
        win.nameB = ""
        win.ovA = -1
        win.ovB = -1
        win.result = null
        win.closeBlock()
        win.closeHelp()
    }

    function confirmAction() {
        var action = win.pendingAction
        win.pendingAction = ""
        if (action === "result")
            win.calc()
        else if (action === "reset")
            win.resetAll()
    }

    Shortcut {
        sequence: "Esc"
        enabled: (win.activeBlock >= 0 || win.helpOpen) && !confirmDialog.visible
        onActivated: {
            win.closeBlock()
            win.closeHelp()
        }
    }

    // --- Раскладка -------------------------------------------------------
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 26
        spacing: 14

        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: 22

            Text {
                anchors.centerIn: parent
                text: "ТРИВИУМ"
                color: P.accent
                font.pixelSize: 13
                font.letterSpacing: 8
                font.bold: true
            }
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 16
            visible: !win.hasResult

            SongCard {
                objectName: "cardA"
                Layout.fillWidth: true
                accent: P.sideA
                caption: "ПЕСНЯ 1"
                placeholder: "Никнейм исполнителя"
                gen: win.gen
                onNameEdited: (text) => {
                    win.nameA = text
                    if (win.result !== null)
                        win.result = null
                }
                onOvSelected: (value) => {
                    win.ovA = value
                    if (win.result !== null)
                        win.result = null
                }
            }

            Text {
                text: "VS"
                color: P.textMute
                font.pixelSize: 10
                font.letterSpacing: 2
                Layout.alignment: Qt.AlignTop
                Layout.topMargin: 44
            }

            SongCard {
                objectName: "cardB"
                Layout.fillWidth: true
                accent: P.sideB
                caption: "ПЕСНЯ 2"
                placeholder: "Никнейм исполнителя"
                gen: win.gen
                onNameEdited: (text) => {
                    win.nameB = text
                    if (win.result !== null)
                        win.result = null
                }
                onOvSelected: (value) => {
                    win.ovB = value
                    if (win.result !== null)
                        win.result = null
                }
            }
        }

        // после результата на месте полей ввода — итоговые карточки
        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            visible: win.hasResult
            Layout.preferredHeight: 92

            ResultCard {
                Layout.fillWidth: true
                Layout.preferredHeight: 92
                title: !win.hasResult ? ""
                       : (win.result.draw ? "НИЧЬЯ"
                                          : (win.result.winner === "A" ? "ПОБЕДИТЕЛЬ" : "ПРОИГРАВШИЙ"))
                nameText: win.hasResult ? win.result.name_a : "—"
                ovText: win.hasResult ? win.result.ov_a : "—"
                accent: P.sideA
                muted: !win.hasResult || win.result.winner !== "A"
            }

            ResultCard {
                Layout.fillWidth: true
                Layout.preferredHeight: 92
                title: !win.hasResult ? ""
                       : (win.result.draw ? "НИЧЬЯ"
                                          : (win.result.winner === "B" ? "ПОБЕДИТЕЛЬ" : "ПРОИГРАВШИЙ"))
                nameText: win.hasResult ? win.result.name_b : "—"
                ovText: win.hasResult ? win.result.ov_b : "—"
                accent: P.sideB
                muted: !win.hasResult || win.result.winner !== "B"
            }
        }

        Item {
            id: stageHost
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true

            readonly property int panelW: Math.min(720, Math.max(460, Math.round(width * 0.5)))
            readonly property int panelRows: win.panelData && win.panelData.criteria ? win.panelData.criteria.length : 3
            readonly property int panelH: 84 + panelRows * 74 + 16
            readonly property int panelX: width - panelW - 20
            // сколько места занимает «веер» раскрытой фигуры
            readonly property int orbitSpan: 266
            readonly property int sideSpace: dockX - orbitSpan - 24

            // хватает ли слева места на колонку с пояснениями
            readonly property bool sideInfo: win.showInfo && sideSpace >= 260

            // иначе пояснение — полоса сверху. Если места хватает, фигура уезжает
            // под неё; если нет — полоса ложится поверх фигуры.
            readonly property real stripIdeal: Math.min(height * 0.40, 230)
            readonly property real stripInline: height - panelH - 44
            property real topInset: (win.showInfo && !stageHost.sideInfo && stripInline >= 130)
                                    ? Math.min(stripInline, stripIdeal)
                                    : 0
            readonly property real stripHeight: (win.showInfo && !stageHost.sideInfo)
                                                ? (topInset >= 130 ? topInset : stripIdeal)
                                                : 0
            Behavior on topInset { NumberAnimation { duration: 280; easing.type: Easing.OutCubic } }

            readonly property int panelY: Math.round(Math.max(topInset, topInset + (height - topInset - panelH) / 2))
            readonly property int dockX: panelX - 56
            readonly property int dockY: panelY + Math.round(panelH / 2)

            readonly property int infoW: Math.max(240, Math.min(660, sideSpace - 12))

            readonly property int helpH: Math.min(520, Math.max(280, height - 40))

            Tetra {
                id: tet
                anchors.fill: parent
                labels: win.vertexLabels
                activeIndex: win.activeBlock
                dockEnabled: win.activeBlock >= 0
                dockX: stageHost.dockX
                dockY: stageHost.dockY
                interactive: !win.helpOpen
                idleLeft: win.helpOpen
                leftLimit: stageHost.sideInfo ? stageHost.infoW + 12 : 0
                topInset: stageHost.topInset
                onVertexClicked: (i) => win.toggleBlock(i)
            }

            CriteriaInfo {
                id: infoPanel
                open: win.showInfo
                isSide: stageHost.sideInfo
                blockData: win.panelData
                textMax: stageHost.sideInfo ? 460 : 660
                x: 0
                y: 0
                width: stageHost.sideInfo ? stageHost.infoW : Math.max(240, stageHost.panelX - 12)
                height: stageHost.sideInfo ? stageHost.height : stageHost.stripHeight
                onDismissed: win.infoHidden = true
            }

            // нить от вершины к панели — блок «растёт» из вершины
            Rectangle {
                x: stageHost.dockX
                y: stageHost.dockY - 0.5
                width: Math.max(0, stageHost.panelX - stageHost.dockX)
                height: 1
                color: P.accent
                opacity: win.activeBlock >= 0 && win.panelShown ? 0.45 : 0.0
                Behavior on opacity { NumberAnimation { duration: 220 } }
            }

            FaderPanel {
                id: panel
                x: stageHost.panelX
                y: stageHost.panelY
                fullWidth: stageHost.panelW
                fullHeight: stageHost.panelH
                open: win.activeBlock >= 0 && win.panelShown
                blockData: win.panelData
                gen: win.gen
                infoVisible: win.showInfo
                onInfoToggleRequested: win.infoHidden = !win.infoHidden
                onFaderMoved: (key, value) => win.setFader(win.panelData ? win.panelData.kind : "base", key, value)
                onCloseRequested: win.closeBlock()
            }

            HelpPanel {
                id: helpPanel
                x: stageHost.panelX
                y: Math.round((stageHost.height - height) / 2)
                fullWidth: stageHost.panelW
                fullHeight: stageHost.helpH
                sections: win.spec && win.spec.algorithm ? win.spec.algorithm : []
                open: win.helpOpen
                onCloseRequested: win.closeHelp()
            }

            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.bottom: parent.bottom
                anchors.bottomMargin: 8
                text: "нажмите на вершину — из неё раскроется блок"
                color: P.textMute
                font.pixelSize: 10
                font.letterSpacing: 1
                opacity: win.activeBlock < 0 && !win.helpOpen && !win.hasResult ? 0.8 : 0.0
                Behavior on opacity { NumberAnimation { duration: 200 } }
            }

            ResultView {
                anchors.fill: parent
                result: win.result
                colorA: P.sideA
                colorB: P.sideB
            }
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 10

            Text {
                text: "Разработчик: Lawanda"
                color: P.textMute
                font.pixelSize: 10
                font.letterSpacing: 1
            }

            SocialLink {
                kind: "vk"
                url: "https://vk.com/lawandanebanano"
                Layout.alignment: Qt.AlignVCenter
            }

            SocialLink {
                kind: "mail"
                url: "mailto:lawandabsnbtz@gmail.com"
                Layout.alignment: Qt.AlignVCenter
            }

            SocialLink {
                kind: "tg"
                url: "https://t.me/lawandabsnbtz"
                Layout.alignment: Qt.AlignVCenter
            }

            Item { Layout.fillWidth: true }

            FlatButton {
                text: "Как судить?"
                implicitWidth: 150
                onClicked: win.helpOpen ? win.closeHelp() : win.openHelp()
            }

            FlatButton {
                text: "Сброс"
                implicitWidth: 130
                onClicked: {
                    win.pendingAction = "reset"
                    confirmDialog.open()
                }
            }

            FlatButton {
                text: "Результат"
                primary: true
                implicitWidth: 170
                onClicked: {
                    win.pendingAction = "result"
                    confirmDialog.open()
                }
            }
        }
    }

    // --- Подтверждение действий ------------------------------------------
    Dialog {
        id: confirmDialog
        modal: true
        width: 480
        padding: 24
        anchors.centerIn: Overlay.overlay
        closePolicy: Popup.CloseOnEscape

        background: Rectangle {
            color: P.surfaceHi
            radius: 4
            border.color: P.line
            border.width: 1
        }

        contentItem: Column {
            width: confirmDialog.width - 48
            spacing: 14

            Text {
                text: win.pendingAction === "result" ? "ПОКАЗАТЬ РЕЗУЛЬТАТ?" : "СБРОСИТЬ ФОРМУ?"
                color: P.text
                font.pixelSize: 13
                font.letterSpacing: 3
                font.bold: true
            }

            Text {
                width: parent.width
                text: win.pendingAction === "result"
                      ? "Блок свернётся, будут показаны победитель и проигравший с оценками за общее впечатление."
                      : "Все фейдеры, никнеймы и оценки ОВ будут очищены. Отменить это нельзя."
                color: P.textDim
                font.pixelSize: 12
                wrapMode: Text.WordWrap
                lineHeight: 1.3
            }

            RowLayout {
                width: parent.width
                spacing: 10

                Item { Layout.fillWidth: true }

                FlatButton {
                    text: "Отмена"
                    implicitHeight: 34
                    implicitWidth: 120
                    font.pixelSize: 11
                    onClicked: confirmDialog.close()
                }

                FlatButton {
                    text: "Подтвердить"
                    primary: true
                    implicitHeight: 34
                    implicitWidth: 160
                    font.pixelSize: 11
                    onClicked: {
                        confirmDialog.close()
                        win.confirmAction()
                    }
                }
            }
        }
    }
}
