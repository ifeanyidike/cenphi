import { ScrollArea } from "../ui/scroll-area";
import { TabsList, TabsTrigger } from "../ui/tabs";
import { Flag, Palette, Type } from "lucide-react";

const TabListElement = () => {
  return (
    <ScrollArea className="max-w-full">
      <TabsList className="h-8 p-1">
        <TabsTrigger
          value="essentials"
          className="flex items-center gap-1.5 text-xs h-6"
        >
          <Flag className="h-3 w-3" />
          <span>Essentials</span>
        </TabsTrigger>
        <TabsTrigger
          value="colors"
          className="flex items-center gap-1.5 text-xs h-6"
        >
          <Palette className="h-3 w-3" />
          <span>Colors</span>
        </TabsTrigger>
        <TabsTrigger
          value="typography"
          className="flex items-center gap-1.5 text-xs h-6"
        >
          <Type className="h-3 w-3" />
          <span>Typography</span>
        </TabsTrigger>
      </TabsList>
    </ScrollArea>
  );
};

export default TabListElement;
