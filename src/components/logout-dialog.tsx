"use client";

import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutDialog({
  renderTrigger,
  onConfirm,
  onAfterConfirm,
}: {
  renderTrigger?: React.ReactElement;
  onConfirm: () => void;
  onAfterConfirm?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    try {
      onConfirm();
    } finally {
      setOpen(false);
      onAfterConfirm && onAfterConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={renderTrigger} />
      <DialogContent className="sm:max-w-sm rounded-3xl border-kawaii-purple/20 text-center">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 text-red-600"> <LogOut className="w-5 h-5" /> </span>
            Log out
          </DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to log out? Your progress is saved and can be restored when you sign in again.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Log out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
