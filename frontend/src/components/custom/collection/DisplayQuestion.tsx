import { motion } from "framer-motion";
import { collectionStore } from "@/stores/collectionStore";
import { observer } from "mobx-react-lite";

const DisplayQuestion = observer(() => {
  return (
    <motion.div
      key={collectionStore.currentPrompt.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-8"
    >
      <div className="text-sm font-medium text-gray-400 mb-2">
        {collectionStore.currentPrompt.category}
      </div>
      <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
        {collectionStore.currentPrompt.question}
      </h2>
      <p className="text-gray-500 text-base md:text-lg">
        {collectionStore.currentPrompt.description}
      </p>
    </motion.div>
  );
});

export default DisplayQuestion;
