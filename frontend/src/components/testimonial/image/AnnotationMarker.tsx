import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "../UI";
import { Trash } from "../UI/icons";
import { Annotation } from "../../../repo/managers/image_editor";
import { workspaceHub } from "@/repo/workspace_hub";

interface AnnotationMarkerProps {
  annotation: Annotation;
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = observer(
  ({ annotation }) => {
    const imageEditorManager = workspaceHub.imageEditorManager;
    return (
      <div
        key={annotation.id}
        className="absolute z-10"
        style={{
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <button
          className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-md transition-all duration-200 ${
            imageEditorManager.selectedAnnotationId === annotation.id
              ? "bg-blue-600 text-white scale-110"
              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
          }`}
          onClick={() =>
            (imageEditorManager.selectedAnnotationId =
              imageEditorManager.selectedAnnotationId === annotation.id
                ? null
                : annotation.id)
          }
        >
          {imageEditorManager.annotations.findIndex(
            (a) => a.id === annotation.id
          ) + 1}
        </button>

        {imageEditorManager.selectedAnnotationId === annotation.id && (
          <div className="absolute mt-3 p-3 bg-white border border-slate-200 rounded-lg shadow-xl z-20 w-56 -translate-x-1/2">
            <h4 className="text-xs font-semibold text-slate-800 mb-1">
              Annotation
            </h4>
            <textarea
              value={annotation.text}
              onChange={(e) =>
                imageEditorManager.updateAnnotation(annotation.id, {
                  text: e.target.value,
                })
              }
              className="w-full h-24 text-sm p-2 mb-2 border border-slate-300 rounded text-slate-800 resize-none"
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="xs"
                onClick={() => (imageEditorManager.selectedAnnotationId = null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="xs"
                onClick={() =>
                  imageEditorManager.deleteAnnotation(annotation.id)
                }
                icon={<Trash size={14} />}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default AnnotationMarker;
