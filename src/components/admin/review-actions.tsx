import { ModerationStatus } from "@prisma/client";
import {
  reviewEventFeedbackAction,
  reviewEventPhotoAction
} from "@/app/admin/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export function ReviewActions({
  kind,
  id,
  eventId,
  status
}: {
  kind: "feedback" | "photo";
  id: string;
  eventId: string;
  status: ModerationStatus;
}) {
  const action =
    kind === "feedback" ? reviewEventFeedbackAction : reviewEventPhotoAction;
  const idName = kind === "feedback" ? "feedbackId" : "photoId";

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status !== ModerationStatus.APPROVED ? (
        <form action={action}>
          <input type="hidden" name={idName} value={id} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="status" value={ModerationStatus.APPROVED} />
          <PendingSubmitButton
            className="bg-emerald-500/20 text-emerald-200"
            pendingLabel="…"
          >
            تأیید
          </PendingSubmitButton>
        </form>
      ) : null}
      {status !== ModerationStatus.REJECTED ? (
        <form action={action}>
          <input type="hidden" name={idName} value={id} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="status" value={ModerationStatus.REJECTED} />
          <PendingSubmitButton
            className="bg-red-500/20 text-red-200"
            pendingLabel="…"
          >
            رد
          </PendingSubmitButton>
        </form>
      ) : null}
    </div>
  );
}
