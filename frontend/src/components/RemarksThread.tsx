import { FormEvent, useEffect, useMemo, useState } from "react";
import { TaskRemark } from "@/types";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

type RemarksThreadProps = {
  taskId: string;
  remarks?: TaskRemark[];
  allowReply?: boolean;
  replyLabel?: string;
  emptyStateLabel?: string;
  onRemarkAdded?: (remark: TaskRemark) => void;
};

export default function RemarksThread({
  taskId,
  remarks,
  allowReply = false,
  replyLabel = "Let QA know what changed",
  emptyStateLabel = "No remarks yet.",
  onRemarkAdded,
}: RemarksThreadProps) {
  const { user } = useAuth();
  const [thread, setThread] = useState<TaskRemark[]>(remarks ?? []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setThread(remarks ?? []);
  }, [remarks]);

  const sortedRemarks = useMemo(() => {
    return [...thread].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });
  }, [thread]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please enter a remark before sending.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const newRemark = await apiFetch<TaskRemark>(`/tasks/${taskId}/remarks`, {
        method: "POST",
        body: { message: trimmed },
      });
      setThread((prev) => [...prev, newRemark]);
      setMessage("");
      onRemarkAdded?.(newRemark);
    } catch (err: any) {
      setError(err?.message || "Failed to send remark");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showEmptyState = sortedRemarks.length === 0;

  return (
    <div className="card border border-amber-200 bg-amber-50">
      <div className="card-body space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
            QA Conversation
          </h3>
          <span className="text-xs text-amber-600">
            {showEmptyState
              ? "Waiting for first remark"
              : `${sortedRemarks.length} message${
                  sortedRemarks.length === 1 ? "" : "s"
                }`}
          </span>
        </div>

        {showEmptyState ? (
          <p className="text-sm text-amber-700">{emptyStateLabel}</p>
        ) : (
          <div className="space-y-3">
            {sortedRemarks.map((remark, index) => {
              const isSelf = remark.author_id === user?.id;
              const bubbleClasses = isSelf
                ? "bg-white border-blue-200"
                : remark.remark_type === "qa_return"
                ? "bg-amber-100 border-amber-200"
                : "bg-white border-amber-200";

              return (
                <div
                  key={`${remark.created_at}-${index}`}
                  className="flex flex-col"
                >
                  <div
                    className={`rounded-lg border p-3 shadow-sm ${bubbleClasses}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {remark.author_name || remark.author_role.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(remark.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                      {remark.message}
                    </p>
                    {remark.remark_type === "qa_return" && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        ↩ QA Return
                      </span>
                    )}
                    {remark.remark_type === "annotator_reply" && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                        ✅ Annotator Reply
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {allowReply && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              {replyLabel}
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="Describe what you addressed or any follow-up notes"
              disabled={isSubmitting}
            />
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
