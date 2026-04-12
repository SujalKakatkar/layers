import {useState} from "react"
import type {EditingText, Point, Shape, Text} from "../types/types"
import {measureTextSize} from "../helpers/measureTextSize"


const PAD_OFFSET_X = 1;
const PAD_OFFSETS_Y = 4;

export function useText (
    addShape: (shape: any) => void,
    updateShape: (id: string, updater: (shape: Shape) => Shape) => void
) {

    const [editingText, setEditingText] = useState<EditingText | null>(null)

    function startText (point: Point, existing?: Text
    ) {
        if(existing) {
            setEditingText({
                id: existing.id,
                x: existing.x,
                y: existing.y,
                text: existing.text,
                fontSize: existing.fontSize,
                width: existing?.width,
                height:existing?.height,
                isNew: false
            })
            return
        }

        const {width, height} = measureTextSize("Text")

        setEditingText({
            id: crypto.randomUUID(),
            x: point.x,
            y: point.y,
            text: "Text",
            fontSize: 20,
            width,
            height,
            isNew: true
        })
    }

    function updateText (value: string) {
        if(!editingText) return

        const {width, height} = measureTextSize(value || '')

        setEditingText({
            ...editingText,
            text: value,
            width,
            height
        })
    }


    function finishText () {
        if(!editingText) return
        const {width, height} = measureTextSize(editingText.text)
        if(editingText.text.trim() !== "") {

            if(editingText.isNew) {

                addShape({
                    id: editingText.id,
                    type: "text",
                    x: editingText.x + PAD_OFFSET_X,
                    y: editingText.y + PAD_OFFSETS_Y,
                    text: editingText.text,
                    fontSize: 20,
                    width,
                    height
                })

            } else {

                updateShape(editingText.id, (shape) => ({
                    ...shape,
                    text: editingText.text,
                    width,
                    height
                }))

            }
        }

        const current = editingText.id;

        setEditingText(null)

        return current
    }

    return {
        editingText,
        startText,
        updateText,
        finishText
    }
}