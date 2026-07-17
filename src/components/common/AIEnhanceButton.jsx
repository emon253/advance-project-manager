import React, { useState } from "react";
import { Wand2 } from "lucide-react";
import { AIEnhancerModal } from "./AIEnhancerModal";

export function AIEnhanceButton({ value, onEnhance, type = "description", className = "" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold text-primary bg-primary/8 hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20 rounded-lg transition-colors border border-primary/20 shrink-0 cursor-pointer"
          title="Refine wording with AI"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Refine</span>
        </button>
      </div>

      <AIEnhancerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValue={value}
        onApply={onEnhance}
        type={type}
      />
    </>
  );
}
