import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface PlanningPokerDeleteSessionDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function PlanningPokerDeleteSessionDialog({
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: PlanningPokerDeleteSessionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete planning poker session?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            This permanently deletes the session, votes, and participants. Anyone in the
            shared room will be disconnected and cannot recover this round.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-white/10 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete session"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
