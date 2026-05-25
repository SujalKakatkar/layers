import {useState} from "react"
import type {EditingText, Point, Shape, Text} from "../types/types"
import {measureTextSize} from "../helpers/measureTextSize"


const PAD_OFFSET_X = 1;
const PAD_OFFSETS_Y = 4;

export function useText (
    addShape: (shape: Shape) => void,
    updateShape: (_id: string, updater: (shape: Shape) => Shape) => void
) {

    const [editingText, setEditingText] = useState<EditingText | null>(null)

    function startText (point: Point, existing?: Text
    ) {
        if(existing) {
            setEditingText({
                _id: existing._id,
                x: existing.x,
                y: existing.y,
                text: existing.text,
                fontSize: existing.fontSize,
                width: existing?.width,
                height: existing?.height,
                isNew: false
            })
            return
        }

        const {width, height} = measureTextSize("Text")

        setEditingText({
            _id: crypto.randomUUID(),
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

        const {width, height} = measureTextSize(
            value || '', 
            editingText.fontSize, 
            editingText.fontWeight
        )

        setEditingText({
            ...editingText,
            text: value,
            width,
            height
        })
    }


    function finishText () {
        if(!editingText) return
        const {width, height} = measureTextSize(
            editingText.text, 
            editingText.fontSize, 
            editingText.fontWeight
        )
        if(editingText.text.trim() !== "") {

            if(editingText.isNew) {

                addShape({
                    _id: editingText._id,
                    type: "text",
                    x: editingText.x + PAD_OFFSET_X,
                    y: editingText.y + PAD_OFFSETS_Y,
                    text: editingText.text,
                    fontSize: editingText.fontSize,
                    fontWeight: editingText.fontWeight,
                    width,
                    height,
                    rotation: 0,
                })

            } else {

                updateShape(editingText._id, (shape) => ({
                    ...shape,
                    text: editingText.text,
                    fontSize: editingText.fontSize,
                    fontWeight: editingText.fontWeight,
                    width,
                    height
                }))

            }
        }

        const current = editingText._id;

        setEditingText(null)

        return current
    }

    return {
        editingText,
        setEditingText,
        startText,
        updateText,
        finishText
    }
}