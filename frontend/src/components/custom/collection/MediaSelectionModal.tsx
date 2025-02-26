import React from "react";
import {
  X,
  Upload,
  Video,
  Mic,
  Smartphone,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { observer } from "mobx-react-lite";
import { collectionStore } from "@/stores/collectionStore";
import { runInAction } from "mobx";
import { useNavigate } from "react-router-dom";

// type MediaType = "video" | "audio" | "text" | null;
type OptionType = "record" | "upload" | "mobile";

interface MediaOption {
  id: OptionType;
  title: string;
  icon: React.ElementType;
  description: string;
  action: () => void;
}

// interface MediaSelectionModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   type: MediaType;
//   onOptionSelect: (option: OptionType) => void;
// }

const MediaSelectionModal: React.FC = observer(() => {
  // { isOpen, onClose, type, onOptionSelect }
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const type = collectionStore.state.type;
  const onClose = () =>
    runInAction(() => (collectionStore.showOptionsModal = false));
  // const isMobile = useMediaQuery("(max-width: 640px)");

  const options: MediaOption[] = [
    {
      id: "record",
      title: `Record ${type}`,
      icon: type === "video" ? Video : Mic,
      description: `Capture your ${type} testimonial instantly`,
      action: () => {
        collectionStore.handleOptionSelect("record");
        navigate(`/collection/${type}/record`);
      },
    },
    {
      id: "upload",
      title: `Upload ${type}`,
      icon: Upload,
      description: "Select a file from your device",
      action: () => {
        collectionStore.handleOptionSelect("upload");
        navigate(`/collection/${type}/upload`);
      },
    },
    ...(isDesktop
      ? [
          {
            id: "mobile" as const,
            title: "Continue on Mobile",
            icon: Smartphone,
            description: "Switch to your phone via QR code",
            action: () => {
              collectionStore.handleOptionSelect("mobile");
              navigate(`/collection/transfer?mode=${type}`);
            },
          },
        ]
      : []),
  ];

  const method = () =>
    type ? type.charAt(0).toUpperCase() + type.slice(1) : "";

  return (
    <Dialog open={collectionStore.showOptionsModal} onOpenChange={onClose}>
      <DialogContent
        hideDefaultClose={true}
        className="sm:max-w-[800px] w-full p-0 
    rounded-[3rem] bg-gradient-to-br from-zinc-50 via-white to-zinc-50
    backdrop-blur-3xl border-0
    shadow-[0_35px_100px_-15px_rgba(0,0,0,0.2)]
    animate-in fade-in-0 zoom-in-95
    sm:mx-auto
    max-h-[90vh] overflow-y-auto"
        //overflow-hidden  max-h-[90vh] overflow-y-auto
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/40 via-transparent to-transparent opacity-80" />

        <DialogHeader className="relative pt-16 pb-12 px-8 sm:px-8">
          <button
            onClick={onClose}
            className="
              absolute right-8 sm:right-12 top-8 sm:top-12 p-4 rounded-full
              bg-black/5 hover:bg-black/10 transition-all duration-700
              backdrop-blur-xl
              hover:scale-110 hover:-rotate-180
              group
            "
          >
            <X className="h-5 w-5 text-black/60 group-hover:text-black/80 transition-colors duration-700" />
          </button>

          <div className="space-y-4">
            <p className="text-sm sm:text-base font-medium text-sky-600 tracking-wide">
              SELECT YOUR PREFERENCE
            </p>
            <h2 className="font-sans text-4xl sm:text-6xl font-black text-zinc-900 tracking-tight leading-tight">
              How would you
              <br />
              like to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                {method()}
              </span>
              ?
            </h2>
          </div>
        </DialogHeader>

        <div className="px-8 sm:px-16 pb-16 relative space-y-12">
          <div className="grid gap-6">
            {options.map((option, index) => (
              <div
                key={option.id}
                className="transform transition-all duration-500 hover:translate-x-4"
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                <Card
                  onClick={option.action}
                  className="
                    group cursor-pointer p-6 sm:p-8 rounded-3xl
                    bg-gradient-to-br from-white to-zinc-50/95
                    hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]
                    transition-all duration-700
                    border-2 border-black/5 hover:border-sky-100
                    relative overflow-hidden
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 to-sky-500/0 group-hover:from-sky-50/50 group-hover:to-indigo-50/50 transition-all duration-700" />

                  <div className="flex items-center gap-6 sm:gap-8 relative">
                    <div
                      className="
                      p-4 sm:p-6 rounded-2xl
                      bg-black/5 group-hover:bg-sky-500/10
                      transition-all duration-700
                      relative
                    "
                    >
                      <option.icon
                        className="
                        h-8 w-8 sm:h-10 sm:w-10
                        text-black/70 group-hover:text-sky-600
                        transition-all duration-700
                      "
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className=" text-xl sm:text-2xl text-zinc-800 tracking-tight group-hover:text-sky-600 transition-colors duration-700">
                          {option.title}
                        </h3>
                        <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-sky-500 transition-all duration-700 transform group-hover:translate-x-1" />
                      </div>
                      <p className="mt-2 text-base sm:text-lg text-zinc-600 leading-relaxed group-hover:text-zinc-700 transition-colors duration-700">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {type === "video" && (
            <div
              className="
              p-6 sm:p-8 rounded-3xl
              bg-gradient-to-br from-amber-50 to-orange-50/70
              border-2 border-amber-100/50
              relative overflow-hidden
            "
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent" />
              <div className="flex items-start sm:items-center gap-5 relative flex-col sm:flex-row">
                <div className="p-4 rounded-2xl bg-amber-100/80 border border-amber-200/50 shrink-0">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-800">
                    Optimize Your Recording
                  </h4>
                  <p className="text-base text-amber-700 leading-relaxed">
                    For the best quality, ensure you have good lighting and a
                    quiet environment before recording.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default MediaSelectionModal;
